import apiClient from './client';
import { useAuthStore } from '../store/authStore';

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  type: 'text' | 'image' | 'system';
  sentAt: string;
  readAt: string | null;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ChatPreview {
  matchId: string;
  recipientId: string;
  recipientName: string;
  recipientPhoto: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline: boolean;
  isTyping: boolean;
}

export interface SendMessageRequest {
  matchId: string;
  text: string;
  type?: 'text' | 'image';
}

export const chatApi = {
  async getChatList(): Promise<ChatPreview[]> {
    try {
      const response = await apiClient.get('/chat');
      const chats = Array.isArray(response.data) ? response.data : response.data.chats || [];
      const currentUserId = useAuthStore.getState().user?.id;

      return chats.map((chat: any) => {
        const isP1 = chat.participant1Id === currentUserId;
        const other = isP1 ? chat.participant2 : chat.participant1;
        return {
          matchId: chat.matchId || chat.id,
          recipientId: other?.id || '',
          recipientName: other?.firstName
            ? `${other.firstName} ${other.lastName || ''}`.trim()
            : other?.username || 'User',
          recipientPhoto: '',
          lastMessage: chat.lastMessageText || '',
          lastMessageAt: chat.lastMessageAt || chat.createdAt || new Date().toISOString(),
          unreadCount: isP1 ? (chat.unreadCount1 || 0) : (chat.unreadCount2 || 0),
          isOnline: false,
          isTyping: false,
        };
      });
    } catch {
      return [];
    }
  },

  async getMessages(
    matchId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    try {
      const response = await apiClient.get(`/chat/match/${matchId}/messages`, {
        params: { page, limit },
      });

      const data = response.data;
      const rawMessages = data.messages || [];

      const messages: Message[] = rawMessages.map((m: any) => ({
        id: m.id,
        matchId: matchId,
        senderId: m.senderId,
        text: m.content,
        type: m.type || 'text',
        sentAt: m.createdAt,
        readAt: m.status === 'read' ? m.updatedAt : null,
        status: m.status || 'sent',
      }));

      const hasMore = data.total ? rawMessages.length < data.total : false;

      return { messages, hasMore };
    } catch {
      return { messages: [], hasMore: false };
    }
  },

  async sendMessage(data: SendMessageRequest): Promise<Message> {
    const response = await apiClient.post(`/chat/match/${data.matchId}/messages`, {
      content: data.text,
    });

    const m = response.data;
    return {
      id: m.id,
      matchId: data.matchId,
      senderId: m.senderId,
      text: m.content,
      type: m.type || 'text',
      sentAt: m.createdAt,
      readAt: m.status === 'read' ? m.updatedAt : null,
      status: m.status || 'sent',
    };
  },

  async markAsRead(matchId: string): Promise<void> {
    try {
      await apiClient.patch(`/chat/match/${matchId}/read`);
    } catch {
      // Silent - marking read is best-effort
    }
  },

  async sendImage(matchId: string, formData: FormData): Promise<Message> {
    const response = await apiClient.post(`/chat/match/${matchId}/messages/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const m = response.data;
    return {
      id: m.id,
      matchId,
      senderId: m.senderId,
      text: m.content || '[Image]',
      type: 'image',
      sentAt: m.createdAt,
      readAt: m.status === 'read' ? m.updatedAt : null,
      status: m.status || 'sent',
    };
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ unreadCount: number }>('/chat/unread');
      return response.data.unreadCount;
    } catch {
      return 0;
    }
  },

  async archiveChat(chatId: string): Promise<void> {
    try {
      await apiClient.patch(`/chat/${chatId}/archive`);
    } catch {
      // Silent - archiving is best-effort
    }
  },

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await apiClient.delete(`/chat/messages/${messageId}`);
    } catch {
      // Silent - deletion is best-effort
    }
  },
};
