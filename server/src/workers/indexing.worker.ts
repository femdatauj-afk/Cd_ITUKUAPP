import { Injectable, Logger } from '@nestjs/common';
import { QueueService, WorkerJob } from './queue.service';
import { PrismaService } from '../prisma/prisma.service';

export interface IndexEntry {
  id: string;
  type: string; // 'post', 'comment', 'page', 'group'
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
  tags: string[];
  indexed: boolean;
  indexedAt?: Date;
}

@Injectable()
export class IndexingWorker {
  private readonly logger = new Logger(IndexingWorker.name);
  private isRunning = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private indexStorage: Map<string, IndexEntry> = new Map();

  constructor(
    private readonly queue: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Start the indexing worker
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Indexing worker is already running');
      return;
    }

    this.isRunning = true;
    this.logger.log('Indexing worker started');

    // Poll queue every 200ms
    this.pollingInterval = setInterval(() => {
      this.processNextJob();
    }, 200);
  }

  /**
   * Stop the indexing worker
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

    this.logger.log('Indexing worker stopped');
  }

  /**
   * Process a single indexing job
   */
  private async processNextJob(): Promise<void> {
    try {
      const job = this.queue.dequeueJob('indexing');
      if (!job) {
        return;
      }

      await this.indexContent(job);
      this.queue.completeJob(job.id);
    } catch (error) {
      this.logger.error(`Error processing indexing job: ${error}`);
    }
  }

  /**
   * Index content for search
   */
  private async indexContent(job: WorkerJob): Promise<void> {
    try {
      const { contentType, contentId, title, content, authorId, tags } =
        job.payload;

      this.logger.log(`Indexing ${contentType} ${contentId}`);

      // Create index entry
      const indexId = `${contentType}:${contentId}`;
      const entry: IndexEntry = {
        id: indexId,
        type: contentType,
        title,
        content,
        authorId,
        createdAt: new Date(),
        tags: tags || [],
        indexed: true,
        indexedAt: new Date(),
      };

      // Store in memory index (in production, would use Elasticsearch or similar)
      this.indexStorage.set(indexId, entry);

      // Optional: Mark in database as indexed
      // This would require adding an "indexed" field to Post/Comment models
      // For now, we just track in memory

      this.logger.log(`Successfully indexed ${contentType} ${contentId}`);
    } catch (error) {
      this.logger.error(`Failed to index content: ${error}`);
      throw error;
    }
  }

  /**
   * Enqueue content for indexing
   */
  enqueueIndexing(
    contentType: string,
    contentId: string,
    title: string,
    content: string,
    authorId: string,
    tags: string[] = [],
  ): string {
    return this.queue.enqueueJob('indexing', {
      contentType,
      contentId,
      title,
      content,
      authorId,
      tags,
    });
  }

  /**
   * Search indexed content
   */
  search(query: string, contentType?: string): IndexEntry[] {
    const results: IndexEntry[] = [];
    const queryLower = query.toLowerCase();

    for (const entry of this.indexStorage.values()) {
      // Filter by type if specified
      if (contentType && entry.type !== contentType) {
        continue;
      }

      // Simple text search in title and content
      if (
        entry.title.toLowerCase().includes(queryLower) ||
        entry.content.toLowerCase().includes(queryLower) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(queryLower))
      ) {
        results.push(entry);
      }
    }

    return results;
  }

  /**
   * Get indexed content by ID
   */
  getIndexEntry(id: string): IndexEntry | undefined {
    return this.indexStorage.get(id);
  }

  /**
   * Get all indexed entries for a content type
   */
  getIndexedByType(contentType: string): IndexEntry[] {
    return Array.from(this.indexStorage.values()).filter(
      (entry) => entry.type === contentType,
    );
  }

  /**
   * Clear index for a specific content type
   */
  clearIndex(contentType?: string): number {
    if (!contentType) {
      const count = this.indexStorage.size;
      this.indexStorage.clear();
      this.logger.log(`Cleared entire index (${count} entries)`);
      return count;
    }

    let count = 0;
    for (const [key] of this.indexStorage.entries()) {
      if (key.startsWith(contentType)) {
        this.indexStorage.delete(key);
        count++;
      }
    }

    this.logger.log(`Cleared index for type ${contentType} (${count} entries)`);
    return count;
  }

  /**
   * Get indexing statistics
   */
  getIndexStats() {
    const stats = {
      totalIndexed: this.indexStorage.size,
      byType: {},
      queueStats: this.queue.getQueueStats(),
    };

    // Count by type
    for (const entry of this.indexStorage.values()) {
      if (!stats.byType[entry.type]) {
        stats.byType[entry.type] = 0;
      }
      stats.byType[entry.type]++;
    }

    return stats;
  }

  /**
   * Get if worker is running
   */
  isWorkerRunning(): boolean {
    return this.isRunning;
  }
}
