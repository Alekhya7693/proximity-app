import {
  Controller,
  Get,
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
import { DiscoveryService } from './discovery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IntentionType } from '../profile/entities/profile.entity';

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
}
