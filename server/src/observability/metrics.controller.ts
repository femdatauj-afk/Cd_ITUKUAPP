import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  /**
   * Get all metrics
   * GET /metrics
   */
  @Get()
  getMetrics() {
    return this.metrics.getMetrics();
  }

  /**
   * Get metrics summary
   * GET /metrics/summary
   */
  @Get('summary')
  getMetricsSummary() {
    return this.metrics.getMetricsSummary();
  }
}
