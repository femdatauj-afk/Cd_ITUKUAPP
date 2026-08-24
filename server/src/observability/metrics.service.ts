import { Injectable, Logger } from '@nestjs/common';

export interface MetricsData {
  requests: {
    total: number;
    byMethod: { [key: string]: number };
    byStatus: { [key: string]: number };
    averageResponseTime: number;
  };
  errors: {
    total: number;
    byType: { [key: string]: number };
    recent: Array<{
      timestamp: Date;
      type: string;
      message: string;
      path?: string;
    }>;
  };
  database: {
    queries: number;
    averageQueryTime: number;
  };
  workers: {
    jobsProcessed: number;
    jobsFailed: number;
  };
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  private metrics: MetricsData = {
    requests: {
      total: 0,
      byMethod: {},
      byStatus: {},
      averageResponseTime: 0,
    },
    errors: {
      total: 0,
      byType: {},
      recent: [],
    },
    database: {
      queries: 0,
      averageQueryTime: 0,
    },
    workers: {
      jobsProcessed: 0,
      jobsFailed: 0,
    },
  };

  private requestTimings: number[] = [];
  private queryTimings: number[] = [];
  private readonly maxRecentErrors = 100;

  /**
   * Record an incoming request
   */
  recordRequest(method: string, path: string): (statusCode: number) => void {
    const startTime = Date.now();

    return (statusCode: number) => {
      const duration = Date.now() - startTime;
      this.requestTimings.push(duration);

      // Keep only last 1000 timings
      if (this.requestTimings.length > 1000) {
        this.requestTimings.shift();
      }

      this.metrics.requests.total++;
      this.metrics.requests.byMethod[method] =
        (this.metrics.requests.byMethod[method] || 0) + 1;
      this.metrics.requests.byStatus[statusCode] =
        (this.metrics.requests.byStatus[statusCode] || 0) + 1;
      this.metrics.requests.averageResponseTime =
        this.requestTimings.reduce((a, b) => a + b, 0) /
        this.requestTimings.length;

      this.logger.debug(`${method} ${path} - ${statusCode} (${duration}ms)`);
    };
  }

  /**
   * Record a database query
   */
  recordDatabaseQuery(duration: number): void {
    this.queryTimings.push(duration);

    // Keep only last 1000 timings
    if (this.queryTimings.length > 1000) {
      this.queryTimings.shift();
    }

    this.metrics.database.queries++;
    this.metrics.database.averageQueryTime =
      this.queryTimings.reduce((a, b) => a + b, 0) / this.queryTimings.length;
  }

  /**
   * Record an error
   */
  recordError(type: string, message: string, path?: string): void {
    this.metrics.errors.total++;
    this.metrics.errors.byType[type] =
      (this.metrics.errors.byType[type] || 0) + 1;

    // Add to recent errors
    this.metrics.errors.recent.unshift({
      timestamp: new Date(),
      type,
      message,
      path,
    });

    // Keep only recent errors
    if (this.metrics.errors.recent.length > this.maxRecentErrors) {
      this.metrics.errors.recent.pop();
    }

    this.logger.error(
      `Error (${type}): ${message}${path ? ` at ${path}` : ''}`,
    );
  }

  /**
   * Record a completed worker job
   */
  recordWorkerJob(success: boolean): void {
    if (success) {
      this.metrics.workers.jobsProcessed++;
    } else {
      this.metrics.workers.jobsFailed++;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): MetricsData {
    return this.metrics;
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    return {
      totalRequests: this.metrics.requests.total,
      totalErrors: this.metrics.errors.total,
      errorRate:
        this.metrics.requests.total > 0
          ? (
              (this.metrics.errors.total / this.metrics.requests.total) *
              100
            ).toFixed(2) + '%'
          : '0%',
      averageResponseTime:
        this.metrics.requests.averageResponseTime.toFixed(2) + 'ms',
      averageQueryTime:
        this.metrics.database.averageQueryTime.toFixed(2) + 'ms',
      workersJobsProcessed: this.metrics.workers.jobsProcessed,
      workersJobsFailed: this.metrics.workers.jobsFailed,
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byStatus: {},
        averageResponseTime: 0,
      },
      errors: {
        total: 0,
        byType: {},
        recent: [],
      },
      database: {
        queries: 0,
        averageQueryTime: 0,
      },
      workers: {
        jobsProcessed: 0,
        jobsFailed: 0,
      },
    };
    this.requestTimings = [];
    this.queryTimings = [];
    this.logger.log('Metrics reset');
  }
}
