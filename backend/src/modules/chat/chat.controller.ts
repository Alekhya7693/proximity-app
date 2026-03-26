import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
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
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('chat')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get all chats for current user' })
  @ApiResponse({ status: 200, description: 'Chat list' })
  async getChats(@CurrentUser('id') userId: string) {
    return this.chatService.getUserChats(userId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get total unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.chatService.getTotalUnreadCount(userId);
    return { unreadCount: count };
  }

  @Post()
  @ApiOperation({ summary: 'Create or get chat for a match' })
  @ApiResponse({ status: 201, description: 'Chat created or retrieved' })
  async createChat(
    @CurrentUser('id') userId: string,
    @Body() body: { matchId: string; recipientId: string },
  ) {
    return this.chatService.getOrCreateChat(userId, body.recipientId, body.matchId);
  }

  @Get('match/:matchId')
  @ApiOperation({ summary: 'Get chat by match ID' })
  @ApiResponse({ status: 200, description: 'Chat details' })
  @ApiResponse({ status: 404, description: 'Chat not found for this match' })
  async getChatByMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getChatByMatchId(matchId, userId);
  }

  @Get('match/:matchId/messages')
  @ApiOperation({ summary: 'Get messages by match ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Messages list' })
  async getMessagesByMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const chat = await this.chatService.getChatByMatchId(matchId, userId);
    return this.chatService.getMessages(chat.id, userId, page, limit);
  }

  @Post('match/:matchId/messages')
  @ApiOperation({ summary: 'Send message by match ID' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessageByMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { content: string; type?: string },
  ) {
    const chat = await this.chatService.getChatByMatchId(matchId, userId);
    return this.chatService.sendMessage({
      chatId: chat.id,
      senderId: userId,
      content: body.content,
    });
  }

  @Patch('match/:matchId/read')
  @ApiOperation({ summary: 'Mark messages as read by match ID' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsReadByMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser('id') userId: string,
  ) {
    const chat = await this.chatService.getChatByMatchId(matchId, userId);
    await this.chatService.markAsRead(chat.id, userId);
    return { message: 'Messages marked as read' };
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Get chat details' })
  @ApiResponse({ status: 200, description: 'Chat details' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async getChat(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getChatById(chatId, userId);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Get messages in a chat' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Messages list' })
  async getMessages(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.chatService.getMessages(chatId, userId, page, limit);
  }

  @Post(':chatId/messages')
  @ApiOperation({ summary: 'Send a message (REST fallback)' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { content: string; type?: string },
  ) {
    return this.chatService.sendMessage({
      chatId,
      senderId: userId,
      content: body.content,
    });
  }

  @Patch(':chatId/read')
  @ApiOperation({ summary: 'Mark chat messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsRead(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.chatService.markAsRead(chatId, userId);
    return { message: 'Messages marked as read' };
  }

  @Patch(':chatId/archive')
  @ApiOperation({ summary: 'Archive a chat' })
  @ApiResponse({ status: 200, description: 'Chat archived' })
  async archiveChat(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.chatService.archiveChat(chatId, userId);
    return { message: 'Chat archived' };
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  async deleteMessage(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.chatService.deleteMessage(messageId, userId);
    return { message: 'Message deleted' };
  }
}
