import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserEntity } from './entities/user.entity';
import { SessionEntity } from './entities/session.entity';
import { ProfileEntity } from '../profile/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SessionEntity, ProfileEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          issuer: configService.get<string>('JWT_ISSUER', 'myko'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, TypeOrmModule],
})
export class AuthModule {}
