import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { MessageType } from './entities/message.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Client connected without token, disconnecting');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      this.connectedUsers.set(payload.sub, client.id);

      // Join personal room for targeted events
      client.join(`user:${payload.sub}`);

      this.logger.log(
        `User ${payload.sub} connected via WebSocket (${client.id})`,
      );
    } catch (error) {
      this.logger.warn(`WebSocket auth failed: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected from WebSocket`);
    }
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ): Promise<void> {
    if (!client.userId) {
      throw new WsException('Not authenticated');
    }

    try {
      // Verify user is a participant
      await this.chatService.getChatById(data.chatId, client.userId);
      client.join(`chat:${data.chatId}`);
      this.logger.debug(`User ${client.userId} joined chat room ${data.chatId}`);
    } catch (error) {
      throw new WsException('Cannot join this chat');
    }
  }

  @SubscribeMessage('leave_chat')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ): Promise<void> {
    client.leave(`chat:${data.chatId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      chatId: string;
      content: string;
      type?: MessageType;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    if (!client.userId) {
      throw new WsException('Not authenticated');
    }

    if (!data.content || !data.chatId) {
      throw new WsException('chatId and content are required');
    }

    try {
      const message = await this.chatService.sendMessage({
        chatId: data.chatId,
        senderId: client.userId,
        content: data.content,
        type: data.type,
        metadata: data.metadata,
      });

      // Broadcast to all participants in the chat room
      this.server.to(`chat:${data.chatId}`).emit('new_message', {
        message,
        chatId: data.chatId,
      });

      // Also send to the recipient's personal room (for notification badge)
      const chat = await this.chatService.getChatById(
        data.chatId,
        client.userId,
      );
      const recipientId =
        chat.participant1Id === client.userId
          ? chat.participant2Id
          : chat.participant1Id;

      this.server.to(`user:${recipientId}`).emit('message_notification', {
        chatId: data.chatId,
        senderId: client.userId,
        preview:
          data.content.length > 80
            ? data.content.substring(0, 80) + '...'
            : data.content,
        type: data.type || MessageType.TEXT,
      });
    } catch (error) {
      throw new WsException(error.message || 'Failed to send message');
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ): Promise<void> {
    if (!client.userId) return;

    // Broadcast typing status to other participants
    client.to(`chat:${data.chatId}`).emit('user_typing', {
      chatId: data.chatId,
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ): Promise<void> {
    if (!client.userId) return;

    try {
      await this.chatService.markAsRead(data.chatId, client.userId);

      // Notify the other participant that messages were read
      client.to(`chat:${data.chatId}`).emit('messages_read', {
        chatId: data.chatId,
        readBy: client.userId,
      });
    } catch (error) {
      this.logger.error(`Failed to mark as read: ${error.message}`);
    }
  }

  // ─── Server-Side Emitters (called from other services) ────

  /**
   * Emit a new match event to both users.
   */
  emitNewMatch(userId1: string, userId2: string, matchData: any): void {
    this.server.to(`user:${userId1}`).emit('new_match', matchData);
    this.server.to(`user:${userId2}`).emit('new_match', matchData);
  }

  /**
   * Check if a user is currently connected.
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
