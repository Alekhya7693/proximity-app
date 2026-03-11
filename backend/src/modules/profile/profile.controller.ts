import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProfileEntity } from './entities/profile.entity';

@ApiTags('profile')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update profile' })
  @ApiResponse({ status: 201, description: 'Profile created' })
  async createProfile(
    @CurrentUser('id') userId: string,
    @Body() data: Partial<ProfileEntity>,
  ) {
    return this.profileService.createProfile(userId, data);
  }

  @Put()
  @ApiOperation({ summary: 'Update profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() data: Partial<ProfileEntity>,
  ) {
    return this.profileService.updateProfile(userId, data);
  }

  @Patch('visibility')
  @ApiOperation({ summary: 'Toggle profile visibility' })
  @ApiResponse({ status: 200, description: 'Visibility toggled' })
  async toggleVisibility(@CurrentUser('id') userId: string) {
    return this.profileService.toggleVisibility(userId);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get public profile of another user' })
  @ApiResponse({ status: 200, description: 'Public profile retrieved' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getPublicProfile(
    @Param('userId', ParseUUIDPipe) profileUserId: string,
    @CurrentUser('id') requestingUserId: string,
  ) {
    return this.profileService.getPublicProfile(profileUserId, requestingUserId);
  }
}
