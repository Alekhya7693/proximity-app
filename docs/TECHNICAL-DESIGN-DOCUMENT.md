# PROXIMITY — Technical Design Document (TDD)

**Version:** 1.0
**Date:** 2026-03-07

---

## 1. SYSTEM OVERVIEW

### Architecture Pattern
Modular monolith built on NestJS, deployed as a single service for MVP. Clear module boundaries allow future service extraction.

### System Context Diagram
```
┌──────────────┐         ┌─────────────────────────────────┐
│  Mobile App  │◄───────►│       Proximity API Server       │
│ (React Native│  HTTPS  │         (NestJS)                 │
│   + Expo)    │◄──WSS──►│                                  │
└──────┬───────┘         │  ┌──────┐ ┌──────┐ ┌──────────┐ │
       │                 │  │ Auth │ │Disco-│ │  Chat    │ │
       │                 │  │      │ │very  │ │ (WS+HTTP)│ │
       │                 │  └──────┘ └──────┘ └──────────┘ │
       │                 │  ┌──────┐ ┌──────┐ ┌──────────┐ │
       │                 │  │Match │ │ Loca-│ │  Safety  │ │
       │                 │  │      │ │tion  │ │          │ │
       │                 │  └──────┘ └──────┘ └──────────┘ │
       │                 └──────┬──────────┬───────────────┘
       │                        │          │
       │                 ┌──────▼───┐ ┌────▼────┐
       │                 │PostgreSQL│ │  Redis  │
       │                 │+ PostGIS │ │         │
       │                 └──────────┘ └─────────┘
       │
       │                 ┌──────────────┐
       └────────────────►│  S3 / CDN    │ (photos)
                         └──────────────┘
```

---

## 2. DATA FLOW DIAGRAMS

### 2.1 Discovery Feed Flow
```
Mobile App                    API Server                  Database
    │                             │                          │
    │ GET /discover/feed          │                          │
    │────────────────────────────►│                          │
    │                             │ GEORADIUS (Redis)        │
    │                             │─────────────────────────►│
    │                             │◄─────────────────────────│
    │                             │ nearby_user_ids          │
    │                             │                          │
    │                             │ SELECT profiles, interests│
    │                             │─────────────────────────►│
    │                             │◄─────────────────────────│
    │                             │                          │
    │                             │ apply hard_filters()     │
    │                             │ compute soft_scores()    │
    │                             │ sort + paginate          │
    │                             │                          │
    │◄────────────────────────────│                          │
    │ { profiles: [...] }         │                          │
```

### 2.2 Match + Chat Flow
```
User A App          API Server          User B App
    │                    │                    │
    │ POST /swipes       │                    │
    │ {target: B, right} │                    │
    │───────────────────►│                    │
    │                    │ check mutual like  │
    │                    │ swipe(B→A) exists? │
    │                    │ YES → create match │
    │                    │                    │
    │◄───────────────────│───────────────────►│
    │ match notification │ match notification │
    │                    │                    │
    │ POST /matches/:id  │                    │
    │ {action: say_hi}   │                    │
    │───────────────────►│                    │
    │                    │ create chat        │
    │                    │ notify B via WS    │
    │                    │───────────────────►│
    │                    │                    │
    │ WS: chat:message   │                    │
    │ {content: "Hey!"}  │                    │
    │───────────────────►│                    │
    │                    │ store message      │
    │                    │ broadcast to room  │
    │                    │───────────────────►│
    │                    │ WS: chat:message   │
```

### 2.3 Location Update Flow
```
Mobile App              API Server              Redis           PostgreSQL
    │                       │                      │                 │
    │ POST /location/update │                      │                 │
    │ {lat, lng, accuracy}  │                      │                 │
    │──────────────────────►│                      │                 │
    │                       │ validate (spoof check)│                │
    │                       │                      │                 │
    │                       │ GEOADD user          │                 │
    │                       │─────────────────────►│                 │
    │                       │                      │                 │
    │                       │ compute geohash      │                 │
    │                       │ update location_session               │
    │                       │─────────────────────────────────────►│
    │                       │                      │                 │
    │                       │ check active chats   │                 │
    │                       │ update chat status   │                 │
    │                       │─────────────────────────────────────►│
    │                       │                      │                 │
    │◄──────────────────────│                      │                 │
    │ {zoneHash, chatStatuses}                     │                 │
```

---

## 3. MODULE SPECIFICATIONS

### 3.1 Auth Module
```typescript
// Key interfaces
interface RegisterDto {
  email: string;          // valid email format
  password: string;       // min 8 chars, 1 upper, 1 number
  dateOfBirth: string;    // ISO date, must be 18+
  gender: Gender;
  tosAccepted: boolean;   // must be true
}

interface LoginDto {
  email: string;
  password: string;
}

interface TokenPayload {
  sub: string;            // user_id
  email: string;
  status: UserStatus;
  mode: Mode;
  iat: number;
  exp: number;
}

// Services
AuthService
  ├── register(dto: RegisterDto): Promise<AuthResponse>
  ├── login(dto: LoginDto): Promise<AuthResponse>
  ├── verifyEmail(userId: string, code: string): Promise<void>
  ├── refreshToken(token: string): Promise<AuthResponse>
  ├── forgotPassword(email: string): Promise<void>
  ├── resetPassword(token: string, newPassword: string): Promise<void>
  ├── logout(userId: string, refreshToken: string): Promise<void>
  └── deleteAccount(userId: string, password: string): Promise<void>
```

### 3.2 Location Module
```typescript
interface LocationUpdateDto {
  latitude: number;       // -90 to 90
  longitude: number;      // -180 to 180
  accuracy: number;       // meters
  timestamp: string;      // ISO datetime
}

interface ZoneInfo {
  zoneHash: string;       // geohash precision 7
  zoneStatus: ZoneStatus; // entering | active | exiting | left
  proximityConfidence: number; // 0.0-1.0
}

// Services
LocationService
  ├── updateLocation(userId: string, dto: LocationUpdateDto): Promise<ZoneInfo>
  ├── getNearbyUsers(userId: string, radiusM: number): Promise<string[]>
  ├── getProximityConfidence(userAId: string, userBId: string): Promise<number>
  ├── checkSpoofing(userId: string, dto: LocationUpdateDto): Promise<boolean>
  └── cleanupStaleLocations(): Promise<number>  // returns count cleaned

// Redis operations
RedisGeoService
  ├── addUserLocation(userId: string, lat: number, lng: number): Promise<void>
  ├── findNearby(lat: number, lng: number, radiusM: number): Promise<GeoResult[]>
  ├── getDistance(userAId: string, userBId: string): Promise<number | null>
  └── removeUser(userId: string): Promise<void>
```

### 3.3 Discovery Module
```typescript
interface FeedProfile {
  id: string;
  displayName: string;
  age: number;
  bio: string;
  photos: Photo[];
  avatarUrl: string;
  compatibilityPct: number;
  sharedInterests: string[];
  vibe: VibeInfo | null;
  distanceLabel: string;
  mode: Mode;
  tier: number;
}

interface FeedResponse {
  profiles: FeedProfile[];
  pagination: PaginationInfo;
  meta: FeedMeta;
}

// Services
DiscoveryService
  ├── getFeed(userId: string, mode: Mode, page: number): Promise<FeedResponse>
  ├── getProfileDetail(viewerId: string, targetId: string): Promise<ProfileDetail>
  ├── computeCompatibility(userA: UserProfile, userB: UserProfile): number
  └── resolvePseudonym(userId: string, zoneHash: string): string
```

### 3.4 Chat Module
```typescript
// WebSocket Gateway Events
@WebSocketGateway({ namespace: '/chat' })
class ChatGateway {
  @SubscribeMessage('chat:join')
  handleJoin(client: Socket, data: { chatId: string }): void

  @SubscribeMessage('chat:message')
  handleMessage(client: Socket, data: { chatId: string, content: string }): void

  @SubscribeMessage('chat:typing')
  handleTyping(client: Socket, data: { chatId: string, isTyping: boolean }): void

  @SubscribeMessage('chat:read')
  handleRead(client: Socket, data: { chatId: string, messageId: string }): void
}

// Services
ChatService
  ├── createChat(matchId: string): Promise<Chat>
  ├── sendMessage(chatId: string, senderId: string, content: string): Promise<Message>
  ├── getMessages(chatId: string, before?: string, limit?: number): Promise<Message[]>
  ├── updateChatStatus(chatId: string, status: ChatStatus): Promise<void>
  ├── checkAndUpdateChatEligibility(chatId: string): Promise<ChatStatus>
  └── deleteExpiredChats(): Promise<number>
```

---

## 4. INFRASTRUCTURE DESIGN

### 4.1 MVP Deployment
```yaml
# docker-compose.yml (development)
services:
  api:
    build: ./backend
    ports: ["3000:3000"]
    depends_on: [postgres, redis]
    environment:
      - DATABASE_URL=postgres://proximity:pass@postgres:5432/proximity
      - REDIS_URL=redis://redis:6379

  postgres:
    image: postgis/postgis:16-3.4
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  admin:
    build: ./admin
    ports: ["3001:3001"]

volumes:
  pgdata:
```

### 4.2 Production Deployment (AWS)
```
Internet → CloudFront (CDN)
           ├── Static assets (photos, avatars)
           └── ALB (Application Load Balancer)
               ├── API instances (ECS Fargate, 2+ tasks)
               │   ├── HTTP API
               │   └── WebSocket (sticky sessions)
               ├── RDS PostgreSQL (Multi-AZ, PostGIS)
               ├── ElastiCache Redis (cluster mode)
               └── S3 (media storage)
```

---

## 5. ERROR HANDLING STRATEGY

### HTTP Error Response Format
```typescript
{
  statusCode: number;
  error: string;       // HTTP status text
  message: string;     // Human-readable message
  details?: Array<{    // Validation errors
    field: string;
    message: string;
  }>;
  requestId: string;   // For debugging
}
```

### Error Categories
| Category | HTTP Status | Logging Level | Alert |
|----------|------------|---------------|-------|
| Validation | 400 | Debug | No |
| Auth failure | 401/403 | Info | No (unless spike) |
| Not found | 404 | Debug | No |
| Rate limited | 429 | Warn | Yes (if sustained) |
| Server error | 500 | Error | Yes (immediate) |
| DB error | 503 | Error | Yes (immediate) |

---

## 6. TESTING STRATEGY

### Test Pyramid
```
         ┌─────────┐
         │   E2E   │  5%  - Detox (mobile), Cypress (admin)
        ┌┴─────────┴┐
        │Integration │ 25% - Supertest + test DB
       ┌┴────────────┴┐
       │    Unit       │ 70% - Jest
       └───────────────┘
```

### Key Test Scenarios
1. **Auth:** Registration, login, token refresh, password reset
2. **Location:** Nearby query, spoof detection, zone transitions
3. **Discovery:** Feed generation, hard filters, scoring accuracy
4. **Matching:** Mutual like detection, match state transitions
5. **Chat:** Message flow, lock/expire, WebSocket events
6. **Safety:** Report creation, block enforcement, trust score

### Performance Benchmarks
| Operation | Target | Measurement |
|-----------|--------|-------------|
| Feed generation (50 candidates) | < 200ms | API response time |
| Location update | < 50ms | API response time |
| Message send (WebSocket) | < 100ms | Round-trip time |
| Swipe processing | < 100ms | API response time |
| Match notification | < 500ms | Time to push delivery |

---

## 7. FEATURE FLAGS

```typescript
// Feature flag configuration
const featureFlags = {
  // Phase 1 - enabled
  DUAL_MODE: true,
  VIBE_CHECK: true,
  PUSH_NOTIFICATIONS: true,

  // Phase 2 - disabled in MVP
  UWB_PROXIMITY: false,
  BLUETOOTH_PROXIMITY: false,
  HOT_ZONE_MAP: false,
  MICRO_SURVEYS: false,
  APPLE_SIGN_IN: false,
  GOOGLE_SIGN_IN: false,
  AI_CONTENT_MODERATION: false,
  PHOTO_MODERATION: false,
  ZONE_PSEUDONYM_ROTATION: false,
  AVATAR_STYLES: false,

  // Phase 3+
  E2E_ENCRYPTION: false,
  EVENTS: false,
  PREMIUM: false,
  REFERRALS: false,
};
```
