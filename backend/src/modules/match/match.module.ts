import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { SwipeEntity } from './entities/swipe.entity';
import { MatchEntity } from './entities/match.entity';
import { AuthModule } from '../auth/auth.module';
import { LocationModule } from '../location/location.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SwipeEntity, MatchEntity]),
    AuthModule,
    LocationModule,
    NotificationModule,
  ],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
