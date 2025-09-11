import { UsersService } from './users.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', () => {
      const users = service.findAll();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(2); // Initial mock data
    });
  });

  describe('findOne', () => {
    it('should return a user by id', () => {
      const user = service.findOne('1');
      expect(user).toBeDefined();
      expect(user?.id).toBe('1');
      expect(user?.name).toBe('John Doe');
    });

    it('should return undefined for non-existent user', () => {
      const user = service.findOne('999');
      expect(user).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new user', () => {
      const createUserDto = {
        name: 'New User',
        email: 'new@example.com',
      };

      const initialCount = service.findAll().length;
      const newUser = service.create(createUserDto);

      expect(newUser).toBeDefined();
      expect(newUser.name).toBe(createUserDto.name);
      expect(newUser.email).toBe(createUserDto.email);
      expect(newUser.id).toBeDefined();
      expect(service.findAll().length).toBe(initialCount + 1);
    });
  });

  describe('update', () => {
    it('should update an existing user', () => {
      const updateDto = { name: 'Updated Name' };
      const updatedUser = service.update('1', updateDto);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.id).toBe('1');
    });

    it('should return undefined for non-existent user', () => {
      const updateDto = { name: 'Updated Name' };
      const result = service.update('999', updateDto);
      expect(result).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should remove an existing user', () => {
      const initialCount = service.findAll().length;
      const result = service.remove('1');

      expect(result).toBe(true);
      expect(service.findAll().length).toBe(initialCount - 1);
      expect(service.findOne('1')).toBeUndefined();
    });

    it('should return false for non-existent user', () => {
      const result = service.remove('999');
      expect(result).toBe(false);
    });
  });
});
