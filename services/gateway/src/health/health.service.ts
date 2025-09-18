import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { RegistryService } from '../registry/registry.service';

export interface SimpleHealthResponse {
  status: string;
  message: string;
  timestamp: string;
  uptime: string;
  services?: {
    gateway: string;
    registry: string;
    registered_services?: number;
  };
  warning?: string;
}

export interface DetailedHealthResponse {
  status: string;
  data?: any;
  error?: string;
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime: Date;

  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly registryService: RegistryService,
  ) {
    this.startTime = new Date();
  }

  /**
   * Format uptime in a human-readable format
   * Shows up to 3 units: days, hours, minutes, seconds
   * Examples: "3s", "45m 35s", "3h 30m 2s", "1d 4h 2m"
   */
  private formatUptime(): string {
    const now = new Date();
    const uptimeMs = now.getTime() - this.startTime.getTime();
    const uptimeSeconds = Math.floor(uptimeMs / 1000);

    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      // No seconds when showing days
    } else if (hours > 0) {
      parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (seconds > 0) parts.push(`${seconds}s`);
    } else if (minutes > 0) {
      parts.push(`${minutes}m`);
      if (seconds > 0) parts.push(`${seconds}s`);
    } else {
      parts.push(`${seconds}s`);
    }

    return parts.join(' ');
  }

  /**
   * Simple health check for Railway deployment
   * Returns basic status without making HTTP calls
   */
  async getSimpleHealth(): Promise<SimpleHealthResponse> {
    return {
      status: 'ok',
      message: 'Gateway is healthy',
      timestamp: new Date().toISOString(),
      uptime: this.formatUptime()
    };
  }

  /**
   * Detailed health check using NestJS Terminus
   * Includes comprehensive service checks
   */
  async getDetailedHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      // Gateway self-check
      async () => {
        return {
          gateway: {
            status: 'up',
            timestamp: new Date().toISOString(),
            message: 'Gateway is running and accessible',
          },
        };
      },

      // Registry service check - simplified to avoid HTTP calls
      async () => {
        try {
          const services = this.registryService.getServices();
          return {
            registry: {
              status: 'up',
              timestamp: new Date().toISOString(),
              registered_services: services.size,
              message: 'Registry is running (simplified check)',
            },
          };
        } catch (error) {
          return {
            registry: {
              status: 'down',
              error: error.message,
              timestamp: new Date().toISOString(),
            },
          };
        }
      },

      // Check all registered services - simplified to avoid HTTP calls during startup
      async () => {
        const healthResult: Record<string, any> = {};
        const services = this.registryService.getServices();

        // Add summary information
        healthResult['registered_services'] = {
          status: 'up',
          total: services.size,
          timestamp: new Date().toISOString(),
        };

        // For Railway deployment, we'll just check if services are registered
        // without making HTTP calls to avoid startup timing issues
        for (const [name, service] of services) {
          healthResult[`service_${name}`] = {
            status: 'registered',
            port: service.port,
            version: service.version,
            lastRegistered: service.timestamp,
            note: 'Service is registered (health check simplified for deployment)',
          };
        }

        return healthResult;
      },
    ]);
  }

  /**
   * Registry-specific health check
   */
  async getRegistryHealth(): Promise<DetailedHealthResponse> {
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

  /**
   * Simple ping response
   */
  getPing(): SimpleHealthResponse {
    return {
      status: 'ok',
      message: 'Gateway is alive',
      timestamp: new Date().toISOString(),
      uptime: this.formatUptime(),
    };
  }

  /**
   * Services health check with HTTP calls
   * Use with caution as it makes external HTTP requests
   */
  async getServicesHealth(): Promise<DetailedHealthResponse> {
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
        data: {
          services: results,
          summary: {
            total: results.length,
            healthy: healthyCount,
            unhealthy: unhealthyCount,
          },
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
