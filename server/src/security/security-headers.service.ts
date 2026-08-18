import { Injectable, Logger } from '@nestjs/common';

export interface SecurityHeaders {
  [key: string]: string;
}

@Injectable()
export class SecurityHeadersService {
  private readonly logger = new Logger(SecurityHeadersService.name);

  /**
   * Get production security headers
   */
  getProductionHeaders(): SecurityHeaders {
    return {
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',

      // Clickjacking protection
      'X-Frame-Options': 'DENY',

      // XSS protection
      'X-XSS-Protection': '1; mode=block',

      // Content Security Policy
      'Content-Security-Policy': this.getCSP(),

      // HSTS (HTTPS enforcement)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // Permissions Policy
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',

      // Remove X-Powered-By header
      'X-Powered-By': '',
    };
  }

  /**
   * Get development security headers (relaxed)
   */
  getDevelopmentHeaders(): SecurityHeaders {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' http://localhost:*",
      'Referrer-Policy': 'same-origin',
    };
  }

  /**
   * Get Content Security Policy header value
   */
  private getCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' wss: https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }

  /**
   * Get CORS headers
   */
  getCorsHeaders(origin: string, allowedOrigins: string[]): SecurityHeaders {
    const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

    return {
      'Access-Control-Allow-Origin': isAllowed ? origin : '',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '3600',
    };
  }

  /**
   * Merge security headers
   */
  mergeHeaders(...headerSets: SecurityHeaders[]): SecurityHeaders {
    const merged: SecurityHeaders = {};

    for (const headerSet of headerSets) {
      Object.assign(merged, headerSet);
    }

    return merged;
  }

  /**
   * Log security headers applied
   */
  logHeaders(headers: SecurityHeaders): void {
    this.logger.log('Applied Security Headers:');
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        this.logger.debug(`  ${key}: ${value.substring(0, 60)}${value.length > 60 ? '...' : ''}`);
      }
    });
  }

  /**
   * Get security headers summary
   */
  getSummary(isProduction: boolean): object {
    const headers = isProduction ? this.getProductionHeaders() : this.getDevelopmentHeaders();

    return {
      environment: isProduction ? 'production' : 'development',
      headersCount: Object.keys(headers).length,
      features: {
        xssProtection: !!headers['X-XSS-Protection'],
        clickjackingProtection: !!headers['X-Frame-Options'],
        mimeTypeSniffingProtection: !!headers['X-Content-Type-Options'],
        cspEnabled: !!headers['Content-Security-Policy'],
        hstsEnabled: !!headers['Strict-Transport-Security'],
        referrerPolicy: !!headers['Referrer-Policy'],
      },
    };
  }
}
