import { Controller, Get, Post, Param, Body, Logger } from '@nestjs/common';
import { PostsService, Post as PostEntity } from './posts.service';
import { ApiVersions, ApiResponse } from '@atlas/shared';

@Controller(ApiVersions.V1)
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(): Promise<ApiResponse<PostEntity[]>> {
    this.logger.debug('GET /posts/v1');
    return this.postsService.findAll();
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'posts',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: 'v1',
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ApiResponse<PostEntity>> {
    this.logger.debug(`GET /posts/v1/${id}`);
    return this.postsService.findOne(id);
  }

  @Post()
  create(@Body() createPostDto: Omit<PostEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<PostEntity>> {
    this.logger.debug('POST /posts/v1');
    return this.postsService.create(createPostDto);
  }
}
