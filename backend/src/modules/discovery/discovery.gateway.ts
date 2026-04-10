import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { LocationService } from '../location/location.service';
import { RedisGeoService } from '../location/redis-geo.service';
import { DiscoveryService } from './discovery.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface SubscribedUser {
  socketId: string;
  mode: 'social' | 'professional';
  lastLat?: number;
  lastLng?: number;
  lastNearbyCount: number;
}

@WebSocketGateway({
  namespace: '/discovery',
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class DiscoveryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DiscoveryGateway.name);
  private readonly subscribers = new Map<string, SubscribedUser>();
  private readonly RADIUS_KM = 10;
  private readonly MIN_MOVE_KM = 0.05; // 50 meters — skip update if user hasn't moved this far

  constructor(
    private readonly jwtService: JwtService,
    private readonly locationService: LocationService,
    private readonly redisGeoService: RedisGeoService,
    private readonly discoveryService: DiscoveryService,
  ) {}

  // ─── Connection Lifecycle ──────────────────────────────────

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.join(`user:${payload.sub}`);

      this.logger.log(`Discovery: user ${payload.sub} connected`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    if (client.userId) {
      this.subscribers.delete(client.userId);
      // Notify nearby users that this user went offline and refresh their feeds
      // so the disconnected user disappears from discovery when onlineOnly is on
      this.broadcastOnlineStatus(client.userId, false);
      await this.refreshNearbyFeeds(client.userId);
      this.logger.log(`Discovery: user ${client.userId} disconnected`);
    }
  }

  // ─── Client Events ─────────────────────────────────────────

  @SubscribeMessage('subscribe_feed')
  async handleSubscribeFeed(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { mode?: 'social' | 'professional' },
  ): Promise<void> {
    if (!client.userId) return;

    const mode = data?.mode || 'social';

    this.subscribers.set(client.userId, {
      socketId: client.id,
      mode,
      lastNearbyCount: 0,
    });

    // Ensure user's location is in Redis (sync from DB if not present)
    // This is critical for users who reconnect after Redis restart or first-time connect
    await this.locationService.syncLocationToRedis(client.userId);

    // Send initial nearby count immediately
    const count = await this.getQuickNearbyCount(client.userId);
    client.emit('nearby_count', { count });

    // Send initial feed
    try {
      const feed = await this.discoveryService.getDiscoveryFeed(
        client.userId,
        1,
        this.RADIUS_KM,
      );
      client.emit('nearby_users_updated', {
        candidates: feed.candidates,
        total: feed.total,
      });
      this.subscribers.get(client.userId)!.lastNearbyCount = feed.total;
    } catch (err) {
      this.logger.error(`Failed to send initial feed: ${err.message}`);
    }

    this.logger.debug(
      `User ${client.userId} subscribed to ${mode} feed`,
    );
  }

  @SubscribeMessage('unsubscribe_feed')
  handleUnsubscribeFeed(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    if (client.userId) {
      this.subscribers.delete(client.userId);
    }
  }

  @SubscribeMessage('location_update')
  async handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { latitude: number; longitude: number },
  ): Promise<void> {
    if (!client.userId) return;
    if (!data?.latitude || !data?.longitude) return;

    const sub = this.subscribers.get(client.userId);

    // Debounce: skip if user hasn't moved at least 50m
    if (sub?.lastLat != null && sub?.lastLng != null) {
      const moved = this.haversineKm(
        sub.lastLat,
        sub.lastLng,
        data.latitude,
        data.longitude,
      );
      if (moved < this.MIN_MOVE_KM) return;
    }

    // Persist location
    try {
      await this.locationService.updateLocation(client.userId, {
        latitude: data.latitude,
        longitude: data.longitude,
      });
    } catch (err) {
      this.logger.error(`Location update failed: ${err.message}`);
      return;
    }

    // Update cached position
    if (sub) {
      sub.lastLat = data.latitude;
      sub.lastLng = data.longitude;
    }

    // Notify subscribed users nearby that feed may have changed
    await this.notifyNearbySubscribers(client.userId);
  }

  @SubscribeMessage('refresh_feed')
  async handleRefreshFeed(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    if (!client.userId) return;

    const sub = this.subscribers.get(client.userId);
    if (!sub) return;

    try {
      const feed = await this.discoveryService.getDiscoveryFeed(
        client.userId,
        1,
        this.RADIUS_KM,
      );
      client.emit('nearby_users_updated', {
        candidates: feed.candidates,
        total: feed.total,
      });
      sub.lastNearbyCount = feed.total;
      client.emit('nearby_count', { count: feed.total });
    } catch (err) {
      this.logger.error(`Feed refresh failed: ${err.message}`);
    }
  }

  // ─── Internal Broadcasting ─────────────────────────────────

  /**
   * When a user's location changes, push real-time feed updates to nearby subscribers.
   * Sends the full updated candidate list so clients update instantly without extra API calls.
   */
  private async notifyNearbySubscribers(movedUserId: string): Promise<void> {
    // Get the moved user's position
    const pos = await this.redisGeoService.getUserPosition(movedUserId);
    if (!pos) return;

    // For each subscribed user, check if movedUser is within their radius
    const notifyPromises: Promise<void>[] = [];

    for (const [subUserId, sub] of this.subscribers.entries()) {
      if (subUserId === movedUserId) continue;

      notifyPromises.push(
        (async () => {
          // Quick distance check using Redis
          const dist = await this.redisGeoService.getDistanceBetween(
            subUserId,
            movedUserId,
          );

          if (dist !== null && dist <= this.RADIUS_KM) {
            // Push the full updated feed so the client refreshes immediately
            try {
              const feed = await this.discoveryService.getDiscoveryFeed(
                subUserId,
                1,
                this.RADIUS_KM,
              );
              sub.lastNearbyCount = feed.total;
              this.server.to(`user:${subUserId}`).emit('nearby_users_updated', {
                candidates: feed.candidates,
                total: feed.total,
              });
              this.server
                .to(`user:${subUserId}`)
                .emit('nearby_count', { count: feed.total });
            } catch (err) {
              this.logger.error(
                `Failed to push feed update to ${subUserId}: ${err.message}`,
              );
              // Fallback: lightweight hint
              this.server
                .to(`user:${subUserId}`)
                .emit('feed_changed', { reason: 'user_moved' });
            }
          }
        })(),
      );
    }

    await Promise.all(notifyPromises);

    // Also refresh the moved user's own count and feed
    const movedSub = this.subscribers.get(movedUserId);
    if (movedSub) {
      try {
        const feed = await this.discoveryService.getDiscoveryFeed(
          movedUserId,
          1,
          this.RADIUS_KM,
        );
        movedSub.lastNearbyCount = feed.total;
        this.server.to(`user:${movedUserId}`).emit('nearby_users_updated', {
          candidates: feed.candidates,
          total: feed.total,
        });
        this.server
          .to(`user:${movedUserId}`)
          .emit('nearby_count', { count: feed.total });
      } catch {
        // Non-critical
      }
    }
  }

  private async broadcastOnlineStatus(
    userId: string,
    isOnline: boolean,
  ): Promise<void> {
    // Notify all subscribers who are near this user
    for (const [subUserId] of this.subscribers.entries()) {
      if (subUserId === userId) continue;
      const dist = await this.redisGeoService.getDistanceBetween(
        subUserId,
        userId,
      );
      if (dist !== null && dist <= this.RADIUS_KM) {
        this.server
          .to(`user:${subUserId}`)
          .emit('user_online_status', { userId, isOnline });
      }
    }
  }

  /**
   * Refresh discovery feeds for all subscribers near a given user.
   * Used when a user goes offline/online to update their appearance in others' feeds.
   */
  private async refreshNearbyFeeds(userId: string): Promise<void> {
    for (const [subUserId, sub] of this.subscribers.entries()) {
      if (subUserId === userId) continue;
      const dist = await this.redisGeoService.getDistanceBetween(
        subUserId,
        userId,
      );
      if (dist !== null && dist <= this.RADIUS_KM) {
        try {
          const feed = await this.discoveryService.getDiscoveryFeed(
            subUserId,
            1,
            this.RADIUS_KM,
          );
          sub.lastNearbyCount = feed.total;
          this.server.to(`user:${subUserId}`).emit('nearby_users_updated', {
            candidates: feed.candidates,
            total: feed.total,
          });
          this.server
            .to(`user:${subUserId}`)
            .emit('nearby_count', { count: feed.total });
        } catch {
          // Non-critical
        }
      }
    }
  }

  // ─── Helpers ───────────────────────────────────────────────

  private async getQuickNearbyCount(userId: string): Promise<number> {
    const nearby = await this.redisGeoService.getNearbyUsersByMember(
      userId,
      this.RADIUS_KM,
      200,
    );
    return nearby.length;
  }

  private haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
