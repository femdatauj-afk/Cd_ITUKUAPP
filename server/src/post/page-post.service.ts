import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagePostService {
  private readonly logger = new Logger(PagePostService.name);

  constructor(private prisma: PrismaService) {}

  private findPage(identifier: string) {
    return this.prisma.page.findFirst({
      where: { OR: [{ id: identifier }, { slug: identifier }] },
    });
  }

  /**
   * Create a new post on a page
   */
  async createPost(
    pageId: string,
    authorId: string,
    content: string,
    photo?: string,
  ) {
    this.logger.log(`Creating post on page ${pageId} by user ${authorId}`);

    // Verify page exists and user has permission
    const page = await this.findPage(pageId);

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Only page owner or admins can post
    if (page.ownerId !== authorId) {
      const user = await this.prisma.user.findUnique({
        where: { id: authorId },
      });
      if (user?.role !== 'admin' && user?.role !== 'moderator') {
        throw new ForbiddenException(
          'You do not have permission to post on this page',
        );
      }
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Content is required');
    }

    const post = await this.prisma.pagePost.create({
      data: {
        pageId: page.id,
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
   * Get all posts on a page
   */
  async getPagePosts(pageId: string, limit: number = 50, offset: number = 0) {
    this.logger.log(`Fetching posts for page ${pageId}`);

    // Verify page exists
    const page = await this.findPage(pageId);

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const [posts, total] = await Promise.all([
      this.prisma.pagePost.findMany({
        where: { pageId: page.id },
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
      this.prisma.pagePost.count({ where: { pageId: page.id } }),
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

    const post = await this.prisma.pagePost.findUnique({
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
        page: {
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

    const post = await this.prisma.pagePost.findUnique({
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

    const updated = await this.prisma.pagePost.update({
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

    const post = await this.prisma.pagePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.pagePost.delete({
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

    const post = await this.prisma.pagePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updated = await this.prisma.pagePost.update({
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

    const post = await this.prisma.pagePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.likes > 0) {
      const updated = await this.prisma.pagePost.update({
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

    const post = await this.prisma.pagePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updated = await this.prisma.pagePost.update({
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

    const post = await this.prisma.pagePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.comments > 0) {
      const updated = await this.prisma.pagePost.update({
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
