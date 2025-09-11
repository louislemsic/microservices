import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('PostsController', () => {
  let controller: PostsController;
  let service: PostsService;

  beforeEach(() => {
    service = new PostsService();
    controller = new PostsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of posts', () => {
      const result = controller.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return a post by id', () => {
      const post = controller.findOne('1');
      expect(post).toBeDefined();
      expect(post?.id).toBe('1');
    });

    it('should return undefined for non-existent post', () => {
      const post = controller.findOne('999');
      expect(post).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new post', () => {
      const createPostDto = {
        title: 'Test Post',
        content: 'Test content',
        author: 'Test Author',
      };
      
      const result = controller.create(createPostDto);
      expect(result).toBeDefined();
      expect(result.title).toBe(createPostDto.title);
      expect(result.content).toBe(createPostDto.content);
      expect(result.author).toBe(createPostDto.author);
      expect(result.id).toBeDefined();
    });
  });
});