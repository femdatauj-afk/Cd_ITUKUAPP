import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderationService: ModerationService,
    @Optional() private readonly notificationService?: NotificationService,
  ) {}

  private async ensureUserCanCreateFeature(userId: string) {
    const isModerated =
      await this.moderationService.checkUserModeration(userId);
    if (isModerated) {
      const status = await this.moderationService.getModerationStatus(userId);
      throw new BadRequestException(
        `Your account is currently ${status.action}. Reason: ${status.reason}${
          status.daysRemaining
            ? ` (${status.daysRemaining} days remaining)`
            : ''
        }`,
      );
    }
  }

  async getMarketplaceListings() {
    return this.prisma.marketplaceListing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            username: true,
            village: true,
            profilePhoto: true,
          },
        },
        images: {
          orderBy: { isPrimary: 'desc' },
        },
        _count: {
          select: { favourites: true },
        },
      },
    });
  }

  async createMarketplaceListing(
    userId: string,
    input: {
      title: string;
      description: string;
      category: string;
      condition?: string;
      price: number;
      village: string;
      contactPreference?: string;
      latitude?: number;
      longitude?: number;
      images?: Array<{ url: string; isPrimary?: boolean }>;
    },
  ) {
    if (!input.title?.trim() || !input.description?.trim()) {
      throw new BadRequestException(
        'Listing title and description are required.',
      );
    }

    if (!Number.isFinite(input.price) || input.price <= 0) {
      throw new BadRequestException(
        'Price must be a valid number greater than zero.',
      );
    }

    const seller = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true, verificationStatus: true },
    });
    if (!seller?.isVerified || seller.verificationStatus !== 'approved' && seller.verificationStatus !== 'active') {
      throw new ForbiddenException('Approved seller verification is required before creating marketplace listings.');
    }

    await this.ensureUserCanCreateFeature(userId);

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < 20) {
      throw new BadRequestException(
        'Insufficient wallet balance. Marketplace listing costs ₦20.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: 20 } },
      });

      const listing = await tx.marketplaceListing.create({
        data: {
          sellerId: userId,
          title: input.title.trim(),
          description: input.description.trim(),
          category: input.category.trim(),
          condition: input.condition?.trim() || 'New',
          price: Number(input.price),
          village: input.village.trim() || 'Umukulu',
          contactPreference: input.contactPreference?.trim() || 'WhatsApp',
          latitude: typeof input.latitude === 'number' ? input.latitude : null,
          longitude:
            typeof input.longitude === 'number' ? input.longitude : null,
          images: {
            create: (input.images || []).slice(0, 4).map((image, index) => ({
              url: image.url,
              isPrimary: image.isPrimary ?? index === 0,
            })),
          },
        },
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              username: true,
              village: true,
              profilePhoto: true,
            },
          },
          images: true,
          _count: { select: { favourites: true } },
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: -20,
          type: 'marketplace_listing',
          description: `Marketplace listing fee for ${listing.title}`,
          referenceId: listing.id,
        },
      });

      return listing;
    });
  }

  async getFeed(limit = 20, offset = 0) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safeOffset = Math.max(offset, 0);

    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      skip: safeOffset,
      include: {
        author: {
          select: { id: true, fullName: true, username: true, village: true },
        },
        _count: {
          select: { comments: true, likes: true, shares: true },
        },
      },
    });
  }

  async createPost(authorId: string, content: string, photo?: string) {
    return this.prisma.post.create({
      data: { authorId, content, photo },
      include: {
        author: {
          select: { id: true, fullName: true, username: true, village: true },
        },
      },
    });
  }

  async getVillages() {
    const villageNames = [
      'AMOKOLO',
      'UMUKULU',
      'UGWUNAGBO',
      'OKWENACHALA',
      'OFEINYI',
      'AMATA',
      'UMUNEVONTA',
      'UMUOWOH',
      'UMUONYIBA',
    ];
    const users = await this.prisma.user.groupBy({
      by: ['village'],
      _count: { village: true },
    });

    const counts = new Map(
      users.map((entry) => [entry.village.toUpperCase(), entry._count.village]),
    );
    return villageNames.map((name) => ({
      name,
      members: counts.get(name) || 0,
    }));
  }

  async getVillage(name: string) {
    const village = name.toUpperCase();
    const [members, posts] = await Promise.all([
      this.prisma.user.count({ where: { village: { equals: village } } }),
      this.prisma.post.findMany({
        where: { author: { village: { equals: village } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          author: {
            select: { id: true, fullName: true, username: true, village: true },
          },
        },
      }),
    ]);
    return { name: village, members, posts };
  }

  async getGroups() {
    return this.prisma.group.findMany({
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGroup(userId: string, name: string, category = 'General') {
    await this.ensureUserCanCreateFeature(userId);

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < 30) {
      throw new BadRequestException(
        'Insufficient wallet balance. Group creation costs ₦30.',
      );
    }

    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
      '-' +
      Date.now().toString(36);

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: 30 } },
      });

      const group = await tx.group.create({
        data: {
          name,
          slug,
          category,
          members: {
            create: { userId, role: 'admin' },
          },
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: -30,
          type: 'group_creation',
          description: `Group creation fee for ${group.name}`,
          referenceId: group.id,
        },
      });

      return group;
    });
  }

  async getPages() {
    const pages = await this.prisma.page.findMany({
      include: {
        owner: { select: { id: true, fullName: true, username: true } },
        _count: { select: { followersOf: true, members: true, posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(pages.map(async (page) => {
      if (page.slug) return page;
      return this.prisma.page.update({
        where: { id: page.id },
        data: { slug: `${page.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${page.id.slice(-6)}` },
        include: {
          owner: { select: { id: true, fullName: true, username: true } },
          _count: { select: { followersOf: true, members: true, posts: true } },
        },
      });
    }));
  }

  private findPage(identifier: string) {
    return this.prisma.page.findFirst({
      where: { OR: [{ id: identifier }, { slug: identifier }] },
    });
  }

  private async ensurePageManager(pageId: string, actorId: string) {
    const member = await this.prisma.pageMember.findUnique({
      where: { pageId_userId: { pageId, userId: actorId } },
    });
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only page owners and admins can manage this page.');
    }
    return member;
  }

  async getPageSettings(pageId: string, actorId: string) {
    await this.ensurePageManager(pageId, actorId);
    return this.prisma.pageSettings.upsert({
      where: { pageId },
      update: {},
      create: { pageId },
    });
  }

  async updatePageProfile(
    pageId: string,
    actorId: string,
    input: {
      name?: string;
      category?: string;
      description?: string;
      website?: string;
      phone?: string;
      address?: string;
      profilePhoto?: string;
      coverPhoto?: string;
    },
  ) {
    await this.ensurePageManager(pageId, actorId);
    if (input.name !== undefined && !input.name.trim()) {
      throw new BadRequestException('Page name cannot be empty.');
    }

    return this.prisma.$transaction(async (tx) => {
      const page = await tx.page.update({
        where: { id: pageId },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.category !== undefined ? { category: input.category.trim() } : {}),
          ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
          ...(input.website !== undefined ? { website: input.website.trim() || null } : {}),
          ...(input.phone !== undefined ? { phone: input.phone.trim() || null } : {}),
          ...(input.address !== undefined ? { address: input.address.trim() || null } : {}),
          ...(input.profilePhoto !== undefined ? { profilePhoto: input.profilePhoto.trim() || null } : {}),
          ...(input.coverPhoto !== undefined ? { coverPhoto: input.coverPhoto.trim() || null } : {}),
        },
      });
      await tx.pageAuditLog.create({
        data: { pageId, actorId, action: 'profile_updated', metadata: input },
      });
      return page;
    });
  }

  async updatePageSettings(
    pageId: string,
    actorId: string,
    input: {
      allowMessages?: boolean;
      allowComments?: boolean;
      allowUserPosts?: boolean;
      followerVisibility?: string;
      defaultPostStatus?: string;
    },
  ) {
    await this.ensurePageManager(pageId, actorId);
    const settings = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.pageSettings.upsert({
        where: { pageId },
        update: {
          ...(typeof input.allowMessages === 'boolean' ? { allowMessages: input.allowMessages } : {}),
          ...(typeof input.allowComments === 'boolean' ? { allowComments: input.allowComments } : {}),
          ...(typeof input.allowUserPosts === 'boolean' ? { allowUserPosts: input.allowUserPosts } : {}),
          ...(input.followerVisibility ? { followerVisibility: input.followerVisibility } : {}),
          ...(input.defaultPostStatus ? { defaultPostStatus: input.defaultPostStatus } : {}),
        },
        create: { pageId },
      });
      await tx.pageAuditLog.create({
        data: { pageId, actorId, action: 'settings_updated', metadata: input },
      });
      return updated;
    });
    return settings;
  }

  async getPageAnalytics(pageId: string, actorId: string) {
    await this.ensurePageManager(pageId, actorId);
    const [page, posts, daily] = await Promise.all([
      this.prisma.page.findUnique({ where: { id: pageId }, select: { followers: true } }),
      this.prisma.pagePost.count({ where: { pageId } }),
      this.prisma.pageAnalyticsDaily.aggregate({
        where: { pageId },
        _sum: { views: true, followerAdds: true, followerDrops: true, postReach: true, postEngagement: true },
      }),
    ]);
    if (!page) throw new NotFoundException('Page not found');
    return {
      followers: page.followers,
      posts,
      views: daily._sum.views || 0,
      followerAdds: daily._sum.followerAdds || 0,
      followerDrops: daily._sum.followerDrops || 0,
      postReach: daily._sum.postReach || 0,
      postEngagement: daily._sum.postEngagement || 0,
    };
  }

  async getPage(pageId: string, userId?: string) {
    const page = await this.prisma.page.findFirst({
      where: { OR: [{ id: pageId }, { slug: pageId }] },
      include: {
        owner: { select: { id: true, fullName: true, username: true } },
        settings: true,
        _count: { select: { followersOf: true, members: true, posts: true } },
        ...(userId
          ? { followersOf: { where: { userId }, select: { id: true } } }
          : {}),
        ...(userId
          ? { members: { where: { userId }, select: { role: true } } }
          : {}),
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return {
      ...page,
      isFollowing: userId ? page.followersOf.length > 0 : false,
      canManage: userId ? page.members.some((member) => ['owner', 'admin'].includes(member.role)) : false,
      followersOf: undefined,
      members: undefined,
    };
  }

  async followPage(pageId: string, userId: string) {
    const page = await this.findPage(pageId);
    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const existing = await this.prisma.pageFollower.findUnique({
      where: { pageId_userId: { pageId: page.id, userId } },
    });
    if (existing) {
      return { success: true, following: true, followers: page.followers };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.pageFollower.create({ data: { pageId: page.id, userId } });
      return tx.page.update({
        where: { id: page.id },
        data: { followers: { increment: 1 } },
      });
    });

    if (this.notificationService && page.ownerId !== userId) {
      const follower = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, username: true },
      });
      await this.notificationService.createNotification(
        page.ownerId,
        'page_follower',
        'New page follower',
        `${follower?.fullName || follower?.username || 'Someone'} started following ${page.name}.`,
        pageId,
        'page',
      );
    }

    return { success: true, following: true, followers: updated.followers };
  }

  async unfollowPage(pageId: string, userId: string) {
    const page = await this.findPage(pageId);
    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const removed = await this.prisma.$transaction(async (tx) => {
      const result = await tx.pageFollower.deleteMany({
        where: { pageId: page.id, userId },
      });
      if (result.count === 0) {
        return page;
      }

      return tx.page.update({
        where: { id: page.id },
        data: { followers: { decrement: 1 } },
      });
    });

    return { success: true, following: false, followers: removed.followers };
  }

  async updatePageMember(
    pageId: string,
    actorId: string,
    userId: string,
    role: string,
  ) {
    const allowedRoles = ['admin', 'editor', 'moderator'];
    if (!allowedRoles.includes(role)) {
      throw new BadRequestException('Invalid page member role.');
    }

    const actor = await this.prisma.pageMember.findUnique({
      where: { pageId_userId: { pageId, userId: actorId } },
    });
    if (!actor || !['owner', 'admin'].includes(actor.role)) {
      throw new ForbiddenException('Only page owners and admins can manage roles.');
    }

    const member = await this.prisma.pageMember.findUnique({
      where: { pageId_userId: { pageId, userId } },
    });
    if (!member || member.role === 'owner') {
      throw new BadRequestException('Page member cannot be updated.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.pageMember.update({
        where: { pageId_userId: { pageId, userId } },
        data: { role },
      });
      await tx.pageAuditLog.create({
        data: {
          pageId,
          actorId,
          action: 'member_role_updated',
          metadata: { userId, role },
        },
      });
      return updated;
    });
  }

  async removePageMember(pageId: string, actorId: string, userId: string) {
    const actor = await this.prisma.pageMember.findUnique({
      where: { pageId_userId: { pageId, userId: actorId } },
    });
    if (!actor || !['owner', 'admin'].includes(actor.role)) {
      throw new ForbiddenException('Only page owners and admins can manage roles.');
    }

    const member = await this.prisma.pageMember.findUnique({
      where: { pageId_userId: { pageId, userId } },
    });
    if (!member || member.role === 'owner') {
      throw new BadRequestException('Page member cannot be removed.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.pageMember.delete({
        where: { pageId_userId: { pageId, userId } },
      });
      await tx.pageAuditLog.create({
        data: {
          pageId,
          actorId,
          action: 'member_removed',
          metadata: { userId },
        },
      });
    });

    return { success: true };
  }

  async getPageMembers(pageId: string, actorId: string) {
    const actor = await this.prisma.pageMember.findUnique({
      where: { pageId_userId: { pageId, userId: actorId } },
    });
    if (!actor || !['owner', 'admin'].includes(actor.role)) {
      throw new ForbiddenException('Only page owners and admins can view page members.');
    }

    return this.prisma.pageMember.findMany({
      where: { pageId },
      include: {
        user: {
          select: { id: true, fullName: true, username: true, profilePhoto: true },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createPage(userId: string, name: string, category: string) {
    await this.ensureUserCanCreateFeature(userId);

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < 50) {
      throw new BadRequestException(
        'Insufficient wallet balance. Page creation costs ₦50.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: 50 } },
      });

      const page = await tx.page.create({
        data: {
          name,
          slug:
            name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
            '-' +
            Date.now().toString(36),
          category,
          ownerId: userId,
          settings: { create: {} },
          members: { create: { userId, role: 'owner' } },
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: -50,
          type: 'page_creation',
          description: `Page creation fee for ${page.name}`,
          referenceId: page.id,
        },
      });

      return page;
    });
  }
}
