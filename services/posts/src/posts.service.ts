import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ApiResponse } from '@atlas/shared';

export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private posts: Post[] = [];

  async findAll(): Promise<ApiResponse<Post[]>> {
    this.logger.debug('Fetching all posts');
    return {
      data: this.posts,
      meta: {
        timestamp: new Date(),
        path: '/posts/v1',
      },
    };
  }

  async findOne(id: string): Promise<ApiResponse<Post>> {
    this.logger.debug(`Fetching post with id: ${id}`);

    const post = this.posts.find((p) => p.id === id);

    if (!post) {
      this.logger.warn(`Post not found with id: ${id}`);
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return {
      data: post,
      meta: {
        timestamp: new Date(),
        path: `/posts/v1/${id}`,
      },
    };
  }

  async create(createPostDto: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Post>> {
    this.logger.debug('Creating new post');

    const post: Post = {
      id: Date.now().toString(),
      ...createPostDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.posts.push(post);

    return {
      data: post,
      meta: {
        timestamp: new Date(),
        path: '/posts/v1',
      },
    };
  }
}
