import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  // Create post
  async createPost(userId: string, content: string, photo?: string) {
    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        content,
        photo,
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
        _count: {
          select: {
            comments: true,
            likes: true,
            shares: true,
          },
        },
      },
    });

    return {
      ...post,
      stats: {
        commentsCount: post._count.comments,
        likesCount: post._count.likes,
        sharesCount: post._count.shares,
      },
    };
  }

  // Get post by ID
  async getPost(postId: string, currentUserId?: string) {
    const post = await this.prisma.post.findUnique({
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
        comments: {
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
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            shares: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    // Check if current user liked this post
    let hasLiked = false;
    if (currentUserId) {
      const like = await this.prisma.like.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: currentUserId,
          },
        },
      });
      hasLiked = !!like;
    }

    return {
      ...post,
      stats: {
        commentsCount: post._count.comments,
        likesCount: post._count.likes,
        sharesCount: post._count.shares,
      },
      hasLiked,
    };
  }

  // Get user feed (posts from following and friends)
  async getFeed(userId: string, limit: number = 20, offset: number = 0) {
    // Get followed users and friends
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followedId: true },
    });

    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
      select: { userId: true, friendId: true },
    });

    const followedIds = following.map((f) => f.followedId);
    const friendIds = friendships.map((f) =>
      f.userId === userId ? f.friendId : f.userId,
    );
    const allIds = [...new Set([userId, ...followedIds, ...friendIds])]; // Include self posts

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: {
          in: allIds,
        },
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
        _count: {
          select: {
            comments: true,
            likes: true,
            shares: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Check likes for current user
    const postIds = posts.map((p) => p.id);
    const userLikes = await this.prisma.like.findMany({
      where: {
        postId: { in: postIds },
        userId,
      },
    });

    const likedPostIds = new Set(userLikes.map((l) => l.postId));

    return posts.map((post) => ({
      ...post,
      stats: {
        commentsCount: post._count.comments,
        likesCount: post._count.likes,
        sharesCount: post._count.shares,
      },
      hasLiked: likedPostIds.has(post.id),
    }));
  }

  // Like post
  async likePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const existing = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Already liked this post.');
    }

    await this.prisma.like.create({
      data: {
        postId,
        userId,
      },
    });

    return { success: true };
  }

  // Unlike post
  async unlikePost(postId: string, userId: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found.');
    }

    await this.prisma.like.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return { success: true };
  }

  // Get post likes
  async getPostLikes(postId: string) {
    const likes = await this.prisma.like.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return likes.map((l) => l.user);
  }

  // Add comment
  async addComment(postId: string, userId: string, content: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content,
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

    return comment;
  }

  // Get post comments
  async getPostComments(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
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
    });

    return comments;
  }

  // Delete comment
  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    if (comment.authorId !== userId) {
      throw new NotFoundException('Cannot delete comment you did not create.');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { success: true };
  }

  // Share post
  async sharePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const existing = await this.prisma.share.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Already shared this post.');
    }

    await this.prisma.share.create({
      data: {
        postId,
        userId,
      },
    });

    return { success: true };
  }

  // Unshare post
  async unsharePost(postId: string, userId: string) {
    const share = await this.prisma.share.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (!share) {
      throw new NotFoundException('Share not found.');
    }

    await this.prisma.share.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return { success: true };
  }

  async savePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found.');

    try {
      await this.prisma.savedPost.create({ data: { postId, userId } });
    } catch (error) {
      if (error.code === 'P2002')
        throw new ConflictException('Post is already saved.');
      throw error;
    }

    return { success: true };
  }

  async unsavePost(postId: string, userId: string) {
    const savedPost = await this.prisma.savedPost.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (!savedPost) throw new NotFoundException('Saved post not found.');

    await this.prisma.savedPost.delete({ where: { id: savedPost.id } });
    return { success: true };
  }

  async getSavedPosts(userId: string) {
    const savedPosts = await this.prisma.savedPost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullName: true,
                profilePhoto: true,
              },
            },
            _count: { select: { comments: true, likes: true, shares: true } },
          },
        },
      },
    });

    return savedPosts.map(({ createdAt, post }) => ({
      ...post,
      savedAt: createdAt,
      stats: {
        commentsCount: post._count.comments,
        likesCount: post._count.likes,
        sharesCount: post._count.shares,
      },
    }));
  }

  // Delete post (owner only)
  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (post.authorId !== userId) {
      throw new NotFoundException('Cannot delete post you did not create.');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { success: true };
  }
}
