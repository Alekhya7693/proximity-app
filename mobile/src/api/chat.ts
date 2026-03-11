import apiClient from './client';

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  type: 'text' | 'image' | 'system';
  sentAt: string;
  readAt: string | null;
  status: 'sending' | 'sent' | 'delivered' | 'read';
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

const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

const MOCK_CHATS: ChatPreview[] = [
  {
    matchId: 'match-1',
    recipientId: 'user-101',
    recipientName: 'Alex',
    recipientPhoto: 'https://randomuser.me/api/portraits/thumb/women/44.jpg',
    lastMessage: 'Hey! Nice to meet you 😊',
    lastMessageAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unreadCount: 2,
    isOnline: true,
    isTyping: false,
  },
  {
    matchId: 'match-2',
    recipientId: 'user-102',
    recipientName: 'Jordan',
    recipientPhoto: 'https://randomuser.me/api/portraits/thumb/men/32.jpg',
    lastMessage: 'Want to grab coffee sometime?',
    lastMessageAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
  },
  {
    matchId: 'match-4',
    recipientId: 'user-104',
    recipientName: 'Sam',
    recipientPhoto: 'https://randomuser.me/api/portraits/thumb/women/68.jpg',
    lastMessage: 'That hiking trail was amazing!',
    lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'match-1': [
    {
      id: 'msg-1',
      matchId: 'match-1',
      senderId: 'user-101',
      text: 'Hey there! I saw we matched 😊',
      type: 'text',
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-2',
      matchId: 'match-1',
      senderId: 'dev-user',
      text: 'Hi! Yes, great to connect! Love your bio.',
      type: 'text',
      sentAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-3',
      matchId: 'match-1',
      senderId: 'user-101',
      text: 'Thanks! I see you like hiking too. Have you been to any good trails recently?',
      type: 'text',
      sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-4',
      matchId: 'match-1',
      senderId: 'user-101',
      text: 'Hey! Nice to meet you 😊',
      type: 'text',
      sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      readAt: null,
      status: 'delivered',
    },
  ],
  'match-2': [
    {
      id: 'msg-5',
      matchId: 'match-2',
      senderId: 'dev-user',
      text: 'Hey Jordan! Fellow tech enthusiast here 🚀',
      type: 'text',
      sentAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-6',
      matchId: 'match-2',
      senderId: 'user-102',
      text: 'Hey! What kind of tech are you into?',
      type: 'text',
      sentAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-7',
      matchId: 'match-2',
      senderId: 'dev-user',
      text: 'Mostly mobile dev and AI stuff. You?',
      type: 'text',
      sentAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-8',
      matchId: 'match-2',
      senderId: 'user-102',
      text: 'Want to grab coffee sometime?',
      type: 'text',
      sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'read',
    },
  ],
  'match-4': [
    {
      id: 'msg-9',
      matchId: 'match-4',
      senderId: 'user-104',
      text: 'Hi! I love your photography pics!',
      type: 'text',
      sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-10',
      matchId: 'match-4',
      senderId: 'dev-user',
      text: 'Thank you! Your plant collection is impressive 🌱',
      type: 'text',
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-11',
      matchId: 'match-4',
      senderId: 'user-104',
      text: 'That hiking trail was amazing!',
      type: 'text',
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      status: 'read',
    },
  ],
};

let mockMsgCounter = 100;

export const chatApi = {
  async getChatList(): Promise<ChatPreview[]> {
    try {
      const response = await apiClient.get<{ chats: ChatPreview[] }>('/chats');
      return response.data.chats;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, using mock chat list');
        return MOCK_CHATS;
      }
      throw error;
    }
  },

  async getMessages(
    matchId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    try {
      const response = await apiClient.get(`/chats/${matchId}/messages`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, using mock messages');
        const messages = [...(MOCK_MESSAGES[matchId] || [])].reverse();
        return { messages, hasMore: false };
      }
      throw error;
    }
  },

  async sendMessage(data: SendMessageRequest): Promise<Message> {
    try {
      const response = await apiClient.post<Message>(
        `/chats/${data.matchId}/messages`,
        { text: data.text, type: data.type ?? 'text' },
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, using mock send message');
        mockMsgCounter++;
        const newMessage: Message = {
          id: `msg-mock-${mockMsgCounter}`,
          matchId: data.matchId,
          senderId: 'dev-user',
          text: data.text,
          type: data.type ?? 'text',
          sentAt: new Date().toISOString(),
          readAt: null,
          status: 'sent',
        };
        // Add to local mock messages
        if (!MOCK_MESSAGES[data.matchId]) {
          MOCK_MESSAGES[data.matchId] = [];
        }
        MOCK_MESSAGES[data.matchId].push(newMessage);
        return newMessage;
      }
      throw error;
    }
  },

  async markAsRead(matchId: string): Promise<void> {
    try {
      await apiClient.post(`/chats/${matchId}/read`);
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, mock markAsRead');
        return;
      }
      throw error;
    }
  },

  async sendImage(
    matchId: string,
    formData: FormData,
  ): Promise<Message> {
    try {
      const response = await apiClient.post<Message>(
        `/chats/${matchId}/messages/image`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, mock image message');
        mockMsgCounter++;
        return {
          id: `msg-mock-${mockMsgCounter}`,
          matchId,
          senderId: 'dev-user',
          text: 'https://picsum.photos/300/300',
          type: 'image',
          sentAt: new Date().toISOString(),
          readAt: null,
          status: 'sent',
        };
      }
      throw error;
    }
  },
};
