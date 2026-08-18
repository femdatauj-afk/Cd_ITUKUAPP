import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { LoggingService } from './logging.service';

@Module({
  providers: [MetricsService, LoggingService],
  controllers: [MetricsController],
  exports: [MetricsService, LoggingService],
})
export class ObservabilityModule {}
