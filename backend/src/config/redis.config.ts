import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

export function getRedisConfig(configService: ConfigService): RedisOptions {
  const redisUrl = configService.get<string>('REDIS_URL');

  if (redisUrl) {
    return {
      ...parseRedisUrl(redisUrl),
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };
  }

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

function parseRedisUrl(url: string): Partial<RedisOptions> {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db: parsed.pathname ? parseInt(parsed.pathname.replace('/', '') || '0', 10) : 0,
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
