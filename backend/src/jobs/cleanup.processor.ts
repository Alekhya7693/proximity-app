import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Job } from 'bull';
import { SessionEntity } from '../modules/auth/entities/session.entity';
import { SwipeEntity } from '../modules/match/entities/swipe.entity';

export const CLEANUP_QUEUE = 'cleanup';

export interface CleanupJobData {
  type:
    | 'expired_sessions'
    | 'old_swipes'
    | 'inactive_locations'
    | 'stale_verification_codes';
}

@Processor(CLEANUP_QUEUE)
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    @InjectRepository(SwipeEntity)
    private readonly swipeRepository: Repository<SwipeEntity>,
  ) {}

  @Process('cleanup')
  async handleCleanup(job: Job<CleanupJobData>): Promise<void> {
    this.logger.log(`Processing cleanup job: ${job.data.type}`);

    switch (job.data.type) {
      case 'expired_sessions':
        await this.cleanupExpiredSessions();
        break;
      case 'old_swipes':
        await this.cleanupOldSwipes();
        break;
      case 'inactive_locations':
        await this.cleanupInactiveLocations();
        break;
      case 'stale_verification_codes':
        await this.cleanupStaleVerificationCodes();
        break;
      default:
        this.logger.warn(`Unknown cleanup type: ${job.data.type}`);
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Cleanup job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }

  /**
   * Remove expired and revoked sessions older than 30 days.
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.sessionRepository.delete({
      isActive: false,
      createdAt: LessThan(thirtyDaysAgo),
    });

    // Also clean truly expired sessions
    const expiredResult = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .andWhere('isActive = :active', { active: false })
      .execute();

    const total = (result.affected || 0) + (expiredResult.affected || 0);
    this.logger.log(`Cleaned up ${total} expired sessions`);
  }

  /**
   * Remove swipe records older than 90 days for 'pass' swipes.
   * Keep 'like' and 'super_like' swipes indefinitely (needed for match detection).
   */
  private async cleanupOldSwipes(): Promise<void> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await this.swipeRepository
      .createQueryBuilder()
      .delete()
      .where('direction = :direction', { direction: 'pass' })
      .andWhere('createdAt < :date', { date: ninetyDaysAgo })
      .execute();

    this.logger.log(`Cleaned up ${result.affected || 0} old pass swipes`);
  }

  /**
   * Clear location data for users inactive for more than 24 hours.
   * This helps with privacy and keeps the Redis geo index clean.
   */
  private async cleanupInactiveLocations(): Promise<void> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Clear PostGIS locations for inactive users
    const result = await this.sessionRepository.manager
      .createQueryBuilder()
      .update('users')
      .set({
        lastLocation: null,
        lastLocationUpdatedAt: null,
      })
      .where('lastLocationUpdatedAt < :date', {
        date: twentyFourHoursAgo,
      })
      .andWhere('lastLocation IS NOT NULL')
      .execute();

    this.logger.log(
      `Cleared location data for ${result.affected || 0} inactive users`,
    );

    // Redis cleanup would be handled by TTL on online status keys,
    // but stale geo entries remain. A production system should
    // iterate and clean those via RedisGeoService.removeUserLocation().
  }

  /**
   * Clear expired verification codes.
   */
  private async cleanupStaleVerificationCodes(): Promise<void> {
    const result = await this.sessionRepository.manager
      .createQueryBuilder()
      .update('users')
      .set({
        verificationCode: null,
        verificationCodeExpiresAt: null,
      })
      .where('verificationCodeExpiresAt < :now', { now: new Date() })
      .andWhere('verificationCode IS NOT NULL')
      .execute();

    this.logger.log(
      `Cleared ${result.affected || 0} expired verification codes`,
    );
  }
}
