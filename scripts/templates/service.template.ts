import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ApiVersions, AtlasBridge, Services } from '@atlas/shared';

@Injectable()
export class {{ServiceName}}Service {
  private readonly logger = new Logger({{ServiceName}}Service.name);
  private readonly items: any[] = [];
  private readonly bridge: AtlasBridge;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.bridge = new AtlasBridge(this.httpService, this.configService);
  }

  findAll() {
    return {
      data: this.items,
      meta: {
        timestamp: new Date(),
        path: '/{{service}}/v1'
      }
    };
  }

  findOne(id: string) {
    const item = this.items.find(item => item.id === id);
    
    if (!item) {
      throw new NotFoundException(`{{ServiceName}} with ID ${id} not found`);
    }

    return {
      data: item,
      meta: {
        timestamp: new Date(),
        path: `/{{service}}/v1/${id}`
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
        path: '/{{service}}/v1'
      }
    };
  }
}
