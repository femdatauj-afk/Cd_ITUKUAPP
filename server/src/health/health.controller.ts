import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /**
   * Full health status endpoint
   * GET /health/status
   */
  @Get('status')
  async getStatus() {
    return this.health.getHealthStatus();
  }

  /**
   * Liveness probe endpoint (for Kubernetes)
   * GET /health/live
   */
  @Get('live')
  async getLive() {
    return this.health.getLiveness();
  }

  /**
   * Readiness probe endpoint (for Kubernetes)
   * GET /health/ready
   */
  @Get('ready')
  async getReady() {
    return this.health.getReadiness();
  }

  /**
   * Simple health check (root)
   * GET /health
   */
  @Get()
  async getHealth() {
    const status = await this.health.getHealthStatus();
    return {
      status: status.status,
      message:
        status.status === 'healthy'
          ? 'Service is healthy'
          : status.status === 'degraded'
            ? 'Service is degraded'
            : 'Service is unhealthy',
      timestamp: status.timestamp,
    };
  }
}
