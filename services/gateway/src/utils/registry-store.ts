import { ServiceRegistration } from '@atlas/shared';
import { Logger } from '@nestjs/common';

/**
 * Shared singleton registry store that can be accessed by both
 * the gateway and registry applications
 */
class RegistryStore {
  private static instance: RegistryStore;
  private readonly logger = new Logger('RegistryStore');
  private readonly services = new Map<string, ServiceRegistration>();
  private readonly heartbeatIntervals = new Map<string, NodeJS.Timeout>();

  private constructor() {}

  public static getInstance(): RegistryStore {
    if (!RegistryStore.instance) {
      RegistryStore.instance = new RegistryStore();
    }
    return RegistryStore.instance;
  }

  setService(name: string, registration: ServiceRegistration): void {
    this.services.set(name, registration);
    this.logger.debug(`Service ${name} stored in shared registry`);
  }

  getService(name: string): ServiceRegistration | undefined {
    const service = this.services.get(name);
    this.logger.debug(`Service ${name} requested from shared registry: ${service ? 'found' : 'not found'}`);
    return service;
  }

  deleteService(name: string): boolean {
    const deleted = this.services.delete(name);
    this.logger.debug(`Service ${name} deleted from shared registry: ${deleted}`);
    return deleted;
  }

  getAllServices(): ServiceRegistration[] {
    return Array.from(this.services.values());
  }

  getServices(): Map<string, ServiceRegistration> {
    return new Map(this.services);
  }

  setHeartbeatInterval(serviceName: string, interval: NodeJS.Timeout): void {
    this.heartbeatIntervals.set(serviceName, interval);
  }

  getHeartbeatInterval(serviceName: string): NodeJS.Timeout | undefined {
    return this.heartbeatIntervals.get(serviceName);
  }

  clearHeartbeatInterval(serviceName: string): void {
    const interval = this.heartbeatIntervals.get(serviceName);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(serviceName);
      this.logger.debug(`Heartbeat interval cleared for ${serviceName}`);
    }
  }

  getServiceCount(): number {
    return this.services.size;
  }
}

export const registryStore = RegistryStore.getInstance();
