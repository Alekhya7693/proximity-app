import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatEntity, ChatStatus } from './entities/chat.entity';
import {
  MessageEntity,
  MessageType,
  MessageStatus,
} from './entities/message.entity';

interface SendMessagePayload {
  chatId: string;
  senderId: string;
  content: string;
  type?: MessageType;
  metadata?: Record<string, any>;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatRepository: Repository<ChatEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  /**
   * Get or create a chat between two users.
   */
  async getOrCreateChat(
    userId1: string,
    userId2: string,
    matchId?: string,
  ): Promise<ChatEntity> {
    // Ensure consistent ordering
    const [p1, p2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    let chat = await this.chatRepository.findOne({
      where: { participant1Id: p1, participant2Id: p2 },
    });

    if (!chat) {
      chat = this.chatRepository.create({
        participant1Id: p1,
        participant2Id: p2,
        matchId: matchId || null,
      });
      chat = await this.chatRepository.save(chat);
      this.logger.log(`Chat created between ${p1} and ${p2}`);
    }

    return chat;
  }

  /**
   * Get all chats for a user.
   */
  async getUserChats(userId: string): Promise<ChatEntity[]> {
    return this.chatRepository.find({
      where: [
        { participant1Id: userId, status: ChatStatus.ACTIVE },
        { participant2Id: userId, status: ChatStatus.ACTIVE },
      ],
      relations: ['participant1', 'participant2'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  /**
   * Get chat by ID with auth check.
   */
  async getChatById(chatId: string, userId: string): Promise<ChatEntity> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['participant1', 'participant2'],
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
      throw new ForbiddenException('You are not a participant in this chat');
    }

    return chat;
  }

  /**
   * Send a message in a chat.
   */
  async sendMessage(payload: SendMessagePayload): Promise<MessageEntity> {
    const chat = await this.getChatById(payload.chatId, payload.senderId);

    const message = this.messageRepository.create({
      chatId: payload.chatId,
      senderId: payload.senderId,
      content: payload.content,
      type: payload.type || MessageType.TEXT,
      metadata: payload.metadata || null,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update chat's last message info and unread counts
    const updateData: Partial<ChatEntity> = {
      lastMessageText:
        payload.content.length > 100
          ? payload.content.substring(0, 100) + '...'
          : payload.content,
      lastMessageAt: new Date(),
    };

    // Increment unread count for the other participant
    if (payload.senderId === chat.participant1Id) {
      updateData.unreadCount2 = (chat.unreadCount2 || 0) + 1;
    } else {
      updateData.unreadCount1 = (chat.unreadCount1 || 0) + 1;
    }

    await this.chatRepository.update(chat.id, updateData);

    return savedMessage;
  }

  /**
   * Get messages for a chat with pagination.
   */
  async getMessages(
    chatId: string,
    userId: string,
    page = 1,
    limit = 50,
  ): Promise<{ messages: MessageEntity[]; total: number }> {
    // Verify access
    await this.getChatById(chatId, userId);

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { chatId, isDeleted: false },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { messages: messages.reverse(), total };
  }

  /**
   * Mark messages as read.
   */
  async markAsRead(chatId: string, userId: string): Promise<void> {
    const chat = await this.getChatById(chatId, userId);

    // Update message statuses
    await this.messageRepository
      .createQueryBuilder()
      .update(MessageEntity)
      .set({ status: MessageStatus.READ })
      .where('chatId = :chatId', { chatId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('status != :status', { status: MessageStatus.READ })
      .execute();

    // Reset unread count
    if (userId === chat.participant1Id) {
      await this.chatRepository.update(chatId, { unreadCount1: 0 });
    } else {
      await this.chatRepository.update(chatId, { unreadCount2: 0 });
    }
  }

  /**
   * Soft-delete a message.
   */
  async deleteMessage(
    messageId: string,
    userId: string,
  ): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageRepository.update(messageId, { isDeleted: true });
  }

  /**
   * Archive a chat.
   */
  async archiveChat(chatId: string, userId: string): Promise<void> {
    await this.getChatById(chatId, userId);
    await this.chatRepository.update(chatId, {
      status: ChatStatus.ARCHIVED,
    });
  }

  /**
   * Get total unread message count for a user across all chats.
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    const result = await this.chatRepository
      .createQueryBuilder('chat')
      .select(
        `SUM(CASE WHEN chat.participant1Id = :userId THEN chat.unreadCount1 ELSE chat.unreadCount2 END)`,
        'total',
      )
      .where('(chat.participant1Id = :userId OR chat.participant2Id = :userId)')
      .andWhere('chat.status = :status', { status: ChatStatus.ACTIVE })
      .setParameter('userId', userId)
      .getRawOne();

    return parseInt(result?.total || '0', 10);
  }
}
