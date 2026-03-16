import { Module, Logger } from '@nestjs/common';
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

const logger = new Logger('AppModule');

// Conditionally include BullModule only when Redis is configured
const redisHost = process.env.REDIS_HOST || process.env.REDIS_URL;
const optionalImports = redisHost
  ? [
      BullModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          redis: getRedisConfig(configService),
          prefix: configService.get<string>('BULL_QUEUE_PREFIX', 'proximity'),
        }),
      }),
    ]
  : [];

if (!redisHost) {
  logger.warn('Redis not configured — BullMQ queues disabled');
}

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

    // BullMQ queues (optional — only when Redis is configured)
    ...optionalImports,

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
