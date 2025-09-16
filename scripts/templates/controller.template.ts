import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { {{ServiceName}}Service } from './{{service}}.service';
import { ApiVersions } from '@atlas/shared';

@Controller(ApiVersions.V1)
export class {{ServiceName}}Controller {
  private readonly logger = new Logger({{ServiceName}}Controller.name);

  constructor(private readonly {{serviceCamel}}Service: {{ServiceName}}Service) {}

  @Get()
  findAll() {
    return this.{{serviceCamel}}Service.findAll();
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: '{{service}}',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: 'v1',
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.{{serviceCamel}}Service.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.{{serviceCamel}}Service.create(data);
  }
}
