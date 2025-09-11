import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

@Injectable()
export class ServiceLoaderService {
  private loadedServices: string[] = [];
  private serviceConfigs: Map<string, Record<string, string>> = new Map();
  private readonly logger = new Logger(ServiceLoaderService.name);

  constructor() {
    this.loadRootConfig();
    this.discoverServices();
  }

  private loadRootConfig(): void {
    // Load root .env file
    const rootEnvPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(rootEnvPath)) {
      dotenv.config({ path: rootEnvPath });
      this.logger.log('📝 Loaded root environment configuration');
    }
  }

  private loadServiceConfig(serviceName: string): void {
    const serviceEnvPath = path.join(process.cwd(), 'services', serviceName, '.env');
    if (fs.existsSync(serviceEnvPath)) {
      // Parse service-specific .env file
      const serviceConfig = dotenv.parse(fs.readFileSync(serviceEnvPath));
      
      // Merge with process.env, allowing service config to override root config
      Object.keys(serviceConfig).forEach(key => {
        process.env[key] = serviceConfig[key];
      });
      
      this.serviceConfigs.set(serviceName, serviceConfig);
      this.logger.log(`📝 Loaded environment configuration for service: ${serviceName}`);
    }
  }

  private discoverServices(): void {
    const servicesPath = path.join(process.cwd(), 'services');

    if (!fs.existsSync(servicesPath)) {
      this.logger.warn('No services directory found. Create services in ./services/ to get started.');
      return;
    }

    const serviceDirs = fs.readdirSync(servicesPath).filter((dir) => {
      const servicePath = path.join(servicesPath, dir);
      return fs.statSync(servicePath).isDirectory();
    });

    this.loadedServices = serviceDirs;

    // Load configurations for each service
    serviceDirs.forEach(service => {
      this.loadServiceConfig(service);
    });

    if (serviceDirs.length === 0) {
      this.logger.warn('No services found in ./services/ directory.');
    } else {
      this.logger.log(
        `🔌 Discovered ${serviceDirs.length} service(s): ${serviceDirs.map((s) => `/${s}/v1`).join(', ')}`
      );
    }
  }

  getLoadedServices(): string[] {
    return this.loadedServices;
  }

  getServiceEndpoints(): { service: string; endpoint: string }[] {
    return this.loadedServices.map((service) => ({
      service,
      endpoint: `/${service}/v1`,
    }));
  }
}
