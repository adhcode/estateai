import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // Serve static files (visitor cards, QR codes, etc.)
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/',
    });

    // Enable CORS
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://kira-woad.vercel.app', // Production frontend
    ].filter(Boolean);

    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Set global API prefix
    app.setGlobalPrefix('api');

    // Enable global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        // Automatically transform payloads to DTO instances
        transform: true,
        // Automatically remove properties that don't have decorators
        whitelist: true,
        // Throw error if non-whitelisted properties are present
        forbidNonWhitelisted: true,
        // Transform string numbers to actual numbers
        transformOptions: {
          enableImplicitConversion: true,
        },
        // Provide detailed error messages
        disableErrorMessages: false,
        // Validate nested objects
        validateCustomDecorators: true,
      }),
    );

    // Enable global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Enable global interceptors
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new ResponseTransformInterceptor(),
      // Rate limiting (can be disabled in development)
      ...(process.env.NODE_ENV === 'production' ? [new RateLimitInterceptor()] : []),
    );

    // Enable global JWT authentication guard
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector));

    const port = process.env.PORT || 3001;
    await app.listen(port);

    logger.log(`🚀 Estate Management API is running on: http://localhost:${port}/api`);
    logger.log(`📱 WhatsApp webhook endpoint: http://localhost:${port}/api/ai-message/whatsapp-webhook`);
    logger.log(`🔍 Health check: http://localhost:${port}/api/health`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🤖 AI Provider: ${process.env.GEMINI_API_KEY ? 'Gemini AI' : 'Pattern Matching'}`);
    logger.log(`📱 WhatsApp: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not Configured'}`);
    logger.log(`🛡️ Security: Headers enabled, Rate limiting ${process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'}`);
    logger.log(`🔐 Authentication: Global JWT guard enabled with @Public() decorator support`);
    logger.log(`📊 Logging: Request/Response logging enabled`);
    logger.log(`✅ Validation: Global validation pipe enabled`);
    logger.log(`🔓 Public endpoints: Health, Auth, WhatsApp webhooks, QR codes, Security verification`);

  } catch (error) {
    logger.error('❌ Failed to start the application', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});