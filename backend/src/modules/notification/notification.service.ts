import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity';

// Firebase Admin types
interface FirebaseMessage {
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  token: string;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private firebaseInitialized = false;
  private firebaseApp: any = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (projectId && clientEmail && privateKey) {
      try {
        const admin = await import('firebase-admin');
        this.firebaseApp = admin.default.initializeApp({
          credential: admin.default.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.firebaseInitialized = true;
        this.logger.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        this.logger.warn(
          `Firebase initialization failed: ${error.message}. Push notifications will be disabled.`,
        );
      }
    } else {
      this.logger.warn(
        'Firebase credentials not configured. Push notifications will be disabled.',
      );
    }
  }

  /**
   * Send a push notification to a specific user.
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.firebaseInitialized) {
      this.logger.debug(
        `Push notification skipped (Firebase not initialized): ${title}`,
      );
      return false;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'fcmToken'],
    });

    if (!user?.fcmToken) {
      this.logger.debug(
        `No FCM token for user ${userId}, skipping push notification`,
      );
      return false;
    }

    return this.sendPush({
      notification: { title, body },
      data: data || {},
      token: user.fcmToken,
    });
  }

  /**
   * Send match notification to both users.
   */
  async sendMatchNotification(
    userId1: string,
    userId2: string,
  ): Promise<void> {
    const [user1, user2] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId1 },
        select: ['id', 'firstName', 'fcmToken'],
      }),
      this.userRepository.findOne({
        where: { id: userId2 },
        select: ['id', 'firstName', 'fcmToken'],
      }),
    ]);

    const promises: Promise<boolean>[] = [];

    if (user1?.fcmToken) {
      promises.push(
        this.sendPush({
          notification: {
            title: 'New Match!',
            body: `You matched with ${user2?.firstName || 'someone'}! Say hello.`,
          },
          data: {
            type: 'match',
            matchedUserId: userId2,
          },
          token: user1.fcmToken,
        }),
      );
    }

    if (user2?.fcmToken) {
      promises.push(
        this.sendPush({
          notification: {
            title: 'New Match!',
            body: `You matched with ${user1?.firstName || 'someone'}! Say hello.`,
          },
          data: {
            type: 'match',
            matchedUserId: userId1,
          },
          token: user2.fcmToken,
        }),
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send new message notification.
   */
  async sendMessageNotification(
    recipientId: string,
    senderName: string,
    messagePreview: string,
    chatId: string,
  ): Promise<boolean> {
    return this.sendToUser(
      recipientId,
      `Message from ${senderName}`,
      messagePreview.length > 80
        ? messagePreview.substring(0, 80) + '...'
        : messagePreview,
      {
        type: 'message',
        chatId,
      },
    );
  }

  /**
   * Send a super like notification.
   */
  async sendSuperLikeNotification(
    recipientId: string,
    senderName: string,
  ): Promise<boolean> {
    return this.sendToUser(
      recipientId,
      'Someone super liked you!',
      `${senderName} sent you a Super Like. Check your discovery feed!`,
      { type: 'super_like' },
    );
  }

  /**
   * Update a user's FCM token.
   */
  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.userRepository.update(userId, { fcmToken });
    this.logger.debug(`FCM token updated for user ${userId}`);
  }

  /**
   * Remove a user's FCM token (on logout).
   */
  async removeFcmToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, { fcmToken: null });
  }

  // ─── Private ──────────────────────────────────────────────

  private async sendPush(message: FirebaseMessage): Promise<boolean> {
    if (!this.firebaseInitialized || !this.firebaseApp) {
      return false;
    }

    try {
      const admin = await import('firebase-admin');
      await admin.default.messaging().send(message);
      this.logger.debug(
        `Push sent: "${message.notification.title}" to token ${message.token.substring(0, 10)}...`,
      );
      return true;
    } catch (error) {
      // Handle invalid token
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        this.logger.warn(
          `Invalid FCM token detected, should be cleaned up: ${message.token.substring(0, 10)}...`,
        );
      } else {
        this.logger.error(`Failed to send push notification: ${error.message}`);
      }
      return false;
    }
  }
}
