# PROXIMITY — Tech Stack, Roadmap, and Risk Assessment

---

## RECOMMENDED MVP TECH STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| **Mobile App** | React Native (Expo) | SDK 52+ |
| **Navigation** | React Navigation | v6 |
| **State Management** | Zustand | v4 |
| **API Client** | Axios + React Query | v5 |
| **Real-time** | Socket.IO Client | v4 |
| **Maps** | react-native-maps | v1 |
| **Location** | expo-location | Latest |
| **Secure Storage** | expo-secure-store | Latest |
| **Push Notifications** | expo-notifications + FCM | Latest |
| **UI Components** | Custom + React Native Reanimated | v3 |
| **Gestures** | react-native-gesture-handler | v2 |
| **Backend** | NestJS | v10 |
| **Language** | TypeScript | v5.3+ |
| **Database** | PostgreSQL + PostGIS | 16 + 3.4 |
| **ORM** | TypeORM | v0.3 |
| **Cache/Queue** | Redis + BullMQ | 7 |
| **WebSocket** | Socket.IO (NestJS Gateway) | v4 |
| **Storage** | AWS S3 / MinIO | - |
| **Email** | Nodemailer / Resend | - |
| **Admin Dashboard** | Next.js + Shadcn/ui + Tailwind | 14 |
| **Monitoring** | Sentry | Latest |
| **CI/CD** | GitHub Actions | - |
| **Hosting (MVP)** | Railway / Render / AWS EC2 | - |
| **Hosting (Scale)** | AWS (ECS/EKS + RDS + ElastiCache) | - |

---

## PHASED IMPLEMENTATION ROADMAP

### PHASE 1: MVP (Weeks 1-14)
**Goal:** Core loop — discover, swipe, match, chat

**Weeks 1-2: Foundation**
- [ ] Project setup (React Native + NestJS + PostgreSQL)
- [ ] Database schema creation with migrations
- [ ] Auth module (email + password, JWT)
- [ ] Email verification
- [ ] Basic CI/CD pipeline
- [ ] Environment configuration

**Weeks 3-4: Profile & Preferences**
- [ ] Profile CRUD (display name, bio, gender)
- [ ] Photo upload to S3
- [ ] Avatar generation (basic — random color + initials)
- [ ] Interest catalog seeding
- [ ] Social preferences
- [ ] Professional preferences
- [ ] Onboarding flow (mobile)

**Weeks 5-6: Location & Discovery**
- [ ] Location update endpoint
- [ ] Redis geospatial index
- [ ] PostGIS spatial queries
- [ ] Zone system (geohash)
- [ ] Discovery feed API (hard filters + soft scoring)
- [ ] Discovery feed UI (swipe cards)
- [ ] Pseudonym generation

**Weeks 7-8: Matching & Chat**
- [ ] Swipe recording
- [ ] Mutual like detection → match creation
- [ ] Match prompt modal (Say Hi / Maybe Later)
- [ ] WebSocket setup (Socket.IO)
- [ ] Chat creation on Say Hi
- [ ] Real-time messaging
- [ ] Typing indicators + read receipts
- [ ] Chat status management (active/locked)

**Weeks 9-10: Chat Lifecycle & Safety**
- [ ] Chat locking based on proximity
- [ ] Chat expiry (3-day locked → delete)
- [ ] Background jobs (BullMQ) for cleanup
- [ ] Report system
- [ ] Block system
- [ ] Push notifications (matches, messages, chat status)

**Weeks 11-12: Dual Mode & Polish**
- [ ] Mode toggle (social/professional)
- [ ] Separate feeds per mode
- [ ] Mode-specific UI theming
- [ ] Vibe Check feature (set/clear/expire)
- [ ] Settings screens
- [ ] Notification preferences
- [ ] Empty state handling

**Weeks 13-14: Testing & Launch Prep**
- [ ] Integration testing
- [ ] Performance testing (feed generation < 200ms)
- [ ] Security audit (auth, location, rate limits)
- [ ] App Store / Play Store preparation
- [ ] Privacy policy + terms of service
- [ ] Soft launch (single city/campus)

**MVP Includes:**
- Email auth (Apple/Google deferred to early Phase 2)
- GPS-based proximity (no UWB, no Bluetooth)
- Basic pseudonym system (without zone rotation)
- Core matching engine (Tier 1 + Tier 2)
- Temporary chat with radius enforcement
- Dual mode with basic theming
- Vibe Check
- Report + block
- Push notifications
- Basic settings

**MVP Defers:**
- Apple/Google sign-in → Phase 2 early
- UWB → Phase 2
- Bluetooth LE → Phase 2
- Hot Zone Map → Phase 2
- Micro-surveys → Phase 2
- Zone-contextual pseudonym rotation → Phase 2
- Avatar generation (beyond basic) → Phase 2
- Admin dashboard → Phase 2 (use direct DB queries initially)
- Photo moderation → Phase 2
- Tier 3/4 feed logic → Phase 2

---

### PHASE 2: Enhanced Matching & Safety (Weeks 15-24)
**Goal:** Improve match quality, add safety layers, expand features

- [ ] Apple Sign-In + Google Sign-In (OAuth)
- [ ] Hot Zone Map (anonymized density)
- [ ] Micro-survey system (question bank + triggers + scoring)
- [ ] Zone-contextual pseudonym rotation
- [ ] Tier 3 + Tier 4 feed logic (sparse market handling)
- [ ] Admin dashboard (Next.js — reports, users, analytics)
- [ ] Photo moderation (AWS Rekognition)
- [ ] AI content moderation for messages
- [ ] Avatar generation with styles
- [ ] UWB-assisted proximity (iOS only initially)
  - Device capability detection
  - NISession integration
  - Proximity confidence scoring update
  - Permission flow
- [ ] Bluetooth LE proximity hints
- [ ] Account deletion flow (30-day grace period)
- [ ] Data export (GDPR)
- [ ] Forgot password flow
- [ ] Advanced anti-spoof detection
- [ ] Trust score system
- [ ] Match analytics
- [ ] Recommendation explanations

**UWB Phase 2 Decision:**
UWB is Phase 2 because:
- Only ~30% of devices support it (2024)
- MVP works fine with GPS + geofencing
- UWB adds significant complexity (NISession/UwbManager)
- Better to validate core loop before adding precision layer
- Phase 2 gives time to study UWB battery impact

---

### PHASE 3: Growth & Scale (Weeks 25-36)
**Goal:** Grow user base, optimize experience, scale infrastructure

- [ ] Referral system
- [ ] In-app events feature (co-located event discovery)
- [ ] Scheduled discovery ("I'll be at X location at Y time")
- [ ] Certificate pinning (mobile security)
- [ ] E2E encryption for chat (Phase 3)
- [ ] Horizontal scaling (multiple API instances)
- [ ] Redis Cluster
- [ ] PostgreSQL read replicas
- [ ] CDN for media
- [ ] Performance monitoring dashboards
- [ ] A/B testing framework
- [ ] Localization (multi-language)
- [ ] Accessibility audit

---

### PHASE 4: Enterprise & Events (Weeks 37+)
**Goal:** Monetization, enterprise features

- [ ] Premium tier (extended radius, more swipes, see who liked you)
- [ ] Event partnerships (branded hot zones, event-specific feeds)
- [ ] Corporate/campus installations
- [ ] API for event organizers
- [ ] Advanced analytics for event partners
- [ ] Group discovery feature
- [ ] Interest-based rooms (Phase 4)

---

## SCALING STRATEGY

### User Scale Milestones

| Users | Architecture | Key Changes |
|-------|-------------|-------------|
| 0 - 10K | Single server (monolith) | MVP architecture sufficient |
| 10K - 50K | Single server + read replica | Add PG read replica, Redis sentinel |
| 50K - 200K | Multi-server + load balancer | Horizontal API scaling, Redis cluster |
| 200K - 1M | Service extraction | Extract chat/location as separate services |
| 1M+ | Full microservices | K8s, service mesh, sharding |

### Bottleneck Analysis

| Bottleneck | Threshold | Solution |
|-----------|-----------|----------|
| Feed generation | > 200ms p95 | Pre-compute, cache in Redis, read replicas |
| WebSocket connections | > 10K concurrent | Multiple Socket.IO instances + Redis adapter |
| Location updates | > 1000/sec | Batch writes to PG, Redis primary store |
| Message throughput | > 5000/sec | Kafka for message queue (Phase 3) |
| Database connections | > 200 concurrent | PgBouncer connection pooling |
| Storage | > 1TB | S3 + CloudFront CDN |

---

## TOP 10 ENGINEERING RISKS

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|------------|------------|
| 1 | GPS inaccuracy leads to poor matching | High | High | Hybrid proximity stack, hysteresis, confidence scoring |
| 2 | Empty feeds (cold start / sparse market) | High | High | Tiered feed strategy, hot zone suggestions, expanded radius |
| 3 | WebSocket scalability | Medium | Medium | Redis adapter, horizontal scaling plan |
| 4 | Location spoofing enables abuse | Medium | Medium | Multi-layer spoof detection, trust scoring |
| 5 | Battery drain from location updates | High | Medium | Geofence-only background, balanced accuracy settings |
| 6 | Chat expiry data loss during moderation | Medium | Low | Report-preserved messages system |
| 7 | UWB device fragmentation | Medium | High (Phase 2) | Graceful fallback, optional-only design |
| 8 | Real-time proximity checking load | Medium | Medium | Batch processing, confidence caching, hysteresis |
| 9 | Schema migrations on live database | Medium | Medium | Zero-downtime migration strategy |
| 10 | Push notification reliability | Medium | Medium | Multiple retry strategy, in-app fallback |

---

## TOP 10 PRODUCT RISKS

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|------------|------------|
| 1 | Not enough users nearby (chicken-and-egg) | Critical | High | Launch in dense areas (campuses, events), hot zone map |
| 2 | Users don't understand ephemeral chat | High | Medium | Clear UI states, tooltips, onboarding explanation |
| 3 | Dating apps stigma bleeds into professional mode | High | Medium | Strong visual separation, separate onboarding |
| 4 | Harassment via location proximity | High | Medium | Block, report, trust score, no exact location sharing |
| 5 | Users want to continue chat after leaving area | High | High | 3-day grace period, re-encounter eligibility |
| 6 | Privacy concerns deter signups | Medium | Medium | Privacy-first messaging, minimal PII, pseudonyms |
| 7 | Professional users don't want to be seen as "available" | Medium | Medium | Professional vibe options, privacy controls |
| 8 | Dual mode confuses users | Medium | Low | Clear mode toggle, distinct themes, onboarding |
| 9 | Matching algorithm feels random early on | Medium | High | Explain compatibility, improve with surveys over time |
| 10 | App feels useless in rural/suburban areas | High | High | Tier 3/4 feed, expanded radius, "active times" suggestions |

---

## NEXT STEPS CHECKLIST FOR IMMEDIATE EXECUTION

1. **Set up monorepo** with React Native (Expo) + NestJS + shared types
2. **Initialize PostgreSQL** with PostGIS extension and run initial migration
3. **Implement auth module** (email registration, login, JWT, email verification)
4. **Build onboarding flow** (profile setup, preference selection)
5. **Implement location update pipeline** (GPS → Redis + PostGIS)
6. **Build discovery feed** (nearby query + hard filters + basic scoring)
7. **Implement swipe + matching logic** (mutual like detection)
8. **Build WebSocket chat** (Socket.IO gateway, message persistence)
9. **Implement chat lifecycle** (radius check, lock/expire jobs)
10. **Set up push notifications** (FCM integration)
11. **Build dual mode** (toggle, separate feeds, themes)
12. **Implement reporting + blocking**
13. **Build settings screens**
14. **QA + performance testing**
15. **Prepare app store assets and submit**

---

## OPEN QUESTIONS / ASSUMPTIONS

### Assumptions Made
1. App is 18+ only (no minor-safe mode)
2. Available initially in English only
3. No monetization in Phase 1 (free app)
4. No video/audio calling (text chat only)
5. Single-city launch strategy (MVP)
6. No group matching or group chat (individual only)
7. Backend hosted in single region initially
8. No offline mode (requires internet)

### Open Questions for Stakeholder Decision
1. **Launch market:** Which city/campus for initial launch?
2. **Monetization timeline:** When to introduce premium features?
3. **Content policy:** How strict on chat content? (Affects moderation investment)
4. **Re-encounter frequency:** Is 7-day cooldown right, or should it be shorter/longer?
5. **Chat expiry duration:** Is 3 days right for locked chats?
6. **Maximum photos:** Is 5 sufficient, or should it be more?
7. **Profile verification:** Should Phase 2 include ID verification?
8. **Event partnerships:** Should event features be free or monetized?
9. **Analytics depth:** What level of analytics should users see about their own activity?
10. **Social features:** Should users see who liked them? (Premium feature candidate)
