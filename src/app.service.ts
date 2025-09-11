import { Injectable } from '@nestjs/common';
import { ServiceLoaderService } from './service-loader/service-loader.service';

@Injectable()
export class AppService {
  constructor(private readonly serviceLoader: ServiceLoaderService) {}

  getAtlasInfo(): any {
    return {
      name: 'Atlas',
      description: 'A modular Nest.js monorepo — a central hub of APIs and services',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      services: this.serviceLoader.getServiceEndpoints(),
    };
  }
}
