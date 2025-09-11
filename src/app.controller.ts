import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getAtlasInfo(): any {
    return this.appService.getAtlasInfo();
  }

  @Get('health')
  getHealth(): any {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
