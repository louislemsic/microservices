import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',                                    // Local .env file (services/posts/.env)
        '.env.local',                              // Local override file
        join(process.cwd(), '../../.env'),         // Root .env file
        join(process.cwd(), '../../.env.local'),   // Root override file
      ],
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
