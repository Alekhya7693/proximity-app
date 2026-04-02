import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';
import { DiscoveryService } from './discovery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IntentionType } from '../profile/entities/profile.entity';

class SetVibesDto {
  @IsArray()
  @IsString({ each: true })
  vibes: string[];

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customText?: string;
}

@ApiTags('discovery')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Get discovery feed of nearby users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'radius', required: false, description: 'Radius in km' })
  @ApiQuery({
    name: 'intention',
    required: false,
    enum: IntentionType,
    description: 'Filter by intention',
  })
  @ApiResponse({ status: 200, description: 'Discovery feed returned' })
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('radius') radius?: number,
    @Query('intention') intention?: IntentionType,
  ) {
    return this.discoveryService.getDiscoveryFeed(
      userId,
      page,
      radius ? Number(radius) : undefined,
      intention,
    );
  }

  @Get('vibes')
  @ApiOperation({ summary: 'Get available vibe options for a mode' })
  @ApiQuery({ name: 'mode', required: false, description: 'social or professional' })
  @ApiResponse({ status: 200, description: 'List of available vibes' })
  async getVibes(@Query('mode') mode?: string) {
    return this.discoveryService.getAvailableVibes(mode || 'social');
  }

  @Post('vibes')
  @ApiOperation({ summary: 'Set your active vibes' })
  @ApiResponse({ status: 200, description: 'Vibes set successfully' })
  async setVibes(
    @CurrentUser('id') userId: string,
    @Body() dto: SetVibesDto,
  ) {
    return this.discoveryService.setActiveVibes(
      userId,
      dto.vibes,
      dto.durationMinutes || 60,
      dto.customText,
    );
  }

  @Delete('vibes')
  @ApiOperation({ summary: 'Clear your active vibes' })
  @ApiResponse({ status: 200, description: 'Vibes cleared' })
  async clearVibes(@CurrentUser('id') userId: string) {
    return this.discoveryService.clearActiveVibes(userId);
  }
}
