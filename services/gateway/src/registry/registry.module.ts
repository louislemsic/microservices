import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { RegistryService } from './registry.service';
import { RegistryController } from './registry.controller';
import { RegistryGuard } from './registry.guard';

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
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute per IP
      },
    ]),
  ],
  controllers: [RegistryController],
  providers: [RegistryService, RegistryGuard],
  exports: [RegistryService], // Export for use in GatewayModule
})
export class RegistryModule {}
