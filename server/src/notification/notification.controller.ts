import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  /**
   * Get all notifications for current user
   * GET /notifications
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getNotifications(
    @Req() req: any,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const unreadOnlyBool = unreadOnly === 'true';
    const limitNum = limit ? Math.min(parseInt(limit), 100) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;

    return this.notificationService.getNotifications(req.user.id, unreadOnlyBool, limitNum, offsetNum);
  }

  /**
   * Get unread notification count
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  /**
   * Get notifications by type
   * GET /notifications/type/:type
   */
  @Get('type/:type')
  @UseGuards(JwtAuthGuard)
  async getByType(
    @Req() req: any,
    @Param('type') type: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? Math.min(parseInt(limit), 100) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;

    return this.notificationService.getNotificationsByType(req.user.id, type, limitNum, offsetNum);
  }

  /**
   * Mark notification as read
   * PUT /notifications/:id/read
   */
  @Put(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(
    @Req() req: any,
    @Param('id') notificationId: string,
  ) {
    return this.notificationService.markAsRead(notificationId, req.user.id);
  }

  /**
   * Mark all notifications as read
   * PUT /notifications/read-all
   */
  @Put('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  /**
   * Delete a notification
   * DELETE /notifications/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteNotification(
    @Req() req: any,
    @Param('id') notificationId: string,
  ) {
    return this.notificationService.deleteNotification(notificationId, req.user.id);
  }

  /**
   * Delete all notifications
   * DELETE /notifications/all
   */
  @Delete('all')
  @UseGuards(JwtAuthGuard)
  async deleteAllNotifications(@Req() req: any) {
    return this.notificationService.deleteAllNotifications(req.user.id);
  }

  /**
   * Create a notification (admin/system only)
   * POST /notifications/create
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createNotification(
    @Req() req: any,
    @Body()
    body: {
      userId?: string;
      type?: string;
      title?: string;
      message?: string;
      relatedId?: string;
      relatedType?: string;
      expiresAt?: string;
    },
  ) {
    // Only allow admins or system services
    if (req.user.role !== 'admin' && req.user.role !== 'system') {
      throw new BadRequestException('Only admins can create notifications');
    }

    if (!body.userId || !body.type || !body.title || !body.message) {
      throw new BadRequestException('userId, type, title, and message are required');
    }

    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    return this.notificationService.createNotification(
      body.userId,
      body.type,
      body.title,
      body.message,
      body.relatedId,
      body.relatedType,
      expiresAt,
    );
  }

  /**
   * Broadcast notification to multiple users (admin only)
   * POST /notifications/broadcast
   */
  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  async broadcastNotification(
    @Req() req: any,
    @Body()
    body: {
      userIds?: string[];
      type?: string;
      title?: string;
      message?: string;
      relatedId?: string;
      relatedType?: string;
    },
  ) {
    // Only allow admins
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can broadcast notifications');
    }

    if (
      !body.userIds ||
      !Array.isArray(body.userIds) ||
      body.userIds.length === 0 ||
      !body.type ||
      !body.title ||
      !body.message
    ) {
      throw new BadRequestException('userIds array, type, title, and message are required');
    }

    return this.notificationService.broadcastNotification(
      body.userIds,
      body.type,
      body.title,
      body.message,
      body.relatedId,
      body.relatedType,
    );
  }

  /**
   * Cleanup expired notifications (admin only, typically run via scheduler)
   * POST /notifications/cleanup
   */
  @Post('cleanup')
  @UseGuards(JwtAuthGuard)
  async cleanupExpired(@Req() req: any) {
    // Only allow admins or system services
    if (req.user.role !== 'admin' && req.user.role !== 'system') {
      throw new BadRequestException('Only admins can cleanup notifications');
    }

    return this.notificationService.cleanupExpiredNotifications();
  }
}
