import { io, Socket } from 'socket.io-client';
import { storage } from '../utils/storage';
import { env } from '../config/env';

const SOCKET_URL = env.SOCKET_URL;

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

type NearbyCountHandler = (data: { count: number }) => void;

type NearbyUsersHandler = (data: {
  candidates: any[];
  total: number;
}) => void;

type FeedChangedHandler = (data: { reason: string }) => void;

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

interface DiscoveryEventHandlers {
  onNearbyCount?: NearbyCountHandler;
  onNearbyUsersUpdated?: NearbyUsersHandler;
  onFeedChanged?: FeedChangedHandler;
  onUserOnlineStatus?: OnlineStatusHandler;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private discoverySocket: Socket | null = null;
  private handlers: SocketEventHandlers = {};
  private discoveryHandlers: DiscoveryEventHandlers = {};

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

  // ─── Discovery Socket (separate namespace) ─────────────────

  async connectDiscovery(): Promise<void> {
    const token = await storage.getAccessToken();
    if (!token) return;

    if (this.discoverySocket?.connected) return;

    this.discoverySocket = io(`${SOCKET_URL}/discovery`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupDiscoveryListeners();
  }

  private setupDiscoveryListeners(): void {
    if (!this.discoverySocket) return;

    this.discoverySocket.on('connect', () => {
      console.log('Discovery socket connected:', this.discoverySocket?.id);
      this.discoveryHandlers.onConnect?.();
    });

    this.discoverySocket.on('disconnect', (reason: string) => {
      console.log('Discovery socket disconnected:', reason);
      this.discoveryHandlers.onDisconnect?.(reason);
    });

    this.discoverySocket.on('connect_error', (error: Error) => {
      console.warn('Discovery socket error:', error.message);
    });

    this.discoverySocket.on('nearby_count', (data) => {
      this.discoveryHandlers.onNearbyCount?.(data);
    });

    this.discoverySocket.on('nearby_users_updated', (data) => {
      this.discoveryHandlers.onNearbyUsersUpdated?.(data);
    });

    this.discoverySocket.on('feed_changed', (data) => {
      this.discoveryHandlers.onFeedChanged?.(data);
    });

    this.discoverySocket.on('user_online_status', (data) => {
      this.discoveryHandlers.onUserOnlineStatus?.(data);
    });
  }

  setDiscoveryHandlers(handlers: DiscoveryEventHandlers): void {
    this.discoveryHandlers = { ...this.discoveryHandlers, ...handlers };
  }

  subscribeFeed(mode: 'social' | 'professional'): void {
    this.discoverySocket?.emit('subscribe_feed', { mode });
  }

  unsubscribeFeed(): void {
    this.discoverySocket?.emit('unsubscribe_feed');
  }

  refreshFeed(): void {
    this.discoverySocket?.emit('refresh_feed');
  }

  updateLocationViaDiscovery(latitude: number, longitude: number): void {
    this.discoverySocket?.emit('location_update', { latitude, longitude });
  }

  disconnectDiscovery(): void {
    if (this.discoverySocket) {
      this.discoverySocket.removeAllListeners();
      this.discoverySocket.disconnect();
      this.discoverySocket = null;
    }
    this.discoveryHandlers = {};
  }

  get isDiscoveryConnected(): boolean {
    return this.discoverySocket?.connected ?? false;
  }

  // ─── Chat Socket (existing) ────────────────────────────────

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      if (__DEV__) console.log('Socket connected:', this.socket?.id);
      this.handlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason: string) => {
      if (__DEV__) console.log('Socket disconnected:', reason);
      this.handlers.onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.warn('Socket connection error:', error.message);
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
    // Send to both sockets — discovery handles it server-side
    this.discoverySocket?.emit('location_update', { latitude, longitude });
    this.socket?.emit('location_update', { latitude, longitude });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers = {};
    this.disconnectDiscovery();
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
