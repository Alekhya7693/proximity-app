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
import { IsEnum, IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';
import { SafetyService, ReportReason } from './safety.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class ReportUserDto {
  @IsUUID()
  reportedUserId: string;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

class BlockUserDto {
  @IsUUID()
  blockedUserId: string;
}

@ApiTags('safety')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('report')
  @ApiOperation({ summary: 'Report a user' })
  @ApiResponse({ status: 201, description: 'Report submitted' })
  @ApiResponse({ status: 409, description: 'Duplicate report or self-report' })
  async reportUser(
    @CurrentUser('id') userId: string,
    @Body() dto: ReportUserDto,
  ) {
    return this.safetyService.reportUser(
      userId,
      dto.reportedUserId,
      dto.reason,
      dto.description,
    );
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get my submitted reports' })
  @ApiResponse({ status: 200, description: 'Reports list' })
  async getMyReports(@CurrentUser('id') userId: string) {
    return this.safetyService.getMyReports(userId);
  }

  @Post('block')
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({ status: 201, description: 'User blocked' })
  @ApiResponse({ status: 409, description: 'Already blocked or self-block' })
  async blockUser(
    @CurrentUser('id') userId: string,
    @Body() dto: BlockUserDto,
  ) {
    return this.safetyService.blockUser(userId, dto.blockedUserId);
  }

  @Delete('block/:userId')
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({ status: 200, description: 'User unblocked' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  async unblockUser(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) blockedUserId: string,
  ) {
    await this.safetyService.unblockUser(currentUserId, blockedUserId);
    return { message: 'User unblocked' };
  }

  @Get('blocked')
  @ApiOperation({ summary: 'Get list of blocked users' })
  @ApiResponse({ status: 200, description: 'Blocked users list' })
  async getBlockedUsers(@CurrentUser('id') userId: string) {
    return this.safetyService.getBlockedUsers(userId);
  }
}
