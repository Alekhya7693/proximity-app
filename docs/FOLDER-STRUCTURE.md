# PROXIMITY — Codebase Structure

---

## BACKEND (NestJS)

```
backend/
├── docker-compose.yml            # Dev: PostgreSQL + Redis
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env.example
├── .gitignore
│
├── src/
│   ├── main.ts                   # Bootstrap: CORS, validation, Swagger
│   ├── app.module.ts             # Root module
│   │
│   ├── config/
│   │   ├── database.config.ts    # TypeORM + PostGIS config
│   │   ├── redis.config.ts       # Redis connection config
│   │   └── feature-flags.ts      # Feature flag definitions
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── audit-log.interceptor.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── login.dto.ts
│   │   │   └── entities/
│   │   │       ├── user.entity.ts
│   │   │       └── session.entity.ts
│   │   │
│   │   ├── profile/
│   │   │   ├── profile.module.ts
│   │   │   ├── profile.controller.ts
│   │   │   ├── profile.service.ts
│   │   │   └── entities/
│   │   │       ├── profile.entity.ts
│   │   │       └── photo.entity.ts
│   │   │
│   │   ├── location/
│   │   │   ├── location.module.ts
│   │   │   ├── location.controller.ts
│   │   │   ├── location.service.ts
│   │   │   ├── redis-geo.service.ts
│   │   │   └── entities/
│   │   │       └── location-session.entity.ts
│   │   │
│   │   ├── discovery/
│   │   │   ├── discovery.module.ts
│   │   │   ├── discovery.controller.ts
│   │   │   └── discovery.service.ts
│   │   │
│   │   ├── match/
│   │   │   ├── match.module.ts
│   │   │   ├── match.controller.ts
│   │   │   ├── match.service.ts
│   │   │   └── entities/
│   │   │       ├── swipe.entity.ts
│   │   │       └── match.entity.ts
│   │   │
│   │   ├── chat/
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── chat.gateway.ts      # Socket.IO WebSocket
│   │   │   └── entities/
│   │   │       ├── chat.entity.ts
│   │   │       └── message.entity.ts
│   │   │
│   │   ├── vibe/
│   │   │   ├── vibe.module.ts
│   │   │   ├── vibe.controller.ts
│   │   │   ├── vibe.service.ts
│   │   │   └── entities/
│   │   │       └── vibe.entity.ts
│   │   │
│   │   ├── safety/
│   │   │   ├── safety.module.ts
│   │   │   ├── safety.controller.ts
│   │   │   ├── safety.service.ts
│   │   │   └── entities/
│   │   │       ├── report.entity.ts
│   │   │       └── block.entity.ts
│   │   │
│   │   └── notification/
│   │       ├── notification.module.ts
│   │       └── notification.service.ts
│   │
│   ├── jobs/
│   │   └── cleanup.processor.ts  # BullMQ job processors
│   │
│   └── database/
│       └── migrations/           # TypeORM migrations
│
└── test/
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

---

## MOBILE (React Native / Expo)

```
mobile/
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── .env.example
├── .gitignore
│
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
│
├── src/
│   ├── App.tsx                   # Root component
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx     # Auth vs Main split
│   │   ├── AuthNavigator.tsx     # Login, Register, etc.
│   │   ├── MainTabNavigator.tsx  # Bottom tabs
│   │   └── types.ts
│   │
│   ├── store/
│   │   ├── authStore.ts          # Zustand: auth state
│   │   ├── locationStore.ts      # Zustand: location
│   │   └── modeStore.ts          # Zustand: social/professional
│   │
│   ├── api/
│   │   ├── client.ts             # Axios instance + interceptors
│   │   ├── auth.ts
│   │   ├── discovery.ts
│   │   ├── matches.ts
│   │   ├── chat.ts
│   │   └── location.ts
│   │
│   ├── services/
│   │   ├── socket.ts             # Socket.IO client
│   │   ├── location.ts           # expo-location wrapper
│   │   └── notifications.ts      # Push notification setup
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── VerifyEmailScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   │
│   │   ├── onboarding/
│   │   │   ├── ProfileSetupScreen.tsx
│   │   │   ├── SocialPreferencesScreen.tsx
│   │   │   ├── ProfessionalPreferencesScreen.tsx
│   │   │   └── LocationPermissionScreen.tsx
│   │   │
│   │   └── main/
│   │       ├── DiscoverScreen.tsx
│   │       ├── MatchesScreen.tsx
│   │       ├── ChatListScreen.tsx
│   │       ├── ChatDetailScreen.tsx
│   │       ├── ProfileScreen.tsx
│   │       ├── ProfileDetailScreen.tsx
│   │       └── SettingsScreen.tsx
│   │
│   ├── components/
│   │   ├── SwipeCard.tsx
│   │   ├── MatchPromptModal.tsx
│   │   ├── VibeSelector.tsx
│   │   ├── ModeToggle.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── CompatibilityBadge.tsx
│   │   ├── EmptyState.tsx
│   │   └── InterestTag.tsx
│   │
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── ThemeContext.tsx
│   │
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       └── storage.ts
│
└── __tests__/
```

---

## ADMIN (Next.js)

```
admin/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── .env.example
├── .gitignore
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout + providers
│   │   ├── globals.css           # Tailwind + shadcn/ui CSS
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx          # Admin login
│   │   │
│   │   └── (dashboard)/
│   │       ├── layout.tsx        # Dashboard layout + sidebar
│   │       ├── page.tsx          # Dashboard home
│   │       │
│   │       ├── reports/
│   │       │   └── page.tsx      # Report queue
│   │       │
│   │       ├── users/
│   │       │   ├── page.tsx      # User search/management
│   │       │   └── [id]/
│   │       │       └── page.tsx  # User detail
│   │       │
│   │       └── analytics/
│   │           └── page.tsx      # Analytics dashboard
│   │
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── StatsCard.tsx
│   │   ├── DataTable.tsx
│   │   └── ReportActions.tsx
│   │
│   ├── lib/
│   │   ├── api.ts               # Admin API client
│   │   ├── auth.ts              # Auth utilities
│   │   └── utils.ts             # Helpers
│   │
│   └── types/
│       └── index.ts             # Admin entity types
│
└── public/
```
