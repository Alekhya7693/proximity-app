import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IsUUID, IsOptional, IsNumber } from 'class-validator';
import { VibeService } from './vibe.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class VibeCheckDto {
  @IsUUID()
  targetUserId: string;

  @IsOptional()
  @IsNumber()
  distanceKm?: number;
}

@ApiTags('vibe')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('vibe')
export class VibeController {
  constructor(private readonly vibeService: VibeService) {}

  @Post('check')
  @ApiOperation({ summary: 'Run a vibe check with another user' })
  @ApiResponse({ status: 200, description: 'Vibe check result' })
  @ApiResponse({ status: 404, description: 'Profile not found or feature disabled' })
  async vibeCheck(
    @CurrentUser('id') userId: string,
    @Body() dto: VibeCheckDto,
  ) {
    return this.vibeService.vibeCheck(
      userId,
      dto.targetUserId,
      dto.distanceKm,
    );
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get your vibe profile summary' })
  @ApiResponse({ status: 200, description: 'Vibe profile' })
  async getVibeProfile(@CurrentUser('id') userId: string) {
    return this.vibeService.getVibeProfile(userId);
  }
}
