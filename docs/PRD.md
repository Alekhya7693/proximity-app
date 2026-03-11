# PROXIMITY — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 2026-03-07
**Status:** Ready for Engineering

---

## 1. PRODUCT OVERVIEW

### 1.1 Product Name
Proximity

### 1.2 Elevator Pitch
Proximity is a privacy-first mobile app that connects people who are physically nearby, supporting both social and professional networking through real-time, location-aware matching and temporary chat.

### 1.3 Problem Statement
Meeting new people in physical proximity is challenging:
- Approaching strangers is awkward and intimidating
- Existing networking apps don't leverage real-time physical proximity
- Users want to connect but don't want to share personal contact info upfront
- Professional networking at events lacks a digital bridge for in-person encounters
- No tool bridges the gap between "being in the same space" and "starting a conversation"

### 1.4 Target Users
- **Primary:** Urban adults (18-35) who frequent cafes, coworking spaces, campuses, events
- **Secondary:** Professional networkers at conferences, meetups, and coworking spaces
- **Tertiary:** Event attendees looking for in-person connections

### 1.5 Success Criteria (MVP)
| Metric | Target | Measurement |
|--------|--------|-------------|
| DAU/MAU | >25% | Analytics |
| Match-to-Chat conversion | >40% | Backend metrics |
| Average messages per chat | >5 | Backend metrics |
| Report rate | <5 per 1000 matches | Moderation dashboard |
| 7-day retention | >30% | Analytics |
| App Store rating | >4.0 | Store reviews |
| Feed non-empty rate | >85% | Backend metrics |

---

## 2. USER STORIES

### 2.1 Registration & Auth
| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-01 | New user | Register with email + password | I can create an account | P0 |
| US-02 | New user | Verify my email | My account is secured | P0 |
| US-03 | User | Log in with credentials | I can access my account | P0 |
| US-04 | User | Reset my password | I can recover my account | P0 |
| US-05 | User | Sign in with Apple/Google | Registration is faster | P1 |
| US-06 | User | Delete my account | My data is removed | P0 |

### 2.2 Onboarding
| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-10 | New user | Set up my profile (name, photo, bio) | Others can learn about me | P0 |
| US-11 | New user | Select my social interests | I get relevant social matches | P0 |
| US-12 | New user | Select professional interests | I get relevant professional matches | P0 |
| US-13 | New user | Use a pseudonym instead of my real name | My privacy is protected | P0 |
| US-14 | New user | Use a generated avatar instead of a photo | I don't need to share my face | P1 |

### 2.3 Discovery
| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-20 | User | See nearby compatible profiles | I can discover people around me | P0 |
| US-21 | User | Swipe right to express interest | I can indicate I want to connect | P0 |
| US-22 | User | Swipe left to pass | I can skip uninteresting profiles | P0 |
| US-23 | User | See compatibility percentage | I know how well we might connect | P0 |
| US-24 | User | Filter by age, gender, interests | I see more relevant profiles | P1 |
| US-25 | User | See shared interests highlighted | I know what we have in common | P0 |

### 2.4 Matching & Chat
| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-30 | User | Be notified of mutual matches | I know when someone likes me back | P0 |
| US-31 | User | Choose "Say Hi" or "Maybe Later" on match | I control when to start chatting | P0 |
| US-32 | User | Chat in real-time with matches | We can have a conversation | P0 |
| US-33 | User | See when my chat is locked (left area) | I understand why I can't message | P0 |
| US-34 | User | Have locked chats auto-delete after 3 days | Old conversations are cleaned up | P0 |
| US-35 | User | View all matches in a list | I can manage my connections | P0 |
| US-36 | User | See typing indicators and read receipts | I know my message status | P1 |

### 2.5 Dual Mode
| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-40 | User | Switch between Social and Professional modes | I use the right context | P0 |
| US-41 | User | Have separate preferences per mode | My networking is contextual | P0 |
| US-42 | User | See distinct visual themes per mode | I always know which mode I'm in | P0 |

### 2.6 Vibe Check
| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-50 | User | Set a temporary vibe/intent | Others know what I'm looking for | P1 |
| US-51 | User | See others' active vibes | I can prioritize aligned connections | P1 |
| US-52 | User | Have vibes auto-expire | I don't forget to update my status | P1 |

### 2.7 Safety
| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-60 | User | Report inappropriate users | The community stays safe | P0 |
| US-61 | User | Block users | I don't see or hear from them | P0 |
| US-62 | User | Feel confident my location isn't exposed | My physical safety is protected | P0 |

---

## 3. FEATURE PRIORITY MATRIX

### P0 — Must Have (MVP)
- Email registration + login + verification + password reset
- Profile setup (name/pseudonym, photo/avatar, bio, gender, age)
- Interest selection (social + professional)
- Location-based discovery feed (GPS)
- Swipe right/left
- Mutual matching with Say Hi / Maybe Later
- Real-time chat (WebSocket)
- Chat locking (out of radius) + auto-deletion
- Dual mode (social/professional) with separate feeds
- Report + block
- Push notifications (match, message, chat lock)
- Settings (profile, preferences, notifications)
- Age gate (18+)

### P1 — Should Have (MVP stretch / Phase 2 early)
- Apple/Google sign-in
- Vibe Check feature
- Avatar generation (styled)
- Filters (age, gender, distance, match %)
- Typing indicators + read receipts
- All/unread chat filter
- Profile completeness indicator
- Compatibility breakdown on profile

### P2 — Nice to Have (Phase 2)
- Hot Zone Map
- Micro-survey system
- Zone-contextual pseudonym rotation
- UWB-assisted proximity
- Bluetooth LE proximity
- Admin dashboard
- Photo moderation (AI)
- Data export (GDPR)
- Recommendation explanations

### P3 — Future (Phase 3-4)
- E2E encryption
- Event features
- Referral system
- Premium tier
- Group discovery
- Multi-language

---

## 4. OUT OF SCOPE (MVP)

- Video/audio calling
- Group chat
- Status/story/feed posting
- Payment/subscription system
- Desktop/web app
- Offline mode
- Age verification (beyond DOB declaration)
- Integration with other social platforms

---

## 5. CONSTRAINTS AND DEPENDENCIES

### Technical Constraints
- iOS 15+ and Android 12+ minimum support
- Location permission required for core functionality
- Internet connection required (no offline mode)
- Push notification support required for full experience

### External Dependencies
- Apple App Store review process
- Google Play Store review process
- FCM for push notifications
- AWS/cloud provider for infrastructure
- PostGIS for spatial queries

### Legal/Compliance
- Privacy Policy required before launch
- Terms of Service required before launch
- GDPR considerations for EU users (Phase 2)
- CCPA considerations for California users (Phase 2)
- Age verification compliance varies by jurisdiction

---

## 6. RELEASE CRITERIA

### MVP Launch Checklist
- [ ] All P0 features implemented and tested
- [ ] Performance: feed generation < 200ms p95
- [ ] Security: auth, rate limits, spoof detection operational
- [ ] Privacy: no coordinate exposure to clients verified
- [ ] Stability: < 1% crash rate
- [ ] App Store assets (screenshots, descriptions, icons) prepared
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Support email configured
- [ ] Monitoring and alerting set up
- [ ] Backup and recovery tested
