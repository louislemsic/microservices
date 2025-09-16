import { All, Controller, Param, Req, Get, Logger } from '@nestjs/common';
import { Request } from 'express';
import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(private readonly gatewayService: GatewayService) {}

  @All(':service/:version')
  async handleRequest(@Param('service') service: string, @Param('version') version: string, @Req() request: Request) {
    return this.gatewayService.routeRequest(request.method, service, version, '', request.body);
  }

  @All(':service/:version/*slugs')
  async handleRequestWithSlugs(
    @Param('service') service: string,
    @Param('version') version: string,
    @Param('slugs') slugs: object,
    @Req() request: Request,
  ) {
    return this.gatewayService.routeRequest(
      request.method,
      service,
      version,
      Object.values(slugs).join('/'),
      request.body,
    );
  }

  @All('services')
  getServices() {
    return {
      services: this.gatewayService.getServiceEndpoints(),
    };
  }

  @Get('health')
  getHealth() {
    return this.gatewayService.getHealth();
  }

  @Get('ping')
  ping() {
    return {
      status: 'ok',
      message: 'Gateway is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('debug/registry')
  debugRegistry() {
    return this.gatewayService.getServiceEndpoints();
  }
}
