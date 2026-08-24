import * as path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { SecurityMiddleware } from './security/security.middleware';
import { EnvironmentService } from './security/environment.service';
import { RateLimitService } from './security/rate-limit.service';
import { SecurityHeadersService } from './security/security-headers.service';

loadEnv({ path: path.resolve(__dirname, '../.env') });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(path.resolve(__dirname, '../public'));
  const logger = new Logger('Bootstrap');

  // Get security services from app context
  const environmentService = app.get(EnvironmentService);
  const rateLimitService = app.get(RateLimitService);
  const securityHeadersService = app.get(SecurityHeadersService);

  // Get configuration
  const config = environmentService.getConfig();
  const isProduction = environmentService.isProduction();

  // Enable CORS with environment-based configuration
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        config.corsOrigins.includes(origin) ||
        config.corsOrigins.includes('*')
      ) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('CORS not allowed'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 3600,
  });

  // Apply global middleware for security
  app.use(
    new SecurityMiddleware(
      rateLimitService,
      securityHeadersService,
      environmentService,
    ).use.bind(
      new SecurityMiddleware(
        rateLimitService,
        securityHeadersService,
        environmentService,
      ),
    ),
  );

  // Set API prefix
  app.setGlobalPrefix('api');

  // Log configuration
  logger.log(`Starting ITUKUAPP server in ${config.nodeEnv} mode`);
  logger.log(`Port: ${config.port}`);
  logger.log(`CORS Origins: ${config.corsOrigins.join(', ')}`);
  logger.log(
    `Rate Limit: ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs}ms`,
  );

  // Start server
  await app.init();
  const server = app.getHttpServer();
  server.listen(config.port, '0.0.0.0', () => {
    logger.log(`✅ Server is running on port ${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
