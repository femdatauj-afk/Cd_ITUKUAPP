import { Module } from '@nestjs/common';
import { EnvironmentService } from './environment.service';
import { RateLimitService } from './rate-limit.service';
import { SecurityHeadersService } from './security-headers.service';
import { RequestValidationService } from './request-validation.service';

@Module({
  providers: [
    EnvironmentService,
    {
      provide: RateLimitService,
      useFactory: () => {
        const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
        const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
        return new RateLimitService({ windowMs, maxRequests });
      },
    },
    SecurityHeadersService,
    RequestValidationService,
  ],
  exports: [EnvironmentService, RateLimitService, SecurityHeadersService, RequestValidationService],
})
export class SecurityModule {}
