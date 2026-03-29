import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity';

// These would normally be separate entity files, but we define them
// inline here for the scaffolding. Migrate to separate files as needed.

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';

export enum ReportReason {
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  FAKE_PROFILE = 'fake_profile',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  UNDERAGE = 'underage',
  SCAM = 'scam',
  HATE_SPEECH = 'hate_speech',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('reports')
export class ReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  reporterId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporterId' })
  reporter: UserEntity;

  @Column({ type: 'uuid' })
  @Index()
  reportedUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportedUserId' })
  reportedUser: UserEntity;

  @Column({ type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({ type: 'text', nullable: true })
  moderatorNote: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('blocks')
@Unique(['blockerId', 'blockedId'])
export class BlockEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  blockerId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockerId' })
  blocker: UserEntity;

  @Column({ type: 'uuid' })
  @Index()
  blockedId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockedId' })
  blocked: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportRepository: Repository<ReportEntity>,
    @InjectRepository(BlockEntity)
    private readonly blockRepository: Repository<BlockEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // ─── Reporting ────────────────────────────────────────────

  /**
   * Submit a report against another user.
   */
  async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: ReportReason,
    description?: string,
  ): Promise<ReportEntity> {
    if (reporterId === reportedUserId) {
      throw new ConflictException('You cannot report yourself');
    }

    const reportedUser = await this.userRepository.findOne({
      where: { id: reportedUserId },
    });
    if (!reportedUser) {
      throw new NotFoundException('Reported user not found');
    }

    // Check for duplicate recent report
    const existingReport = await this.reportRepository.findOne({
      where: {
        reporterId,
        reportedUserId,
        status: ReportStatus.PENDING,
      },
    });
    if (existingReport) {
      throw new ConflictException(
        'You already have a pending report against this user',
      );
    }

    const report = this.reportRepository.create({
      reporterId,
      reportedUserId,
      reason,
      description: description || null,
    });

    const saved = await this.reportRepository.save(report);
    this.logger.log(
      `Report submitted: ${reporterId} reported ${reportedUserId} for ${reason}`,
    );

    // Auto-block the reported user for the reporter's safety
    await this.blockUser(reporterId, reportedUserId).catch(() => {
      // Ignore if already blocked
    });

    return saved;
  }

  /**
   * Get reports submitted by a user.
   */
  async getMyReports(userId: string): Promise<ReportEntity[]> {
    return this.reportRepository.find({
      where: { reporterId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Blocking ─────────────────────────────────────────────

  /**
   * Block another user.
   */
  async blockUser(
    blockerId: string,
    blockedId: string,
  ): Promise<BlockEntity> {
    if (blockerId === blockedId) {
      throw new ConflictException('You cannot block yourself');
    }

    const existing = await this.blockRepository.findOne({
      where: { blockerId, blockedId },
    });
    if (existing) {
      throw new ConflictException('User is already blocked');
    }

    const blockedUser = await this.userRepository.findOne({
      where: { id: blockedId },
    });
    if (!blockedUser) {
      throw new NotFoundException('User not found');
    }

    const block = this.blockRepository.create({ blockerId, blockedId });
    const saved = await this.blockRepository.save(block);

    this.logger.log(`User ${blockerId} blocked ${blockedId}`);
    return saved;
  }

  /**
   * Unblock a user.
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const block = await this.blockRepository.findOne({
      where: { blockerId, blockedId },
    });
    if (!block) {
      throw new NotFoundException('Block not found');
    }

    await this.blockRepository.remove(block);
    this.logger.log(`User ${blockerId} unblocked ${blockedId}`);
  }

  /**
   * Get list of blocked users.
   */
  async getBlockedUsers(userId: string): Promise<BlockEntity[]> {
    return this.blockRepository.find({
      where: { blockerId: userId },
      relations: ['blocked'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Check if user A has blocked user B.
   */
  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.blockRepository.findOne({
      where: { blockerId, blockedId },
    });
    return !!block;
  }

  /**
   * Check if either user has blocked the other (bidirectional check).
   */
  async isBlockedEitherWay(
    userId1: string,
    userId2: string,
  ): Promise<boolean> {
    const block = await this.blockRepository.findOne({
      where: [
        { blockerId: userId1, blockedId: userId2 },
        { blockerId: userId2, blockedId: userId1 },
      ],
    });
    return !!block;
  }

  // ─── Support Reports ─────────────────────────────────────

  /**
   * Submit a support/bug report.
   */
  async submitSupportReport(
    userId: string,
    category: string,
    description: string,
  ): Promise<{ message: string; id: string }> {
    // Store as a self-report with the category in the description
    const report = this.reportRepository.create({
      reporterId: userId,
      reportedUserId: userId, // Self-report for support issues
      reason: ReportReason.OTHER,
      description: `[${category}] ${description}`,
      status: ReportStatus.PENDING,
    });

    const saved = await this.reportRepository.save(report);
    this.logger.log(
      `Support report submitted by user ${userId}: [${category}]`,
    );

    return { message: 'Report submitted successfully', id: saved.id };
  }

  /**
   * Get all user IDs that a user has blocked or has been blocked by.
   */
  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.blockRepository.find({
      where: [{ blockerId: userId }, { blockedId: userId }],
    });

    const ids = new Set<string>();
    for (const block of blocks) {
      if (block.blockerId === userId) {
        ids.add(block.blockedId);
      } else {
        ids.add(block.blockerId);
      }
    }

    return [...ids];
  }
}
