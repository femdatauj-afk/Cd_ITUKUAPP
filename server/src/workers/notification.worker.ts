import { Injectable, Logger } from '@nestjs/common';
import { QueueService, WorkerJob } from './queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);
  private isRunning = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly queue: QueueService,
    private readonly prisma: PrismaService,
    private readonly chat: ChatGateway,
  ) {}

  /**
   * Start the notification worker
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Notification worker is already running');
      return;
    }

    this.isRunning = true;
    this.logger.log('Notification worker started');

    // Poll queue every 100ms
    this.pollingInterval = setInterval(() => {
      this.processNextJob();
    }, 100);
  }

  /**
   * Stop the notification worker
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.logger.log('Notification worker stopped');
  }

  /**
   * Process a single notification job
   */
  private async processNextJob(): Promise<void> {
    try {
      const job = this.queue.dequeueJob('notification');
      if (!job) {
        return;
      }

      await this.deliverNotification(job);
      this.queue.completeJob(job.id);
    } catch (error) {
      this.logger.error(`Error processing notification job: ${error}`);
    }
  }

  /**
   * Deliver a notification to a user
   */
  private async deliverNotification(job: WorkerJob): Promise<void> {
    try {
      const { userId, type, title, message, relatedId, relatedType } =
        job.payload;

      if (!userId) {
        throw new Error('Missing userId in notification payload');
      }

      this.logger.log(`Delivering notification to user ${userId}: ${type}`);

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Create notification record
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
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // Send via Socket.IO if gateway available
      try {
        this.chat.sendNotificationToUser(userId, {
          id: notification.id,
          type,
          title,
          message,
          relatedId,
          relatedType,
          timestamp: new Date(),
        });
      } catch (socketError) {
        this.logger.warn(
          `Could not send notification via Socket.IO: ${socketError}`,
        );
        // Continue - notification is still stored in DB
      }

      this.logger.log(`Notification delivered to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to deliver notification: ${error}`);
      throw error;
    }
  }

  /**
   * Enqueue a notification for delivery
   */
  enqueueNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedId?: string,
    relatedType?: string,
  ): string {
    return this.queue.enqueueJob('notification', {
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType,
    });
  }

  /**
   * Get notification queue statistics
   */
  getQueueStats() {
    return this.queue.getQueueStats();
  }

  /**
   * Get if worker is running
   */
  isWorkerRunning(): boolean {
    return this.isRunning;
  }
}
