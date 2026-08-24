import * as fs from 'node:fs';
import * as path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';

function loadDotEnvFromProjectRoot(): void {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env'),
  ];

  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      loadEnv({ path: filePath, override: false });
      return;
    }
  }
}

export interface EnvironmentConfig {
  nodeEnv: 'development' | 'staging' | 'production';
  port: number;
  jwtSecret: string;
  databaseUrl: string;
  jwtExpiresIn: string;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  logLevel: string;
  cdnUrl?: string;
}

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);
  private config: EnvironmentConfig;

  constructor() {
    loadDotEnvFromProjectRoot();
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  /**
   * Load environment configuration
   */
  private loadConfiguration(): EnvironmentConfig {
    return {
      nodeEnv:
        (process.env.NODE_ENV as 'development' | 'staging' | 'production') ||
        'development',
      port: parseInt(process.env.PORT || '3000'),
      jwtSecret: process.env.JWT_SECRET || '',
      databaseUrl: process.env.DATABASE_URL || '',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
      corsOrigins: (
        process.env.CORS_ORIGINS ||
        'http://localhost:3002'
      )
        .split(',')
        .map((origin) => origin.trim()),
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
      rateLimitMaxRequests: parseInt(
        process.env.RATE_LIMIT_MAX_REQUESTS || '100',
      ),
      logLevel: process.env.LOG_LEVEL || 'log',
      cdnUrl: process.env.CDN_URL,
    };
  }

  /**
   * Validate environment configuration
   */
  private validateConfiguration(): void {
    const errors: string[] = [];

    // Check required variables
    if (!this.config.jwtSecret) {
      errors.push('JWT_SECRET is required');
    }

    if (!this.config.databaseUrl) {
      errors.push('DATABASE_URL is required');
    }

    // Production-specific validations
    if (this.config.nodeEnv === 'production') {
      if (this.config.jwtSecret.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters in production');
      }

      if (!this.config.cdnUrl) {
        this.logger.warn('CDN_URL not configured in production');
      }
    }

    // CORS validation
    if (this.config.corsOrigins.length === 0) {
      errors.push('CORS_ORIGINS must be configured');
    }

    if (errors.length > 0) {
      this.logger.error('Environment configuration errors:');
      errors.forEach((error) => this.logger.error(`  - ${error}`));
      throw new BadRequestException('Invalid environment configuration');
    }

    this.logger.log('Environment configuration validated successfully');
    this.logConfiguration();
  }

  /**
   * Log configuration (without sensitive data)
   */
  private logConfiguration(): void {
    this.logger.log('Active Configuration:');
    this.logger.log(`  Environment: ${this.config.nodeEnv}`);
    this.logger.log(`  Port: ${this.config.port}`);
    this.logger.log(`  JWT Expiry: ${this.config.jwtExpiresIn}`);
    this.logger.log(`  CORS Origins: ${this.config.corsOrigins.join(', ')}`);
    this.logger.log(
      `  Rate Limit: ${this.config.rateLimitMaxRequests} requests per ${this.config.rateLimitWindowMs}ms`,
    );
    this.logger.log(`  Log Level: ${this.config.logLevel}`);
  }

  /**
   * Get full configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Get specific config value
   */
  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  /**
   * Check if production
   */
  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  /**
   * Check if staging
   */
  isStaging(): boolean {
    return this.config.nodeEnv === 'staging';
  }

  /**
   * Check if development
   */
  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  /**
   * Validate CORS origin
   */
  isAllowedOrigin(origin: string): boolean {
    return (
      this.config.corsOrigins.includes(origin) ||
      this.config.corsOrigins.includes('*')
    );
  }

  /**
   * Get environment summary for health checks
   */
  getEnvironmentSummary() {
    return {
      environment: this.config.nodeEnv,
      port: this.config.port,
      jwtConfigured: !!this.config.jwtSecret,
      databaseConfigured: !!this.config.databaseUrl,
      corsOriginsCount: this.config.corsOrigins.length,
      cdnConfigured: !!this.config.cdnUrl,
    };
  }
}
