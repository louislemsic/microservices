import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
    controller = new UsersController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', () => {
      const result = controller.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', () => {
      const user = controller.findOne('1');
      expect(user).toBeDefined();
      expect(user?.id).toBe('1');
    });

    it('should return undefined for non-existent user', () => {
      const user = controller.findOne('999');
      expect(user).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new user', () => {
      const createUserDto = {
        name: 'Test User',
        email: 'test@example.com',
      };
      
      const result = controller.create(createUserDto);
      expect(result).toBeDefined();
      expect(result.name).toBe(createUserDto.name);
      expect(result.email).toBe(createUserDto.email);
      expect(result.id).toBeDefined();
    });
  });
});