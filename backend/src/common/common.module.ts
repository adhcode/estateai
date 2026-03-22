import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';

@Module({})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}