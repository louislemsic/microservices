import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { ApiKey } from './entities/api-key.entity';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly redis: Redis;

  constructor(
    @InjectRepository(ApiKey)
    private apiKeys: Repository<ApiKey>,
  ) {
    // Initialize Redis with Railway's URL
    this.redis = new Redis(process.env.REDIS_URL);
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  async generateApiKey(clientId: string, allowedServices: string[] = []): Promise<string> {
    // Generate key in format: atlas_randomString_checksum
    const randomString = randomBytes(16).toString('hex');
    const checksum = this.hashKey(randomString).slice(0, 6);
    const key = `atlas_${randomString}_${checksum}`;

    // Store hashed version in DB
    const hashedKey = this.hashKey(key);

    const apiKey = this.apiKeys.create({
      key: hashedKey,
      clientId,
      allowedServices,
      isActive: true,
    });

    await this.apiKeys.save(apiKey);

    // Return the actual key to the client (will only be shown once)
    return key;
  }

  async validateApiKey(key: string, service?: string): Promise<boolean> {
    const hashedKey = this.hashKey(key);

    try {
      // Check Redis cache first
      const cached = await this.redis.get(`apikey:${hashedKey}`);
      if (cached) {
        const cachedData = JSON.parse(cached);
        if (!cachedData.isActive) return false;
        if (service && !cachedData.allowedServices.includes(service)) return false;

        // Update last used asynchronously
        this.updateLastUsed(hashedKey).catch((err) =>
          this.logger.error(`Failed to update last used timestamp: ${err.message}`),
        );

        return true;
      }

      // If not in cache, check DB
      const apiKey = await this.apiKeys.findOne({
        where: { key: hashedKey, isActive: true },
      });

      if (!apiKey) return false;

      // Validate service access if specified
      if (service && !apiKey.allowedServices.includes(service)) return false;

      // Cache the result
      await this.redis.set(
        `apikey:${hashedKey}`,
        JSON.stringify({
          isActive: apiKey.isActive,
          allowedServices: apiKey.allowedServices,
        }),
        'EX',
        3600, // Cache for 1 hour
      );

      // Update last used timestamp
      await this.updateLastUsed(hashedKey);

      return true;
    } catch (error) {
      this.logger.error(`Error validating API key: ${error.message}`);
      return false;
    }
  }

  private async updateLastUsed(hashedKey: string): Promise<void> {
    await this.apiKeys.update({ key: hashedKey }, { lastUsedAt: new Date() });
  }

  async deactivateApiKey(key: string): Promise<void> {
    const hashedKey = this.hashKey(key);

    const result = await this.apiKeys.update({ key: hashedKey }, { isActive: false });

    if (result.affected === 0) {
      throw new NotFoundException('API key not found');
    }

    // Remove from cache
    await this.redis.del(`apikey:${hashedKey}`);
  }
}
