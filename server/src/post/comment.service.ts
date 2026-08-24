import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new comment on a post
   */
  async createComment(postId: string, authorId: string, content: string, parentId?: string, mediaUrl?: string, target: 'post' | 'group' | 'page' = 'post') {
    if (!content.trim()) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    // Verify post exists
    const post = target === 'group'
      ? await this.prisma.groupPost.findUnique({ where: { id: postId } })
      : target === 'page'
        ? await this.prisma.pagePost.findUnique({ where: { id: postId } })
        : await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (parentId) {
      const parent = await this.prisma.comment.findFirst({ where: { id: parentId, ...(target === 'group' ? { groupPostId: postId } : target === 'page' ? { pagePostId: postId } : { postId }) } });
      if (!parent) throw new NotFoundException('Parent comment not found');
    }

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        ...(target === 'group' ? { groupPostId: postId } : target === 'page' ? { pagePostId: postId } : { postId }),
        authorId,
        parentId,
        mediaUrl,
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
        reactions: true,
      },
    });

    this.logger.log(
      `Comment ${comment.id} created on post ${postId} by ${authorId}`,
    );

    return comment;
  }

  /**
   * Get all comments for a post with pagination
   */
  async getPostComments(
    postId: string,
    limit: number = 50,
    offset: number = 0,
    target: 'post' | 'group' | 'page' = 'post',
  ) {
    // Verify post exists
    const post = target === 'group'
      ? await this.prisma.groupPost.findUnique({ where: { id: postId } })
      : target === 'page'
        ? await this.prisma.pagePost.findUnique({ where: { id: postId } })
        : await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comments = await this.prisma.comment.findMany({
      where: target === 'group' ? { groupPostId: postId } : target === 'page' ? { pagePostId: postId } : { postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
        reactions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return comments;
  }

  async toggleReaction(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    const existing = await this.prisma.commentLike.findUnique({ where: { commentId_userId: { commentId, userId } } });
    if (existing) {
      await this.prisma.commentLike.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.commentLike.create({ data: { commentId, userId } });
    }
    return { reacted: !existing, count: await this.prisma.commentLike.count({ where: { commentId } }) };
  }

  /**
   * Get a single comment by ID
   */
  async getComment(commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  /**
   * Update a comment (only by author)
   */
  async updateComment(commentId: string, userId: string, content: string) {
    if (!content.trim()) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
      },
    });

    this.logger.log(`Comment ${commentId} updated by ${userId}`);

    return updated;
  }

  /**
   * Delete a comment (by author or post owner or moderator)
   */
  async deleteComment(commentId: string, userId: string, userRole?: string, target: 'post' | 'group' | 'page' = 'post') {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            id: true,
            authorId: true,
          },
        },
        groupPost: { select: { authorId: true } },
        pagePost: { select: { authorId: true } },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check permissions
    const isAuthor = comment.authorId === userId;
    const isPostOwner = target === 'group'
      ? comment.groupPost?.authorId === userId
      : target === 'page'
        ? comment.pagePost?.authorId === userId
        : comment.post?.authorId === userId;
    const isModerator = userRole === 'moderator' || userRole === 'admin';

    if (!isAuthor && !isPostOwner && !isModerator) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    // Delete comment
    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    this.logger.log(`Comment ${commentId} deleted by ${userId}`);

    return { success: true };
  }

  /**
   * Get total comment count for a post
   */
  async getCommentCount(postId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { postId },
    });
  }

  /**
   * Increment comment count tracking (semantic - no direct counter field)
   * This is for use when notifications mention comment counts
   */
  async incrementCommentCount(postId: string): Promise<void> {
    // In this schema, comments are tracked via relations, not counters
    // This method is for compatibility but doesn't perform a direct increment
    this.logger.log(`Comment added to post ${postId}`);
  }

  /**
   * Decrement comment count tracking (semantic - no direct counter field)
   * This is for use when notifications mention comment counts
   */
  async decrementCommentCount(postId: string): Promise<void> {
    // In this schema, comments are tracked via relations, not counters
    // This method is for compatibility but doesn't perform a direct decrement
    this.logger.log(`Comment removed from post ${postId}`);
  }
}
