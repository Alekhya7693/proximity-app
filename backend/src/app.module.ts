import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { getDatabaseConfig } from './config/database.config';
import { getRedisConfig } from './config/redis.config';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { LocationModule } from './modules/location/location.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { MatchModule } from './modules/match/match.module';
import { ChatModule } from './modules/chat/chat.module';
import { VibeModule } from './modules/vibe/vibe.module';
import { SafetyModule } from './modules/safety/safety.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    // Global config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
    }),

    // BullMQ queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: getRedisConfig(configService),
        prefix: configService.get<string>('BULL_QUEUE_PREFIX', 'proximity'),
      }),
    }),

    // Feature modules
    AuthModule,
    ProfileModule,
    LocationModule,
    DiscoveryModule,
    MatchModule,
    ChatModule,
    VibeModule,
    SafetyModule,
    NotificationModule,
  ],
})
export class AppModule {}
