import { Injectable, Logger } from '@nestjs/common';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

export interface RateLimitRecord {
  count: number;
  resetTime: number;
  blocked?: boolean;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private records: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private config: RateLimitConfig) {
    this.startCleanup();
  }

  /**
   * Start cleanup interval to remove expired records
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredRecords();
    }, this.config.windowMs);
  }

  /**
   * Stop cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    let record = this.records.get(key);

    // Create new record if doesn't exist
    if (!record) {
      record = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      this.records.set(key, record);
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: record.resetTime,
      };
    }

    // Check if window has expired
    if (now >= record.resetTime) {
      record.count = 1;
      record.resetTime = now + this.config.windowMs;
      record.blocked = false;
      this.records.set(key, record);
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: record.resetTime,
      };
    }

    // Check if limit exceeded
    if (record.count >= this.config.maxRequests) {
      record.blocked = true;
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    // Increment and allow
    record.count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  /**
   * Clean up expired records
   */
  private cleanupExpiredRecords(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.records.entries()) {
      if (now >= record.resetTime) {
        this.records.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit records`);
    }
  }

  /**
   * Get rate limit status for a key
   */
  getStatus(key: string): RateLimitRecord | null {
    return this.records.get(key) || null;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.records.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    const count = this.records.size;
    this.records.clear();
    this.logger.log(`Reset ${count} rate limit records`);
  }

  /**
   * Get rate limit statistics
   */
  getStats() {
    return {
      totalRecords: this.records.size,
      blockedRecords: Array.from(this.records.values()).filter((r) => r.blocked)
        .length,
      windowMs: this.config.windowMs,
      maxRequests: this.config.maxRequests,
    };
  }
}
