import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VibeController } from './vibe.controller';
import { VibeService } from './vibe.service';
import { ProfileEntity } from '../profile/entities/profile.entity';
import {
  FEATURE_FLAGS,
  getFeatureFlags,
} from '../../config/feature-flags';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileEntity]), ConfigModule],
  controllers: [VibeController],
  providers: [
    VibeService,
    {
      provide: FEATURE_FLAGS,
      useFactory: (configService: ConfigService) =>
        getFeatureFlags(configService),
      inject: [ConfigService],
    },
  ],
  exports: [VibeService],
})
export class VibeModule {}
