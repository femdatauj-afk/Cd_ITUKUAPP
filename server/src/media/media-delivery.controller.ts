import { Controller, Get, Post, Body, Query, HttpCode } from '@nestjs/common';
import { MediaDeliveryService } from './media-delivery.service';

@Controller('media')
export class MediaDeliveryController {
  constructor(private readonly mediaDelivery: MediaDeliveryService) {}

  /**
   * Get media delivery configuration
   * GET /media/config
   */
  @Get('config')
  getConfig() {
    return this.mediaDelivery.getConfiguration();
  }

  /**
   * Validate file for upload
   * POST /media/validate
   */
  @Post('validate')
  @HttpCode(200)
  validateFile(@Body() body: { mimeType: string; fileSize: number }) {
    return this.mediaDelivery.validateFile(body.mimeType, body.fileSize);
  }

  /**
   * Generate CDN URL for media
   * GET /media/cdn-url
   */
  @Get('cdn-url')
  generateCdnUrl(
    @Query('objectKey') objectKey: string,
    @Query('width') width?: string,
    @Query('height') height?: string,
    @Query('quality') quality?: string,
  ) {
    return {
      cdnUrl: this.mediaDelivery.generateCdnUrl(objectKey, {
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        quality: quality ? parseInt(quality) : undefined,
      }),
    };
  }

  /**
   * Generate responsive image variants
   * GET /media/variants
   */
  @Get('variants')
  getVariants(
    @Query('objectKey') objectKey: string,
    @Query('mimeType') mimeType: string = 'image/jpeg',
  ) {
    return {
      variants: this.mediaDelivery.generateMediaVariants(objectKey, mimeType),
    };
  }

  /**
   * Get cache headers for media
   * GET /media/headers
   */
  @Get('headers')
  getCacheHeaders(
    @Query('mimeType') mimeType: string = 'application/octet-stream',
    @Query('maxAge') maxAge?: string,
  ) {
    return {
      cacheHeaders: this.mediaDelivery.getCacheHeaders(
        mimeType,
        maxAge ? parseInt(maxAge) : undefined,
      ),
      securityHeaders: this.mediaDelivery.getSecurityHeaders(),
    };
  }

  /**
   * Get media delivery statistics
   * GET /media/stats
   */
  @Get('stats')
  getStats() {
    return this.mediaDelivery.getMediaStats();
  }

  /**
   * Get optimal format for media type
   * GET /media/format
   */
  @Get('format')
  getOptimalFormat(@Query('mimeType') mimeType: string) {
    return {
      mimeType,
      optimalFormat: this.mediaDelivery.getOptimalFormat(mimeType),
      recommendedQuality: {
        thumbnail: this.mediaDelivery.getRecommendedQuality('thumbnail'),
        preview: this.mediaDelivery.getRecommendedQuality('preview'),
        full: this.mediaDelivery.getRecommendedQuality('full'),
      },
    };
  }
}
