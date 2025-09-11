import { PostsService } from './posts.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(() => {
    service = new PostsService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of posts', () => {
      const posts = service.findAll();
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBe(2); // Initial mock data
    });
  });

  describe('findOne', () => {
    it('should return a post by id', () => {
      const post = service.findOne('1');
      expect(post).toBeDefined();
      expect(post?.id).toBe('1');
      expect(post?.title).toBe('Welcome to Atlas');
    });

    it('should return undefined for non-existent post', () => {
      const post = service.findOne('999');
      expect(post).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new post', () => {
      const createPostDto = {
        title: 'New Post',
        content: 'This is a new post',
        author: 'Test Author',
      };

      const initialCount = service.findAll().length;
      const newPost = service.create(createPostDto);

      expect(newPost).toBeDefined();
      expect(newPost.title).toBe(createPostDto.title);
      expect(newPost.content).toBe(createPostDto.content);
      expect(newPost.author).toBe(createPostDto.author);
      expect(newPost.id).toBeDefined();
      expect(service.findAll().length).toBe(initialCount + 1);
    });
  });
});