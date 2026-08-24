import { Injectable, Logger } from '@nestjs/common';

export interface WorkerJob {
  id: string;
  type: string;
  payload: any;
  retries: number;
  maxRetries: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private queue: Map<string, WorkerJob[]> = new Map();
  private processing: Set<string> = new Set();
  private readonly defaultMaxRetries = 3;

  /**
   * Enqueue a new job
   */
  enqueueJob(
    type: string,
    payload: any,
    maxRetries: number = this.defaultMaxRetries,
  ): string {
    if (!this.queue.has(type)) {
      this.queue.set(type, []);
    }

    const jobId = `${type}:${Date.now()}:${Math.random()}`;
    const job: WorkerJob = {
      id: jobId,
      type,
      payload,
      retries: 0,
      maxRetries,
      createdAt: new Date(),
    };

    this.queue.get(type)!.push(job);
    this.logger.log(`Job enqueued: ${jobId} (type: ${type})`);

    return jobId;
  }

  /**
   * Dequeue and get next job of a specific type
   */
  dequeueJob(type: string): WorkerJob | undefined {
    const typeQueue = this.queue.get(type);
    if (!typeQueue || typeQueue.length === 0) {
      return undefined;
    }

    const job = typeQueue.shift();
    if (job) {
      this.processing.add(job.id);
      this.logger.log(`Job dequeued: ${job.id}`);
    }

    return job;
  }

  /**
   * Mark job as successfully processed
   */
  completeJob(jobId: string): void {
    this.processing.delete(jobId);
    this.logger.log(`Job completed: ${jobId}`);
  }

  /**
   * Mark job as failed and optionally retry
   */
  failJob(jobId: string, error: string, type: string): boolean {
    this.processing.delete(jobId);

    const typeQueue = this.queue.get(type);
    if (!typeQueue) {
      return false;
    }

    // Find job in processing context
    // For retry, we need to re-enqueue or handle externally
    this.logger.error(`Job failed: ${jobId} - ${error}`);

    return true;
  }

  /**
   * Requeue a failed job if retries remain
   */
  requeueJob(
    jobId: string,
    type: string,
    payload: any,
    retries: number,
  ): boolean {
    if (retries >= this.defaultMaxRetries) {
      this.logger.warn(`Job ${jobId} exceeded max retries`);
      return false;
    }

    const job: WorkerJob = {
      id: `${jobId}:retry:${retries + 1}`,
      type,
      payload,
      retries: retries + 1,
      maxRetries: this.defaultMaxRetries,
      createdAt: new Date(),
      error: `Retry attempt ${retries + 1}`,
    };

    if (!this.queue.has(type)) {
      this.queue.set(type, []);
    }

    this.queue.get(type)!.push(job);
    this.logger.log(`Job requeued: ${job.id} (attempt ${retries + 1})`);

    return true;
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const stats: any = {};

    this.queue.forEach((jobs, type) => {
      stats[type] = {
        queued: jobs.length,
        processing: Array.from(this.processing).filter((id) =>
          id.startsWith(type),
        ).length,
        total:
          jobs.length +
          Array.from(this.processing).filter((id) => id.startsWith(type))
            .length,
      };
    });

    return stats;
  }

  /**
   * Clear all jobs of a specific type
   */
  clearQueue(type: string): number {
    const count = this.queue.get(type)?.length || 0;
    this.queue.delete(type);
    this.logger.log(`Queue cleared: ${type} (${count} jobs removed)`);
    return count;
  }

  /**
   * Get queue size for a type
   */
  getQueueSize(type: string): number {
    return this.queue.get(type)?.length || 0;
  }

  /**
   * Check if processing any jobs
   */
  isProcessing(jobId?: string): boolean {
    if (jobId) {
      return this.processing.has(jobId);
    }
    return this.processing.size > 0;
  }
}
