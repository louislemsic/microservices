import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ApiKey } from './entities/api-key.entity';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',                                    // Local .env file (services/auth/.env)
        '.env.local',                              // Local override file
        join(process.cwd(), '../../.env'),         // Root .env file
        join(process.cwd(), '../../.env.local'),   // Root override file
      ],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [ApiKey],
        synchronize: true, // Set to false in production
      }),
    }),
    TypeOrmModule.forFeature([ApiKey]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}