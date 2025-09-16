import { Injectable, NestMiddleware, Logger, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, of } from 'rxjs';
import { registryStore } from '../shared/registry-store';
import { Services } from '@atlas/shared';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiKeyMiddleware.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.header('x-api-key');

    // Check if auth service is available in the dynamic registry
    const authService = registryStore.getService(Services.AUTH);

    if (!authService) {
      this.logger.warn('Auth service is not registered or offline - allowing request to pass through');
      return next();
    }

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      const serviceName = req.params.service; // Get the target service from the request

      const authEndpoint = `http://localhost:${authService.port}/auth/${authService.version}/keys/validate`;

      this.logger.debug(`Validating API key with auth service at ${authEndpoint}`);

      const { data } = await firstValueFrom(
        this.httpService
          .post(authEndpoint, {
            key: apiKey,
            service: serviceName,
          })
          .pipe(
            catchError((error) => {
              this.logger.warn(`Auth service validation failed (${error.message}) - allowing request to pass through`);
              // If auth service fails to respond, let the request pass through
              return of({ data: { data: { isValid: true } } });
            }),
          ),
      );

      if (!data.data.isValid) {
        throw new UnauthorizedException('Invalid API key');
      }

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(`API key validation error (${error.message}) - allowing request to pass through`);
      // If any other error occurs, let the request pass through
      next();
    }
  }
}
