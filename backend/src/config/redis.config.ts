import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

export function getRedisConfig(configService: ConfigService): RedisOptions {
  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD', '') || undefined,
    db: configService.get<number>('REDIS_DB', 0),
    retryStrategy: (times: number) => {
      if (times > 3) {
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  };
}

export function createRedisClient(configService: ConfigService): Redis {
  const options = getRedisConfig(configService);
  const client = new Redis(options);

  client.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  client.on('connect', () => {
    console.log('Redis connected successfully');
  });

  return client;
}

export const REDIS_CLIENT = 'REDIS_CLIENT';
