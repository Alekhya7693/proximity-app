# Proximity

Privacy-first, location-based networking mobile app.

## Project Structure

```
proximity/
├── docs/                    # Architecture specs, PRD, TDD
│   ├── 01-ARCHITECTURE-SPEC.md
│   ├── 02-UX-SCREENS.md
│   ├── 03-MATCHING-ENGINE.md
│   ├── 04-GEOLOCATION-ZONES.md
│   ├── 05-DATABASE-SCHEMA.md
│   ├── 06-BACKEND-ARCHITECTURE.md
│   ├── 07-API-SPECIFICATION.md
│   ├── 08-SECURITY-PRIVACY.md
│   ├── 09-EDGE-CASES.md
│   ├── 10-ADMIN-PANEL.md
│   ├── 11-TECH-STACK-ROADMAP.md
│   ├── PRD.md
│   └── TECHNICAL-DESIGN-DOCUMENT.md
├── database/
│   └── schema.sql           # PostgreSQL + PostGIS schema
├── backend/                 # NestJS API server
├── mobile/                  # React Native (Expo) app
├── admin/                   # Next.js admin dashboard
└── shared/                  # Shared types (future)
```

## Quick Start

### Prerequisites
- Node.js 20 LTS
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

### Backend
```bash
cd backend
cp .env.example .env
docker-compose up -d          # Start PostgreSQL + Redis
npm install
npm run migration:run
npm run start:dev
```

### Mobile App
```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

### Admin Dashboard
```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

## Tech Stack
- **Mobile:** React Native (Expo) + TypeScript
- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL 16 + PostGIS 3.4
- **Cache/Queue:** Redis 7 + BullMQ
- **Real-time:** Socket.IO
- **Admin:** Next.js 14 + Tailwind + shadcn/ui
- **Storage:** AWS S3 / MinIO

## Documentation
See `docs/` for complete architecture specification.
