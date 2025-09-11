import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts/v1')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  create(@Body() createPostDto: any) {
    return this.postsService.create(createPostDto);
  }
}