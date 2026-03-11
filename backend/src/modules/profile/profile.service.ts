import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileEntity } from './entities/profile.entity';
import { UserEntity } from '../auth/entities/user.entity';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getProfile(userId: string): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async getProfileById(profileId: string): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async createProfile(
    userId: string,
    data: Partial<ProfileEntity>,
  ): Promise<ProfileEntity> {
    const existing = await this.profileRepository.findOne({
      where: { userId },
    });

    if (existing) {
      return this.updateProfile(userId, data);
    }

    const profile = this.profileRepository.create({
      ...data,
      userId,
      profileCompleteness: this.calculateCompleteness(data),
    });

    const saved = await this.profileRepository.save(profile);
    this.logger.log(`Profile created for user: ${userId}`);
    return saved;
  }

  async updateProfile(
    userId: string,
    data: Partial<ProfileEntity>,
  ): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found. Create one first.');
    }

    // Merge and recalculate completeness
    const merged = { ...profile, ...data };
    merged.profileCompleteness = this.calculateCompleteness(merged);

    await this.profileRepository.update(profile.id, {
      ...data,
      profileCompleteness: merged.profileCompleteness,
    });

    this.logger.log(`Profile updated for user: ${userId}`);
    return this.getProfile(userId);
  }

  async toggleVisibility(userId: string): Promise<{ isVisible: boolean }> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const newVisibility = !profile.isVisible;
    await this.profileRepository.update(profile.id, {
      isVisible: newVisibility,
    });

    return { isVisible: newVisibility };
  }

  async getPublicProfile(
    profileUserId: string,
    requestingUserId: string,
  ): Promise<Partial<ProfileEntity>> {
    const profile = await this.profileRepository.findOne({
      where: { userId: profileUserId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (!profile.isVisible && profileUserId !== requestingUserId) {
      throw new ForbiddenException('This profile is not visible');
    }

    // Return public-safe fields
    return {
      id: profile.id,
      userId: profile.userId,
      bio: profile.bio,
      gender: profile.gender,
      intention: profile.intention,
      photos: profile.photos,
      interests: profile.interests,
      occupation: profile.occupation,
      company: profile.company,
      education: profile.education,
      city: profile.city,
      prompts: profile.prompts,
      profileCompleteness: profile.profileCompleteness,
    };
  }

  private calculateCompleteness(data: Partial<ProfileEntity>): number {
    const fields = [
      { key: 'bio', weight: 15 },
      { key: 'gender', weight: 10 },
      { key: 'photos', weight: 25 },
      { key: 'interests', weight: 15 },
      { key: 'occupation', weight: 10 },
      { key: 'education', weight: 5 },
      { key: 'city', weight: 5 },
      { key: 'prompts', weight: 10 },
      { key: 'heightCm', weight: 5 },
    ];

    let score = 0;
    for (const field of fields) {
      const value = (data as any)[field.key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          score += field.weight;
        } else if (!Array.isArray(value)) {
          score += field.weight;
        }
      }
    }

    return Math.min(score, 100);
  }
}
