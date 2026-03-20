import { io, Socket } from 'socket.io-client';
import { storage } from '../utils/storage';

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';

type MessageHandler = (data: {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  sentAt: string;
}) => void;

type TypingHandler = (data: {
  matchId: string;
  userId: string;
  isTyping: boolean;
}) => void;

type OnlineStatusHandler = (data: {
  userId: string;
  isOnline: boolean;
}) => void;

type MatchHandler = (data: {
  matchId: string;
  userId: string;
  displayName: string;
  profilePhoto: string;
}) => void;

type ProximityHandler = (data: {
  userId: string;
  displayName: string;
  distance: number;
  compatibilityScore: number;
}) => void;

type ReadReceiptHandler = (data: {
  matchId: string;
  messageId: string;
  readAt: string;
}) => void;

interface SocketEventHandlers {
  onNewMessage?: MessageHandler;
  onTyping?: TypingHandler;
  onOnlineStatus?: OnlineStatusHandler;
  onNewMatch?: MatchHandler;
  onProximityAlert?: ProximityHandler;
  onReadReceipt?: ReadReceiptHandler;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private handlers: SocketEventHandlers = {};

  async connect(): Promise<void> {
    const token = await storage.getAccessToken();
    if (!token) {
      console.warn('SocketService: No access token, cannot connect.');
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.handlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      this.handlers.onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';
      if (IS_DEV) {
        console.log('[DEV] Socket connection unavailable (backend not running) — chat will use mock data');
        // In dev mode, stop reconnection attempts to avoid console spam
        if (this.socket) {
          this.socket.io.opts.reconnection = false;
          this.socket.disconnect();
        }
      } else {
        console.error('Socket connection error:', error.message);
      }
    });

    this.socket.on('new_message', (data) => {
      this.handlers.onNewMessage?.(data);
    });

    this.socket.on('typing', (data) => {
      this.handlers.onTyping?.(data);
    });

    this.socket.on('online_status', (data) => {
      this.handlers.onOnlineStatus?.(data);
    });

    this.socket.on('new_match', (data) => {
      this.handlers.onNewMatch?.(data);
    });

    this.socket.on('proximity_alert', (data) => {
      this.handlers.onProximityAlert?.(data);
    });

    this.socket.on('read_receipt', (data) => {
      this.handlers.onReadReceipt?.(data);
    });
  }

  setHandlers(handlers: SocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  joinChat(matchId: string): void {
    this.socket?.emit('join_chat', { matchId });
  }

  leaveChat(matchId: string): void {
    this.socket?.emit('leave_chat', { matchId });
  }

  sendMessage(matchId: string, text: string): void {
    this.socket?.emit('send_message', { matchId, text });
  }

  sendTyping(matchId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { matchId, isTyping });
  }

  updateLocation(latitude: number, longitude: number): void {
    this.socket?.emit('location_update', { latitude, longitude });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers = {};
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
