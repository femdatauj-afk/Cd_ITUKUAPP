import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: {
      status: 'ok' | 'error';
      latency: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning';
      usage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
      };
      percentUsed: number;
    };
    uptime: {
      status: 'ok';
      seconds: number;
    };
    workers: {
      status: 'ok' | 'warning';
      running: string[];
      message?: string;
    };
  };
  timestamp: Date;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private startTime = Date.now();
  private readonly memoryThresholdPercent = 85;

  constructor(private prisma: PrismaService) {}

  /**
   * Get full health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const [database, memory, uptime, workers] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkUptime(),
      this.checkWorkers(),
    ]);

    // Determine overall status
    const allStatuses = [
      database.status,
      memory.status,
      uptime.status,
      workers.status,
    ];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (allStatuses.includes('error')) {
      overallStatus = 'unhealthy';
    } else if (allStatuses.includes('warning')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      checks: {
        database,
        memory,
        uptime,
        workers,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<any> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        status: 'ok',
        latency,
      };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error}`);
      return {
        status: 'error',
        latency: Date.now() - start,
        error: error.message,
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<any> {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    const status =
      heapUsedPercent > this.memoryThresholdPercent ? 'warning' : 'ok';

    if (status === 'warning') {
      this.logger.warn(
        `Memory usage is high: ${heapUsedPercent.toFixed(2)}% of heap used`,
      );
    }

    return {
      status,
      usage: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
      percentUsed: heapUsedPercent,
    };
  }

  /**
   * Check uptime
   */
  private async checkUptime(): Promise<any> {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status: 'ok',
      seconds: uptimeSeconds,
    };
  }

  /**
   * Check worker status
   */
  private async checkWorkers(): Promise<any> {
    try {
      // This would be populated when workers are running
      // For now, we return a basic check
      const runningWorkers = [];

      // Try to inject worker status if workers are available
      // This is a simplified version - in production, would query worker service

      return {
        status: 'ok',
        running: runningWorkers,
        message: 'Workers are running',
      };
    } catch (error) {
      this.logger.error(`Worker health check failed: ${error}`);
      return {
        status: 'warning',
        running: [],
        message: error.message,
      };
    }
  }

  /**
   * Get liveness probe (simple up/down check)
   */
  async getLiveness(): Promise<{ alive: boolean }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { alive: true };
    } catch (error) {
      this.logger.error(`Liveness check failed: ${error}`);
      return { alive: false };
    }
  }

  /**
   * Get readiness probe (ready to receive requests)
   */
  async getReadiness(): Promise<{ ready: boolean; message: string }> {
    try {
      const health = await this.getHealthStatus();

      if (health.status === 'unhealthy') {
        return { ready: false, message: 'Service is unhealthy' };
      }

      return { ready: true, message: 'Service is ready' };
    } catch (error) {
      this.logger.error(`Readiness check failed: ${error}`);
      return { ready: false, message: error.message };
    }
  }
}
