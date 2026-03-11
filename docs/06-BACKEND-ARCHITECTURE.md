# PROXIMITY — Backend Architecture Design

---

## ARCHITECTURE STYLE: Modular Monolith

**Decision:** Start with a modular monolith, NOT microservices.

**Rationale:**
- Team size (2-4 engineers) doesn't justify microservices overhead
- Modular monolith allows clean domain boundaries that can be extracted later
- Single deployment unit reduces DevOps complexity
- Shared database simplifies transactions and data consistency
- NestJS module system naturally supports modular monolith architecture
- Can extract hot paths (chat, location) into services when needed (Phase 3+)

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / Load Balancer               │
│                    (nginx / AWS ALB)                          │
└──────────────┬───────────────────────────┬──────────────────┘
               │                           │
    ┌──────────▼──────────┐    ┌──────────▼──────────┐
    │   HTTP REST API      │    │   WebSocket Server   │
    │   (NestJS)           │    │   (Socket.IO)        │
    └──────────┬──────────┘    └──────────┬──────────┘
               │                           │
    ┌──────────▼───────────────────────────▼──────────┐
    │              Application Layer                    │
    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
    │  │  Auth   │ │Discovery│ │  Chat   │ │ Admin │ │
    │  │ Module  │ │ Module  │ │ Module  │ │Module │ │
    │  └────┬────┘ └────┬────┘ └────┬────┘ └───┬───┘ │
    │  ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌───┴───┐ │
    │  │Profile │ │Location│ │ Match  │ │Survey│ │
    │  │ Module  │ │ Module  │ │ Module  │ │Module │ │
    │  └────┬────┘ └────┬────┘ └────┬────┘ └───┬───┘ │
    │  ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌───┴───┐ │
    │  │ Safety │ │  Vibe  │ │HotZone │ │Notif │ │
    │  │ Module  │ │ Module  │ │ Module  │ │Module │ │
    │  └─────────┘ └─────────┘ └─────────┘ └───────┘ │
    └──────────────────────┬──────────────────────────┘
                           │
    ┌──────────────────────▼──────────────────────────┐
    │              Infrastructure Layer                 │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
    │  │PostgreSQL│ │  Redis   │ │    S3    │        │
    │  │+ PostGIS │ │          │ │(MinIO/S3)│        │
    │  └──────────┘ └──────────┘ └──────────┘        │
    │  ┌──────────┐ ┌──────────┐                      │
    │  │Bull Queue│ │  FCM/    │                      │
    │  │(BullMQ)  │ │  APNs    │                      │
    │  └──────────┘ └──────────┘                      │
    └─────────────────────────────────────────────────┘
```

---

## TECHNOLOGY CHOICES

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Runtime** | Node.js 20 LTS | Ecosystem, async I/O for real-time |
| **Framework** | NestJS 10 | Module system, TypeScript, DI, guards, interceptors |
| **Language** | TypeScript 5.3+ | Type safety, developer productivity |
| **Database** | PostgreSQL 16 + PostGIS 3.4 | Spatial queries, mature, reliable |
| **ORM** | TypeORM | NestJS integration, migration support, PostGIS support |
| **Cache** | Redis 7 | Geospatial index, pub/sub, session cache, queue backend |
| **Queue** | BullMQ | Redis-backed, delayed jobs, cron jobs |
| **Real-time** | Socket.IO 4 | WebSocket with fallback, rooms, namespaces |
| **Auth** | Passport.js + JWT | Well-tested, multiple strategies |
| **Storage** | AWS S3 / MinIO | Photo storage, CDN-ready |
| **Push Notifications** | Firebase Cloud Messaging (FCM) + APNs | Cross-platform push |
| **Validation** | class-validator + class-transformer | DTO validation |
| **API Docs** | Swagger/OpenAPI via @nestjs/swagger | Auto-generated API docs |
| **Logging** | Winston + Pino | Structured logging |
| **Monitoring** | Prometheus + Grafana | Metrics, dashboards |
| **Error Tracking** | Sentry | Error aggregation, alerting |

---

## MODULE BREAKDOWN

### Auth Module
```
Responsibilities:
- User registration (email, Apple, Google)
- Login / logout
- JWT token issuance and refresh
- Email verification
- Password reset
- Session management
- Account deletion flow

Dependencies: users table, sessions table, email service
Exports: AuthGuard, CurrentUser decorator, AuthService
```

### Profile Module
```
Responsibilities:
- Profile CRUD
- Photo upload/management
- Avatar generation
- Profile completeness calculation
- Display name management

Dependencies: profiles, photos, S3 service
Exports: ProfileService
```

### Preference Module
```
Responsibilities:
- Social preference management
- Professional preference management
- Interest selection
- Filter configuration

Dependencies: preferences tables, interests
Exports: PreferenceService
```

### Location Module
```
Responsibilities:
- Location update processing
- Zone assignment (geohash)
- Zone session lifecycle management
- Proximity confidence calculation
- Anti-spoof detection
- Redis geospatial index updates
- Stale location cleanup

Dependencies: location_sessions, Redis geo, PostGIS
Exports: LocationService, ProximityService
```

### Discovery Module
```
Responsibilities:
- Feed generation (tiered strategy)
- Hard/soft filtering
- Compatibility scoring
- Feed pagination and caching
- Pseudonym resolution
- Empty state logic

Dependencies: LocationService, PreferenceService, MatchService
Exports: DiscoveryService
```

### Match Module
```
Responsibilities:
- Swipe processing
- Mutual like detection
- Match creation
- Match prompt handling (Say Hi / Maybe Later)
- Match expiration
- Re-encounter logic

Dependencies: swipes, matches
Exports: MatchService
```

### Chat Module
```
Responsibilities:
- Chat creation (on Say Hi)
- Message sending/receiving via WebSocket
- Chat status management (active/locked/expired)
- Radius-based chat eligibility checking
- Typing indicators
- Read receipts
- Chat deletion jobs

Dependencies: chats, messages, LocationService, Socket.IO
Exports: ChatService, ChatGateway (WebSocket)
```

### Vibe Module
```
Responsibilities:
- Vibe setting/clearing
- Vibe expiration
- Vibe history tracking

Dependencies: vibes, vibe_history
Exports: VibeService
```

### Hot Zone Module
```
Responsibilities:
- Aggregate active user density
- Compute zone statistics
- Apply privacy thresholds
- Serve hot zone map data

Dependencies: location_sessions, hot_zone_aggregates
Exports: HotZoneService
```

### Survey Module
```
Responsibilities:
- Survey question serving
- Answer collection
- Preference vector computation
- Survey fatigue prevention
- Trigger logic

Dependencies: survey tables
Exports: SurveyService
```

### Safety Module
```
Responsibilities:
- Report handling
- Block management
- Trust score calculation
- Abuse detection
- Moderation workflow

Dependencies: reports, blocks, moderation_actions
Exports: SafetyService, BlockGuard
```

### Notification Module
```
Responsibilities:
- Push notification dispatch (FCM/APNs)
- In-app notification management
- Notification preferences
- Delivery tracking

Dependencies: notifications, FCM/APNs service
Exports: NotificationService
```

### Admin Module
```
Responsibilities:
- Admin authentication
- Report review queue
- User search/management
- Moderation actions
- Analytics dashboards
- Audit logging

Dependencies: admin_users, all other modules
Exports: AdminService
```

---

## REAL-TIME ARCHITECTURE (WebSocket)

### Socket.IO Namespaces
```
/chat          - Chat messaging, typing indicators, read receipts
/presence      - User online status, location updates for chat eligibility
/notifications - Real-time notification delivery
```

### WebSocket Authentication
```typescript
// Socket.IO middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const payload = jwtService.verify(token);
    socket.data.userId = payload.sub;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});
```

### Chat Room Strategy
```
Room naming: chat:{chat_id}
- Both users join room on chat open
- Messages broadcast to room
- Typing indicators broadcast to room
- On disconnect: leave room, update presence
```

### Scaling WebSocket (Phase 3)
```
Problem: Single server can handle ~10K concurrent connections.
         Need horizontal scaling.

Solution: Redis adapter for Socket.IO
  - All Socket.IO instances share state via Redis pub/sub
  - Messages broadcast across all instances
  - Sticky sessions via load balancer (IP hash or cookie)
```

---

## BACKGROUND JOBS (BullMQ)

| Job | Schedule | Purpose |
|-----|----------|---------|
| `cleanup-stale-locations` | Every 5 min | Remove inactive location sessions |
| `cleanup-expired-chats` | Every 1 hour | Delete locked chats older than 3 days |
| `cleanup-expired-matches` | Every 1 hour | Remove expired pending matches |
| `compute-hot-zones` | Every 2 min | Aggregate active user density |
| `expire-vibes` | Every 1 min | Deactivate expired vibes |
| `check-chat-eligibility` | Every 1 min | Update chat lock status based on proximity |
| `cleanup-proximity-snapshots` | Every 15 min | Delete snapshots older than 1 hour |
| `send-chat-expiry-warnings` | Every 1 hour | Notify users of chats expiring in 24h |
| `cleanup-notifications` | Daily | Delete notifications older than 30 days |
| `anonymize-old-swipes` | Daily | Anonymize swipes older than 90 days |
| `purge-deleted-accounts` | Daily | Hard delete accounts past 30-day grace period |
| `compute-trust-scores` | Every 30 min | Recalculate trust scores for flagged users |
| `cleanup-pseudo-names` | Daily | Remove pseudonym sessions older than 30 days |

---

## CACHING STRATEGY (Redis)

| Cache Key | TTL | Purpose |
|-----------|-----|---------|
| `user:{id}:profile` | 5 min | Profile data for feed cards |
| `user:{id}:interests` | 10 min | Interest set for scoring |
| `user:{id}:preferences:{mode}` | 10 min | Preference filters |
| `user:{id}:survey_vector` | 5 min | Survey preference vector |
| `user:{id}:feed:{mode}` | 30 sec | Cached feed results |
| `user:{id}:vibe` | Match vibe TTL | Current active vibe |
| `zone:{hash}:users` | 1 min | Active users in zone |
| `interests:all` | 1 hour | Full interest catalog |
| `surveys:active:{mode}` | 1 hour | Active survey questions |

---

## PUSH NOTIFICATION DESIGN

```typescript
// Notification payload structure
interface PushNotification {
  token: string;        // device FCM/APNs token
  title: string;
  body: string;
  data: {
    type: 'match' | 'message' | 'chat_locked' | 'chat_expiring';
    resourceId: string; // match_id or chat_id
    deepLink: string;   // proximity://chat/{id}
  };
  badge?: number;       // iOS badge count
  sound?: string;
}

// Notification routing
switch (type) {
  case 'match':
    title = "New Match!";
    body = `You matched with ${pseudonym}`;
    deepLink = `proximity://matches/${matchId}`;
    break;
  case 'message':
    title = pseudonym;
    body = truncate(messagePreview, 100);
    deepLink = `proximity://chat/${chatId}`;
    break;
  case 'chat_locked':
    title = "Chat Locked";
    body = `Your chat with ${pseudonym} is locked — you've moved apart`;
    deepLink = `proximity://chat/${chatId}`;
    break;
  case 'chat_expiring':
    title = "Chat Expiring";
    body = `Your chat with ${pseudonym} expires tomorrow`;
    deepLink = `proximity://chat/${chatId}`;
    break;
}
```

---

## DEPLOYMENT ARCHITECTURE

### MVP (Single Server)
```
┌──────────────────────────────────┐
│        AWS EC2 / Railway          │
│  ┌──────────────────────────────┐ │
│  │     NestJS Application       │ │
│  │  (HTTP + WebSocket + Workers)│ │
│  └──────────┬───────────────────┘ │
│             │                     │
│  ┌──────────▼──────┐             │
│  │   PostgreSQL    │             │
│  │   (RDS/local)   │             │
│  └─────────────────┘             │
│  ┌─────────────────┐             │
│  │     Redis       │             │
│  │  (ElastiCache)  │             │
│  └─────────────────┘             │
│  ┌─────────────────┐             │
│  │    S3 Bucket    │             │
│  └─────────────────┘             │
└──────────────────────────────────┘
```

### Scale (Phase 3+)
```
┌─────────────────────────────────────────────┐
│              AWS ALB (Application LB)        │
│              + CloudFront CDN               │
└──────┬─────────────────────────┬────────────┘
       │                         │
┌──────▼──────┐          ┌──────▼──────┐
│  API Server │          │  API Server │  (horizontal scaling)
│  Instance 1 │          │  Instance 2 │
└──────┬──────┘          └──────┬──────┘
       │                         │
       └──────────┬──────────────┘
                  │
    ┌─────────────▼──────────────┐
    │    Redis Cluster           │
    │  (ElastiCache, 3 nodes)    │
    └─────────────┬──────────────┘
                  │
    ┌─────────────▼──────────────┐
    │  PostgreSQL (RDS)          │
    │  Primary + Read Replica    │
    └────────────────────────────┘
```

---

## ENVIRONMENT CONFIGURATION

```env
# .env.example

# App
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=proximity
DB_USER=proximity_user
DB_PASSWORD=change_me
DB_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=change_me_to_random_64_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# OAuth
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Storage
S3_ENDPOINT=
S3_BUCKET=proximity-media
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=us-east-1
S3_CDN_URL=

# Push Notifications
FCM_PROJECT_ID=
FCM_PRIVATE_KEY=
APNS_KEY_ID=
APNS_TEAM_ID=
APNS_BUNDLE_ID=

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@proximity.app

# Feature Flags
FEATURE_UWB_ENABLED=false
FEATURE_BLUETOOTH_ENABLED=false
FEATURE_HOT_ZONES_ENABLED=true
FEATURE_SURVEYS_ENABLED=true

# Rate Limits
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# Sentry
SENTRY_DSN=
```

---

## OBSERVABILITY

### Logging
```typescript
// Structured log format
{
  "timestamp": "2024-01-01T10:00:00.000Z",
  "level": "info",
  "service": "proximity-api",
  "module": "discovery",
  "action": "feed_generated",
  "userId": "uuid",
  "metadata": {
    "totalCandidates": 45,
    "tier1Count": 12,
    "tier2Count": 8,
    "latencyMs": 87
  }
}
```

### Key Metrics (Prometheus)
```
# Application
proximity_active_users_gauge
proximity_feed_generation_duration_seconds
proximity_match_creation_total
proximity_chat_messages_total
proximity_websocket_connections_gauge

# Infrastructure
proximity_db_query_duration_seconds
proximity_redis_operations_total
proximity_queue_job_duration_seconds
proximity_push_notification_sent_total
```

### Health Check
```
GET /health
{
  "status": "ok",
  "uptime": 123456,
  "database": "connected",
  "redis": "connected",
  "version": "1.0.0"
}
```
