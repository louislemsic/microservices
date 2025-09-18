import { Controller, Get, Logger } from '@nestjs/common';
import { HealthCheckResult } from '@nestjs/terminus';
import { HealthService, SimpleHealthResponse, DetailedHealthResponse } from './health.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @Get('ping')
  async check(): Promise<SimpleHealthResponse> {
    return this.healthService.getSimpleHealth();
  }

  @Get('detailed')
  async checkDetailed(): Promise<HealthCheckResult> {
    return this.healthService.getDetailedHealth();
  }

  @Get('registry')
  async checkRegistry(): Promise<DetailedHealthResponse> {
    return this.healthService.getRegistryHealth();
  }

  @Get('services')
  async checkServices(): Promise<DetailedHealthResponse> {
    return this.healthService.getServicesHealth();
  }
}
