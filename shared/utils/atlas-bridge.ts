import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiVersions } from '../enums/api.enum';
import { Services } from '../enums/services.enum';

@Injectable()
export class AtlasBridge {
  private readonly logger = new Logger(AtlasBridge.name);
  private readonly gatewayUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const host = this.configService.get<string>('GATEWAY_HOST', 'localhost');
    const port = this.configService.get<number>('GATEWAY_PORT', 3000);
    this.gatewayUrl = `http://${host}:${port}`;
  }

  /**
   * Make a GET request to another service through the Atlas Gateway
   * @example
   * // Get user details from users service
   * const user = await bridge.get<UserDetails>(Services.USERS, ApiVersions.V1, `profile/${userId}`);
   */
  async get<T>(service: Services, version: ApiVersions | number, path: string): Promise<T> {
    const url = `${this.gatewayUrl}/${service}/${this.getVersionString(version)}/${path}`.replace(/\/+/g, '/');
    this.logger.debug(`🌉 AtlasBridge: GET ${url}`);
    
    const response = await firstValueFrom(
      this.httpService.get<T>(url)
    );
    
    return response.data;
  }

  /**
   * Make a POST request to another service through the Atlas Gateway
   * @example
   * // Create a post with associated user
   * const post = await bridge.post<Post>(Services.POSTS, ApiVersions.V1, 'create', { title, userId });
   */
  async post<T>(service: Services, version: ApiVersions | number, path: string, data: any): Promise<T> {
    const url = `${this.gatewayUrl}/${service}/${this.getVersionString(version)}/${path}`.replace(/\/+/g, '/');
    this.logger.debug(`🌉 AtlasBridge: POST ${url}`);
    
    const response = await firstValueFrom(
      this.httpService.post<T>(url, data)
    );
    
    return response.data;
  }

  /**
   * Make a PUT request to another service through the Atlas Gateway
   * @example
   * // Update user settings
   * const settings = await bridge.put<Settings>(Services.USERS, ApiVersions.V1, `settings/${userId}`, data);
   */
  async put<T>(service: Services, version: ApiVersions | number, path: string, data: any): Promise<T> {
    const url = `${this.gatewayUrl}/${service}/${this.getVersionString(version)}/${path}`.replace(/\/+/g, '/');
    this.logger.debug(`🌉 AtlasBridge: PUT ${url}`);
    
    const response = await firstValueFrom(
      this.httpService.put<T>(url, data)
    );
    
    return response.data;
  }

  /**
   * Make a DELETE request to another service through the Atlas Gateway
   * @example
   * // Delete a post
   * await bridge.delete(Services.POSTS, ApiVersions.V1, `posts/${postId}`);
   */
  async delete<T>(service: Services, version: ApiVersions | number, path: string): Promise<T> {
    const url = `${this.gatewayUrl}/${service}/${this.getVersionString(version)}/${path}`.replace(/\/+/g, '/');
    this.logger.debug(`🌉 AtlasBridge: DELETE ${url}`);
    
    const response = await firstValueFrom(
      this.httpService.delete<T>(url)
    );
    
    return response.data;
  }

  private getVersionString(version: ApiVersions | number): string {
    return typeof version === 'number' ? `v${version}` : (version[0] === 'v' ? version : `v${version}`);
  }
}
