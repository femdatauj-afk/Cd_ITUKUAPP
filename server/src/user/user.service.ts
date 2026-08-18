import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // Get public user profile by username or ID
  async getUserProfile(usernameOrId: string, currentUserId?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: usernameOrId }, { id: usernameOrId }],
      },
      include: {
        wallet: true,
        posts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
            friendships: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Get friendship status if viewing another user
    let friendshipStatus: string | null = null;
    let followingStatus = false;
    if (currentUserId && currentUserId !== user.id) {
      const friendship = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: currentUserId, friendId: user.id },
            { userId: user.id, friendId: currentUserId },
          ],
        },
      });
      friendshipStatus = friendship?.status || null;

      const follow = await this.prisma.follow.findFirst({
        where: {
          followerId: currentUserId,
          followedId: user.id,
        },
      });
      followingStatus = !!follow;
    }

    return {
      ...this.sanitizeUser(user),
      stats: {
        postsCount: user._count.posts,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        friendsCount: user._count.friendships,
      },
      friendshipStatus,
      isFollowing: followingStatus,
    };
  }

  // Send friend request
  async sendFriendRequest(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot send friend request to yourself.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found.');
    }

    // Check if already friends or request already exists
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'pending') {
        throw new ConflictException('Friend request already sent.');
      } else {
        throw new ConflictException('Already friends with this user.');
      }
    }

    const friendship = await this.prisma.friendship.create({
      data: {
        userId,
        friendId: targetUserId,
        status: 'pending',
      },
    });

    return { success: true, friendship };
  }

  // Accept friend request
  async acceptFriendRequest(userId: string, friendRequestId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendRequestId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found.');
    }

    if (friendship.friendId !== userId) {
      throw new BadRequestException('Cannot accept friend request not directed to you.');
    }

    if (friendship.status !== 'pending') {
      throw new BadRequestException('Friend request is not pending.');
    }

    const updated = await this.prisma.friendship.update({
      where: { id: friendRequestId },
      data: { status: 'accepted' },
    });

    return { success: true, friendship: updated };
  }

  // Decline friend request
  async declineFriendRequest(userId: string, friendRequestId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendRequestId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found.');
    }

    if (friendship.friendId !== userId) {
      throw new BadRequestException('Cannot decline friend request not directed to you.');
    }

    await this.prisma.friendship.delete({
      where: { id: friendRequestId },
    });

    return { success: true };
  }

  // Get friend requests for a user
  async getFriendRequests(userId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  // Get friends list
  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userId, status: 'accepted' }, { friendId: userId, status: 'accepted' }],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
        friend: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
      },
    });

    return friendships.map((f) => (f.userId === userId ? f.friend : f.user));
  }

  async discoverPeople(currentUserId: string, query = '') {
    const needle = query.trim();
    const users = await this.prisma.user.findMany({
      where: { id: { not: currentUserId }, ...(needle ? { OR: [{ fullName: { contains: needle } }, { username: { contains: needle } }, { village: { contains: needle } }] } : {}) },
      select: { id: true, fullName: true, username: true, village: true, bio: true, profilePhoto: true, createdAt: true }, take: 50, orderBy: { fullName: 'asc' },
    });
    const links = await this.prisma.friendship.findMany({ where: { OR: [{ userId: currentUserId }, { friendId: currentUserId }] } });
    return users.map((user) => { const link = links.find((item) => item.userId === user.id || item.friendId === user.id); return { ...user, friendshipStatus: link?.status ?? null, isFriend: link?.status === 'accepted' }; });
  }

  async getMutualFriends(currentUserId: string, targetUserId: string) {
    const [mine, theirs] = await Promise.all([this.getFriends(currentUserId), this.getFriends(targetUserId)]);
    const myIds = new Set(mine.map((user) => user.id));
    return theirs.filter((user) => myIds.has(user.id));
  }

  // Follow user
  async followUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot follow yourself.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found.');
    }

    const existing = await this.prisma.follow.findFirst({
      where: {
        followerId: userId,
        followedId: targetUserId,
      },
    });

    if (existing) {
      throw new ConflictException('Already following this user.');
    }

    await this.prisma.follow.create({
      data: {
        followerId: userId,
        followedId: targetUserId,
      },
    });

    return { success: true };
  }

  // Unfollow user
  async unfollowUser(userId: string, targetUserId: string) {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId: userId,
        followedId: targetUserId,
      },
    });

    if (!follow) {
      throw new NotFoundException('Not following this user.');
    }

    await this.prisma.follow.delete({
      where: { id: follow.id },
    });

    return { success: true };
  }

  // Get followers
  async getFollowers(userId: string, currentUserId?: string) {
    const followers = await this.prisma.follow.findMany({
      where: { followedId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return followers.map((f) => ({
      ...f.follower,
      isFollowedBack: currentUserId ? this.checkIfFollowing(currentUserId, f.follower.id) : false,
    }));
  }

  // Get following
  async getFollowing(userId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        followed: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return following.map((f) => f.followed);
  }

  // Helper method to check if following
  private async checkIfFollowing(userId: string, targetUserId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId: userId,
        followedId: targetUserId,
      },
    });
    return !!follow;
  }

  // Update user profile
  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      bio?: string;
      profilePhoto?: string;
      coverPhoto?: string;
    },
  ) {
    // Get current user to check for existing photos to delete
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Delete old profile photo if a new one is being set
    if (data.profilePhoto && currentUser?.profilePhoto) {
      try {
        await this.storage.delete(currentUser.profilePhoto);
      } catch (error) {
        // Log but don't fail - old file might already be deleted
        console.warn(`Failed to delete old profile photo: ${error.message}`);
      }
    }

    // Delete old cover photo if a new one is being set
    if (data.coverPhoto && currentUser?.coverPhoto) {
      try {
        await this.storage.delete(currentUser.coverPhoto);
      } catch (error) {
        // Log but don't fail - old file might already be deleted
        console.warn(`Failed to delete old cover photo: ${error.message}`);
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: { wallet: true },
    });

    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
