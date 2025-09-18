import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ApiKeyMiddleware } from './middleware/api-key.middleware';
import { RegistryModule } from './registry/registry.module';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env', // Local .env file (gateway/.env)
        '.env.local', // Local override file
        join(process.cwd(), '../.env'), // Root .env file
        join(process.cwd(), '../.env.local'), // Root override file
      ],
    }),
    HttpModule,
    TerminusModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute per IP
      },
    ]),
    RegistryModule, // Import RegistryModule to access RegistryService
  ],
  controllers: [HealthController, GatewayController],
  providers: [HealthService, GatewayService],
})
export class GatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .exclude(
        { path: 'auth/v1/keys', method: RequestMethod.POST }, // Generate API key
        { path: 'auth/v1/keys/validate', method: RequestMethod.POST }, // Validate API key
        { path: 'health', method: RequestMethod.GET }, // Health check
        { path: 'ping', method: RequestMethod.GET }, // Ping endpoint
        { path: 'registry/ping', method: RequestMethod.GET }, // Registry ping
        { path: '*services/health', method: RequestMethod.GET }, // Service health endpoints
      )
      .forRoutes('*');
  }
}
