import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  ParseFloatPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class UpdateLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  altitude?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;
}

@ApiTags('location')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('update')
  @ApiOperation({ summary: 'Update current location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationService.updateLocation(userId, dto);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby users' })
  @ApiQuery({ name: 'radius', required: false, description: 'Radius in km' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results' })
  @ApiResponse({ status: 200, description: 'Nearby users list' })
  async getNearbyUsers(
    @CurrentUser('id') userId: string,
    @Query('radius', new DefaultValuePipe(10), ParseFloatPipe) radius: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.locationService.getNearbyUsers(userId, radius, limit);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear location data (privacy)' })
  @ApiResponse({ status: 200, description: 'Location cleared' })
  async clearLocation(@CurrentUser('id') userId: string) {
    await this.locationService.clearLocation(userId);
    return { message: 'Location data cleared' };
  }
}
