import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as net from 'net';

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function findAvailablePort(startPort: number, endPort: number): Promise<number> {
  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${endPort}`);
}

async function bootstrap() {
  const logger = new Logger('Microservices');
  const app = await NestFactory.create(AppModule);

  // Support for Railway PORT or find available port between 3000-3009
  const port = process.env.PORT || await findAvailablePort(3000, 3009);

  // Enable CORS for development
  app.enableCors();

  await app.listen(port);

  console.log();
  logger.log(`🚀 Gateway is running on: http://localhost:${port}\n`);
}

bootstrap();
