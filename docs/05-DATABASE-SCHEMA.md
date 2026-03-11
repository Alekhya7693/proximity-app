# PROXIMITY — Database Schema Design

---

## DATABASE: PostgreSQL 16 + PostGIS 3.4

---

## SCHEMA OVERVIEW

```
proximity_db
├── auth
│   ├── users
│   ├── auth_identities
│   ├── sessions
│   └── email_verifications
├── profiles
│   ├── profiles
│   ├── photos
│   ├── avatars
│   └── pseudo_name_sessions
├── preferences
│   ├── interests
│   ├── user_interests
│   ├── social_preferences
│   └── professional_preferences
├── discovery
│   ├── location_sessions
│   ├── proximity_confidence_snapshots
│   ├── swipes
│   ├── matches
│   └── vibes
├── chat
│   ├── chats
│   ├── messages
│   └── chat_status_log
├── surveys
│   ├── survey_questions
│   ├── survey_answers
│   └── survey_response_profiles
├── safety
│   ├── reports
│   ├── blocks
│   ├── moderation_actions
│   └── trust_scores
├── analytics
│   ├── hot_zone_aggregates
│   └── vibe_history
├── admin
│   ├── admin_users
│   └── audit_logs
└── notifications
    └── notification_log
```

---

## TABLE DEFINITIONS

### 1. users
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),  -- NULL for social auth only users
    date_of_birth   DATE NOT NULL,
    gender          VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
    status          VARCHAR(20) NOT NULL DEFAULT 'onboarding'
                    CHECK (status IN ('onboarding', 'active', 'suspended', 'pending_deletion', 'deleted')),
    trust_score     INTEGER NOT NULL DEFAULT 100 CHECK (trust_score BETWEEN 0 AND 100),
    current_mode    VARCHAR(20) NOT NULL DEFAULT 'social' CHECK (current_mode IN ('social', 'professional')),
    email_verified  BOOLEAN NOT NULL DEFAULT false,
    tos_accepted_at TIMESTAMPTZ,
    deletion_requested_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_status ON users(status) WHERE status = 'active';
CREATE INDEX idx_users_email ON users(email);

-- Privacy notes:
-- date_of_birth: never exposed to other users, used only for age calculation
-- email: never exposed to other users
-- password_hash: bcrypt with cost factor 12
```

### 2. auth_identities
```sql
CREATE TABLE auth_identities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider    VARCHAR(20) NOT NULL CHECK (provider IN ('email', 'apple', 'google')),
    provider_id VARCHAR(255),  -- external provider user ID
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_id)
);

CREATE INDEX idx_auth_identities_user ON auth_identities(user_id);
```

### 3. sessions
```sql
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   VARCHAR(512) NOT NULL UNIQUE,
    device_info     JSONB,  -- { platform, os_version, app_version, device_model }
    ip_address      INET,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token) WHERE revoked_at IS NULL;

-- Retention: delete expired sessions after 90 days
-- TTL job: DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '90 days'
```

### 4. email_verifications
```sql
CREATE TABLE email_verifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code        VARCHAR(6) NOT NULL,
    attempts    INTEGER NOT NULL DEFAULT 0,
    expires_at  TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_verif_user ON email_verifications(user_id);

-- TTL: delete after 24 hours regardless
```

### 5. profiles
```sql
CREATE TABLE profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name    VARCHAR(50),  -- NULL = use pseudonym
    bio_social      VARCHAR(200),
    bio_professional VARCHAR(200),
    avatar_type     VARCHAR(20) CHECK (avatar_type IN ('photo', 'generated', 'none')),
    avatar_style    VARCHAR(20),  -- for generated: 'illustrated', 'abstract', 'geometric', 'minimal'
    avatar_colors   JSONB,        -- for generated: color palette
    profile_completeness FLOAT NOT NULL DEFAULT 0.0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Privacy: display_name is the ONLY name shown to others
-- If NULL, pseudonym system generates contextual name
```

### 6. photos
```sql
CREATE TABLE photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url         VARCHAR(512) NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0,  -- ordering
    is_primary  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_user ON photos(user_id);

-- Max 5 photos per user (enforced at application level)
-- Stored in S3-compatible storage, URL points to CDN
-- On user deletion: delete from S3 + DB
```

### 7. pseudo_name_sessions
```sql
CREATE TABLE pseudo_name_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    zone_hash   VARCHAR(12) NOT NULL,  -- geohash of zone
    pseudo_name VARCHAR(50) NOT NULL,
    salt        VARCHAR(32) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, zone_hash)
);

CREATE INDEX idx_pseudo_zone ON pseudo_name_sessions(user_id, zone_hash);

-- Privacy: this table maps user to pseudonym per zone
-- Access: server-side only, never exposed in API
-- Retention: keep for 30 days, then delete (user gets new pseudonym if returning)
```

### 8. interests
```sql
CREATE TABLE interests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    category    VARCHAR(30) NOT NULL,
    mode        VARCHAR(20) NOT NULL CHECK (mode IN ('social', 'professional', 'both')),
    icon        VARCHAR(10),  -- emoji
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_interests_mode ON interests(mode, is_active);

-- Seed data: ~80-120 interests across all categories
```

### 9. user_interests
```sql
CREATE TABLE user_interests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES interests(id),
    mode        VARCHAR(20) NOT NULL CHECK (mode IN ('social', 'professional')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, interest_id, mode)
);

CREATE INDEX idx_user_interests_user_mode ON user_interests(user_id, mode);
CREATE INDEX idx_user_interests_interest ON user_interests(interest_id);
```

### 10. social_preferences
```sql
CREATE TABLE social_preferences (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    looking_for JSONB DEFAULT '[]',  -- ["friendship", "dating", "casual_chat", "activity_partners"]
    conversation_styles JSONB DEFAULT '[]',
    age_min     INTEGER DEFAULT 18,
    age_max     INTEGER DEFAULT 99,
    gender_preference JSONB DEFAULT '[]',  -- empty = no preference
    max_distance_m INTEGER DEFAULT 300,
    min_match_pct INTEGER DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 11. professional_preferences
```sql
CREATE TABLE professional_preferences (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    industries  JSONB DEFAULT '[]',
    professional_interests JSONB DEFAULT '[]',
    experience_level VARCHAR(20),
    conversation_styles JSONB DEFAULT '[]',
    age_min     INTEGER DEFAULT 18,
    age_max     INTEGER DEFAULT 99,
    gender_preference JSONB DEFAULT '[]',
    max_distance_m INTEGER DEFAULT 300,
    min_match_pct INTEGER DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 12. location_sessions
```sql
CREATE TABLE location_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location        GEOGRAPHY(Point, 4326) NOT NULL,
    accuracy_m      FLOAT,
    zone_hash       VARCHAR(12) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('entering', 'active', 'exiting', 'left')),
    proximity_confidence FLOAT DEFAULT 0.0,
    entered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at         TIMESTAMPTZ
);

CREATE INDEX idx_location_sessions_user ON location_sessions(user_id) WHERE status = 'active';
CREATE INDEX idx_location_sessions_zone ON location_sessions(zone_hash) WHERE status = 'active';
CREATE INDEX idx_location_sessions_geo ON location_sessions USING GIST(location);
CREATE INDEX idx_location_sessions_active ON location_sessions(last_active) WHERE status = 'active';

-- Privacy: location data is ephemeral
-- Retention: delete sessions older than 24 hours
-- NEVER store historical location trails
```

### 13. proximity_confidence_snapshots
```sql
CREATE TABLE proximity_confidence_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id       UUID NOT NULL REFERENCES users(id),
    user_b_id       UUID NOT NULL REFERENCES users(id),
    gps_confidence  FLOAT NOT NULL,
    geofence_confidence FLOAT NOT NULL DEFAULT 0,
    bluetooth_confidence FLOAT NOT NULL DEFAULT 0,
    uwb_confidence  FLOAT NOT NULL DEFAULT 0,
    total_confidence FLOAT NOT NULL,
    distance_estimate_m FLOAT,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prox_snap_users ON proximity_confidence_snapshots(user_a_id, user_b_id);

-- Privacy: HIGH SENSITIVITY — contains precise proximity data
-- Retention: delete after 1 hour
-- Purpose: audit trail for matching/chat eligibility decisions
-- Do NOT store long-term
```

### 14. swipes
```sql
CREATE TABLE swipes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swiper_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    swiped_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    direction   VARCHAR(10) NOT NULL CHECK (direction IN ('right', 'left')),
    mode        VARCHAR(20) NOT NULL CHECK (mode IN ('social', 'professional')),
    zone_hash   VARCHAR(12),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(swiper_id, swiped_id, mode)
);

CREATE INDEX idx_swipes_swiped ON swipes(swiped_id, direction) WHERE direction = 'right';
CREATE INDEX idx_swipes_swiper ON swipes(swiper_id, created_at);

-- Used for: mutual like detection, analytics, implicit preference learning
-- Retention: keep for 90 days, then anonymize (replace user IDs with hashes)
```

### 15. matches
```sql
CREATE TABLE matches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode            VARCHAR(20) NOT NULL CHECK (mode IN ('social', 'professional')),
    status          VARCHAR(20) NOT NULL DEFAULT 'matched'
                    CHECK (status IN ('matched', 'chat_active', 'chat_locked', 'chat_expired', 'expired')),
    match_location  GEOGRAPHY(Point, 4326) NOT NULL,
    match_zone_hash VARCHAR(12) NOT NULL,
    compatibility_score FLOAT NOT NULL,
    user_a_action   VARCHAR(20) DEFAULT 'pending'
                    CHECK (user_a_action IN ('pending', 'say_hi', 'maybe_later')),
    user_b_action   VARCHAR(20) DEFAULT 'pending'
                    CHECK (user_b_action IN ('pending', 'say_hi', 'maybe_later')),
    chat_started_at TIMESTAMPTZ,
    locked_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,  -- for pending matches: 72 hours after match
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_users ON matches(user_a_id, user_b_id);
CREATE INDEX idx_matches_user_a ON matches(user_a_id, status);
CREATE INDEX idx_matches_user_b ON matches(user_b_id, status);
CREATE INDEX idx_matches_status ON matches(status) WHERE status IN ('matched', 'chat_active', 'chat_locked');
CREATE INDEX idx_matches_expires ON matches(expires_at) WHERE status IN ('matched', 'chat_locked');

-- Retention:
-- 'expired' matches: delete after 7 days
-- 'chat_expired' matches: delete after 7 days (chat already deleted)
```

### 16. chats
```sql
CREATE TABLE chats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'locked', 'expired', 'deleted')),
    locked_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,  -- locked_at + 3 days
    message_count   INTEGER NOT NULL DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_chats_match ON chats(match_id);
CREATE INDEX idx_chats_status ON chats(status) WHERE status IN ('active', 'locked');
CREATE INDEX idx_chats_expires ON chats(expires_at) WHERE status = 'locked';
```

### 17. messages
```sql
CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id     UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'sent'
                CHECK (status IN ('sent', 'delivered', 'read')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at     TIMESTAMPTZ
);

CREATE INDEX idx_messages_chat ON messages(chat_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Privacy: messages are HARD DELETED when chat expires
-- No soft delete for messages — this is a privacy requirement
-- Max message length: 1000 chars (enforced at application level)
```

### 18. vibes
```sql
CREATE TABLE vibes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode        VARCHAR(20) NOT NULL CHECK (mode IN ('social', 'professional')),
    label       VARCHAR(50) NOT NULL,
    icon        VARCHAR(10),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vibes_user ON vibes(user_id) WHERE is_active = true;

-- Only 1 active vibe per user per mode at a time
-- Enforced at application level
-- Retention: keep for 7 days for analytics, then delete
```

### 19. vibe_history (analytics)
```sql
CREATE TABLE vibe_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode        VARCHAR(20) NOT NULL,
    label       VARCHAR(50) NOT NULL,
    zone_hash   VARCHAR(12),
    duration_minutes INTEGER,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vibe_history_user ON vibe_history(user_id, created_at);

-- Anonymize after 30 days (replace user_id with hash)
```

### 20. survey_questions
```sql
CREATE TABLE survey_questions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode        VARCHAR(20) NOT NULL CHECK (mode IN ('social', 'professional', 'both')),
    category    VARCHAR(30) NOT NULL,
    text        VARCHAR(200) NOT NULL,
    options     JSONB NOT NULL,  -- [{ "value": "a", "label": "Option A" }]
    weight_impacts JSONB NOT NULL,  -- { "a": { "dim1": 0.2, "dim2": -0.1 } }
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 21. survey_answers
```sql
CREATE TABLE survey_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id),
    answer      VARCHAR(50) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

CREATE INDEX idx_survey_answers_user ON survey_answers(user_id);
```

### 22. survey_response_profiles
```sql
CREATE TABLE survey_response_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preference_vector FLOAT[] NOT NULL DEFAULT '{}',  -- 10-dimensional vector
    answer_count    INTEGER NOT NULL DEFAULT 0,
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recomputed each time user answers a new survey question
```

### 23. reports
```sql
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID NOT NULL REFERENCES users(id),
    reported_id     UUID NOT NULL REFERENCES users(id),
    reason          VARCHAR(30) NOT NULL
                    CHECK (reason IN ('harassment', 'fake_profile', 'spam',
                           'inappropriate', 'unsafe_conduct', 'other')),
    description     TEXT,
    context         VARCHAR(20) CHECK (context IN ('profile', 'chat')),
    chat_id         UUID REFERENCES chats(id),
    selected_message_ids UUID[],
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    severity        VARCHAR(10) DEFAULT 'medium'
                    CHECK (severity IN ('low', 'medium', 'high')),
    resolution      TEXT,
    resolved_by     UUID REFERENCES admin_users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_reports_status ON reports(status, severity);
CREATE INDEX idx_reports_reported ON reports(reported_id);

-- Privacy: reporter identity is NEVER revealed to reported user
-- Retention: keep for 1 year for legal compliance
-- Messages referenced by reports are preserved even if chat is deleted
```

### 24. blocks
```sql
CREATE TABLE blocks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);
```

### 25. hot_zone_aggregates
```sql
CREATE TABLE hot_zone_aggregates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_hash       VARCHAR(8) NOT NULL,  -- geohash precision 6 (~1.2km)
    center          GEOGRAPHY(Point, 4326) NOT NULL,
    active_count    INTEGER NOT NULL DEFAULT 0,
    dominant_vibes  JSONB DEFAULT '[]',
    mode_breakdown  JSONB DEFAULT '{}',  -- { "social": 5, "professional": 3 }
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hot_zone_geo ON hot_zone_aggregates USING GIST(center);
CREATE INDEX idx_hot_zone_time ON hot_zone_aggregates(computed_at);

-- Recomputed every 2 minutes by background job
-- Retention: keep for 7 days for analytics
-- Privacy: NEVER store individual user data, only aggregates
-- Minimum threshold: only create entry if active_count >= 3
```

### 26. moderation_actions
```sql
CREATE TABLE moderation_actions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    UUID NOT NULL REFERENCES admin_users(id),
    target_user_id UUID NOT NULL REFERENCES users(id),
    action      VARCHAR(20) NOT NULL
                CHECK (action IN ('warn', 'suspend', 'ban', 'unsuspend', 'unban', 'dismiss_report')),
    report_id   UUID REFERENCES reports(id),
    reason      TEXT,
    duration_days INTEGER,  -- for suspensions
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mod_actions_target ON moderation_actions(target_user_id);
```

### 27. admin_users
```sql
CREATE TABLE admin_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    role        VARCHAR(20) NOT NULL
                CHECK (role IN ('super_admin', 'moderator', 'analyst', 'support')),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login  TIMESTAMPTZ
);
```

### 28. audit_logs
```sql
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type  VARCHAR(10) NOT NULL CHECK (actor_type IN ('user', 'admin', 'system')),
    actor_id    UUID,
    action      VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    metadata    JSONB DEFAULT '{}',
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_type, actor_id, created_at);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- Retention: keep for 2 years for compliance
-- Append-only: never update or delete
```

### 29. notifications
```sql
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(30) NOT NULL
                CHECK (type IN ('match', 'message', 'chat_locked', 'chat_expiring',
                       'vibe_expired', 'report_resolved', 'account_warning')),
    title       VARCHAR(100) NOT NULL,
    body        VARCHAR(200),
    data        JSONB DEFAULT '{}',  -- deep link data
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at);

-- Retention: delete after 30 days
```

---

## DATA RETENTION SUMMARY

| Table | Retention | Strategy |
|-------|-----------|----------|
| users | Until deletion | Soft delete → 30 day → hard purge |
| sessions | 90 days after expiry | Hard delete |
| email_verifications | 24 hours | Hard delete |
| location_sessions | 24 hours | Hard delete |
| proximity_confidence_snapshots | 1 hour | Hard delete |
| swipes | 90 days | Anonymize |
| matches (expired) | 7 days | Hard delete |
| messages | With chat | Hard delete on chat expiry |
| vibes | 7 days | Hard delete |
| vibe_history | 30 days | Anonymize |
| hot_zone_aggregates | 7 days | Hard delete |
| reports | 1 year | Keep for compliance |
| audit_logs | 2 years | Append-only |
| notifications | 30 days | Hard delete |
| pseudo_name_sessions | 30 days | Hard delete |

---

## ANONYMIZATION STRATEGY

When anonymizing data for analytics retention:

```sql
-- Replace user_id with irreversible hash
UPDATE swipes
SET swiper_id = encode(digest(swiper_id::text || 'anonymization_salt', 'sha256'), 'hex')::uuid,
    swiped_id = encode(digest(swiped_id::text || 'anonymization_salt', 'sha256'), 'hex')::uuid
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## MIGRATION STRATEGY

Use TypeORM migrations (with NestJS):
- Migrations stored in `src/database/migrations/`
- Named with timestamp: `1700000001-CreateUsersTable.ts`
- Run on deploy: `typeorm migration:run`
- Generate from entities: `typeorm migration:generate`
- Each migration is idempotent (IF NOT EXISTS guards)
