# PROXIMITY — Security and Privacy Design

---

## THREAT MODEL

### High-Value Assets
1. User location data (most sensitive)
2. User identity / PII
3. Chat message content
4. Matching preferences and behavior patterns
5. Auth credentials

### Threat Categories
1. **Location tracking** — tracking individuals across zones/time
2. **Identity exposure** — linking pseudonymous profiles to real identities
3. **Data breach** — unauthorized access to database
4. **Location spoofing** — faking location to appear in different zones
5. **Harassment** — abuse of matching/chat system
6. **Account takeover** — unauthorized access to user accounts
7. **Man-in-the-middle** — intercepting API/WebSocket communications
8. **Privacy violation** — excessive data collection or retention

---

## PII MINIMIZATION

### Data Collection Principles
```
COLLECT ONLY:
✓ Email (auth required)
✓ Date of birth (age gate, never displayed)
✓ Gender (matching, user-controlled visibility)
✓ Photos (optional, user-controlled)
✓ Interests (user-controlled)
✓ Location (ephemeral, never stored long-term)

DO NOT COLLECT:
✗ Phone number
✗ Real name (unless user opts in with display name)
✗ Address
✗ Social media handles
✗ Employer information
✗ Government ID
✗ Financial information
```

### Display Name Privacy
- Users NEVER need to reveal real name
- Pseudonym system provides zone-contextual names
- Display name is optional and user-controlled
- Display name is the ONLY name shared with other users
- Email is NEVER shared with other users

### Location Privacy
- Exact coordinates NEVER shared with other users
- Other users see fuzzy distance labels ("Very close", "Nearby", "Within range")
- Location stored only as current session data (TTL: 24 hours)
- No historical location trails stored
- Hot zone map shows only aggregated density (min 3 users)
- GPS coordinates encrypted at rest in database

---

## AUTHENTICATION SECURITY

### Password Security
```
Hashing: bcrypt with cost factor 12
Minimum requirements:
  - 8+ characters
  - 1 uppercase letter
  - 1 number
  - Checked against common password list (top 10,000)
```

### Token Strategy
```
Access Token:
  - JWT (signed with RS256)
  - 15-minute expiry
  - Contains: user_id, email, status, mode
  - Stored in memory (mobile app) — NOT in persistent storage

Refresh Token:
  - JWT (signed with RS256, different key)
  - 30-day expiry
  - Stored in secure keychain (iOS) / encrypted SharedPreferences (Android)
  - Rotated on each use (old token invalidated)
  - Linked to device_id to prevent token reuse across devices
```

### OAuth Security
```
Apple Sign-In:
  - Validate id_token signature with Apple's public keys
  - Verify audience (app client ID)
  - Verify issuer (https://appleid.apple.com)

Google Sign-In:
  - Validate id_token with Google's tokeninfo endpoint
  - Verify audience (app client ID)
  - Verify issuer (accounts.google.com)
```

### Session Security
```
- Maximum 5 active sessions per user
- Session bound to device fingerprint
- Force logout all sessions on password change
- Session revocation on account deletion
- Admin can force-revoke any session
```

---

## LOCATION SECURITY

### Anti-Spoofing (Multi-layered)
1. **Velocity check:** Flag impossible movement speeds (>300 km/h)
2. **IP correlation:** Compare GPS with IP geolocation (coarse, >500km mismatch flagged)
3. **Jitter analysis:** Spoofed locations often lack natural GPS noise
4. **Accuracy anomaly:** Perfect accuracy (0m) is suspicious
5. **Update frequency:** Rate limit to 1 per 5 seconds
6. **Behavioral analysis:** Flag patterns inconsistent with human movement

### Coordinate Protection
```
Storage:
  - PostGIS geography type (encrypted at rest via disk encryption)
  - Redis geospatial set (encrypted in-transit, not at rest — acceptable for cache)
  - Never logged in application logs
  - Never included in error reports / Sentry

API responses:
  - Never return exact lat/lng to clients
  - Return only:
    - "zoneHash" (geohash, ~150m resolution)
    - "distanceLabel" (fuzzy: "Very close" / "Nearby" / "Within range")
    - Hot zone center points (aggregated, ~1.2km resolution)
```

### UWB Privacy (Phase 2)
```
- UWB ranging data NEVER stored in database
- UWB measurements used only for proximity_confidence computation
- Raw distance NEVER exposed to other users
- UWB sessions limited to 10 seconds max
- User must explicitly opt-in via permissions
- Clear permission prompt: "Allow Proximity to use Ultra Wideband for better nearby accuracy?"
```

---

## TRANSPORT SECURITY

```
- All API traffic over HTTPS (TLS 1.3)
- WebSocket over WSS
- HSTS headers enforced
- Certificate pinning in mobile app (Phase 2)
- API rate limiting at both application and infrastructure level
```

---

## DATA ENCRYPTION

| Layer | Method |
|-------|--------|
| In-transit | TLS 1.3 |
| At-rest (database) | AWS RDS encryption (AES-256) or disk encryption |
| At-rest (S3/storage) | S3 server-side encryption (AES-256) |
| Passwords | bcrypt (cost 12) |
| Sensitive fields | Application-level encryption for coordinates (AES-256-GCM) |
| Tokens | RSA-signed JWTs |

---

## ABUSE PREVENTION

### Rate Limiting
```
Per-user (authenticated):
  - General API: 100 req/min
  - Auth endpoints: 10 req/15 min
  - Swipes: 100/min (generous for active swiping)
  - Messages: 30/min
  - Location updates: 12/min
  - Reports: 5/hour

Per-IP (unauthenticated):
  - Registration: 5/hour
  - Login: 20/15 min
  - Password reset: 3/hour
```

### Content Moderation
```
Phase 1 (MVP):
  - User reporting system
  - Admin moderation queue
  - Keyword filter for messages (profanity + threat detection)
  - Block system

Phase 2:
  - AI content moderation for messages (OpenAI moderation API or AWS Comprehend)
  - Photo moderation (nudity detection via AWS Rekognition)
  - Automated trust score adjustments
```

### Anti-Spam Measures
```
- New accounts: limited to 50 swipes/day for first 48 hours
- Message rate: 30/min limit prevents spam flooding
- Repeated reporting of different users: flag reporter
- Multiple blocked within short period: automatic review
- Identical messages to multiple users: spam detection
```

---

## CHAT SECURITY

### Message Security
```
- Messages encrypted in-transit (WSS/HTTPS)
- Messages stored in PostgreSQL (encrypted at rest via disk encryption)
- Messages HARD DELETED when chat expires (not soft deleted)
- No message backup or export capability
- Server cannot read message content (but does store it — E2E encryption is Phase 3)
```

### Report-Preserved Messages
```
Exception: When a user reports specific messages:
  - Reported messages are copied to a separate `reported_messages` store
  - These copies are retained for the report investigation period
  - Deleted after report resolution + 30 day buffer
  - This prevents message deletion from blocking moderation
```

---

## GDPR/CCPA COMPLIANCE

### User Rights Implementation

| Right | Implementation |
|-------|---------------|
| **Right to Access** | GET /settings/data-export → generates downloadable JSON of all user data |
| **Right to Deletion** | DELETE /auth/account → 30-day grace period → full purge |
| **Right to Rectification** | PATCH /profile → edit any personal data |
| **Right to Portability** | Same as access — JSON format |
| **Right to Object** | Settings to control data usage (hot zone, vibes, surveys) |
| **Right to Restrict** | Delete account flow |

### Data Processing Basis
```
- Account creation: Contract (necessary for service)
- Location processing: Consent (explicit location permission)
- Hot zone aggregation: Legitimate interest (anonymized data)
- Survey answers: Consent (optional participation)
- Push notifications: Consent (explicit opt-in)
- Analytics: Legitimate interest (anonymized/aggregated data)
```

### Data Export Format
```json
{
  "exportDate": "2024-01-01T10:00:00Z",
  "account": {
    "email": "user@example.com",
    "createdAt": "2023-06-01T10:00:00Z",
    "gender": "male",
    "dateOfBirth": "1995-06-15"
  },
  "profile": {
    "displayName": "UrbanFox",
    "bioSocial": "...",
    "bioProfessional": "...",
    "photos": ["url1", "url2"]
  },
  "preferences": { ... },
  "interests": [...],
  "surveyAnswers": [...],
  "matchHistory": [
    {
      "matchId": "uuid",
      "createdAt": "...",
      "mode": "social",
      "status": "expired"
    }
  ],
  "reportsMade": [...],
  "blockedUsers": [...]
}
```

### Deletion Purge Procedure
```
On hard delete (30 days after request):
1. Delete all messages in active/locked chats
2. Delete all photos from S3
3. Delete profile, preferences, interests
4. Delete all matches where this user is involved
5. Delete all swipes
6. Delete all location data
7. Delete all vibes and history
8. Delete all survey answers
9. Delete all sessions
10. Anonymize (not delete) reports made BY this user (legal compliance)
11. Keep audit log entry: "account_deleted" with anonymized user hash
12. Delete the user record itself
```

---

## ADMIN ACCESS CONTROLS

### Role-Based Access

| Role | Capabilities |
|------|-------------|
| **Super Admin** | Full access, user management, admin user CRUD, system settings |
| **Moderator** | Report queue, moderation actions (warn/suspend), user search |
| **Analyst** | Read-only analytics dashboards, no user PII access |
| **Support** | User search, view reports, respond to user inquiries, no moderation actions |

### Admin Security
```
- Admin panel on separate domain (admin.proximity.app)
- Admin accounts require 2FA (TOTP)
- Admin sessions expire after 4 hours
- All admin actions logged to audit_logs
- IP allowlisting for admin panel (optional, recommended for production)
- Admin cannot view message content (only message IDs for moderation)
- Admin can view reported message content ONLY for messages included in reports
```

---

## TOP 10 PRIVACY RISKS AND MITIGATIONS

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | Location tracking across zones | Critical | Zone-contextual pseudonyms, no cross-zone user ID exposure |
| 2 | GPS coordinate exposure | Critical | Never expose coordinates to other users, fuzzy labels only |
| 3 | UWB person-tracking | High | Ephemeral sessions (10s max), no raw distance exposure |
| 4 | Message content leak | High | Hard delete on chat expiry, encrypted in transit |
| 5 | Profile data breach | High | Minimal PII, encryption at rest, access controls |
| 6 | Location spoofing | Medium | Multi-layer detection (velocity, IP, jitter, accuracy) |
| 7 | Admin abuse | Medium | Role-based access, audit logging, 2FA |
| 8 | Hot zone de-anonymization | Medium | Minimum 3-user threshold, count rounding |
| 9 | Survey data profiling | Medium | Anonymize after 30 days, minimize dimensions |
| 10 | Cross-mode identity linking | Medium | Separate feeds/matches, but same account (deliberate tradeoff) |
