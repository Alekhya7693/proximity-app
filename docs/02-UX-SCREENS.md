# PROXIMITY — Screen-by-Screen UX Breakdown

---

## NAVIGATION STRUCTURE

**Bottom Tab Bar (4 tabs):**
```
┌────────┬────────┬────────┬────────┐
│ Discover│ Matches│  Chat  │Profile │
│   🔍   │   ❤️   │   💬   │   👤   │
└────────┴────────┴────────┴────────┘
```

**Top Bar:**
```
┌─────────────────────────────────────┐
│ [Mode Toggle]  PROXIMITY  [Vibe ⚡] │
└─────────────────────────────────────┘
```

---

## SCREEN CATALOG

### S01: Splash Screen
- **Purpose:** Brand introduction, auth state check
- **Elements:** App logo, gradient background, loading indicator
- **Actions:** Auto-navigate to Login (if no session) or Home (if session valid)
- **States:** Loading → redirect
- **Duration:** 1.5 seconds max

### S02: Sign Up
- **Purpose:** New user registration
- **Elements:**
  - App logo (small)
  - Email input field
  - Password input field (with show/hide toggle)
  - Confirm password field
  - Date of birth picker (for age gate)
  - "Create Account" button
  - "Already have an account? Log in" link
  - Social sign-in buttons (Apple, Google)
  - Terms & Privacy Policy links (must check to proceed)
- **Actions:** Submit registration, navigate to social auth, navigate to login
- **States:**
  - Default: empty form
  - Validating: inline field errors
  - Submitting: button loading state
  - Error: server error banner
  - Under 18: "You must be 18+ to use Proximity" → blocked
- **Validation:**
  - Email: valid format, not already registered
  - Password: min 8 chars, 1 uppercase, 1 number
  - DOB: must be 18+

### S03: Email Verification
- **Purpose:** Verify email ownership
- **Elements:**
  - "Check your email" message with email displayed
  - 6-digit code input (auto-focus, auto-advance)
  - "Resend code" link (with 60s cooldown)
  - "Change email" link
- **Actions:** Submit code, resend, go back
- **States:** Default, Invalid code, Expired code, Max attempts reached, Success

### S04: Login
- **Purpose:** Existing user authentication
- **Elements:**
  - Email input
  - Password input (show/hide)
  - "Log In" button
  - "Forgot Password?" link
  - Social sign-in buttons
  - "Don't have an account? Sign Up" link
- **Actions:** Submit login, navigate to forgot password, navigate to sign up
- **States:** Default, Validating, Error (wrong credentials), Account suspended, Account pending deletion (offer reactivation)

### S05: Forgot Password
- **Purpose:** Initiate password reset
- **Elements:**
  - Email input
  - "Send Reset Link" button
  - Back to login link
- **Actions:** Submit email
- **States:** Default, Email sent confirmation, Email not found error

### S06: Reset Password
- **Purpose:** Set new password via reset link
- **Elements:**
  - New password input
  - Confirm password input
  - "Reset Password" button
- **Actions:** Submit new password
- **States:** Default, Success (redirect to login), Link expired, Validation error

### S07: Onboarding — Profile Setup
- **Purpose:** Collect basic profile info
- **Elements:**
  - Photo upload area (circular, tap to add)
  - "Use Avatar Instead" option
  - Display name input (optional, placeholder: "or we'll pick a cool name for you")
  - Gender selector (chips: Male, Female, Non-binary, Prefer not to say)
  - Short bio textarea (optional, max 200 chars, character counter)
  - "Next" button
- **Actions:** Upload photo, pick avatar, fill fields, proceed
- **States:** Default, Photo uploading, Photo upload error, Skipped (valid)

### S08: Onboarding — Avatar Selection (if no photo)
- **Purpose:** Generate avatar for users who skip photo
- **Elements:**
  - Style picker (Illustrated, Abstract, Geometric, Minimal)
  - Color palette picker (6 color options)
  - Preview of generated avatar
  - "Regenerate" button
  - "Use This Avatar" button
- **Actions:** Select style, select colors, regenerate, confirm
- **States:** Generating, Preview, Confirmed

### S09: Onboarding — Social Preferences
- **Purpose:** Set Social Mode interests
- **Elements:**
  - Section header: "What are you into? (Social)"
  - Category sections with selectable chips/tags
  - Minimum selection indicator ("Select at least 3")
  - "Next" button (disabled until 3+ selected)
  - "Skip for now" link
- **Categories displayed:**
  - Lifestyle tags
  - Social Interest tags
  - Conversation Style tags
  - Looking For tags
- **Actions:** Select/deselect tags, proceed, skip
- **States:** Default, Minimum met (button enabled), Skipped

### S10: Onboarding — Professional Preferences
- **Purpose:** Set Professional Mode interests
- **Elements:** Same structure as S09 but with professional categories
- **Categories:**
  - Industry tags
  - Professional Interest tags
  - Experience Level (single select)
  - Conversation Style tags
- **Actions:** Same as S09
- **States:** Same as S09

### S11: Onboarding — Location Permission
- **Purpose:** Request and explain location permission
- **Elements:**
  - Illustration showing proximity concept
  - Headline: "Proximity needs your location to find people nearby"
  - Explanation bullets:
    - "We'll show you compatible people within 300m"
    - "Your exact location is never shared with others"
    - "You can disable this anytime"
  - "Enable Location" button (triggers OS permission dialog)
  - "Maybe Later" link (limited mode)
- **Actions:** Grant permission, skip
- **States:**
  - Default (pre-permission)
  - Permission granted → proceed to home
  - Permission denied → limited mode explanation screen
  - Permission "Ask Next Time" (iOS) → re-prompt strategy

### S12: Onboarding — Mode Selection
- **Purpose:** Choose starting mode
- **Elements:**
  - Two large selectable cards:
    - Social Mode card (warm colors, social icon, description)
    - Professional Mode card (cool colors, briefcase icon, description)
  - "You can switch anytime" note
  - "Get Started" button
- **Actions:** Select mode, proceed to home
- **States:** Social selected, Professional selected

### S13: Home / Discovery Feed
- **Purpose:** Core discovery experience — browse nearby profiles
- **Elements:**
  - Top bar: Mode toggle (left), "PROXIMITY" title (center), Vibe button (right)
  - Stacked card deck (Tinder-style swipe cards)
  - Each card shows:
    - Photo or avatar (full card background)
    - Pseudo name / display name (bottom overlay)
    - Age
    - Compatibility % badge
    - Active vibe (if set, shown as pill)
    - Top 3 shared interest tags
    - Distance indicator (fuzzy: "Very close", "Nearby", "Within range")
  - Action buttons below cards:
    - ✕ (pass) — left
    - ★ (view profile) — center
    - ✓ (like) — right
  - Bottom tab bar
- **Actions:** Swipe right (like), swipe left (pass), tap for detail, tap vibe button
- **States:**
  - Loading: skeleton cards
  - Active feed: cards available
  - Empty — no nearby users:
    ```
    ┌─────────────────────────┐
    │                         │
    │   🔍 No one nearby      │
    │                         │
    │  Check out active areas │
    │  [View Hot Zones →]     │
    │                         │
    │  Or come back later!    │
    │                         │
    └─────────────────────────┘
    ```
  - End of feed: "You've seen everyone nearby" → refresh option
  - Location disabled: prompt to enable
  - Mode-specific theming (warm vs cool colors)

### S14: Profile Detail (Other User)
- **Purpose:** Full profile view before swiping
- **Elements:**
  - Photo gallery (swipeable if multiple)
  - Display name / pseudonym
  - Age
  - Compatibility % with breakdown:
    - "You share 5 interests"
    - "Similar conversation style"
    - Vibe alignment indicator
  - Bio (if provided)
  - Interest tags (all, with shared ones highlighted)
  - Active vibe (if set)
  - Mode badge (Social / Professional)
  - Action buttons: Pass (✕), Like (✓)
  - "Report" option (kebab menu)
  - "Block" option (kebab menu)
- **Actions:** Like, pass, report, block, close
- **States:** Default, Reported (confirmation), Blocked (removed from feed)

### S15: Match Prompt Modal
- **Purpose:** Celebrate match, prompt action
- **Elements:**
  - Celebration animation (confetti for social, handshake for professional)
  - "It's a Match!" heading
  - Both user avatars/photos side by side
  - Compatibility % displayed
  - "Say Hi" button (primary, prominent)
  - "Maybe Later" button (secondary, subtle)
- **Actions:** Say Hi → open chat, Maybe Later → save to matches list
- **States:** Just matched (celebration), Already seen (from matches list)
- **Behavior:**
  - Modal appears over current screen
  - Cannot dismiss by tapping outside (must choose)
  - If app was backgrounded, shows on next app open

### S16: Matches List
- **Purpose:** View all matches
- **Elements:**
  - Segmented filter: "All" | "Social" | "Professional"
  - List of match cards:
    - Avatar/photo (circular)
    - Display name / pseudonym
    - Compatibility %
    - Match time ("Matched 2h ago")
    - Status badge: "Say Hi ✨" (if no chat yet), "Active 💬", "Locked 🔒", "Expiring ⏰"
  - Empty state: "No matches yet — keep exploring!"
- **Actions:** Tap match → open chat (or prompt to Say Hi if pending), pull to refresh
- **States:** Loading, Empty, Populated, Match expired (removed from list)

### S17: Chat List
- **Purpose:** View all conversations
- **Elements:**
  - Segmented filter: "All" | "Unread" (+ badge count)
  - Mode tags on each chat (Social / Professional)
  - List items:
    - Avatar/photo (circular)
    - Display name / pseudonym
    - Last message preview (truncated)
    - Timestamp
    - Unread badge (count)
    - Status indicator:
      - Green dot = Active (in radius)
      - Grey = Locked (out of radius)
      - Red clock = Expiring soon (< 24h)
  - Empty state: "No conversations yet — match with someone nearby!"
- **Actions:** Tap → open chat, swipe to archive/delete
- **States:** Loading, Empty, Populated, Filter active

### S18: Chat Detail
- **Purpose:** Active conversation
- **Elements:**
  - Header:
    - Back arrow
    - Avatar + name
    - Status: "Active" (green) or "Locked" (grey)
    - Kebab menu (Report, Block, View Profile)
  - Message list:
    - Sent messages (right-aligned, primary color)
    - Received messages (left-aligned, grey)
    - Timestamps (grouped by time)
    - Read receipts (✓ sent, ✓✓ delivered, colored ✓✓ read)
    - Typing indicator (animated dots)
  - Input bar:
    - Text input
    - Send button
    - Character counter (near 1000 limit)
  - Chat status banner (if locked):
    ```
    ┌──────────────────────────────────┐
    │ 🔒 Chat locked — you've moved   │
    │ apart. Returns if you're nearby  │
    │ again. Expires in 2d 14h.        │
    └──────────────────────────────────┘
    ```
- **Actions:** Send message, view profile, report, block
- **States:**
  - Active: full messaging enabled
  - Locked: input disabled, greyed messages, expiry countdown
  - Expiring: same as locked + "Expiring soon" banner
  - Expired: "This conversation has ended" → removed from list

### S19: Vibe Selection Modal
- **Purpose:** Set temporary intent/mood
- **Elements:**
  - Bottom sheet modal
  - "Set Your Vibe" heading
  - Grid of vibe options (mode-specific)
  - Each option: icon + label
  - Selected state highlight
  - Duration indicator: "Active for 60 min"
  - "Set Vibe" button
  - "Clear Vibe" button (if vibe already active)
  - "Skip" button
- **Actions:** Select vibe, set, clear, dismiss
- **States:** No vibe set, Vibe active (shows current), Selection mode

### S20: Hot Zone Map
- **Purpose:** See anonymous activity areas nearby
- **Elements:**
  - Full-screen map (MapLibre or Mapbox)
  - User location (blue dot, NOT exact to others)
  - Activity clusters (circular heat indicators)
  - Cluster tap: shows count ("~10 active"), dominant vibes, distance
  - "Back to Feed" button
  - Legend: "🔴 Very Active  🟡 Active  🔵 A Few People"
  - Refresh indicator
- **Actions:** Pan/zoom map, tap clusters, return to feed
- **States:** Loading, No hot zones nearby, Hot zones visible, Map error

### S21: Filters Screen
- **Purpose:** Refine discovery preferences
- **Elements:**
  - Age range slider (18-99, dual thumb)
  - Gender filter (multi-select chips: All, Male, Female, Non-binary)
  - Maximum distance slider (100m-500m)
  - Minimum match % slider (0%-80%)
  - Interest filter (expandable category list with checkboxes)
  - "Apply Filters" button
  - "Reset to Defaults" link
- **Actions:** Adjust filters, apply, reset
- **States:** Default values, Modified (shows changes), Applied

### S22: Settings Screen
- **Purpose:** App configuration
- **Elements:** Hierarchical list as defined in section 4.13
- **Actions:** Navigate to sub-screens
- **States:** Standard list

### S23: Edit Profile Screen
- **Purpose:** Update profile information
- **Elements:**
  - Photo editor (reorder, add, remove)
  - Display name field
  - Bio field with character counter
  - Avatar regeneration option
- **Actions:** Edit, save, cancel
- **States:** Viewing, Editing, Saving, Saved (success toast)

### S24: Report Flow
- **Purpose:** Report a user
- **Elements:**
  - Reason selector (radio buttons):
    - Harassment
    - Fake Profile
    - Spam
    - Inappropriate Behavior
    - Unsafe Conduct
    - Other
  - Description field (optional, max 500 chars)
  - Message selector (if from chat context — checkboxes next to messages)
  - "Submit Report" button
  - Confirmation: "Thank you. We'll review this within 24 hours."
- **Actions:** Select reason, describe, submit
- **States:** Selection, Describing, Submitting, Submitted

### S25: Block Confirmation
- **Purpose:** Confirm blocking action
- **Elements:**
  - Alert dialog: "Block [name]?"
  - Description: "They won't be able to see or contact you. You won't see them either."
  - "Block" button (destructive style)
  - "Cancel" button
- **Actions:** Confirm block, cancel
- **States:** Confirmation, Blocked (returns to previous screen)

### S26: Account Deletion Flow
- **Purpose:** Delete account with grace period
- **Elements:**
  - Warning: "Your account will be scheduled for deletion"
  - Explanation: "You have 30 days to change your mind by logging back in"
  - What gets deleted: list of data types
  - Password confirmation field
  - "Delete My Account" button (destructive)
  - "Keep My Account" button
- **Actions:** Confirm deletion, cancel
- **States:** Warning, Confirming, Deleted (logged out)

---

## UI DIFFERENTIATION BY MODE

### Social Mode Theme
```
Primary:     #FF6B6B (Coral)
Secondary:   #FFA940 (Amber)
Background:  #FFF9F5 (Warm white)
Card bg:     #FFFFFF
Text:        #2D2D2D
Subtle:      #8E8E93
Accent:      Linear gradient (Coral → Amber)
Border radius: 16px (rounded, friendly)
Font weight:  Regular body, Bold headers
Match animation: Confetti burst
```

### Professional Mode Theme
```
Primary:     #1A365D (Navy)
Secondary:   #0BC5EA (Cyan)
Background:  #F7FAFC (Cool white)
Card bg:     #FFFFFF
Text:        #1A202C
Subtle:      #718096
Accent:      Linear gradient (Navy → Teal)
Border radius: 8px (structured, clean)
Font weight:  Medium body, Semibold headers
Match animation: Handshake icon + subtle glow
```
