import { Injectable, Logger } from '@nestjs/common';

export interface OptimizationProfile {
  profile: 'thumbnail' | 'preview' | 'full';
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: string; // 'webp', 'jpeg', 'png', 'mp4', 'webm'
}

@Injectable()
export class CdnOptimizationService {
  private readonly logger = new Logger(CdnOptimizationService.name);

  private readonly optimizationProfiles: Record<string, OptimizationProfile> = {
    thumbnail: {
      profile: 'thumbnail',
      maxWidth: 200,
      maxHeight: 200,
      quality: 60,
      format: 'webp',
    },
    preview: {
      profile: 'preview',
      maxWidth: 800,
      maxHeight: 800,
      quality: 75,
      format: 'webp',
    },
    full: {
      profile: 'full',
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 90,
      format: 'webp',
    },
  };

  constructor() {
    this.logger.log('CDN Optimization service initialized');
  }

  /**
   * Get optimization profile for a delivery variant
   */
  getProfile(variant: 'thumbnail' | 'preview' | 'full'): OptimizationProfile {
    return this.optimizationProfiles[variant];
  }

  /**
   * Calculate optimal dimensions preserving aspect ratio
   */
  calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
  ): { width: number; height: number; willResize: boolean } {
    // If image fits within bounds, no resize needed
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return {
        width: originalWidth,
        height: originalHeight,
        willResize: false,
      };
    }

    // Calculate aspect ratio
    const aspectRatio = originalWidth / originalHeight;

    let width = maxWidth;
    let height = Math.round(width / aspectRatio);

    // If height exceeds max, constrain by height instead
    if (height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
    }

    return {
      width,
      height,
      willResize: true,
    };
  }

  /**
   * Calculate compression savings
   */
  calculateCompressionSavings(
    originalSize: number,
    compressedSize: number,
  ): {
    ratio: number;
    percentReduction: number;
    savedBytes: number;
  } {
    return {
      ratio: originalSize / compressedSize,
      percentReduction: ((originalSize - compressedSize) / originalSize) * 100,
      savedBytes: originalSize - compressedSize,
    };
  }

  /**
   * Get recommended format for media type
   */
  getRecommendedFormat(mimeType: string, quality: number): string {
    if (mimeType.startsWith('image/')) {
      // WebP is most efficient for all image types
      return 'webp';
    }

    if (mimeType.startsWith('video/')) {
      // MP4 H.264 is most compatible, VP9 for higher efficiency
      return quality >= 90 ? 'vp9' : 'h264';
    }

    // For audio, use AAC as standard
    if (mimeType.startsWith('audio/')) {
      return 'aac';
    }

    return 'original';
  }

  /**
   * Estimate file size after optimization
   */
  estimateOptimizedSize(
    originalSize: number,
    mimeType: string,
    quality: number,
    format?: string,
  ): { estimatedSize: number; compression: number } {
    let compressionRatio = 1.0;

    if (mimeType.startsWith('image/')) {
      // WebP compression typically achieves 25-35% reduction
      compressionRatio = format === 'webp' ? 0.65 : 0.75;
      // Adjust for quality
      compressionRatio *= quality / 75;
    } else if (mimeType.startsWith('video/')) {
      // Video compression varies widely, estimate 50% for quality video
      compressionRatio = 0.5;
      compressionRatio *= quality / 75;
    }

    return {
      estimatedSize: Math.round(originalSize * compressionRatio),
      compression: compressionRatio,
    };
  }

  /**
   * Get optimization recommendations for a media file
   */
  getOptimizationRecommendations(
    fileSize: number,
    mimeType: string,
    width?: number,
    height?: number,
  ): {
    shouldOptimize: boolean;
    recommendations: string[];
    potentialSavings: number;
  } {
    const recommendations: string[] = [];
    let potentialSavings = 0;

    // Check file size
    if (fileSize > 5 * 1024 * 1024) {
      // > 5MB
      recommendations.push('File is large - consider compression');
      potentialSavings += fileSize * 0.35; // Estimate 35% savings
    }

    if (mimeType.startsWith('image/')) {
      // Image-specific recommendations
      if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
        recommendations.push('Convert to WebP format for better compression');
      }

      if (width && height) {
        if (width > 2000 || height > 2000) {
          recommendations.push(
            'Image dimensions are large - consider resizing for web delivery',
          );
          potentialSavings += fileSize * 0.25; // Additional 25% savings from resize
        }
      }
    } else if (mimeType.startsWith('video/')) {
      recommendations.push('Video files should use adaptive bitrate streaming');
      recommendations.push(
        'Consider HLS or DASH format for streaming delivery',
      );
    }

    return {
      shouldOptimize: recommendations.length > 0,
      recommendations,
      potentialSavings: Math.round(potentialSavings),
    };
  }

  /**
   * Get all optimization profiles
   */
  getAllProfiles(): OptimizationProfile[] {
    return Object.values(this.optimizationProfiles);
  }

  /**
   * Get cache strategy for media type
   */
  getCacheStrategy(mimeType: string): {
    maxAge: number;
    sMaxAge: number;
    staleWhileRevalidate: number;
    description: string;
  } {
    if (mimeType.startsWith('image/')) {
      // Images can be cached for 1 year (long-lived content)
      return {
        maxAge: 31536000,
        sMaxAge: 31536000,
        staleWhileRevalidate: 2592000, // 30 days
        description: 'Long-term cache for images (1 year)',
      };
    }

    if (mimeType.startsWith('video/')) {
      // Videos can be cached for 30 days
      return {
        maxAge: 2592000,
        sMaxAge: 2592000,
        staleWhileRevalidate: 604800, // 7 days
        description: 'Medium-term cache for videos (30 days)',
      };
    }

    if (mimeType.startsWith('audio/')) {
      // Audio can be cached for 7 days
      return {
        maxAge: 604800,
        sMaxAge: 604800,
        staleWhileRevalidate: 86400, // 1 day
        description: 'Short-term cache for audio (7 days)',
      };
    }

    // Default: 1 day cache
    return {
      maxAge: 86400,
      sMaxAge: 86400,
      staleWhileRevalidate: 3600, // 1 hour
      description: 'Default cache strategy (1 day)',
    };
  }
}
