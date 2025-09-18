import { Controller, Post, Delete, Get, Body, Param, UseGuards, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RegistryService } from './registry.service';
import { RegistryGuard } from './registry.guard';
import { ServiceRegistration, RegistryHealth } from '@atlas/shared';

@Controller('registry')
@UseGuards(RegistryGuard)
export class RegistryController {
  private readonly logger = new Logger(RegistryController.name);

  constructor(private readonly registryService: RegistryService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute per IP
  @HttpCode(HttpStatus.CREATED)
  async registerService(@Body() registration: ServiceRegistration) {
    this.logger.log(`Registration request for service: ${registration.name}`);

    await this.registryService.registerService(registration);

    return {
      success: true,
      message: `Service ${registration.name} registered successfully`,
      data: {
        name: registration.name,
        port: registration.port,
        version: registration.version,
        registeredAt: new Date().toISOString(),
      },
    };
  }

  @Delete('services/:serviceName')
  @HttpCode(HttpStatus.OK)
  async deregisterService(@Param('serviceName') serviceName: string) {
    this.logger.log(`Deregistration request for service: ${serviceName}`);

    const wasRemoved = await this.registryService.deregisterService(serviceName);

    return {
      success: wasRemoved,
      message: wasRemoved ? `Service ${serviceName} deregistered successfully` : `Service ${serviceName} was not found`,
      data: {
        serviceName,
        deregisteredAt: new Date().toISOString(),
      },
    };
  }

  @Get('services')
  @HttpCode(HttpStatus.OK)
  getServices() {
    const services = this.registryService.getAllServices();

    return {
      success: true,
      data: {
        services,
        count: services.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('services/:serviceName')
  @HttpCode(HttpStatus.OK)
  getService(@Param('serviceName') serviceName: string) {
    const service = this.registryService.getService(serviceName);

    if (!service) {
      return {
        success: false,
        message: `Service ${serviceName} not found`,
        data: null,
      };
    }

    return {
      success: true,
      data: service,
    };
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getRegistryHealth(): Promise<{ success: boolean; data: RegistryHealth }> {
    const health = await this.registryService.getRegistryHealth();

    return {
      success: true,
      data: health,
    };
  }

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  ping() {
    return {
      success: true,
      message: 'Registry service is running',
      timestamp: new Date().toISOString(),
    };
  }
}
