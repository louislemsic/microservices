import { Controller, Post, Body, Get, Param, Delete, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiVersions } from '@atlas/shared';

@Controller(ApiVersions.V1)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('keys')
  async generateKey(@Body() body: { clientId: string; allowedServices?: string[] }) {
    const key = await this.authService.generateApiKey(body.clientId, body.allowedServices);

    return {
      data: { key },
      meta: {
        timestamp: new Date(),
        path: '/auth/v1/keys',
      },
    };
  }

  @Post('keys/validate')
  async validateKey(@Body() body: { key: string; service?: string }) {
    const isValid = await this.authService.validateApiKey(body.key, body.service);

    return {
      data: { isValid },
      meta: {
        timestamp: new Date(),
        path: '/auth/v1/keys/validate',
      },
    };
  }

  @Delete('keys/:key')
  async deactivateKey(@Param('key') key: string) {
    await this.authService.deactivateApiKey(key);

    return {
      data: { message: 'API key deactivated' },
      meta: {
        timestamp: new Date(),
        path: `/auth/v1/keys/${key}`,
      },
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'auth',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: 'v1',
    };
  }
}
