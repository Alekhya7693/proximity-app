-- ================================================================
-- PROXIMITY — PostgreSQL + PostGIS Schema
-- Version: 1.0 (MVP)
-- Database: PostgreSQL 16 + PostGIS 3.4
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- ENUMS
-- ================================================================

CREATE TYPE user_status AS ENUM ('onboarding', 'active', 'suspended', 'pending_deletion', 'deleted');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
CREATE TYPE mode_type AS ENUM ('social', 'professional');
CREATE TYPE auth_provider AS ENUM ('email', 'apple', 'google');
CREATE TYPE avatar_type AS ENUM ('photo', 'generated', 'none');
CREATE TYPE swipe_direction AS ENUM ('right', 'left');
CREATE TYPE match_status AS ENUM ('matched', 'chat_active', 'chat_locked', 'chat_expired', 'expired');
CREATE TYPE match_action AS ENUM ('pending', 'say_hi', 'maybe_later');
CREATE TYPE chat_status AS ENUM ('active', 'locked', 'expired', 'deleted');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE zone_status AS ENUM ('entering', 'active', 'exiting', 'left');
CREATE TYPE report_reason AS ENUM ('harassment', 'fake_profile', 'spam', 'inappropriate', 'unsafe_conduct', 'other');
CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE moderation_action_type AS ENUM ('warn', 'suspend', 'ban', 'unsuspend', 'unban', 'dismiss_report');
CREATE TYPE admin_role AS ENUM ('super_admin', 'moderator', 'analyst', 'support');
CREATE TYPE actor_type AS ENUM ('user', 'admin', 'system');
CREATE TYPE notification_type AS ENUM ('match', 'message', 'chat_locked', 'chat_expiring', 'vibe_expired', 'report_resolved', 'account_warning');

-- ================================================================
-- TABLES
-- ================================================================

-- 1. Users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    date_of_birth   DATE NOT NULL,
    gender          gender_type NOT NULL,
    status          user_status NOT NULL DEFAULT 'onboarding',
    trust_score     INTEGER NOT NULL DEFAULT 100 CHECK (trust_score BETWEEN 0 AND 100),
    current_mode    mode_type NOT NULL DEFAULT 'social',
    email_verified  BOOLEAN NOT NULL DEFAULT false,
    tos_accepted_at TIMESTAMPTZ,
    deletion_requested_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_status ON users(status) WHERE status = 'active';
CREATE INDEX idx_users_email ON users(lower(email));

-- 2. Auth Identities
CREATE TABLE auth_identities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider    auth_provider NOT NULL,
    provider_id VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_id)
);

CREATE INDEX idx_auth_identities_user ON auth_identities(user_id);

-- 3. Sessions
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   VARCHAR(512) NOT NULL UNIQUE,
    device_info     JSONB DEFAULT '{}',
    ip_address      INET,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token) WHERE revoked_at IS NULL;

-- 4. Email Verifications
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

-- 5. Profiles
CREATE TABLE profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name        VARCHAR(50),
    bio_social          VARCHAR(200),
    bio_professional    VARCHAR(200),
    avatar_type_value   avatar_type DEFAULT 'none',
    avatar_style        VARCHAR(20),
    avatar_colors       JSONB,
    profile_completeness FLOAT NOT NULL DEFAULT 0.0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Photos
CREATE TABLE photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url         VARCHAR(512) NOT NULL,
    thumbnail_url VARCHAR(512),
    position    INTEGER NOT NULL DEFAULT 0,
    is_primary  BOOLEAN NOT NULL DEFAULT false,
    file_size   INTEGER,
    mime_type   VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_user ON photos(user_id);

-- 7. Pseudo Name Sessions
CREATE TABLE pseudo_name_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    zone_hash   VARCHAR(12) NOT NULL,
    pseudo_name VARCHAR(50) NOT NULL,
    salt        VARCHAR(32) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, zone_hash)
);

CREATE INDEX idx_pseudo_zone ON pseudo_name_sessions(user_id, zone_hash);

-- 8. Interests
CREATE TABLE interests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    category    VARCHAR(30) NOT NULL,
    mode        mode_type NOT NULL,
    icon        VARCHAR(10),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_interests_mode ON interests(mode, is_active);

-- 9. User Interests
CREATE TABLE user_interests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES interests(id),
    mode        mode_type NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, interest_id, mode)
);

CREATE INDEX idx_user_interests_user_mode ON user_interests(user_id, mode);
CREATE INDEX idx_user_interests_interest ON user_interests(interest_id);

-- 10. Social Preferences
CREATE TABLE social_preferences (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    looking_for         JSONB DEFAULT '[]',
    conversation_styles JSONB DEFAULT '[]',
    age_min             INTEGER DEFAULT 18,
    age_max             INTEGER DEFAULT 99,
    gender_preference   JSONB DEFAULT '[]',
    max_distance_m      INTEGER DEFAULT 300,
    min_match_pct       INTEGER DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Professional Preferences
CREATE TABLE professional_preferences (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    industries              JSONB DEFAULT '[]',
    professional_interests  JSONB DEFAULT '[]',
    experience_level        VARCHAR(20),
    conversation_styles     JSONB DEFAULT '[]',
    age_min                 INTEGER DEFAULT 18,
    age_max                 INTEGER DEFAULT 99,
    gender_preference       JSONB DEFAULT '[]',
    max_distance_m          INTEGER DEFAULT 300,
    min_match_pct           INTEGER DEFAULT 0,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Location Sessions
CREATE TABLE location_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location                GEOGRAPHY(Point, 4326) NOT NULL,
    accuracy_m              FLOAT,
    zone_hash               VARCHAR(12) NOT NULL,
    status                  zone_status NOT NULL DEFAULT 'active',
    proximity_confidence    FLOAT DEFAULT 0.0,
    entered_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at                 TIMESTAMPTZ
);

CREATE INDEX idx_location_sessions_user ON location_sessions(user_id) WHERE status = 'active';
CREATE INDEX idx_location_sessions_zone ON location_sessions(zone_hash) WHERE status = 'active';
CREATE INDEX idx_location_sessions_geo ON location_sessions USING GIST(location);
CREATE INDEX idx_location_sessions_active ON location_sessions(last_active) WHERE status = 'active';

-- 13. Proximity Confidence Snapshots
CREATE TABLE proximity_confidence_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id           UUID NOT NULL REFERENCES users(id),
    user_b_id           UUID NOT NULL REFERENCES users(id),
    gps_confidence      FLOAT NOT NULL,
    geofence_confidence FLOAT NOT NULL DEFAULT 0,
    bluetooth_confidence FLOAT NOT NULL DEFAULT 0,
    uwb_confidence      FLOAT NOT NULL DEFAULT 0,
    total_confidence    FLOAT NOT NULL,
    distance_estimate_m FLOAT,
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prox_snap_users ON proximity_confidence_snapshots(user_a_id, user_b_id);
CREATE INDEX idx_prox_snap_time ON proximity_confidence_snapshots(computed_at);

-- 14. Swipes
CREATE TABLE swipes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swiper_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    swiped_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    direction   swipe_direction NOT NULL,
    mode        mode_type NOT NULL,
    zone_hash   VARCHAR(12),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(swiper_id, swiped_id, mode)
);

CREATE INDEX idx_swipes_swiped ON swipes(swiped_id, direction) WHERE direction = 'right';
CREATE INDEX idx_swipes_swiper ON swipes(swiper_id, created_at);

-- 15. Matches
CREATE TABLE matches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode                mode_type NOT NULL,
    status              match_status NOT NULL DEFAULT 'matched',
    match_location      GEOGRAPHY(Point, 4326) NOT NULL,
    match_zone_hash     VARCHAR(12) NOT NULL,
    compatibility_score FLOAT NOT NULL,
    user_a_action       match_action DEFAULT 'pending',
    user_b_action       match_action DEFAULT 'pending',
    chat_started_at     TIMESTAMPTZ,
    locked_at           TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_users ON matches(user_a_id, user_b_id);
CREATE INDEX idx_matches_user_a ON matches(user_a_id, status);
CREATE INDEX idx_matches_user_b ON matches(user_b_id, status);
CREATE INDEX idx_matches_status ON matches(status) WHERE status IN ('matched', 'chat_active', 'chat_locked');
CREATE INDEX idx_matches_expires ON matches(expires_at) WHERE status IN ('matched', 'chat_locked');

-- 16. Chats
CREATE TABLE chats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
    status          chat_status NOT NULL DEFAULT 'active',
    locked_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    message_count   INTEGER NOT NULL DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_chats_match ON chats(match_id);
CREATE INDEX idx_chats_status ON chats(status) WHERE status IN ('active', 'locked');
CREATE INDEX idx_chats_expires ON chats(expires_at) WHERE status = 'locked';

-- 17. Messages
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL CHECK (char_length(content) <= 1000),
    status          message_status NOT NULL DEFAULT 'sent',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at    TIMESTAMPTZ,
    read_at         TIMESTAMPTZ
);

CREATE INDEX idx_messages_chat ON messages(chat_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- 18. Vibes
CREATE TABLE vibes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode        mode_type NOT NULL,
    label       VARCHAR(50) NOT NULL,
    icon        VARCHAR(10),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vibes_user ON vibes(user_id) WHERE is_active = true;

-- 19. Vibe History
CREATE TABLE vibe_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode                mode_type NOT NULL,
    label               VARCHAR(50) NOT NULL,
    zone_hash           VARCHAR(12),
    duration_minutes    INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vibe_history_user ON vibe_history(user_id, created_at);

-- 20. Survey Questions
CREATE TABLE survey_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode            VARCHAR(20) NOT NULL CHECK (mode IN ('social', 'professional', 'both')),
    category        VARCHAR(30) NOT NULL,
    text            VARCHAR(200) NOT NULL,
    options         JSONB NOT NULL,
    weight_impacts  JSONB NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Survey Answers
CREATE TABLE survey_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id),
    answer      VARCHAR(50) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

CREATE INDEX idx_survey_answers_user ON survey_answers(user_id);

-- 22. Survey Response Profiles
CREATE TABLE survey_response_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preference_vector   FLOAT[] NOT NULL DEFAULT '{}',
    answer_count        INTEGER NOT NULL DEFAULT 0,
    last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. Reports
CREATE TABLE reports (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id             UUID NOT NULL REFERENCES users(id),
    reported_id             UUID NOT NULL REFERENCES users(id),
    reason                  report_reason NOT NULL,
    description             TEXT,
    context                 VARCHAR(20) CHECK (context IN ('profile', 'chat')),
    chat_id                 UUID REFERENCES chats(id),
    selected_message_ids    UUID[],
    status                  report_status NOT NULL DEFAULT 'pending',
    severity                severity_level DEFAULT 'medium',
    resolution              TEXT,
    resolved_by             UUID,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at             TIMESTAMPTZ
);

CREATE INDEX idx_reports_status ON reports(status, severity);
CREATE INDEX idx_reports_reported ON reports(reported_id);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);

-- 24. Blocks
CREATE TABLE blocks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- 25. Hot Zone Aggregates
CREATE TABLE hot_zone_aggregates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_hash       VARCHAR(8) NOT NULL,
    center          GEOGRAPHY(Point, 4326) NOT NULL,
    active_count    INTEGER NOT NULL DEFAULT 0,
    dominant_vibes  JSONB DEFAULT '[]',
    mode_breakdown  JSONB DEFAULT '{}',
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hot_zone_geo ON hot_zone_aggregates USING GIST(center);
CREATE INDEX idx_hot_zone_time ON hot_zone_aggregates(computed_at);

-- 26. Moderation Actions
CREATE TABLE moderation_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID NOT NULL,
    target_user_id  UUID NOT NULL REFERENCES users(id),
    action          moderation_action_type NOT NULL,
    report_id       UUID REFERENCES reports(id),
    reason          TEXT,
    duration_days   INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mod_actions_target ON moderation_actions(target_user_id);

-- 27. Admin Users
CREATE TABLE admin_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    role            admin_role NOT NULL,
    totp_secret     VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login      TIMESTAMPTZ
);

-- Add FK to moderation_actions now that admin_users exists
ALTER TABLE reports ADD CONSTRAINT fk_reports_resolved_by
    FOREIGN KEY (resolved_by) REFERENCES admin_users(id);

ALTER TABLE moderation_actions ADD CONSTRAINT fk_mod_actions_admin
    FOREIGN KEY (admin_id) REFERENCES admin_users(id);

-- 28. Audit Logs
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type_value actor_type NOT NULL,
    actor_id        UUID,
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     UUID,
    metadata        JSONB DEFAULT '{}',
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_type_value, actor_id, created_at);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_time ON audit_logs(created_at);

-- 29. Notifications
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notification_type NOT NULL,
    title       VARCHAR(100) NOT NULL,
    body        VARCHAR(200),
    data        JSONB DEFAULT '{}',
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at);

-- 30. Device Tokens (for push notifications)
CREATE TABLE device_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(512) NOT NULL,
    platform    VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    failure_count INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(token)
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id) WHERE is_active = true;

-- 31. Notification Preferences
CREATE TABLE notification_preferences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    new_matches     BOOLEAN NOT NULL DEFAULT true,
    new_messages    BOOLEAN NOT NULL DEFAULT true,
    chat_expiring   BOOLEAN NOT NULL DEFAULT true,
    hot_zone_alerts BOOLEAN NOT NULL DEFAULT false,
    survey_prompts  BOOLEAN NOT NULL DEFAULT true,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 32. Privacy Settings
CREATE TABLE privacy_settings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    show_on_hot_zone    BOOLEAN NOT NULL DEFAULT true,
    show_vibe_to_others BOOLEAN NOT NULL DEFAULT true,
    allow_uwb_ranging   BOOLEAN NOT NULL DEFAULT false,
    location_precision  VARCHAR(10) NOT NULL DEFAULT 'standard'
                        CHECK (location_precision IN ('standard', 'enhanced')),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_prefs_updated_at BEFORE UPDATE ON social_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prof_prefs_updated_at BEFORE UPDATE ON professional_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SEED DATA: Interests
-- ================================================================

INSERT INTO interests (name, category, mode, icon, sort_order) VALUES
-- Social: Lifestyle
('Outdoors', 'lifestyle', 'social', '🌲', 1),
('Urban Explorer', 'lifestyle', 'social', '🏙️', 2),
('Fitness', 'lifestyle', 'social', '💪', 3),
('Travel', 'lifestyle', 'social', '✈️', 4),
('Foodie', 'lifestyle', 'social', '🍕', 5),
('Nightlife', 'lifestyle', 'social', '🌙', 6),
('Wellness', 'lifestyle', 'social', '🧘', 7),
('Photography', 'lifestyle', 'social', '📷', 8),
('Reading', 'lifestyle', 'social', '📚', 9),
('Sustainability', 'lifestyle', 'social', '♻️', 10),

-- Social: Social Interests
('Coffee Chats', 'social', 'social', '☕', 11),
('Group Activities', 'social', 'social', '👥', 12),
('Live Events', 'social', 'social', '🎵', 13),
('Gaming', 'social', 'social', '🎮', 14),
('Art & Design', 'social', 'social', '🎨', 15),
('Music', 'social', 'social', '🎶', 16),
('Movies & TV', 'social', 'social', '🎬', 17),
('Sports', 'social', 'social', '⚽', 18),
('Cooking', 'social', 'social', '👨‍🍳', 19),
('Board Games', 'social', 'social', '🎲', 20),

-- Social: Conversation Styles
('Deep Talks', 'conversation', 'social', '💭', 21),
('Light & Fun', 'conversation', 'social', '😄', 22),
('Debate', 'conversation', 'social', '⚖️', 23),
('Storytelling', 'conversation', 'social', '📖', 24),

-- Professional: Industries
('Technology', 'industry', 'professional', '💻', 1),
('Finance', 'industry', 'professional', '📈', 2),
('Healthcare', 'industry', 'professional', '🏥', 3),
('Creative & Design', 'industry', 'professional', '🎨', 4),
('Education', 'industry', 'professional', '🎓', 5),
('Legal', 'industry', 'professional', '⚖️', 6),
('Consulting', 'industry', 'professional', '📊', 7),
('Startups', 'industry', 'professional', '🚀', 8),
('Marketing', 'industry', 'professional', '📣', 9),
('Real Estate', 'industry', 'professional', '🏢', 10),
('Non-Profit', 'industry', 'professional', '🤝', 11),
('Science & Research', 'industry', 'professional', '🔬', 12),

-- Professional: Professional Interests
('Mentorship', 'professional', 'professional', '🎓', 13),
('Collaboration', 'professional', 'professional', '🤝', 14),
('Hiring', 'professional', 'professional', '📋', 15),
('Job Seeking', 'professional', 'professional', '🔍', 16),
('Investing', 'professional', 'professional', '💰', 17),
('Brainstorming', 'professional', 'professional', '💡', 18),
('Side Projects', 'professional', 'professional', '🛠️', 19),
('Public Speaking', 'professional', 'professional', '🎤', 20),

-- Professional: Conversation Styles
('Formal', 'conversation', 'professional', '👔', 21),
('Casual Professional', 'conversation', 'professional', '💼', 22),
('Pitch Mode', 'conversation', 'professional', '🎯', 23),
('Learning Mode', 'conversation', 'professional', '📝', 24);

-- ================================================================
-- SEED DATA: Survey Questions
-- ================================================================

INSERT INTO survey_questions (mode, category, text, options, weight_impacts) VALUES
('social', 'preference', 'Do you prefer coffee chats or activity-based meetups?',
 '[{"value":"coffee","label":"Coffee chats"},{"value":"activity","label":"Activity-based meetups"},{"value":"both","label":"Both equally"}]',
 '{"coffee":{"social_style":0.2,"activity_level":-0.1},"activity":{"social_style":-0.1,"activity_level":0.2},"both":{"social_style":0.05,"activity_level":0.05}}'),

('social', 'personality', 'Do you like spontaneous plans or scheduled meetups?',
 '[{"value":"spontaneous","label":"Spontaneous"},{"value":"scheduled","label":"Scheduled"},{"value":"depends","label":"Depends on the day"}]',
 '{"spontaneous":{"spontaneity":0.3},"scheduled":{"spontaneity":-0.2},"depends":{"spontaneity":0.05}}'),

('social', 'personality', 'Do you prefer outgoing or calm personalities?',
 '[{"value":"outgoing","label":"Outgoing & energetic"},{"value":"calm","label":"Calm & thoughtful"},{"value":"mix","label":"A good mix"}]',
 '{"outgoing":{"energy_level":0.3},"calm":{"energy_level":-0.2},"mix":{"energy_level":0.0}}'),

('professional', 'preference', 'Are you looking for collaborators or mentors?',
 '[{"value":"collaborators","label":"Collaborators"},{"value":"mentors","label":"Mentors"},{"value":"both","label":"Both"}]',
 '{"collaborators":{"collab_seeking":0.3},"mentors":{"mentor_seeking":0.3},"both":{"collab_seeking":0.15,"mentor_seeking":0.15}}'),

('professional', 'preference', 'Do you prefer startup people or corporate professionals?',
 '[{"value":"startup","label":"Startup world"},{"value":"corporate","label":"Corporate world"},{"value":"either","label":"Either"}]',
 '{"startup":{"startup_affinity":0.3},"corporate":{"corporate_affinity":0.3},"either":{"startup_affinity":0.1,"corporate_affinity":0.1}}');

-- ================================================================
-- SEED DATA: First admin user (change password immediately!)
-- ================================================================

INSERT INTO admin_users (email, password_hash, name, role) VALUES
('admin@proximity.app', crypt('ChangeMe123!', gen_salt('bf', 12)), 'System Admin', 'super_admin');
