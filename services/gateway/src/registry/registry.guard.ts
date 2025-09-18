import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RegistryGuard implements CanActivate {
  private readonly logger = new Logger(RegistryGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Check if request is from internal network
    const clientIp = this.getClientIp(request);
    this.logger.log(`Registry access attempt from IP: ${clientIp}`);

    if (!this.isInternalIp(clientIp)) {
      this.logger.warn(`Registry access denied for external IP: ${clientIp}`);
      throw new ForbiddenException('Registry access is restricted to internal network');
    }

    // Check registry key authentication
    const regKey = request.headers['x-registry-key'] as string;
    const validKey = this.configService.get<string>('REG_KEY');

    if (!validKey) {
      this.logger.error('REG_KEY not configured in environment variables');
      throw new UnauthorizedException('Registry authentication not configured');
    }

    if (!regKey || regKey !== validKey) {
      this.logger.warn(
        `Invalid registry key attempt from IP: ${clientIp} - received: "${regKey.slice(0, 8)}...${regKey.slice(-4)}", expected: "${validKey.slice(0, 8)}...${validKey.slice(-4)}"`,
      );
      throw new UnauthorizedException('Invalid registry key');
    }

    this.logger.log(`✅ Registry access granted for IP: ${clientIp}`);
    return true;
  }

  private getClientIp(request: Request): string {
    // Try to get the real IP address, considering proxies
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      (request.connection as any)?.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private isInternalIp(ip: string): boolean {
    if (!ip || ip === 'unknown') {
      return false;
    }

    // Remove IPv6 prefix if present
    const cleanIp = ip.replace(/^::ffff:/, '');

    // Localhost
    if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') {
      return true;
    }

    // Docker internal networks
    if (
      cleanIp.startsWith('172.') || // Docker default bridge network
      cleanIp.startsWith('10.') || // Private network range
      cleanIp.startsWith('192.168.') || // Private network range
      cleanIp.startsWith('169.254.') // Link-local address
    ) {
      return true;
    }

    // Additional Docker network patterns
    if (cleanIp.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return true; // Docker bridge networks (172.16.0.0/12)
    }

    this.logger.debug(`IP ${cleanIp} is not considered internal`);
    return false;
  }
}
