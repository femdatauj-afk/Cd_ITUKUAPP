import { Injectable, NestMiddleware, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimitService } from './rate-limit.service';
import { SecurityHeadersService } from './security-headers.service';
import { EnvironmentService } from './environment.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  constructor(
    private rateLimitService: RateLimitService,
    private securityHeadersService: SecurityHeadersService,
    private environmentService: EnvironmentService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Get client IP (handle proxies)
    let clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (clientIp === '::1') {
      clientIp = 'localhost';
    }

    // Check rate limit
    const rateLimitKey = `${clientIp}:${req.path}`;
    const rateLimitResult = this.rateLimitService.isAllowed(rateLimitKey);

    if (!rateLimitResult.allowed) {
      this.logger.warn(`Rate limit exceeded for ${clientIp} on ${req.path}`);
      res.setHeader('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          retryAfter: rateLimitResult.resetTime,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Apply security headers
    const isProduction = this.environmentService.isProduction();
    const securityHeaders = isProduction
      ? this.securityHeadersService.getProductionHeaders()
      : this.securityHeadersService.getDevelopmentHeaders();

    // Apply CORS headers if origin is allowed
    const origin = req.headers.origin || '';
    const allowedOrigins = this.environmentService.get('corsOrigins');
    const corsHeaders = this.securityHeadersService.getCorsHeaders(origin, allowedOrigins);

    // Merge and apply all headers
    const allHeaders = { ...securityHeaders, ...corsHeaders };
    Object.entries(allHeaders).forEach(([key, value]) => {
      if (value) {
        res.setHeader(key, value);
      }
    });

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', this.rateLimitService['config'].maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());

    // Log request if in production
    if (isProduction) {
      this.logger.debug(`${req.method} ${req.path} from ${clientIp}`);
    }

    next();
  }
}
