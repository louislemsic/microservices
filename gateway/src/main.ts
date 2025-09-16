import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayModule } from './gateway.module';
import { RegistryModule } from './registry/registry.module';

async function bootstrap() {
  const logger = new Logger('Gateway');

  // Create the main gateway app (port 3000) - PUBLIC ROUTES ONLY
  const publicApp = await NestFactory.create(GatewayModule);
  const configService = publicApp.get(ConfigService);

  const publicPort = configService.get<number>('GATEWAY_PORT', 3000);
  const registryPort = configService.get<number>('REGISTRY_PORT', 3001);
  const regKey = configService.get<string>('REG_KEY');

  logger.log(`Gateway config - PUBLIC_PORT: ${publicPort}, REGISTRY_PORT: ${registryPort}, REG_KEY: ${regKey}`);

  // Create the registry app (port 3001) - REGISTRY ROUTES ONLY
  const registryApp = await NestFactory.create(RegistryModule);

  // Configure CORS for internal registry access
  registryApp.enableCors({
    origin: ['http://localhost', /^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    credentials: true,
  });

  // Start public gateway (3000)
  await publicApp.listen(publicPort);
  logger.log(`🚀 Gateway (Public) is running on: http://localhost:${publicPort}`);

  // Start registry service (3001)
  await registryApp.listen(registryPort);
  logger.log(`🔧 Registry Service is running on: http://localhost:${registryPort}`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}. Shutting down gracefully...`);
    await Promise.all([publicApp.close(), registryApp.close()]);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
