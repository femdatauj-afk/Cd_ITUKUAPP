import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { NotificationWorker } from './notification.worker';
import { IndexingWorker } from './indexing.worker';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, ChatModule],
  providers: [QueueService, NotificationWorker, IndexingWorker],
  exports: [QueueService, NotificationWorker, IndexingWorker],
})
export class WorkersModule {}
