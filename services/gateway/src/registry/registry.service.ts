import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ServiceRegistration, ServiceStatus, RegistryHealth } from '@atlas/shared';
import { registryStore } from '../utils/registry-store';

@Injectable()
export class RegistryService {
  private readonly logger = new Logger(RegistryService.name);
  private readonly heartbeatInterval: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.heartbeatInterval = this.configService.get<number>('HEARTBEAT_INTERVAL_MS', 30000);
  }

  async registerService(registration: ServiceRegistration): Promise<void> {
    this.logger.log(`Registering service: ${registration.name} on port ${registration.port}`);

    // Validate service health before registering
    try {
      await this.validateServiceHealth(registration);

      // Add timestamp if not provided
      registration.timestamp = registration.timestamp || new Date();

      // Store service registration in shared store
      registryStore.setService(registration.name, registration);

      // Setup heartbeat monitoring
      this.setupHeartbeat(registration);

      this.logger.log(`Service ${registration.name} registered successfully`);
    } catch (error) {
      this.logger.error(`Failed to register service ${registration.name}: ${error.message}`);
      throw new BadRequestException(`Service health check failed: ${error.message}`);
    }
  }

  async deregisterService(serviceName: string): Promise<boolean> {
    this.logger.log(`Deregistering service: ${serviceName}`);

    // Clear heartbeat monitoring
    registryStore.clearHeartbeatInterval(serviceName);

    // Remove from shared registry
    const wasRemoved = registryStore.deleteService(serviceName);

    if (wasRemoved) {
      this.logger.log(`Service ${serviceName} deregistered successfully`);
    } else {
      this.logger.warn(`Service ${serviceName} was not found in registry`);
    }

    return wasRemoved;
  }

  getService(serviceName: string): ServiceRegistration | undefined {
    return registryStore.getService(serviceName);
  }

  getServices(): Map<string, ServiceRegistration> {
    return registryStore.getServices();
  }

  getAllServices(): ServiceRegistration[] {
    return registryStore.getAllServices();
  }

  async getRegistryHealth(): Promise<RegistryHealth> {
    const services: Record<string, ServiceStatus> = {};
    let healthyCount = 0;

    for (const [name, service] of registryStore.getServices()) {
      try {
        const startTime = Date.now();
        await this.validateServiceHealth(service);
        const responseTime = Date.now() - startTime;

        services[name] = {
          name,
          status: 'up',
          lastChecked: new Date(),
          responseTime,
        };
        healthyCount++;
      } catch (error) {
        services[name] = {
          name,
          status: 'down',
          lastChecked: new Date(),
          error: error.message,
        };
      }
    }

    return {
      services,
      totalServices: registryStore.getServiceCount(),
      healthyServices: healthyCount,
      unhealthyServices: registryStore.getServiceCount() - healthyCount,
    };
  }

  private async validateServiceHealth(service: ServiceRegistration): Promise<void> {
    // In Docker environment, use service name instead of localhost
    const isDocker = this.configService.get<string>('DOCKER_ENV') === 'true';
    const hostname = isDocker ? `${service.name}-service` : 'localhost';
    const healthUrl = `http://${hostname}:${service.port}${service.healthEndpoint}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(healthUrl, {
          timeout: 5000, // 5 second timeout
        }),
      );

      if (response.status !== 200) {
        throw new Error(`Health check returned status ${response.status}`);
      }

      this.logger.debug(`Health check passed for ${service.name} at ${healthUrl}`);
    } catch (error) {
      this.logger.error(`Health check failed for ${service.name}: ${error.message}`);
      throw error;
    }
  }

  private setupHeartbeat(service: ServiceRegistration): void {
    // Clear existing heartbeat if any
    registryStore.clearHeartbeatInterval(service.name);

    // Setup new heartbeat
    const interval = setInterval(async () => {
      try {
        await this.validateServiceHealth(service);
        this.logger.debug(`Heartbeat successful for ${service.name}`);
      } catch (error) {
        this.logger.warn(`Heartbeat failed for ${service.name}, deregistering...`);
        this.deregisterService(service.name);
      }
    }, this.heartbeatInterval);

    registryStore.setHeartbeatInterval(service.name, interval);
    this.logger.debug(`Heartbeat monitoring started for ${service.name}`);
  }

  // Cleanup method to be called on application shutdown
  onModuleDestroy(): void {
    this.logger.log('Cleaning up registry service...');

    // Clear all heartbeat intervals via the shared store
    for (const service of registryStore.getAllServices()) {
      registryStore.clearHeartbeatInterval(service.name);
      this.logger.debug(`Cleared heartbeat for ${service.name}`);
    }
  }
}
