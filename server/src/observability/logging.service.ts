import { Injectable, Logger, LogLevel } from '@nestjs/common';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  error?: string;
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);
  private logs: LogEntry[] = [];
  private readonly maxLogs = 5000; // Keep last 5000 logs in memory

  /**
   * Log a message
   */
  log(context: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'log',
      context,
      message,
      data,
    };

    this.addLogEntry(entry);
    this.logger.log(`[${context}] ${message}`, data);
  }

  /**
   * Log an error
   */
  error(context: string, message: string, error?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'error',
      context,
      message,
      error: error?.message || error?.toString(),
    };

    this.addLogEntry(entry);
    this.logger.error(`[${context}] ${message}`, error?.stack);
  }

  /**
   * Log a warning
   */
  warn(context: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'warn',
      context,
      message,
      data,
    };

    this.addLogEntry(entry);
    this.logger.warn(`[${context}] ${message}`, data);
  }

  /**
   * Log debug information
   */
  debug(context: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'debug',
      context,
      message,
      data,
    };

    this.addLogEntry(entry);
    this.logger.debug(`[${context}] ${message}`, data);
  }

  /**
   * Add log entry to in-memory storage
   */
  private addLogEntry(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Get all logs
   */
  getLogs(limit?: number, context?: string, level?: LogLevel): LogEntry[] {
    let filtered = [...this.logs];

    if (context) {
      filtered = filtered.filter((log) => log.context === context);
    }

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    if (limit) {
      return filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Get logs for a specific context
   */
  getLogsByContext(context: string, limit?: number): LogEntry[] {
    return this.getLogs(limit, context);
  }

  /**
   * Get error logs
   */
  getErrorLogs(limit?: number): LogEntry[] {
    return this.getLogs(limit, undefined, 'error');
  }

  /**
   * Get warning logs
   */
  getWarningLogs(limit?: number): LogEntry[] {
    return this.getLogs(limit, undefined, 'warn');
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    this.logger.log('All logs cleared');
  }

  /**
   * Get log statistics
   */
  getLogStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        log: 0,
        error: 0,
        warn: 0,
        debug: 0,
      },
      byContext: {} as { [key: string]: number },
    };

    for (const log of this.logs) {
      stats.byLevel[log.level]++;
      stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
    }

    return stats;
  }
}
