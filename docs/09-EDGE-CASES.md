# PROXIMITY — Edge Cases and Product Decisions

---

## MATCH & CHAT EDGE CASES

### 1. Both users say "Maybe Later"
**Decision:** Match stays in PENDING state for 72 hours. Either user can later tap "Say Hi" from the matches list to initiate chat. If neither says hi within 72 hours, match expires and is removed.

### 2. One user says "Say Hi", other never opens the app
**Decision:** Chat is created immediately when one user says hi. The other user receives a push notification. If the other user doesn't respond within 72 hours, the match remains but is deprioritized in the matches list. Chat stays in ACTIVE state as long as both are within radius, regardless of whether both have sent messages.

### 3. Users leave radius and return
**Decision:** If both users return within 300m of the original match location within 3 days of chat locking, chat reactivates. The match location is immutable (set at match creation). Re-entry uses 300m threshold with 50m hysteresis (lock at 350m, unlock at 300m).

### 4. GPS drifts while chatting
**Decision:** Use hysteresis (50m buffer beyond 300m) plus rolling average of last 3 readings. If accuracy drops below 100m, maintain current chat state rather than making a change. "Benefit of the doubt" — don't lock unless we're confident the user has left.

### 5. Chat expires during active view
**Decision:** When the chat deletion job runs while a user has the chat open:
- Show inline banner: "This conversation has ended"
- Disable input
- Messages fade out with a 5-second animation
- Auto-navigate to chat list after 10 seconds
- This is handled via WebSocket event `chat:status` → `expired`

### 6. User reported after chat deletion
**Decision:** If a report references a deleted chat:
- Report is still accepted and queued
- If report was filed BEFORE chat deletion, reported messages were preserved at report time
- If report was filed AFTER chat deletion (within 7 days of match expiry), moderators see "Chat content no longer available" but can still act on the report based on description
- Trust score adjustment still applies

### 7. Same users re-encounter in a new location
**Decision:**
- If previous chat expired naturally: eligible for new swipe cycle after 7 days
- If previous match expired without chat: eligible after 3 days
- Previous swipe history is irrelevant in new zone (fresh start)
- Block/report persists regardless of zone

---

## LOCATION EDGE CASES

### 8. UWB available for one user but not the other
**Decision:** UWB ranging requires BOTH users to have UWB support. If only one does, fall back to GPS-only confidence scoring. UWB confidence bonus is simply not applied. No degraded experience for the user without UWB — they don't even know UWB was attempted.

### 9. UWB readings and GPS disagree
**Decision:** UWB is more accurate at short range. If UWB says 5m but GPS says 350m:
- UWB takes priority for distances < 50m (high confidence in UWB)
- Flag the GPS reading as potentially inaccurate
- Set proximity_confidence = min(0.9, uwb_confidence + gps_confidence)
- Log the discrepancy for monitoring
If UWB says 100m but GPS says 50m:
- UWB is out of reliable range at 100m
- Discard UWB reading, use GPS only

### 10. User turns off location mid-session
**Decision:**
- Mark user as INACTIVE immediately
- Remove from discovery feed
- Active chats remain ACTIVE for 5 minutes (grace period)
- After 5 minutes without location: lock all active chats
- Show in-app prompt: "Enable location to keep discovering people nearby"
- Do NOT force-close the app or prevent usage — they can still view matches and locked chats

### 11. User disables nearby / background permissions
**Decision:**
- Without any location permission: app works in "browse only" mode
  - Can view matches and chats (if any exist from previous sessions)
  - Cannot discover new profiles
  - Cannot send messages in radius-dependent chats
  - Prominent banner: "Enable location to discover people nearby"
- With foreground-only permission: full discovery works when app is open
  - No background geofencing
  - Chats may lock unexpectedly when app is backgrounded
  - Show prompt encouraging "Always" permission with clear explanation

### 12. User is backgrounded for extended period
**Decision:**
- Foreground location stops after app enters background
- If "Always" permission: geofence monitors zone exit
- If foreground-only: last known location becomes stale after 10 minutes → marked inactive
- Active chats: grace period of 5 minutes after last location update before locking
- Push notifications still work regardless of location state

### 13. GPS works poorly indoors (conference/building)
**Decision:**
- GPS accuracy drops to 30-100m+ indoors
- Geohash zones still work (coarser matching)
- Proximity confidence score will be lower (reflecting uncertainty)
- UWB (Phase 2) specifically designed for this scenario
- Bluetooth LE (Phase 2) also helps
- Product messaging: "Proximity works best in open areas. Indoor accuracy may vary."

---

## SPARSE MARKET EDGE CASES

### 14. Only one user exists in a zone
**Decision:**
- Show empty state with nearest hot zones
- Show suggestion: "~X people active Y meters away"
- Optionally show Tier 3 (recently active, extended radius) profiles
- Never show "0 people nearby" — always frame positively
- Track zone activity patterns and suggest: "This area usually gets busy at [time]"

### 15. Very few users in entire city
**Decision:**
- Extend Tier 3 radius to 1km and Tier 4 to 5km
- Show profiles from wider area with label: "Also in your area"
- Prioritize hot zone map to help users find each other
- Consider "scheduled discovery" feature (Phase 3): users can set times they'll be at a location
- Growth strategy: focus on specific neighborhoods/campuses before expanding

---

## IDENTITY EDGE CASES

### 16. Professional and social preferences conflict
**Decision:** They can't conflict — they're completely separate preference sets. A user's social interests don't affect professional matching and vice versa. However:
- Block list is shared: blocking in social mode blocks in professional mode too
- Reports are shared: a report in social mode affects professional trust score too
- This is a safety feature, not a bug

### 17. Minors / age gating
**Decision:**
- Date of birth required at registration (not optional)
- Under 18: registration rejected with clear message
- No "birthday workaround" — DOB is immutable after registration
- If user's DOB is edited by admin to show they're under 18: immediate account suspension
- Age display to other users is calculated from DOB (e.g., "26"), DOB itself never shared
- Consider additional verification for age claims near 18 (Phase 3)

### 18. User changes display name to something offensive
**Decision:**
- Apply keyword filter to display names (same as message filter)
- Reject names containing profanity, slurs, or offensive terms
- If a user-set name is later reported and found offensive:
  - Reset to pseudonym
  - Issue warning
  - Log moderation action

---

## SYSTEM EDGE CASES

### 19. WebSocket disconnects during active chat
**Decision:**
- Client automatically reconnects with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Messages sent during disconnect are queued locally
- On reconnect: sync message state (fetch messages since last seen)
- If disconnect > 5 minutes: show "Reconnecting..." banner in chat
- HTTP fallback for message sending if WebSocket unavailable for > 30 seconds

### 20. Server restart during active sessions
**Decision:**
- WebSocket connections will drop — clients reconnect automatically
- Redis preserves geospatial data (no data loss)
- In-flight messages may be lost — client retries on reconnect
- BullMQ jobs survive restart (persisted in Redis)
- No user-facing impact beyond brief reconnection delay

### 21. Database migration while app is live
**Decision:**
- Use zero-downtime migration strategy:
  1. Add new columns/tables (non-breaking)
  2. Deploy code that writes to both old and new schema
  3. Backfill data
  4. Deploy code that reads from new schema
  5. Drop old columns/tables
- For breaking changes: brief maintenance window with in-app notice

### 22. Push notification failures
**Decision:**
- If FCM/APNs delivery fails:
  - Retry 3 times with exponential backoff
  - After 3 failures: mark device token as potentially invalid
  - After 5 consecutive failures: remove device token
  - User can still see in-app notifications when they open the app
  - Critical notifications (match, chat expiring) also stored in notifications table

### 23. Photo upload of inappropriate content
**Decision (MVP):**
- Accept upload (no real-time moderation in MVP)
- If reported by another user: moderator reviews manually
- If confirmed inappropriate: remove photo, warn user

**Decision (Phase 2):**
- AWS Rekognition moderation on upload (async)
- Flag content with > 80% confidence of nudity/violence
- Auto-quarantine flagged photos (not visible to others until reviewed)
- If cleared: make visible. If confirmed: remove + warn.

### 24. Clock skew between client and server
**Decision:**
- All timestamps are server-generated (never trust client timestamps)
- Client receives server time in API responses
- Vibe expiry, chat expiry, match expiry — all computed server-side
- Client displays relative times ("2 minutes ago") based on server timestamps
- Location update timestamps are from the client but validated against server time (reject if > 5 min drift)

---

## PRODUCT DECISION SUMMARY TABLE

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Match location immutability | Match location fixed at creation | Simpler, prevents gaming |
| Chat re-entry radius | Same as discovery (300m) | Consistency |
| Re-encounter cooldown | 7 days (expired chat), 3 days (expired match) | Balance between freshness and spam |
| Location permission denied | Browse-only mode | Don't force, encourage |
| Background location | Geofence only (not continuous) | Battery life |
| Age verification | DOB at registration (honor system) | MVP simplicity, Phase 3 for verification |
| Cross-mode blocking | Yes (shared block list) | Safety first |
| UWB in MVP | No (Phase 2) | Device coverage, complexity |
| E2E encryption | No (Phase 3) | Complexity, moderation needs |
| Message export | Not supported | Privacy (ephemeral by design) |
| Profile photo moderation | Manual report-based (MVP) | Speed to market |
| Maximum photos | 5 per user | Storage cost, simplicity |
| Chat message limit | 1000 chars | Encourage real conversation |
| Vibe duration | 60 minutes | Balance between relevance and fatigue |
| Hot zone minimum threshold | 3 users | Privacy |
