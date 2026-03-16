import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { RedisGeoService } from './redis-geo.service';
import { UserEntity } from '../auth/entities/user.entity';
import { REDIS_CLIENT, createRedisClient } from '../../config/redis.config';

const logger = new Logger('LocationModule');

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ConfigModule],
  controllers: [LocationController],
  providers: [
    LocationService,
    RedisGeoService,
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST') || configService.get<string>('REDIS_URL');
        if (!redisHost) {
          logger.warn('Redis not configured — REDIS_CLIENT will be null');
          return null;
        }
        return createRedisClient(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [LocationService, RedisGeoService, REDIS_CLIENT],
})
export class LocationModule {}
