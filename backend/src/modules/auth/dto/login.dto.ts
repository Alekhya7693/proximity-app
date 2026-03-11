import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'SecureP@ss1' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;

  @ApiPropertyOptional({ example: 'device-uuid-abc123' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({ example: 'ios' })
  @IsOptional()
  @IsString()
  platform?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'The refresh token from login response' })
  @IsString()
  refreshToken: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  code: string;
}
