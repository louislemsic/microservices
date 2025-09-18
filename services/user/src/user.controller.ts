import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiVersions } from '@atlas/shared';

@Controller(ApiVersions.V1)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'user',
      timestamp: new Date().toISOString(),
      uptime: this.formatUptime(process.uptime() * 1000),
      version: 'v1',
    };
  }

  private formatUptime(uptimeMs: number): string {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      const remainingMonths = Math.floor((days % 365) / 30);
      return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
    }
    if (months > 0) {
      const remainingDays = days % 30;
      return remainingDays > 0 ? `${months}m ${remainingDays}d` : `${months}m`;
    }
    if (days > 0) {
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.userService.create(data);
  }
}
