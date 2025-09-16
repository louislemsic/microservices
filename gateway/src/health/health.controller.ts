import { Controller, Get, Logger } from '@nestjs/common';
import { HealthCheckService, HealthCheck, HttpHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { RegistryService } from '../registry/registry.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly registryService: RegistryService,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Gateway self-check
      () => this.http.pingCheck('gateway', 'http://localhost:3000/ping'),

      // Registry service check
      () => this.http.pingCheck('registry', 'http://localhost:3001/registry/ping'),

      // Check all registered services
      async () => {
        const healthResult: Record<string, any> = {};
        const services = this.registryService.getServices();

        // Add summary information
        healthResult['registered_services'] = {
          status: 'up',
          total: services.size,
          timestamp: new Date().toISOString(),
        };

        for (const [name, service] of services) {
          try {
            const healthUrl = `http://localhost:${service.port}${service.healthEndpoint}`;
            await this.http.pingCheck(`service_${name}`, healthUrl);
            healthResult[`service_${name}`] = {
              status: 'up',
              port: service.port,
              version: service.version,
              lastRegistered: service.timestamp,
            };
          } catch (error) {
            healthResult[`service_${name}`] = {
              status: 'down',
              error: error.message,
              port: service.port,
            };

            // Optionally deregister unhealthy services
            this.logger.warn(`Service ${name} failed health check, will be deregistered`);
            this.registryService
              .deregisterService(name)
              .catch((err) => this.logger.error(`Failed to deregister unhealthy service ${name}: ${err.message}`));
          }
        }

        return healthResult;
      },
    ]);
  }

  @Get('registry')
  async checkRegistry() {
    try {
      const registryHealth = await this.registryService.getRegistryHealth();
      return {
        status: 'ok',
        data: registryHealth,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Registry health check failed: ${error.message}`);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('services')
  async checkServices() {
    try {
      const services = this.registryService.getAllServices();
      const serviceHealth = await Promise.allSettled(
        services.map(async (service) => {
          try {
            const healthUrl = `http://localhost:${service.port}${service.healthEndpoint}`;
            const startTime = Date.now();

            await this.http.pingCheck(`${service.name}_check`, healthUrl);

            return {
              name: service.name,
              status: 'healthy',
              port: service.port,
              responseTime: Date.now() - startTime,
              lastChecked: new Date().toISOString(),
            };
          } catch (error) {
            return {
              name: service.name,
              status: 'unhealthy',
              port: service.port,
              error: error.message,
              lastChecked: new Date().toISOString(),
            };
          }
        }),
      );

      const results = serviceHealth.map((result) =>
        result.status === 'fulfilled'
          ? result.value
          : {
              name: 'unknown',
              status: 'error',
              error: result.reason?.message || 'Unknown error',
            },
      );

      const healthyCount = results.filter((r) => r.status === 'healthy').length;
      const unhealthyCount = results.filter((r) => r.status === 'unhealthy').length;

      return {
        status: unhealthyCount === 0 ? 'ok' : 'degraded',
        services: results,
        summary: {
          total: results.length,
          healthy: healthyCount,
          unhealthy: unhealthyCount,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Services health check failed: ${error.message}`);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
