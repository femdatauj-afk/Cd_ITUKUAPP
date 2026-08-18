import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a notification for a user
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedId?: string,
    relatedType?: string,
    expiresAt?: Date,
  ) {
    this.logger.log(`Creating notification for user ${userId}: ${type}`);

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        read: false,
        createdAt: new Date(),
        expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      },
    });

    return {
      success: true,
      data: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt,
      },
    };
  }

  /**
   * Get all notifications for a user
   */
  async getNotifications(userId: string, unreadOnly: boolean = false, limit: number = 50, offset: number = 0) {
    this.logger.log(`Fetching notifications for user ${userId} (unreadOnly: ${unreadOnly})`);

    const where = { userId };
    if (unreadOnly) {
      where['read'] = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      success: true,
      data: notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string) {
    this.logger.log(`Fetching unread count for user ${userId}`);

    const count = await this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return {
      success: true,
      data: {
        unreadCount: count,
      },
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    this.logger.log(`Marking notification ${notificationId} as read for user ${userId}`);

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    this.logger.log(`Marking all notifications as read for user ${userId}`);

    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });

    return {
      success: true,
      data: {
        count: result.count,
      },
    };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    this.logger.log(`Deleting notification ${notificationId} for user ${userId}`);

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return {
      success: true,
      message: 'Notification deleted',
    };
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string) {
    this.logger.log(`Deleting all notifications for user ${userId}`);

    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });

    return {
      success: true,
      data: {
        count: result.count,
      },
    };
  }

  /**
   * Clean up expired notifications (run periodically)
   */
  async cleanupExpiredNotifications() {
    this.logger.log('Cleaning up expired notifications');

    const result = await this.prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    this.logger.log(`Deleted ${result.count} expired notifications`);

    return {
      success: true,
      data: {
        deletedCount: result.count,
      },
    };
  }

  /**
   * Broadcast notification to multiple users
   */
  async broadcastNotification(
    userIds: string[],
    type: string,
    title: string,
    message: string,
    relatedId?: string,
    relatedType?: string,
  ) {
    this.logger.log(`Broadcasting notification to ${userIds.length} users: ${type}`);

    const results: Array<{ userId: string; status: string; message?: string }> = [];

    for (const userId of userIds) {
      try {
        await this.createNotification(userId, type, title, message, relatedId, relatedType);
        results.push({ userId, status: 'success' });
      } catch (error) {
        this.logger.error(`Error creating notification for user ${userId}:`, error);
        results.push({ userId, status: 'error', message: error.message });
      }
    }

    return {
      success: true,
      data: results,
    };
  }

  /**
   * Get notifications by type
   */
  async getNotificationsByType(userId: string, type: string, limit: number = 50, offset: number = 0) {
    this.logger.log(`Fetching ${type} notifications for user ${userId}`);

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          userId,
          type,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({
        where: {
          userId,
          type,
        },
      }),
    ]);

    return {
      success: true,
      data: notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }
}
