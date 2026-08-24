import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ModerationStatus {
  isModerated: boolean;
  action?: string;
  reason?: string;
  expiresAt?: Date | null;
  daysRemaining?: number | null;
}

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async getModerationStatus(userId: string): Promise<ModerationStatus> {
    const activeModerations = await this.prisma.moderationAction.findMany({
      where: {
        userId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (activeModerations.length === 0) {
      return { isModerated: false };
    }

    const moderation = activeModerations[0];
    const daysRemaining = moderation.expiresAt
      ? Math.ceil(
          (moderation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      isModerated: true,
      action: moderation.action,
      reason: moderation.reason,
      expiresAt: moderation.expiresAt,
      daysRemaining: daysRemaining,
    };
  }

  async checkUserModeration(userId: string): Promise<boolean> {
    const status = await this.getModerationStatus(userId);
    return status.isModerated;
  }

  async createModerationAction(
    userId: string,
    action: 'warning' | 'mute' | 'suspend' | 'ban',
    reason: string,
    durationHours?: number,
  ) {
    const expiresAt = durationHours
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
      : null;

    const moderation = await this.prisma.moderationAction.create({
      data: {
        userId,
        action,
        reason,
        duration: durationHours,
        expiresAt,
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    return moderation;
  }

  async resolveModerationAction(actionId: string) {
    const moderation = await this.prisma.moderationAction.update({
      where: { id: actionId },
      data: {
        isActive: false,
        resolvedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    return moderation;
  }

  async listModerationActions(filter?: {
    userId?: string;
    action?: string;
    isActive?: boolean;
  }) {
    return this.prisma.moderationAction.findMany({
      where: {
        ...(filter?.userId && { userId: filter.userId }),
        ...(filter?.action && { action: filter.action }),
        ...(filter?.isActive !== undefined && { isActive: filter.isActive }),
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
