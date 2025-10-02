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

  private formatUptime(uptimeMs: number): string {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      const remainingMonths = Math.floor((days % 365) / 30);
      return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
    }
    if (months > 0) {
      const remainingDays = days % 30;
      return remainingDays > 0 ? `${months}m ${remainingDays}d` : `${months}m`;
    }
    if (days > 0) {
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  }

  getHealth(): HealthStatus {
    const now = new Date();
    const uptimeMs = now.getTime() - this.startTime.getTime();

    return {
      status: 'UP',
      uptime: this.formatUptime(uptimeMs),
      timestamp: now.toISOString(),
    };
  }
}
