import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SwipeEntity, SwipeDirection } from './entities/swipe.entity';
import { MatchEntity, MatchStatus } from './entities/match.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { RedisGeoService } from '../location/redis-geo.service';
import { NotificationService } from '../notification/notification.service';
import { ChatService } from '../chat/chat.service';

interface SwipeResult {
  swipe: SwipeEntity;
  isMatch: boolean;
  match?: MatchEntity;
}

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    @InjectRepository(SwipeEntity)
    private readonly swipeRepository: Repository<SwipeEntity>,
    @InjectRepository(MatchEntity)
    private readonly matchRepository: Repository<MatchEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisGeoService: RedisGeoService,
    private readonly notificationService: NotificationService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Process a swipe action and detect mutual likes (matches).
   */
  async processSwipe(
    swiperId: string,
    swipedId: string,
    direction: SwipeDirection,
  ): Promise<SwipeResult> {
    // Prevent self-swipe
    if (swiperId === swipedId) {
      throw new ConflictException('Cannot swipe on yourself');
    }

    // Check if already swiped
    const existingSwipe = await this.swipeRepository.findOne({
      where: { swiperId, swipedId },
    });
    if (existingSwipe) {
      throw new ConflictException('You have already swiped on this user');
    }

    // Verify target user exists
    const targetUser = await this.userRepository.findOne({
      where: { id: swipedId },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Record swipe
    const swipe = this.swipeRepository.create({
      swiperId,
      swipedId,
      direction,
    });
    const savedSwipe = await this.swipeRepository.save(swipe);

    // Check for mutual like
    let isMatch = false;
    let match: MatchEntity | undefined;

    if (
      direction === SwipeDirection.LIKE ||
      direction === SwipeDirection.SUPER_LIKE
    ) {
      const reciprocalSwipe = await this.swipeRepository.findOne({
        where: {
          swiperId: swipedId,
          swipedId: swiperId,
          direction: SwipeDirection.LIKE,
        },
      });

      // Also check for super like as reciprocal
      const reciprocalSuperLike = reciprocalSwipe
        ? reciprocalSwipe
        : await this.swipeRepository.findOne({
            where: {
              swiperId: swipedId,
              swipedId: swiperId,
              direction: SwipeDirection.SUPER_LIKE,
            },
          });

      if (reciprocalSwipe || reciprocalSuperLike) {
        match = await this.createMatch(swiperId, swipedId);
        isMatch = true;
        this.logger.log(`New match created: ${swiperId} <> ${swipedId}`);
      }
    }

    return { swipe: savedSwipe, isMatch, match };
  }

  /**
   * Get all active matches for a user.
   */
  async getMatches(userId: string): Promise<MatchEntity[]> {
    return this.matchRepository.find({
      where: [
        { user1Id: userId, status: MatchStatus.ACTIVE },
        { user2Id: userId, status: MatchStatus.ACTIVE },
      ],
      relations: ['user1', 'user1.profile', 'user2', 'user2.profile'],
      order: { matchedAt: 'DESC' },
    });
  }

  /**
   * Unmatch (remove match between two users).
   */
  async unmatch(userId: string, matchId: string): Promise<void> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('You are not part of this match');
    }

    await this.matchRepository.update(matchId, {
      status: MatchStatus.UNMATCHED,
      unmatchedAt: new Date(),
    });

    this.logger.log(`Match ${matchId} unmatched by ${userId}`);
  }

  /**
   * Check if two users are matched.
   */
  async areMatched(userId1: string, userId2: string): Promise<boolean> {
    const match = await this.matchRepository.findOne({
      where: [
        { user1Id: userId1, user2Id: userId2, status: MatchStatus.ACTIVE },
        { user1Id: userId2, user2Id: userId1, status: MatchStatus.ACTIVE },
      ],
    });
    return !!match;
  }

  /**
   * Get users who liked you (pending likes that you haven't swiped on yet).
   */
  async getLikesReceived(userId: string): Promise<SwipeEntity[]> {
    // Get IDs of users you already swiped on
    const mySwiped = await this.swipeRepository.find({
      where: { swiperId: userId },
      select: ['swipedId'],
    });
    const swipedIds = mySwiped.map((s) => s.swipedId);

    const query = this.swipeRepository
      .createQueryBuilder('swipe')
      .leftJoinAndSelect('swipe.swiper', 'swiper')
      .where('swipe.swipedId = :userId', { userId })
      .andWhere('swipe.direction IN (:...directions)', {
        directions: [SwipeDirection.LIKE, SwipeDirection.SUPER_LIKE],
      })
      .orderBy('swipe.createdAt', 'DESC');

    if (swipedIds.length > 0) {
      query.andWhere('swipe.swiperId NOT IN (:...swipedIds)', { swipedIds });
    }

    return query.getMany();
  }

  /**
   * Get a single match by ID with authorization check.
   */
  async getMatchById(userId: string, matchId: string): Promise<MatchEntity> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: ['user1', 'user1.profile', 'user2', 'user2.profile'],
    });
    if (!match) throw new NotFoundException('Match not found');
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('You are not part of this match');
    }
    return match;
  }

  // ─── Private ──────────────────────────────────────────────

  private async createMatch(
    user1Id: string,
    user2Id: string,
  ): Promise<MatchEntity> {
    // Ensure consistent ordering (smaller UUID first)
    const [orderedUser1, orderedUser2] =
      user1Id < user2Id
        ? [user1Id, user2Id]
        : [user2Id, user1Id];

    // Check for existing match
    const existing = await this.matchRepository.findOne({
      where: { user1Id: orderedUser1, user2Id: orderedUser2 },
    });
    if (existing) {
      return existing;
    }

    // Get distance at time of match
    const distance = await this.redisGeoService.getDistanceBetween(
      user1Id,
      user2Id,
    );

    const match = this.matchRepository.create({
      user1Id: orderedUser1,
      user2Id: orderedUser2,
      distanceAtMatchKm: distance
        ? Math.round(distance * 10) / 10
        : null,
    });

    const savedMatch = await this.matchRepository.save(match);

    // Auto-create chat for this match
    await this.chatService.getOrCreateChat(user1Id, user2Id, savedMatch.id);

    // Send push notification to both users
    await this.notificationService.sendMatchNotification(user1Id, user2Id);

    return savedMatch;
  }
}
