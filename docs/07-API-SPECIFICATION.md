# PROXIMITY — API Specification

---

## BASE URL
```
Production: https://api.proximity.app/api/v1
Development: http://localhost:3000/api/v1
```

## AUTHENTICATION
All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

---

## 1. AUTH ENDPOINTS

### POST /auth/register
**Purpose:** Create new user account
```json
// Request
{
  "email": "user@example.com",
  "password": "SecureP@ss1",
  "dateOfBirth": "1995-06-15",
  "gender": "male",
  "tosAccepted": true
}

// Response 201
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "status": "onboarding",
    "emailVerified": false
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}

// Errors
// 400: Validation error (password too weak, under 18, etc.)
// 409: Email already registered
```

### POST /auth/login
**Purpose:** Authenticate existing user
```json
// Request
{
  "email": "user@example.com",
  "password": "SecureP@ss1"
}

// Response 200
{
  "user": { "id": "uuid", "status": "active", ... },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}

// Errors
// 401: Invalid credentials
// 403: Account suspended (include reason)
// 410: Account pending deletion (include reactivation option)
```

### POST /auth/social
**Purpose:** Social sign-in (Apple/Google)
```json
// Request
{
  "provider": "apple",
  "idToken": "apple_or_google_id_token",
  "dateOfBirth": "1995-06-15",  // required for new users only
  "gender": "female"             // required for new users only
}

// Response 200 (existing user) or 201 (new user)
{
  "user": { ... },
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "isNewUser": true
}
```

### POST /auth/verify-email
**Purpose:** Verify email with 6-digit code
```json
// Request
{ "code": "123456" }

// Response 200
{ "verified": true }

// Errors
// 400: Invalid code
// 429: Too many attempts
// 410: Code expired
```

### POST /auth/resend-verification
**Purpose:** Resend verification email
```json
// Response 200
{ "sent": true, "cooldownSeconds": 60 }

// Errors
// 429: Rate limited (wait X seconds)
```

### POST /auth/forgot-password
```json
// Request
{ "email": "user@example.com" }

// Response 200 (always, even if email not found — prevents enumeration)
{ "sent": true }
```

### POST /auth/reset-password
```json
// Request
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecureP@ss2"
}

// Response 200
{ "reset": true }

// Errors
// 400: Token invalid/expired, password too weak
```

### POST /auth/refresh
```json
// Request
{ "refreshToken": "jwt..." }

// Response 200
{ "accessToken": "new_jwt...", "refreshToken": "new_jwt..." }
```

### POST /auth/logout
```json
// Request (authenticated)
{ "refreshToken": "jwt..." }

// Response 200
{ "loggedOut": true }
```

### DELETE /auth/account
**Purpose:** Request account deletion
```json
// Request (authenticated)
{ "password": "SecureP@ss1" }

// Response 200
{
  "deletionScheduledAt": "2024-01-01T10:00:00Z",
  "deletionDate": "2024-01-31T10:00:00Z",
  "message": "Your account will be deleted in 30 days. Log in again to cancel."
}
```

---

## 2. PROFILE ENDPOINTS

### GET /profile
**Purpose:** Get current user's profile
```json
// Response 200
{
  "id": "uuid",
  "displayName": "UrbanFox",
  "bioSocial": "Love hiking and coffee",
  "bioProfessional": "Tech lead, love building products",
  "avatarType": "photo",
  "photos": [
    { "id": "uuid", "url": "https://cdn.../photo1.jpg", "position": 0, "isPrimary": true }
  ],
  "profileCompleteness": 0.75,
  "gender": "male",
  "age": 28
}
```

### PATCH /profile
**Purpose:** Update profile fields
```json
// Request
{
  "displayName": "NewName",
  "bioSocial": "Updated bio",
  "bioProfessional": "Updated professional bio"
}

// Response 200
{ ...updatedProfile }
```

### POST /profile/photos
**Purpose:** Upload photo (multipart/form-data)
```
Content-Type: multipart/form-data
Body: file (image, max 5MB, jpg/png/webp)

// Response 201
{
  "id": "uuid",
  "url": "https://cdn.../photo.jpg",
  "position": 1,
  "isPrimary": false
}

// Errors
// 400: Invalid file type, too large
// 409: Maximum 5 photos reached
```

### DELETE /profile/photos/:photoId
```json
// Response 200
{ "deleted": true }
```

### POST /profile/avatar/generate
**Purpose:** Generate avatar
```json
// Request
{
  "style": "illustrated",
  "colors": ["#FF6B6B", "#4ECDC4"]
}

// Response 200
{
  "avatarUrl": "https://cdn.../avatar.svg",
  "style": "illustrated",
  "colors": ["#FF6B6B", "#4ECDC4"]
}
```

---

## 3. PREFERENCE ENDPOINTS

### GET /preferences/social
```json
// Response 200
{
  "lookingFor": ["friendship", "casual_chat"],
  "conversationStyles": ["deep_talks", "light_fun"],
  "ageMin": 22,
  "ageMax": 35,
  "genderPreference": [],
  "maxDistanceM": 300,
  "minMatchPct": 0,
  "interests": [
    { "id": "uuid", "name": "Hiking", "category": "lifestyle" },
    { "id": "uuid", "name": "Coffee Chats", "category": "social" }
  ]
}
```

### PUT /preferences/social
```json
// Request
{
  "lookingFor": ["friendship", "dating"],
  "conversationStyles": ["deep_talks"],
  "ageMin": 20,
  "ageMax": 40,
  "genderPreference": ["female"],
  "maxDistanceM": 300,
  "minMatchPct": 20,
  "interestIds": ["uuid1", "uuid2", "uuid3"]
}

// Response 200
{ ...updatedPreferences }

// Validation
// interestIds: minimum 3 required
// ageMin: >= 18
// maxDistanceM: 100-500
// minMatchPct: 0-80
```

### GET /preferences/professional
### PUT /preferences/professional
(Same structure as social with professional fields)

### GET /interests
**Purpose:** Get all available interests
```json
// Query: ?mode=social
// Response 200
{
  "interests": [
    {
      "id": "uuid",
      "name": "Hiking",
      "category": "lifestyle",
      "mode": "social",
      "icon": "🥾"
    },
    ...
  ]
}
```

---

## 4. DISCOVERY ENDPOINTS

### GET /discover/feed
**Purpose:** Get discovery feed
```json
// Query: ?page=1&limit=20
// Response 200
{
  "profiles": [
    {
      "id": "uuid",
      "displayName": "CosmicSage",
      "age": 26,
      "bio": "Short bio here",
      "photos": [{ "url": "...", "isPrimary": true }],
      "avatarUrl": "...",
      "compatibilityPct": 78,
      "sharedInterests": ["Hiking", "Coffee Chats", "Music"],
      "sharedInterestCount": 3,
      "vibe": { "label": "Coffee Chat", "icon": "☕" },
      "distanceLabel": "Very close",
      "mode": "social",
      "tier": 1
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "hasMore": true
  },
  "meta": {
    "nearbyCount": 45,
    "feedGeneration": "standard"
  }
}

// Empty state response (0 nearby)
{
  "profiles": [],
  "pagination": { ... },
  "meta": {
    "nearbyCount": 0,
    "feedGeneration": "empty",
    "suggestions": {
      "nearestHotZone": {
        "distance": 400,
        "activeCount": 8,
        "label": "~8 active nearby"
      },
      "expandRadius": true,
      "peakTimes": ["12pm-2pm", "6pm-8pm"]
    }
  }
}
```

### GET /discover/profile/:userId
**Purpose:** Get full profile detail for a discovered user
```json
// Response 200
{
  "id": "uuid",
  "displayName": "CosmicSage",
  "age": 26,
  "bio": "Longer bio here...",
  "photos": [...],
  "interests": [
    { "name": "Hiking", "category": "lifestyle", "isShared": true },
    { "name": "Photography", "category": "social", "isShared": false }
  ],
  "compatibilityPct": 78,
  "compatibilityBreakdown": {
    "sharedInterests": 5,
    "vibeMatch": true,
    "conversationStyleMatch": "similar"
  },
  "vibe": { "label": "Coffee Chat", "icon": "☕" },
  "mode": "social"
}
```

---

## 5. SWIPE ENDPOINTS

### POST /swipes
**Purpose:** Record a swipe action
```json
// Request
{
  "targetUserId": "uuid",
  "direction": "right"
}

// Response 200 (no match)
{
  "swiped": true,
  "match": null
}

// Response 200 (match!)
{
  "swiped": true,
  "match": {
    "id": "uuid",
    "matchedUser": {
      "id": "uuid",
      "displayName": "CosmicSage",
      "photoUrl": "...",
      "compatibilityPct": 78
    }
  }
}

// Errors
// 400: Cannot swipe on self, already swiped, user not in range
// 404: Target user not found or inactive
```

---

## 6. MATCH ENDPOINTS

### GET /matches
**Purpose:** Get all matches
```json
// Query: ?mode=social&status=all
// Response 200
{
  "matches": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "displayName": "CosmicSage",
        "photoUrl": "...",
        "compatibilityPct": 78
      },
      "status": "matched",
      "myAction": "pending",
      "theirAction": "say_hi",
      "mode": "social",
      "createdAt": "2024-01-01T10:00:00Z",
      "expiresAt": "2024-01-04T10:00:00Z"
    }
  ]
}
```

### POST /matches/:matchId/action
**Purpose:** Respond to match (Say Hi or Maybe Later)
```json
// Request
{ "action": "say_hi" }

// Response 200 (if both said hi, chat created)
{
  "match": { ...updatedMatch, "status": "chat_active" },
  "chat": { "id": "uuid", "status": "active" }
}

// Response 200 (if only one said hi)
{
  "match": { ...updatedMatch },
  "chat": null
}
```

---

## 7. CHAT ENDPOINTS

### GET /chats
**Purpose:** Get all chats
```json
// Query: ?filter=unread
// Response 200
{
  "chats": [
    {
      "id": "uuid",
      "matchId": "uuid",
      "user": {
        "id": "uuid",
        "displayName": "CosmicSage",
        "photoUrl": "..."
      },
      "status": "active",
      "lastMessage": {
        "content": "Hey, how's it going?",
        "senderId": "uuid",
        "createdAt": "2024-01-01T10:05:00Z"
      },
      "unreadCount": 2,
      "mode": "social",
      "lockedAt": null,
      "expiresAt": null,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### GET /chats/:chatId/messages
**Purpose:** Get paginated messages
```json
// Query: ?before=<messageId>&limit=50
// Response 200
{
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "content": "Hey!",
      "status": "read",
      "createdAt": "2024-01-01T10:01:00Z",
      "deliveredAt": "2024-01-01T10:01:01Z",
      "readAt": "2024-01-01T10:01:05Z"
    }
  ],
  "hasMore": true
}
```

### POST /chats/:chatId/messages
**Purpose:** Send a message (HTTP fallback for when WebSocket unavailable)
```json
// Request
{ "content": "Hey, nice to meet you!" }

// Response 201
{
  "id": "uuid",
  "senderId": "uuid",
  "content": "Hey, nice to meet you!",
  "status": "sent",
  "createdAt": "2024-01-01T10:01:00Z"
}

// Errors
// 403: Chat is locked (out of radius)
// 404: Chat not found
// 410: Chat expired
```

---

## 8. REAL-TIME EVENTS (WebSocket / Socket.IO)

### Client → Server Events
```
chat:join        { chatId }              // Join chat room
chat:leave       { chatId }              // Leave chat room
chat:message     { chatId, content }     // Send message
chat:typing      { chatId, isTyping }    // Typing indicator
chat:read        { chatId, messageId }   // Mark as read
location:update  { lat, lng, accuracy }  // Location update
```

### Server → Client Events
```
chat:message     { message }                  // New message received
chat:typing      { chatId, userId, isTyping } // Typing indicator
chat:read        { chatId, messageId }        // Read receipt
chat:status      { chatId, status, expiresAt }// Chat status change
match:new        { match }                    // New match notification
notification     { notification }             // General notification
```

---

## 9. VIBE ENDPOINTS

### GET /vibes/options
**Purpose:** Get available vibes for current mode
```json
// Response 200
{
  "vibes": [
    { "label": "Coffee Chat", "icon": "☕", "description": "Down for a chill conversation" },
    { "label": "Socializing", "icon": "🎉", "description": "Ready to meet people" }
  ]
}
```

### POST /vibes
**Purpose:** Set active vibe
```json
// Request
{ "label": "Coffee Chat" }

// Response 200
{
  "vibe": {
    "id": "uuid",
    "label": "Coffee Chat",
    "icon": "☕",
    "expiresAt": "2024-01-01T11:00:00Z",
    "isActive": true
  }
}
```

### DELETE /vibes/active
**Purpose:** Clear active vibe
```json
// Response 200
{ "cleared": true }
```

---

## 10. HOT ZONE ENDPOINTS

### GET /hot-zones
**Purpose:** Get nearby activity areas
```json
// Query: ?lat=40.7128&lng=-74.0060&radiusKm=5
// Response 200
{
  "zones": [
    {
      "id": "zone_hash",
      "center": { "lat": 40.7130, "lng": -74.0058 },
      "activeLabel": "~10 active",
      "activeCount": 10,
      "distanceM": 200,
      "dominantVibes": ["Coffee Chat", "Networking"],
      "modeBreakdown": { "social": 6, "professional": 4 }
    }
  ],
  "lastUpdated": "2024-01-01T10:00:00Z"
}

// Privacy: zones with < 3 users are excluded
// Counts are rounded (3-5 → "A few", 6-15 → nearest 5, 16+ → nearest 10)
```

---

## 11. LOCATION ENDPOINTS

### POST /location/update
**Purpose:** Update user location
```json
// Request
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 15.5,
  "timestamp": "2024-01-01T10:00:00Z"
}

// Response 200
{
  "zoneHash": "dr5regw",
  "zoneStatus": "active",
  "proximityConfidence": 0.75,
  "activeChatStatuses": [
    { "chatId": "uuid", "status": "active" },
    { "chatId": "uuid", "status": "locked" }
  ]
}

// Rate limit: max 1 per 5 seconds
// Errors
// 429: Rate limited
// 400: Suspicious location (spoof detected)
```

### POST /location/capability
**Purpose:** Register device capabilities (Phase 2)
```json
// Request
{
  "uwbSupported": true,
  "bluetoothLeSupported": true,
  "uwbPermissionGranted": false,
  "platform": "ios",
  "osVersion": "17.2",
  "deviceModel": "iPhone 15 Pro"
}

// Response 200
{ "registered": true }
```

---

## 12. SURVEY ENDPOINTS

### GET /surveys/next
**Purpose:** Get next survey question (if eligible)
```json
// Response 200 (question available)
{
  "question": {
    "id": "uuid",
    "text": "Do you prefer coffee chats or activity-based meetups?",
    "options": [
      { "value": "coffee", "label": "Coffee chats" },
      { "value": "activity", "label": "Activity-based meetups" },
      { "value": "both", "label": "Both equally" }
    ]
  }
}

// Response 204 (no question available — not eligible or fatigued)
```

### POST /surveys/:questionId/answer
```json
// Request
{ "answer": "coffee" }

// Response 200
{
  "answered": true,
  "totalAnswered": 7,
  "message": "Thanks! This helps us find better matches for you."
}
```

---

## 13. SETTINGS / NOTIFICATION ENDPOINTS

### GET /settings/notifications
```json
// Response 200
{
  "newMatches": true,
  "newMessages": true,
  "chatExpiring": true,
  "hotZoneAlerts": false,
  "surveyPrompts": true
}
```

### PATCH /settings/notifications
```json
// Request
{ "hotZoneAlerts": true }

// Response 200
{ ...updatedSettings }
```

### GET /settings/privacy
```json
{
  "showOnHotZoneMap": true,
  "showVibeToOthers": true,
  "allowUwbRanging": false,
  "locationPrecision": "standard"
}
```

### PATCH /settings/privacy
```json
// Request
{ "showOnHotZoneMap": false }
```

---

## 14. REPORTING ENDPOINTS

### POST /reports
```json
// Request
{
  "reportedUserId": "uuid",
  "reason": "harassment",
  "description": "Sent threatening messages",
  "context": "chat",
  "chatId": "uuid",
  "selectedMessageIds": ["uuid1", "uuid2"]
}

// Response 201
{
  "reportId": "uuid",
  "status": "pending",
  "message": "Thank you. We'll review this within 24 hours."
}
```

### POST /blocks
```json
// Request
{ "blockedUserId": "uuid" }

// Response 201
{ "blocked": true }
```

### DELETE /blocks/:blockedUserId
```json
// Response 200
{ "unblocked": true }
```

---

## 15. ADMIN ENDPOINTS (requires admin auth)

### POST /admin/auth/login
### GET /admin/reports?status=pending&severity=high&page=1
### PATCH /admin/reports/:id
```json
// Request
{
  "status": "resolved",
  "action": "suspend",
  "durationDays": 7,
  "reason": "Harassment confirmed"
}
```

### GET /admin/users?search=email@example.com
### GET /admin/users/:id (full user detail including trust score, reports, etc.)
### POST /admin/users/:id/suspend
### POST /admin/users/:id/ban
### POST /admin/users/:id/unsuspend
### GET /admin/analytics/overview
```json
// Response 200
{
  "totalUsers": 10240,
  "activeUsersToday": 1832,
  "matchesToday": 456,
  "chatsActive": 234,
  "reportsToday": 12,
  "reportsPending": 8,
  "topHotZones": [...],
  "topVibes": [...]
}
```

---

## RATE LIMITS

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| Auth (login/register) | 10 | 15 min |
| Auth (verification) | 5 | 15 min |
| Profile updates | 30 | 1 min |
| Feed/discovery | 60 | 1 min |
| Swipes | 100 | 1 min |
| Messages (HTTP) | 30 | 1 min |
| Location updates | 12 | 1 min |
| Reports | 5 | 1 hour |
| General API | 100 | 1 min |

---

## ERROR FORMAT

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```
