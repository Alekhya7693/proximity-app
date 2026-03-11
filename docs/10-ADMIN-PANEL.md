# PROXIMITY — Admin Panel Design

---

## TECH STACK

- **Framework:** Next.js 14 (App Router)
- **UI Library:** Shadcn/ui + Tailwind CSS
- **Charts:** Recharts
- **Tables:** TanStack Table
- **State:** React Query (TanStack Query)
- **Auth:** JWT with 2FA (TOTP)
- **Hosting:** Same domain as API or separate subdomain (admin.proximity.app)

---

## ADMIN ROLES

| Role | Access Level |
|------|-------------|
| **Super Admin** | Full system access, admin user management |
| **Moderator** | Report queue, user moderation (warn/suspend), content review |
| **Analyst** | Read-only analytics dashboards, no PII access |
| **Support** | User search, view reports (read-only), respond to inquiries |

---

## SCREEN BREAKDOWN

### A01: Admin Login
- Email + password
- 2FA TOTP verification (second step)
- Session timeout: 4 hours
- Failed login lockout: 5 attempts → 15 min lock

### A02: Dashboard (Home)
- **Key Metrics Cards:**
  - Total Users / Active Today / New Today
  - Matches Today / Chats Active
  - Reports Pending / Reports Today
  - Average Compatibility Score
- **Charts:**
  - User growth (line chart, 30 days)
  - Daily active users (bar chart, 14 days)
  - Matches per day (line chart, 14 days)
  - Mode split (pie chart: social vs professional)
- **Quick Actions:**
  - Jump to report queue (with pending count badge)
  - Jump to flagged users

### A03: Report Queue
- **Filters:** Status (pending/reviewing/resolved/dismissed), Severity (low/medium/high), Date range
- **Table Columns:** Report ID, Reporter (masked), Reported User, Reason, Severity, Status, Date, Actions
- **Actions per report:**
  - View details → opens report detail panel
  - Assign to self
  - Mark as reviewing
  - Resolve with action (warn/suspend/ban/dismiss)
- **Sort:** Default by severity DESC, then date ASC (oldest first)
- **Bulk Actions:** Assign multiple, dismiss multiple

### A04: Report Detail
- **Report Info:** Reason, description, context (profile/chat), date
- **Reported User Profile:** Avatar, display name, trust score, account age, previous reports count
- **Reporter Profile:** (minimal — just account age and report history)
- **Evidence:** Selected messages (if from chat context, and if preserved)
- **History:** Previous reports against this user, previous moderation actions
- **Actions:**
  - Dismiss report (with reason)
  - Warn user (sends notification)
  - Suspend user (7/14/30 days selector)
  - Ban user (permanent)
  - Escalate to super admin
- **Notes:** Internal notes field for moderator communication

### A05: User Management
- **Search:** By email, user ID, display name
- **Filters:** Status (active/suspended/banned/pending_deletion), Trust score range, Registration date range
- **Table Columns:** User ID, Email (masked for analyst), Display Name, Status, Trust Score, Registration Date, Last Active, Actions
- **User Detail Panel:**
  - Profile information
  - Account status
  - Trust score + breakdown
  - Report history (as reporter and reported)
  - Moderation action history
  - Match statistics (count, modes)
  - Session information
  - **Actions:** Warn, suspend, ban, unsuspend, unban, force password reset

### A06: User Detail Page
- **Tabs:**
  - Overview: Profile data, account info, trust score
  - Reports: All reports involving this user (as reporter and reported)
  - Moderation: All moderation actions taken against this user
  - Activity: Match count, chat count, vibe usage, survey completion
  - Sessions: Active sessions, device info, last login
- **Actions sidebar:** Quick actions (warn, suspend, ban)

### A07: Analytics Dashboard
- **User Analytics:**
  - Registration funnel (started → completed → active)
  - Retention curves (D1, D7, D30)
  - DAU / WAU / MAU trends
  - Mode preference distribution
  - Profile completeness distribution
- **Match Analytics:**
  - Matches per day/week
  - Match-to-chat conversion rate
  - Average compatibility score of matches
  - Say Hi vs Maybe Later ratio
  - Match duration (time to first message)
- **Chat Analytics:**
  - Active chats over time
  - Average chat duration (before lock)
  - Average messages per chat
  - Chat lock rate (% that get locked)
  - Chat completion rate (% that expire naturally vs user-initiated)
- **Hot Zone Analytics:**
  - Most active zones (map view)
  - Zone activity by time of day
  - Zone density trends
- **Vibe Analytics:**
  - Most popular vibes (by mode)
  - Vibe usage by time of day
  - Vibe impact on match rate
- **Survey Analytics:**
  - Completion rates per question
  - Response distribution per question
  - Survey fatigue metrics (dismissal rate)
  - Survey impact on match quality

### A08: Hot Zone Map (Admin View)
- Full map with ALL hot zones (no privacy threshold — admin view)
- Individual zone detail: exact user count, user list (IDs only), dominant vibes
- Historical overlay: activity patterns by time
- Anomaly detection: unusual spikes flagged

### A09: System Health
- API response time metrics
- WebSocket connection count
- Database connection pool status
- Redis memory usage
- Queue job status (pending/active/failed counts)
- Background job execution history
- Error rate trends

### A10: Audit Log Viewer
- **Filters:** Actor type (user/admin/system), action type, date range, resource type
- **Table:** Timestamp, Actor, Action, Resource, Details
- **Search:** By actor ID, resource ID
- **Export:** CSV export capability
- Append-only: no edit/delete capability

### A11: Admin User Management (Super Admin only)
- List admin users
- Create new admin user
- Assign/change roles
- Deactivate admin accounts
- View admin activity log
- Force password reset for admin

### A12: Content Moderation (Phase 2)
- Auto-flagged photos queue
- AI moderation confidence scores
- Bulk approve/reject
- False positive tracking

---

## ADMIN PANEL NAVIGATION

```
Sidebar:
├── Dashboard
├── Reports
│   ├── Queue (badge: pending count)
│   └── Resolved
├── Users
│   ├── Search
│   └── Flagged
├── Analytics
│   ├── Users
│   ├── Matches
│   ├── Chats
│   ├── Hot Zones
│   ├── Vibes
│   └── Surveys
├── Map (Hot Zones)
├── System
│   ├── Health
│   ├── Audit Logs
│   └── Jobs
└── Settings (Super Admin)
    ├── Admin Users
    ├── Feature Flags
    └── System Config
```

---

## ADMIN API SECURITY

```
All admin endpoints require:
1. Valid admin JWT token
2. Role check (middleware)
3. Audit log entry (automatic via interceptor)

Sensitive operations require:
- 2FA re-verification for: ban, unban, admin user changes, data export
- IP allowlisting (optional, configurable)
```
