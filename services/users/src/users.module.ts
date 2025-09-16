import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',                                    // Local .env file (services/users/.env)
        '.env.local',                              // Local override file
        join(process.cwd(), '../../.env'),         // Root .env file
        join(process.cwd(), '../../.env.local'),   // Root override file
      ],
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
