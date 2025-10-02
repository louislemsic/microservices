import { Injectable, Logger, NotFoundException } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly items: any[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      createdAt: new Date()
    }
  ];

  findAll() {
    return {
      data: this.items,
      meta: {
        timestamp: new Date(),
        path: '/user/v1'
      }
    };
  }

  findOne(id: string) {
    const item = this.items.find(item => item.id === id);
    
    if (!item) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      data: item,
      meta: {
        timestamp: new Date(),
        path: `/user/v1/${id}`
      }
    };
  }

  create(data: any) {
    const item = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date()
    };

    this.items.push(item);

    return {
      data: item,
      meta: {
        timestamp: new Date(),
        path: '/user/v1'
      }
    };
  }
}
