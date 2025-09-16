import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ApiResponse } from '@atlas/shared';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private users: User[] = [];

  async findAll(): Promise<ApiResponse<User[]>> {
    this.logger.debug('Fetching all users');
    return {
      data: this.users,
      meta: {
        timestamp: new Date(),
        path: '/users/v1',
      },
    };
  }

  async findOne(id: string): Promise<ApiResponse<User>> {
    this.logger.debug(`Fetching user with id: ${id}`);

    const user = this.users.find((u) => u.id === id);

    if (!user) {
      this.logger.warn(`User not found with id: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      data: user,
      meta: {
        timestamp: new Date(),
        path: `/users/v1/${id}`,
      },
    };
  }

  async create(createUserDto: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<User>> {
    this.logger.debug('Creating new user');

    const user: User = {
      id: Date.now().toString(),
      ...createUserDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(user);

    return {
      data: user,
      meta: {
        timestamp: new Date(),
        path: '/users/v1',
      },
    };
  }
}
