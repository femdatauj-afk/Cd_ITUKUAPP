import { Injectable, Logger } from '@nestjs/common';

export interface MediaDeliveryConfig {
  cdnEnabled: boolean;
  cdnUrl: string;
  cacheTtl: number; // in seconds
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  compressionEnabled: boolean;
  optimizeImages: boolean;
}

export interface MediaOptimization {
  originalSize: number;
  optimizedSize?: number;
  compressionRatio?: number;
  format?: string;
  width?: number;
  height?: number;
  quality?: number;
}

@Injectable()
export class MediaDeliveryService {
  private readonly logger = new Logger(MediaDeliveryService.name);

  private config: MediaDeliveryConfig = {
    cdnEnabled: process.env.CDN_ENABLED === 'true',
    cdnUrl: process.env.CDN_URL || '',
    cacheTtl: parseInt(process.env.CACHE_TTL || '86400'), // 24 hours default
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
    ],
    compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
    optimizeImages: process.env.IMAGE_OPTIMIZATION !== 'false',
  };

  constructor() {
    this.logConfiguration();
  }

  /**
   * Log media delivery configuration
   */
  private logConfiguration(): void {
    this.logger.log('Media Delivery Configuration:');
    this.logger.log(`  CDN Enabled: ${this.config.cdnEnabled}`);
    this.logger.log(`  Cache TTL: ${this.config.cacheTtl}s`);
    this.logger.log(
      `  Max File Size: ${(this.config.maxFileSize / 1024 / 1024).toFixed(2)}MB`,
    );
    this.logger.log(`  Compression: ${this.config.compressionEnabled}`);
    this.logger.log(`  Image Optimization: ${this.config.optimizeImages}`);
  }

  /**
   * Generate CDN URL for media
   */
  generateCdnUrl(
    objectKey: string,
    options?: { width?: number; height?: number; quality?: number },
  ): string {
    if (!this.config.cdnEnabled || !this.config.cdnUrl) {
      return objectKey;
    }

    let url = `${this.config.cdnUrl}/${objectKey}`;

    // Add image optimization parameters if provided
    if (options) {
      const params: string[] = [];
      if (options.width) params.push(`w=${options.width}`);
      if (options.height) params.push(`h=${options.height}`);
      if (options.quality) params.push(`q=${options.quality}`);

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
    }

    return url;
  }

  /**
   * Get cache headers for media delivery
   */
  getCacheHeaders(mimeType: string, maxAge?: number): Record<string, string> {
    const ttl = maxAge || this.config.cacheTtl;

    return {
      'Cache-Control': `public, max-age=${ttl}`,
      Expires: new Date(Date.now() + ttl * 1000).toUTCString(),
      ETag: this.generateETag(),
      'Last-Modified': new Date().toUTCString(),
    };
  }

  /**
   * Generate ETag for cache validation
   */
  private generateETag(): string {
    return `"${Date.now().toString(36)}"`;
  }

  /**
   * Get security headers for media delivery
   */
  getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy':
        "default-src 'self'; img-src 'self' data: https:; media-src 'self'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    };
  }

  /**
   * Validate file before upload
   */
  validateFile(
    mimeType: string,
    fileSize: number,
  ): { valid: boolean; error?: string } {
    if (!this.config.allowedMimeTypes.includes(mimeType)) {
      return {
        valid: false,
        error: `File type not allowed. Supported types: ${this.config.allowedMimeTypes.join(', ')}`,
      };
    }

    if (fileSize > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${(this.config.maxFileSize / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Get optimal media format based on mime type
   */
  getOptimalFormat(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      // WebP is most efficient for images, fallback to original
      return 'webp';
    }

    if (mimeType.startsWith('video/')) {
      // H.264/MP4 is most compatible
      return 'mp4';
    }

    if (mimeType.startsWith('audio/')) {
      // MP3 is most compatible for audio
      return 'mp3';
    }

    return 'original';
  }

  /**
   * Calculate optimal image dimensions
   */
  getOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    targetWidth: number,
  ): { width: number; height: number } {
    const aspectRatio = originalHeight / originalWidth;
    return {
      width: targetWidth,
      height: Math.round(targetWidth * aspectRatio),
    };
  }

  /**
   * Get recommended image quality for delivery
   */
  getRecommendedQuality(mediaType: 'thumbnail' | 'preview' | 'full'): number {
    switch (mediaType) {
      case 'thumbnail':
        return 60;
      case 'preview':
        return 75;
      case 'full':
        return 90;
      default:
        return 75;
    }
  }

  /**
   * Generate media variants for responsive delivery
   */
  generateMediaVariants(
    objectKey: string,
    mimeType: string,
  ): Array<{ variant: string; url: string; size: string }> {
    if (!mimeType.startsWith('image/')) {
      return [];
    }

    return [
      {
        variant: 'thumbnail',
        url: this.generateCdnUrl(objectKey, {
          width: 200,
          quality: this.getRecommendedQuality('thumbnail'),
        }),
        size: '200px',
      },
      {
        variant: 'preview',
        url: this.generateCdnUrl(objectKey, {
          width: 600,
          quality: this.getRecommendedQuality('preview'),
        }),
        size: '600px',
      },
      {
        variant: 'full',
        url: this.generateCdnUrl(objectKey, {
          quality: this.getRecommendedQuality('full'),
        }),
        size: 'full',
      },
    ];
  }

  /**
   * Get media delivery configuration
   */
  getConfiguration(): MediaDeliveryConfig {
    return { ...this.config };
  }

  /**
   * Update media delivery configuration
   */
  updateConfiguration(updates: Partial<MediaDeliveryConfig>): void {
    this.config = { ...this.config, ...updates };
    this.logConfiguration();
  }

  /**
   * Get media statistics
   */
  getMediaStats() {
    return {
      cdnEnabled: this.config.cdnEnabled,
      cacheTtl: this.config.cacheTtl,
      maxFileSize: `${(this.config.maxFileSize / 1024 / 1024).toFixed(2)}MB`,
      compressionEnabled: this.config.compressionEnabled,
      imageOptimizationEnabled: this.config.optimizeImages,
      allowedMimeTypes: this.config.allowedMimeTypes.length,
    };
  }
}
