import { Injectable } from '@nestjs/common';

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
}

@Injectable()
export class PostsService {
  private posts: Post[] = [
    {
      id: '1',
      title: 'Welcome to Atlas',
      content: 'Atlas is a modular API hub built with Nest.js',
      author: 'System',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Building Modular Services',
      content: 'Learn how to create plug-and-play services in Atlas',
      author: 'Developer',
      createdAt: new Date('2024-01-02'),
    },
  ];

  findAll(): Post[] {
    return this.posts;
  }

  findOne(id: string): Post | undefined {
    return this.posts.find((post) => post.id === id);
  }

  create(createPostDto: Partial<Post>): Post {
    const newPost: Post = {
      id: String(this.posts.length + 1),
      title: createPostDto.title || '',
      content: createPostDto.content || '',
      author: createPostDto.author || 'Anonymous',
      createdAt: new Date(),
    };
    this.posts.push(newPost);
    return newPost;
  }
}