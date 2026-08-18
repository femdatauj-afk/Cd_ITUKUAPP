import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommunityModule } from './community/community.module';
import { CommunityController } from './community/community.controller';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { MessageModule } from './message/message.module';
import { WalletModule } from './wallet/wallet.module';
import { ChatModule } from './chat/chat.module';
import { ModerationModule } from './moderation/moderation.module';
import { StorageModule } from './storage/storage.module';
import { UploadModule } from './upload/upload.module';
import { NotificationModule } from './notification/notification.module';
import { WorkersModule } from './workers/workers.module';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './observability/observability.module';
import { MediaModule } from './media/media.module';
import { SecurityModule } from './security/security.module';
import { NotificationWorker } from './workers/notification.worker';
import { IndexingWorker } from './workers/indexing.worker';

const featureModules = [
  SecurityModule,
  AuthModule,
  UserModule,
  CommunityModule,
  PostModule,
  MessageModule,
  WalletModule,
  ChatModule,
  ModerationModule,
  StorageModule,
  UploadModule,
  NotificationModule,
  WorkersModule,
  HealthModule,
  ObservabilityModule,
  MediaModule,
];

@Module({
  imports: featureModules,
  controllers: [AppController, CommunityController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private notificationWorker: NotificationWorker,
    private indexingWorker: IndexingWorker,
  ) {}

  onModuleInit() {
    // Start background workers
    this.notificationWorker.start();
    this.indexingWorker.start();
  }
}
