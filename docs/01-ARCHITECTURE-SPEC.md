# PROXIMITY — Complete Architecture Specification
## Production-Ready Engineering Document v1.0

---

## 1. EXECUTIVE SUMMARY

Proximity is a privacy-first, location-based networking mobile app that connects nearby active users in real time across two distinct modes: **Social** (casual conversations, friendship, dating) and **Professional** (career networking, mentorship, collaboration).

**Core differentiators:**
- Hybrid proximity detection (GPS + geofencing + optional Bluetooth + optional UWB)
- Pseudonymous identity system with rotating zone-contextual names
- Dual-mode experience with separate preferences, feeds, and UI themes
- Temporary location-bound ephemeral chat with 300m radius enforcement
- Adaptive preference learning via micro-surveys and behavioral signals
- Hot Zone anonymous density map
- Vibe Check real-time intent system

**Target:** MVP in 12-14 weeks with 2-3 fullstack engineers + 1 mobile engineer + 1 designer.

**Stack:** React Native (Expo) + NestJS + PostgreSQL/PostGIS + Redis + WebSocket (Socket.IO) + S3-compatible storage.

---

## 2. PRODUCT VISION

### Mission
Enable meaningful real-world connections by surfacing compatible, nearby people — without sacrificing privacy.

### Vision
Become the default "who's around me right now" layer for both social and professional contexts. Replace the awkwardness of approaching strangers with a low-friction, privacy-safe discovery mechanism.

### Success Metrics (MVP)
| Metric | Target |
|--------|--------|
| DAU/MAU ratio | >25% |
| Match-to-chat conversion | >40% |
| Average chat duration | >3 minutes |
| Report rate per 1000 matches | <5 |
| 7-day retention | >30% |
| Feed non-empty rate | >85% (via sparse-market logic) |

---

## 3. CORE USER PERSONAS

### Persona 1: Social Explorer (Alex, 24)
- Uses Social Mode primarily
- Wants to meet interesting people at cafes, parks, events
- Privacy-conscious, doesn't want to share phone number
- Values spontaneity and mood-based matching
- Likely to use Vibe Check and Hot Zone Map

### Persona 2: Professional Networker (Maya, 31)
- Uses Professional Mode at conferences, coworking spaces, meetups
- Wants targeted connections (same industry, complementary skills)
- Values efficiency — doesn't want irrelevant matches
- Likely to set Professional vibes and detailed preferences

### Persona 3: Dual-Mode User (Jordan, 27)
- Switches between modes based on context
- Social Mode on weekends, Professional Mode at work
- Wants both experiences without cross-contamination
- Needs clear separation between modes

### Persona 4: Privacy Purist (Sam, 29)
- Uses pseudonyms, no photo, minimal profile
- Still wants quality matches
- Needs the app to work well without revealing identity
- Tests the pseudonymous system deeply

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 Authentication & Registration

| Requirement | Details |
|------------|---------|
| Email + Password | Standard registration with email verification |
| Apple Sign-In | Required for iOS App Store compliance |
| Google Sign-In | OAuth 2.0 flow |
| Email Verification | 6-digit code, 15-min expiry, 3 attempts max |
| Password Reset | Email-based reset link, 1-hour expiry |
| Session Management | JWT access (15min) + refresh token (30 days) |
| Account Deletion | Soft delete → 30-day grace period → hard purge |
| Logout | Invalidate refresh token, clear local state |
| Age Gate | Must be 18+ to register (date of birth required) |

**Auth Flow State Machine:**
```
[Anonymous] → register/login → [Email Unverified] → verify → [Onboarding]
[Onboarding] → complete → [Active]
[Active] → logout → [Anonymous]
[Active] → delete request → [Pending Deletion] → 30 days → [Purged]
[Pending Deletion] → re-login within 30 days → [Active]
```

### 4.2 Onboarding

**Step 1: Basic Profile**
- Date of birth (required, for age gate, never displayed)
- Gender (required: Male, Female, Non-binary, Prefer not to say)
- Display name (optional — if empty, system generates pseudonym)
- Short bio (optional, max 200 chars)
- Photo upload (optional, max 5 photos, 5MB each)
- If no photo: present avatar style picker (illustrated, abstract, geometric)

**Step 2: Social Mode Preferences**
Categories with multi-select tags:
- Lifestyle: Outdoors, Urban, Fitness, Travel, Foodie, Nightlife, Wellness
- Social Interests: Coffee Chats, Group Activities, Live Events, Gaming, Art, Music
- Conversation Styles: Deep Talks, Light & Fun, Debate, Storytelling
- Looking For: Friendship, Dating, Casual Chat, Activity Partners

**Step 3: Professional Mode Preferences**
- Industry: Tech, Finance, Healthcare, Creative, Education, Legal, Consulting, Startup, etc.
- Professional Interests: Mentorship, Collaboration, Hiring, Job Seeking, Investing, Brainstorming
- Experience Level: Student, Early Career, Mid-Career, Senior, Executive
- Conversation Styles: Formal, Casual Professional, Pitch Mode, Learning

**Step 4: Mode Selection**
- Which mode to start in (can always switch)

**Step 5: Location Permission**
- Explain why location is needed
- Request permission
- If denied: app works in limited mode (can browse profiles but not discover nearby)

### 4.3 Pseudonymous Identity System

**Generation Rules:**
- Format: `[Adjective][Noun]` from curated word banks
- Adjective banks: ~200 words (Curious, Silent, Urban, Bright, Swift, Cosmic, etc.)
- Noun banks: ~200 words (Fox, Nomad, Thinker, Voyager, Phoenix, Sage, etc.)
- Total combinations: ~40,000 unique names
- If user provides display name, pseudonym is still generated as fallback

**Zone-Contextual Rotation:**
- Each 300m zone has a zone_id (geohash-based)
- User gets a different pseudonym per zone_id
- Pseudonym = hash(user_id + zone_id + salt) → index into name combinations
- Same user visiting same zone gets same pseudonym (consistency within zone)
- Different zone = different pseudonym (prevents cross-zone tracking)
- User's chosen display name overrides pseudonym if provided

**Privacy Properties:**
- Cannot reverse pseudonym to real identity
- Cannot link pseudonyms across zones without server access
- Server stores mapping but never exposes it to other users

### 4.4 Location Logic

**Hybrid Proximity Stack (ordered by range):**

| Layer | Range | Purpose | Required? |
|-------|-------|---------|-----------|
| GPS/OS Location | 0-∞ | Broad discovery, zone assignment | Yes |
| Geofencing | 300m zones | Entry/exit awareness | Yes |
| Bluetooth LE | 0-30m | Indoor proximity hint | Optional |
| UWB | 0-10m | High-precision ranging | Optional |

**Zone System:**
- Zones are based on geohash precision level 7 (~150m × 150m cells)
- A user's "discovery zone" = their geohash cell + all 8 adjacent cells
- This creates an effective ~450m discovery radius
- 300m enforcement uses Haversine distance calculation for precision

**Location Update Strategy:**
- Foreground: significant location changes (50m or 30 seconds, whichever comes first)
- Background: geofence-based (enter/exit 300m zones only)
- Battery optimization: reduce update frequency when stationary
- Stale location: mark user inactive after 10 minutes without update

**GPS Drift Handling:**
- Rolling average of last 3 location readings
- Discard readings with accuracy > 100m
- Hysteresis buffer: 50m beyond 300m boundary before marking out-of-zone
- This prevents flickering at zone boundaries

**Anti-Spoof Measures:**
- Check location update velocity (>300 km/h = suspicious)
- Compare reported location with IP geolocation (coarse check)
- Flag accounts with impossible movement patterns
- Rate-limit location updates (max 1 per 5 seconds)

### 4.5 Ultra Wideband (UWB) Assisted Precision

**Architecture Decision: UWB is Phase 2, NOT MVP.**

Rationale:
- UWB requires iOS 16+ with U1/U2 chip or Android 12+ with UWB support
- Device penetration is ~30% (2024), growing
- Implementation complexity is high
- GPS + geofencing covers 95% of use cases
- UWB provides marginal improvement for MVP

**Phase 2 UWB Design:**

```
┌─────────────────────────────────────────┐
│          Proximity Confidence Score     │
│                                         │
│  GPS Signal ──────► 0.0-0.6 base score │
│  Geofence Status ─► +0.1-0.2          │
│  Bluetooth RSSI ──► +0.05-0.15        │
│  UWB Range ───────► +0.1-0.3          │
│                     ─────────          │
│  Final Confidence:   0.0-1.0          │
│                                         │
│  Thresholds:                           │
│  Discovery eligible: ≥ 0.4            │
│  Chat eligible:      ≥ 0.5            │
│  High confidence:    ≥ 0.8            │
└─────────────────────────────────────────┘
```

**UWB Interaction Flow:**
1. Both users must have UWB-capable devices
2. App checks `NISession` (iOS) or `UwbManager` (Android) availability
3. Background ranging session initiated only after mutual match
4. Ranging runs for 5 seconds, takes median distance
5. Result feeds into proximity confidence score
6. Session closed immediately after measurement
7. Raw UWB data discarded after confidence score computed

**UWB Privacy Safeguards:**
- Never display raw distance to other users
- UWB sessions are ephemeral (max 10 seconds)
- No continuous tracking — only point-in-time validation
- UWB data never stored in database
- User must opt-in via permissions
- Clear disclosure: "Proximity uses UWB for better nearby accuracy"

### 4.6 Discovery Feed

**Feed Algorithm:**
```
feed = get_nearby_users(user, radius=300m)
  .filter(hard_filters)
  .score(soft_filters)
  .sort(score DESC)
  .paginate(page_size=20)
```

**Hard Filters (must pass ALL):**
- Same active mode (Social ↔ Social, Professional ↔ Professional)
- Age ≥ 18
- Not blocked by either user
- Not banned
- Gender preference match (if set by either user)
- Within radius (proximity confidence ≥ 0.4)
- Not already matched (unless re-encounter logic applies)
- Account active (location update within 10 minutes)

**Soft Scoring (0-100 scale):**

| Signal | Weight | Max Points |
|--------|--------|------------|
| Shared interests | 30% | 30 |
| Vibe alignment | 15% | 15 |
| Survey compatibility | 15% | 15 |
| Proximity (closer = higher) | 10% | 10 |
| Activity recency | 10% | 10 |
| Profile completeness | 5% | 5 |
| Response likelihood (historical) | 5% | 5 |
| Proximity confidence | 5% | 5 |
| Exploration bonus (new user/unseen) | 5% | 5 |

**Compatibility Percentage Display:**
- Shown as "XX% match" on profile cards
- Calculated from soft score
- Minimum display threshold: 20% (below this, don't show percentage)

**Swipe Actions:**
- Swipe right = like
- Swipe left = pass
- No undo in MVP (reduces server complexity)
- Cannot re-encounter same user in same zone within 24 hours after pass

**Empty State Strategy:**
```
if nearby_users.count == 0:
  show "No one nearby right now"
  show nearest hot zones with activity
  show "Check back later" suggestion
  optionally show "Expand your preferences" CTA

if nearby_users.count < 5:
  include Tier 3 (recently active within 30 min, within 1km)
  include Tier 4 (hot zone spillover suggestions)
```

### 4.7 Matching

**Match Creation Flow:**
```
User A swipes right on User B → store swipe(A→B, RIGHT)
  Check: does swipe(B→A, RIGHT) exist?
  If yes → create match(A, B)
    → notify both users
    → show match prompt to both
  If no → do nothing (B doesn't know A liked them)
```

**Match Prompt Modal:**
Both users see:
```
┌─────────────────────────┐
│     It's a Match! 🎉    │
│                         │
│   [Avatar] [Avatar]     │
│                         │
│   ┌──────────────────┐  │
│   │     Say Hi       │  │
│   └──────────────────┘  │
│   ┌──────────────────┐  │
│   │   Maybe Later    │  │
│   └──────────────────┘  │
└─────────────────────────┘
```

**Match States:**
```
[MATCHED] → Say Hi by either → [CHAT_ACTIVE]
[MATCHED] → both say Maybe Later → [PENDING] (72 hours)
[PENDING] → one initiates chat → [CHAT_ACTIVE]
[PENDING] → 72 hours expire → [EXPIRED]
[CHAT_ACTIVE] → both in radius → [CHAT_ACTIVE]
[CHAT_ACTIVE] → one leaves radius → [CHAT_LOCKED]
[CHAT_LOCKED] → both return within 3 days → [CHAT_ACTIVE]
[CHAT_LOCKED] → 3 days expire → [CHAT_DELETED]
[EXPIRED] → re-encounter in new zone → eligible for new swipe cycle
```

### 4.8 Temporary Chat Rules

**Chat State Machine:**
```
         ┌──────────┐
         │  ACTIVE   │ ← both users within 300m of match location
         └────┬──────┘
              │ one user leaves 300m
              ▼
         ┌──────────┐
         │  LOCKED   │ ← visible but read-only, greyed out
         └────┬──────┘
              │ 3 days
              ▼
         ┌──────────┐
         │  DELETED  │ ← permanently removed
         └──────────┘
```

**Re-entry Rules:**
- If both users return within 300m of the ORIGINAL match location within 3 days, chat reactivates
- The match location is stored at match creation time
- Re-entry tolerance: 350m (hysteresis)

**Chat Features (MVP):**
- Text messages only (no attachments in MVP)
- Typing indicators: yes
- Read receipts: yes (delivered / read)
- Message delivery: via WebSocket, fallback to push notification
- Max message length: 1000 characters
- Rate limit: 30 messages per minute per user

**Chat Features (Phase 2):**
- Image sharing (1 at a time, auto-deleted with chat)
- Voice messages (max 60 seconds)
- Location sharing (share a pin, not live location)

**Retention & Deletion:**
- Active chats: no time limit while in radius
- Locked chats: 3 days visibility, then hard delete
- Deletion job: runs every hour, deletes chats where locked_at + 3 days < now
- Messages are hard deleted (not soft deleted) — privacy requirement
- Server retains only: match_id, chat_created_at, chat_deleted_at, message_count (for analytics)

**Notification Rules:**
- New message while app backgrounded: push notification with "New message from [pseudonym]"
- Chat locked: push notification "Your chat with [pseudonym] is now locked — you've moved apart"
- Chat expiring soon (24h before deletion): push notification "Chat expires tomorrow"

### 4.9 Dual Mode System

**Mode Architecture:**
```
┌──────────────────────────────────────────┐
│                 User Account              │
│  ┌─────────────────┐ ┌─────────────────┐ │
│  │   Social Mode    │ │ Professional    │ │
│  │                  │ │     Mode        │ │
│  │ - Social prefs   │ │ - Prof prefs    │ │
│  │ - Social feed    │ │ - Prof feed     │ │
│  │ - Social vibes   │ │ - Prof vibes    │ │
│  │ - Social matches │ │ - Prof matches  │ │
│  │ - Social chats   │ │ - Prof chats    │ │
│  │ - Warm UI theme  │ │ - Cool UI theme │ │
│  └─────────────────┘ └─────────────────┘ │
│                                           │
│  Shared: account, auth, photos, settings  │
└──────────────────────────────────────────┘
```

**Data Sharing Between Modes:**
| Data | Shared? | Rationale |
|------|---------|-----------|
| Account (email, auth) | Yes | Single account |
| Photos/Avatar | Yes | Same person |
| Age, Gender | Yes | Safety requirement |
| Bio | No | Different contexts |
| Interests/Preferences | No | Mode-specific |
| Matches | No | Completely separate |
| Chats | No | Completely separate |
| Vibes | No | Mode-specific |
| Block list | Yes | Safety — blocked everywhere |
| Reports | Yes | Safety |
| Trust score | Yes | Safety |

**Mode Switching:**
- Toggle in top nav bar
- Instant switch — no loading
- Feed refreshes for new mode
- Active chats from other mode accessible via chat tab (labeled by mode)
- Cannot discover same user in both modes simultaneously

**UI Theme Differentiation:**

| Element | Social Mode | Professional Mode |
|---------|------------|-------------------|
| Primary color | Coral/warm gradient | Navy/teal |
| Accent | Amber | Cyan |
| Typography feel | Rounded, friendly | Clean, sharp |
| Card style | Playful with rounded corners | Structured with subtle borders |
| Mode indicator | Sun icon | Briefcase icon |
| Match animation | Confetti | Handshake |

### 4.10 Vibe Check Feature

**Vibe Data Model:**
```json
{
  "vibe_id": "uuid",
  "user_id": "uuid",
  "mode": "social | professional",
  "label": "Coffee Chat",
  "icon": "☕",
  "created_at": "2024-01-01T10:00:00Z",
  "expires_at": "2024-01-01T11:00:00Z",
  "is_active": true
}
```

**Social Vibes:**
| Vibe | Icon | Description |
|------|------|-------------|
| Coffee Chat | ☕ | Down for a chill conversation |
| Socializing | 🎉 | Ready to meet people |
| Casual Conversation | 💬 | Just want to talk |
| Dating | ❤️ | Open to romantic connection |
| Activity Partner | 🏃 | Looking for someone to do stuff with |
| Meet Someone Interesting | ✨ | Open to whatever |

**Professional Vibes:**
| Vibe | Icon | Description |
|------|------|-------------|
| Networking | 🤝 | Building connections |
| Brainstorming | 💡 | Want to bounce ideas |
| Business Discussion | 📊 | Serious business talk |
| Startup Talk | 🚀 | Startup ecosystem chat |
| Industry Conversation | 🏢 | Industry-specific discussion |
| Mentorship | 🎓 | Looking for mentor/mentee |

**Scoring Impact:**
- Matching vibes: +15 points to compatibility score
- Compatible vibes (same category): +8 points
- No vibe set: 0 adjustment (neutral)
- Conflicting vibes (e.g., "Dating" vs "Networking" in wrong mode): should not happen due to mode separation

**Lifecycle:**
- Duration: 60 minutes default
- Can be renewed (resets timer)
- Can be changed (replaces current)
- Can be cleared
- Auto-expires silently
- Max 1 active vibe at a time

### 4.11 Hot Zone Map

**Aggregation Logic:**
```sql
-- Aggregate active users into geohash cells (precision 6 = ~1.2km × 0.6km)
SELECT
  ST_GeoHash(location, 6) as zone,
  COUNT(*) as active_count,
  ST_Centroid(ST_Collect(location)) as center
FROM active_users
WHERE last_active > NOW() - INTERVAL '15 minutes'
GROUP BY ST_GeoHash(location, 6)
HAVING COUNT(*) >= 3  -- privacy threshold
```

**Privacy Thresholds:**
| Active Users in Zone | Display Behavior |
|---------------------|-----------------|
| 0-2 | Do not show zone (privacy risk) |
| 3-5 | Show as "A few people nearby" |
| 6-15 | Show as "~X active" (rounded to nearest 5) |
| 16+ | Show as "X+ active" (rounded to nearest 10) |

**Map Features:**
- Cluster circles with size proportional to count
- Color gradient: cool (few) to warm (many)
- Tap cluster to see: count, dominant vibes, distance from user
- Refresh every 2 minutes
- No zoom below certain level to prevent individual identification
- Minimum cluster radius on map: 200m visual radius

**Event/Conference Mode (Phase 2):**
- Event organizers can create named zones
- Users at events see event-branded hot zone
- Higher density display thresholds for events

### 4.12 Adaptive Micro-Survey System

**Triggering Logic:**
```
if user.sessions_since_last_survey >= 3
   AND user.surveys_completed_today < 2
   AND user.total_surveys_this_week < 5
   AND current_session_duration > 2 minutes
   AND user.has_not_dismissed_survey_this_session:
     show_survey()
```

**Question Bank Structure:**
```json
{
  "question_id": "uuid",
  "mode": "social | professional | both",
  "category": "personality | preference | context",
  "text": "Do you prefer coffee chats or activity-based meetups?",
  "options": [
    { "value": "coffee", "label": "Coffee chats" },
    { "value": "activity", "label": "Activity-based meetups" },
    { "value": "both", "label": "Both equally" }
  ],
  "weight_impacts": {
    "coffee": { "conversation_style": +0.2, "activity_level": -0.1 },
    "activity": { "conversation_style": -0.1, "activity_level": +0.2 }
  }
}
```

**Sample Questions (Social Mode):**
1. Do you prefer coffee chats or activity-based meetups?
2. Do you like spontaneous plans or scheduled meetups?
3. Do you prefer outgoing or calm personalities?
4. What's your ideal first conversation topic?
5. How important is having shared hobbies?

**Sample Questions (Professional Mode):**
1. Are you looking for collaborators or mentors?
2. Do you prefer startup people or corporate professionals?
3. Are you interested in nearby events or direct networking?
4. What stage is your career at?
5. Do you prefer structured or open-ended conversations?

**Impact on Matching:**
- Each answer adjusts a user's preference vector (10-dimensional)
- Compatibility = cosine similarity between preference vectors × 15 (survey weight)
- Minimum 5 survey answers before survey score is included in matching

### 4.13 Filters and Settings

**Settings Information Architecture:**
```
Settings
├── Account
│   ├── Email
│   ├── Change Password
│   ├── Connected Accounts (Apple, Google)
│   ├── Delete Account
│   └── Logout
├── Profile
│   ├── Display Name
│   ├── Bio
│   ├── Photos / Avatar
│   └── Age (view only)
├── Preferences
│   ├── Social Preferences
│   │   ├── Interests
│   │   ├── Looking For
│   │   └── Conversation Style
│   └── Professional Preferences
│       ├── Industry
│       ├── Professional Interests
│       └── Experience Level
├── Discovery Filters
│   ├── Age Range (18-99 slider)
│   ├── Gender Filter
│   ├── Maximum Distance (100m-500m slider)
│   └── Minimum Match % (0-80% slider)
├── Notifications
│   ├── New Matches
│   ├── New Messages
│   ├── Chat Expiring
│   ├── Hot Zone Alerts
│   └── Survey Prompts
├── Privacy
│   ├── Show on Hot Zone Map (on/off)
│   ├── Show Vibe to Others (on/off)
│   ├── Allow UWB Ranging (on/off, Phase 2)
│   └── Location Precision (Standard / Enhanced)
├── About
│   ├── Terms & Conditions
│   ├── Privacy Policy
│   ├── App Version
│   └── Contact Support
└── Danger Zone
    └── Delete Account
```

### 4.14 Reporting, Safety, and Moderation

**Report Flow:**
1. User taps "Report" on profile or in chat
2. Select reason: Harassment, Fake Profile, Spam, Inappropriate Behavior, Unsafe Conduct, Other
3. Optional: add description (max 500 chars)
4. Optional: select specific messages (in chat context)
5. Submit → confirmation shown
6. Report queued for moderation

**Block Flow:**
1. User taps "Block" on profile or in chat
2. Confirmation dialog: "Block this user? They won't be able to see or contact you."
3. Immediate effect:
   - Remove from each other's feeds
   - Lock any active chats
   - Prevent future matching
   - Bidirectional (neither sees the other)

**Trust Score System:**
```
trust_score = 100 (starting score)

Deductions:
- Reported (per unique reporter): -5
- Report upheld by moderator: -20
- Spam behavior detected: -15
- Multiple blocks in short period: -10

Consequences:
- Score < 70: reduced visibility in feeds
- Score < 50: matches require higher compatibility threshold
- Score < 30: account review triggered
- Score < 10: automatic suspension pending review
```

**Moderation Workflow:**
```
[Report Received] → auto-classify severity
  High (harassment, safety): → immediate review queue
  Medium (fake, inappropriate): → standard queue (24h SLA)
  Low (spam, other): → batch review (48h SLA)

Moderator Actions:
  - Dismiss report (no action)
  - Warn user (sends notification)
  - Suspend user (7 days)
  - Ban user (permanent)
  - Escalate to super admin
```
