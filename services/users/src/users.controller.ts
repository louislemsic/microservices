import { Controller, Get, Post, Param, Body, Logger } from '@nestjs/common';
import { UsersService, User } from './users.service';
import { ApiVersions, ApiResponse } from '@atlas/shared';

@Controller(ApiVersions.V1)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<ApiResponse<User[]>> {
    this.logger.debug('GET /users/v1');
    return this.usersService.findAll();
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'users',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: 'v1',
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ApiResponse<User>> {
    this.logger.debug(`GET /users/v1/${id}`);
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<User>> {
    this.logger.debug('POST /users/v1');
    return this.usersService.create(createUserDto);
  }
}
