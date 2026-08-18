import { Module } from '@nestjs/common';
import { MediaDeliveryService } from './media-delivery.service';
import { MediaDeliveryController } from './media-delivery.controller';
import { CdnOptimizationService } from './cdn-optimization.service';

@Module({
  providers: [MediaDeliveryService, CdnOptimizationService],
  controllers: [MediaDeliveryController],
  exports: [MediaDeliveryService, CdnOptimizationService],
})
export class MediaModule {}
