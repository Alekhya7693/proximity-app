import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { DiscoveryGateway } from './discovery.gateway';
import { UserEntity } from '../auth/entities/user.entity';
import { ProfileEntity } from '../profile/entities/profile.entity';
import { SwipeEntity } from '../match/entities/swipe.entity';
import { BlockEntity } from '../safety/safety.service';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ProfileEntity, SwipeEntity, BlockEntity]),
    LocationModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
        },
      }),
    }),
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, DiscoveryGateway],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
