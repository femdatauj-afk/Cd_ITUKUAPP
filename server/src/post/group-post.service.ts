import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupPostService {
  private readonly logger = new Logger(GroupPostService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new post in a group
   */
  async createPost(
    groupId: string,
    authorId: string,
    content: string,
    photo?: string,
  ) {
    this.logger.log(`Creating post in group ${groupId} by user ${authorId}`);

    // Verify group exists
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { where: { userId: authorId } } },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is a member of the group
    if (group.members.length === 0) {
      throw new ForbiddenException('You are not a member of this group');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Content is required');
    }

    const post = await this.prisma.groupPost.create({
      data: {
        groupId,
        authorId,
        content,
        photo: photo || null,
        likes: 0,
        comments: 0,
        createdAt: new Date(),
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

    return {
      success: true,
      data: post,
    };
  }

  /**
   * Get all posts in a group
   */
  async getGroupPosts(groupId: string, limit: number = 50, offset: number = 0) {
    this.logger.log(`Fetching posts for group ${groupId}`);

    // Verify group exists
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const [posts, total] = await Promise.all([
      this.prisma.groupPost.findMany({
        where: { groupId },
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
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.groupPost.count({ where: { groupId } }),
    ]);

    return {
      success: true,
      data: posts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get a specific post
   */
  async getPost(postId: string) {
    this.logger.log(`Fetching post ${postId}`);

    const post = await this.prisma.groupPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      success: true,
      data: post,
    };
  }

  /**
   * Update a post
   */
  async updatePost(
    postId: string,
    userId: string,
    content?: string,
    photo?: string,
  ) {
    this.logger.log(`Updating post ${postId} by user ${userId}`);

    const post = await this.prisma.groupPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    if (content && content.trim().length === 0) {
      throw new BadRequestException('Content cannot be empty');
    }

    const updated = await this.prisma.groupPost.update({
      where: { id: postId },
      data: {
        ...(content && { content }),
        ...(photo !== undefined && { photo }),
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

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string, userId: string) {
    this.logger.log(`Deleting post ${postId} by user ${userId}`);

    const post = await this.prisma.groupPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.groupPost.delete({
      where: { id: postId },
    });

    return {
      success: true,
      message: 'Post deleted',
    };
  }

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string) {
    this.logger.log(`User ${userId} liked post ${postId}`);

    const post = await this.prisma.groupPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updated = await this.prisma.groupPost.update({
      where: { id: postId },
      data: {
        likes: post.likes + 1,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        postId: updated.id,
        likes: updated.likes,
      },
    };
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string) {
    this.logger.log(`User ${userId} unliked post ${postId}`);

    const post = await this.prisma.groupPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.likes > 0) {
      const updated = await this.prisma.groupPost.update({
        where: { id: postId },
        data: {
          likes: post.likes - 1,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: {
          postId: updated.id,
          likes: updated.likes,
        },
      };
    }

    return {
      success: true,
      data: {
        postId: post.id,
        likes: post.likes,
      },
    };
  }

  /**
   * Increment comment count
   */
  async incrementComments(postId: string) {
    this.logger.log(`Incrementing comment count for post ${postId}`);

    const post = await this.prisma.groupPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updated = await this.prisma.groupPost.update({
      where: { id: postId },
      data: {
        comments: post.comments + 1,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        postId: updated.id,
        comments: updated.comments,
      },
    };
  }

  /**
   * Decrement comment count
   */
  async decrementComments(postId: string) {
    this.logger.log(`Decrementing comment count for post ${postId}`);

    const post = await this.prisma.groupPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.comments > 0) {
      const updated = await this.prisma.groupPost.update({
        where: { id: postId },
        data: {
          comments: post.comments - 1,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: {
          postId: updated.id,
          comments: updated.comments,
        },
      };
    }

    return {
      success: true,
      data: {
        postId: post.id,
        comments: post.comments,
      },
    };
  }
}
