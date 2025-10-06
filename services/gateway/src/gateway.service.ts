import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RegistryService } from './registry/registry.service';

export interface HealthStatus {
  status: 'UP' | 'DOWN';
  uptime: string;
  timestamp: string;
}

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private readonly startTime: Date;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly registryService: RegistryService,
  ) {
    this.startTime = new Date();
  }

  async routeRequest(method: string, serviceName: string, version: string, path: string, body?: any) {
    this.logger.log(`Routing request to ${serviceName} at ${version}/${path}`);

    // Get service from dynamic registry
    const service = this.registryService.getService(serviceName);

    if (!service) {
      this.logger.warn(`Service not found in registry: ${serviceName}`);
      throw new NotFoundException(`Service ${serviceName} is not registered or unavailable`);
    }

    const serviceUrl = `http://${service.host}:${service.port}/${serviceName}/${version}/${path}`;
    this.logger.debug(`Routing ${method} request to: ${serviceUrl}`);

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: serviceUrl,
          data: body,
          timeout: 10000, // 10 second timeout
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error routing request to ${serviceName} at ${serviceUrl}:`,
        error?.response?.data || error?.message,
      );

      // If service is unreachable, consider deregistering it
      if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
        this.logger.warn(`Service ${serviceName} appears to be down, deregistering...`);
        this.registryService
          .deregisterService(serviceName)
          .catch((err) => this.logger.error(`Failed to deregister service ${serviceName}: ${err.message}`));
        throw new NotFoundException(`Service ${serviceName} is not available`);
      }

      throw (
        error?.response?.data || {
          statusCode: error?.response?.status || 500,
          message: error?.message || 'Internal server error',
          error: 'Service error',
        }
      );
    }
  }

  getServiceEndpoints(): { service: string; endpoint: string; url: string; version: string; status: string }[] {
    const services = this.registryService.getAllServices();
    return services.map((service) => ({
      service: service.name,
      endpoint: `/${service.name}/${service.version}`,
      url: `http://localhost:${service.port}/${service.name}/${service.version}`,
      version: service.version,
      status: 'registered',
    }));
  }
}
