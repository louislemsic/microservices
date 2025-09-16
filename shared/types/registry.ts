export interface ServiceRegistration {
  name: string;
  port: number;
  version: string; // API version (e.g., "v1", "v2")
  semanticVersion?: string; // Semantic version from package.json (e.g., "1.0.0")
  healthEndpoint: string;
  timestamp: Date;
  metadata?: {
    description?: string;
    tags?: string[];
    packageName?: string;
    [key: string]: any;
  };
}

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'unknown';
  lastChecked: Date;
  responseTime?: number;
  error?: string;
}

export interface RegistryHealth {
  services: Record<string, ServiceStatus>;
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
}

export interface HeartbeatResponse {
  status: 'ok' | 'error';
  timestamp: Date;
  uptime: number;
  version?: string;
}
