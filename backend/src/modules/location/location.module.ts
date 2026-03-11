import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { RedisGeoService } from './redis-geo.service';
import { UserEntity } from '../auth/entities/user.entity';
import { REDIS_CLIENT, createRedisClient } from '../../config/redis.config';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ConfigModule],
  controllers: [LocationController],
  providers: [
    LocationService,
    RedisGeoService,
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) =>
        createRedisClient(configService),
      inject: [ConfigService],
    },
  ],
  exports: [LocationService, RedisGeoService, REDIS_CLIENT],
})
export class LocationModule {}
