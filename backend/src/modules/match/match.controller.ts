import {
  Controller,
  Get,
  Post,
  Delete,
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
import { IsEnum, IsUUID } from 'class-validator';
import { MatchService } from './match.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SwipeDirection } from './entities/swipe.entity';

class SwipeDto {
  @IsUUID()
  targetUserId: string;

  @IsEnum(SwipeDirection)
  direction: SwipeDirection;
}

@ApiTags('match')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post('swipe')
  @ApiOperation({ summary: 'Swipe on a user (like, pass, super_like)' })
  @ApiResponse({ status: 201, description: 'Swipe recorded' })
  @ApiResponse({ status: 409, description: 'Already swiped' })
  async swipe(
    @CurrentUser('id') userId: string,
    @Body() dto: SwipeDto,
  ) {
    return this.matchService.processSwipe(
      userId,
      dto.targetUserId,
      dto.direction,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all active matches' })
  @ApiResponse({ status: 200, description: 'Matches list' })
  async getMatches(@CurrentUser('id') userId: string) {
    return this.matchService.getMatches(userId);
  }

  @Get('likes')
  @ApiOperation({ summary: 'Get users who liked you (not yet swiped on)' })
  @ApiResponse({ status: 200, description: 'Likes received' })
  async getLikesReceived(@CurrentUser('id') userId: string) {
    return this.matchService.getLikesReceived(userId);
  }

  @Delete(':matchId')
  @ApiOperation({ summary: 'Unmatch from a user' })
  @ApiResponse({ status: 200, description: 'Unmatched successfully' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async unmatch(
    @CurrentUser('id') userId: string,
    @Param('matchId', ParseUUIDPipe) matchId: string,
  ) {
    await this.matchService.unmatch(userId, matchId);
    return { message: 'Unmatched successfully' };
  }
}
