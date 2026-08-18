import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderationService: ModerationService,
  ) {}

  private async ensureUserCanCreateFeature(userId: string) {
    const isModerated = await this.moderationService.checkUserModeration(userId);
    if (isModerated) {
      const status = await this.moderationService.getModerationStatus(userId);
      throw new BadRequestException(
        `Your account is currently ${status.action}. Reason: ${status.reason}${
          status.daysRemaining ? ` (${status.daysRemaining} days remaining)` : ''
        }`,
      );
    }
  }

  async getMarketplaceListings() {
    return this.prisma.marketplaceListing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: { id: true, fullName: true, username: true, village: true, profilePhoto: true },
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

  async createMarketplaceListing(userId: string, input: {
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
  }) {
    if (!input.title?.trim() || !input.description?.trim()) {
      throw new BadRequestException('Listing title and description are required.');
    }

    if (!Number.isFinite(input.price) || input.price <= 0) {
      throw new BadRequestException('Price must be a valid number greater than zero.');
    }

    await this.ensureUserCanCreateFeature(userId);

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < 20) {
      throw new BadRequestException('Insufficient wallet balance. Marketplace listing costs ₦20.');
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
          longitude: typeof input.longitude === 'number' ? input.longitude : null,
          images: {
            create: (input.images || []).slice(0, 4).map((image, index) => ({
              url: image.url,
              isPrimary: image.isPrimary ?? index === 0,
            })),
          },
        },
        include: {
          seller: {
            select: { id: true, fullName: true, username: true, village: true, profilePhoto: true },
          },
          images: true,
          _count: { select: { favourites: true } },
        },
      });

      return listing;
    });
  }

  async getFeed() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, fullName: true, username: true, village: true },
        },
      },
    });
  }

  async createPost(authorId: string, content: string) {
    return this.prisma.post.create({
      data: { authorId, content },
      include: {
        author: {
          select: { id: true, fullName: true, username: true, village: true },
        },
      },
    });
  }

  async getVillages() {
    const villageNames = [
      'AMOKOLO', 'UMUKULU', 'UGWUNAGBO', 'OKWENACHALA', 'OFEINYI',
      'AMATA', 'UMUNEVONTA', 'UMUOWOH', 'UMUONYIBA',
    ];
    const users = await this.prisma.user.groupBy({
      by: ['village'],
      _count: { village: true },
    });

    const counts = new Map(users.map((entry) => [entry.village.toUpperCase(), entry._count.village]));
    return villageNames.map((name) => ({ name, members: counts.get(name) || 0 }));
  }

  async getVillage(name: string) {
    const village = name.toUpperCase();
    const [members, posts] = await Promise.all([
      this.prisma.user.count({ where: { village: { equals: village } } }),
      this.prisma.post.findMany({
        where: { author: { village: { equals: village } } },
        orderBy: { createdAt: 'desc' }, take: 20,
        include: { author: { select: { id: true, fullName: true, username: true, village: true } } },
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
      throw new BadRequestException('Insufficient wallet balance. Group creation costs ₦30.');
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

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

      return group;
    });
  }

  async getPages() {
    return this.prisma.page.findMany({
      include: {
        owner: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPage(userId: string, name: string, category: string) {
    await this.ensureUserCanCreateFeature(userId);

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < 50) {
      throw new BadRequestException('Insufficient wallet balance. Page creation costs ₦50.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: 50 } },
      });

      const page = await tx.page.create({
        data: {
          name,
          category,
          ownerId: userId,
        },
      });

      return page;
    });
  }
}
