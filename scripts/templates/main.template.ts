import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { {{ServiceName}}Module } from './{{service}}.module';
import axios from 'axios';
import * as packageJson from '../package.json';

// Convert semantic version to API version (e.g., "1.0.0" -> "v1", "2.1.0" -> "v2")
function getApiVersion(semanticVersion: string): string {
  const majorVersion = semanticVersion.split('.')[0];
  return `v${majorVersion}`;
}

// Extract service name from package.json name (e.g., "auth-service" -> "auth", "@atlas/posts-service" -> "posts")
function getServiceName(packageName: string): string {
  return packageName.replace('@atlas/', '').replace('-service', '');
}

async function bootstrap() {
  const logger = new Logger('{{ServiceName}}Service');
  const app = await NestFactory.create({{ServiceName}}Module);
  
  const configService = app.get(ConfigService);

  const host = configService.get<string>('HOSTNAME', '{{SERVICE_HOSTNAME}}');
  const port = configService.get<number>('PORT', {{SERVICE_PORT}});
  
  // Extract service info from package.json
  const serviceName = getServiceName(packageJson.name);
  const apiVersion = getApiVersion(packageJson.version);
  const serviceVersion = packageJson.version;  
  
  // Registry URL
  const registryUrl = `http://${configService.get<string>('GATEWAY_HOSTNAME', 'localhost')}:${configService.get<string>('REGISTRY_PORT', "3001")}`;
  const regKey = configService.get<string>('REGISTRY_KEY');

  app.setGlobalPrefix(serviceName);

  await app.listen(port);
  logger.log(`🚀 {{ServiceName}} service is running on: http://${host}:${port}/${serviceName}/${apiVersion}`);

  logger.log(`🔄 Attempting to register to gateway at ${registryUrl} with key ${regKey ? `${regKey.slice(0, 8)}...${regKey.slice(-4)}` : 'undefined'}`);

  // Register with gateway
  try {
    await registerWithGateway();
    logger.log(`✅ Successfully registered with gateway at ${registryUrl}`);
  } catch (error) {
    logger.error(`❌ Failed to register with gateway: ${error.message}`);
    logger.warn('Service will continue running but may not be accessible through gateway');
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}. Shutting down gracefully...`);
    try {
      await deregisterFromGateway();
      logger.log('✅ Successfully deregistered from gateway');
    } catch (error) {
      logger.error(`❌ Failed to deregister from gateway: ${error.message}`);
    }
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  async function registerWithGateway() {
    if (!regKey) {
      throw new Error('REGISTRY_KEY environment variable is required for service registration');
    }

    const registration = {
      name: serviceName,
      host: host,
      port: port,
      version: apiVersion,
      semanticVersion: serviceVersion,
      healthEndpoint: `/${serviceName}/${apiVersion}/health`,
      timestamp: new Date(),
      metadata: {
        description: packageJson.description || '{{ServiceName}} service',
        tags: ['atlas', 'microservice', serviceName],
        packageName: packageJson.name,
      },
    };

    await axios.post(`${registryUrl}/registry/register`, registration, {
      headers: {
        'x-registry-key': regKey,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  }

  async function deregisterFromGateway() {
    if (!regKey) {
      return;
    }

    await axios.delete(`${registryUrl}/registry/services/${serviceName}`, {
      headers: {
        'x-registry-key': regKey,
      },
      timeout: 5000,
    });
  }
}

bootstrap();