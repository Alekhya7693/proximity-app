# MYKO App — Launch Checklist (Android & iOS)

## Pre-Launch Setup (One-Time)

### 1. EAS Project Initialization
```bash
cd mobile
npx eas-cli login          # Login with Expo account
npx eas-cli init           # Creates project & returns projectId
```
Then replace `YOUR_EAS_PROJECT_ID` in:
- `mobile/app.json` → `expo.extra.eas.projectId`
- `mobile/app.json` → `expo.updates.url`

### 2. App Store Assets (REQUIRED)
Replace placeholder images in `mobile/assets/` with production artwork:
| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024x1024 | App Store & Play Store icon |
| `adaptive-icon.png` | 1024x1024 | Android adaptive icon (foreground layer) |
| `splash.png` | 1284x2778 | Launch splash screen |
| `notification-icon.png` | 96x96 | Android notification icon (white on transparent) |

Run `node scripts/generate-assets.js` for SVG templates you can use as starting points.

### 3. iOS Certificates & Provisioning
```bash
cd mobile
npx eas-cli credentials     # Interactive setup for iOS certificates
```
EAS handles this automatically on first build, or configure manually in Apple Developer Portal.

### 4. Android Signing Key
EAS generates and manages the keystore automatically on first build.
To use your own:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore myko-release.keystore -alias myko -keyalg RSA -keysize 2048 -validity 10000
npx eas-cli credentials     # Upload keystore
```

### 5. Google Maps API Key
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create API key with Maps SDK for Android & iOS enabled
3. Add key to `mobile/.env` as `GOOGLE_MAPS_API_KEY`
4. Add key to `eas.json` build profile env vars

### 6. Push Notifications (Firebase)
1. Create Firebase project at https://console.firebase.google.com
2. Add Android app (com.myko.app) → download `google-services.json`
3. Add iOS app (com.myko.app) → download `GoogleService-Info.plist`
4. Upload FCM server key to Expo push notification service:
   ```bash
   npx eas-cli credentials
   ```

---

## Backend Deployment

### 7. Database Migration
```bash
cd backend

# CRITICAL: Set DB_SYNCHRONIZE=false in production .env
# Generate migration from current entities:
npm run migration:generate

# Run migration on production database:
NODE_ENV=production npm run migration:run
```

### 8. Production Environment
Copy `backend/.env.production` and fill in real values:
- [ ] `DATABASE_URL` — Production PostgreSQL connection string
- [ ] `JWT_SECRET` — Strong random string (min 64 chars): `openssl rand -base64 64`
- [ ] `REDIS_HOST` / `REDIS_PASSWORD` — Production Redis
- [ ] `CORS_ORIGINS` — Production domain(s)

### 9. Backend Hosting
Deploy to your chosen platform:
- **Railway / Render / Fly.io**: Connect Git repo, set env vars
- **AWS / GCP / Azure**: Use `backend/Dockerfile` for container deployment
- **Docker Compose**: Use `backend/docker-compose.yml` for self-hosted

Health check endpoints:
- `GET /api/v1/health` — Full health check with DB status
- `GET /api/v1/health/live` — Liveness probe (for k8s)
- `GET /api/v1/health/ready` — Readiness probe (for k8s)

---

## Mobile Builds

### 10. Development Build (Testing)
```bash
cd mobile
npm run build:dev
# OR for specific platform:
npx eas-cli build --profile development --platform ios
npx eas-cli build --profile development --platform android
```

### 11. Preview Build (Internal Testing)
```bash
npm run build:preview
```
Distribute via EAS internal distribution or TestFlight (iOS) / Internal Testing (Android).

### 12. Production Build
```bash
npm run build:prod
# OR platform-specific:
npm run build:ios
npm run build:android
```

### 13. App Store Submission
```bash
# iOS — Submit to App Store Connect
npm run submit:ios

# Android — Submit to Google Play Console
npm run submit:android
```

---

## Store Listing Requirements

### Apple App Store
- [ ] App name: MYKO
- [ ] Subtitle: Meet by Chance. Konnect by Choice.
- [ ] Category: Social Networking
- [ ] Screenshots: 6.7" (iPhone 14 Pro Max), 6.5" (iPhone 11 Pro Max), 5.5" (iPhone 8 Plus)
- [ ] iPad screenshots (if supporting tablet)
- [ ] App description (max 4000 chars)
- [ ] Keywords (max 100 chars)
- [ ] Privacy Policy URL: https://myko.app/privacy
- [ ] Support URL: https://myko.app/support
- [ ] Age Rating: 17+ (social networking with location)
- [ ] App Review Information (demo account credentials)

### Google Play Store
- [ ] App title: MYKO
- [ ] Short description (max 80 chars)
- [ ] Full description (max 4000 chars)
- [ ] Screenshots: Phone (min 2), 7-inch tablet, 10-inch tablet
- [ ] Feature graphic: 1024x500 px
- [ ] Content rating questionnaire
- [ ] Privacy Policy URL
- [ ] Target audience: 18+
- [ ] Data safety form

---

## Post-Launch

### 14. OTA Updates
After first store approval, push JS-only updates without new builds:
```bash
cd mobile
npx eas-cli update --branch production --message "Bug fix description"
```

### 15. Monitoring
- [ ] Set up error tracking (Sentry, Bugsnag)
- [ ] Enable Expo crash reports
- [ ] Backend logging service (Datadog, CloudWatch)
- [ ] Uptime monitoring for health endpoints

### 16. Analytics
- [ ] App analytics (Firebase Analytics, Mixpanel)
- [ ] Backend metrics (API response times, user growth)

---

## Configuration Files Summary

| File | Purpose | Contains Secrets? |
|------|---------|-------------------|
| `mobile/app.json` | Expo app configuration | No |
| `mobile/eas.json` | EAS build profiles | No (commit to git) |
| `mobile/.env` | Local dev environment | Yes (gitignored) |
| `mobile/.env.production` | Production env template | Yes (gitignored) |
| `backend/.env` | Local dev environment | Yes (gitignored) |
| `backend/.env.production` | Production env template | Yes (gitignored) |
| `mobile/src/config/env.ts` | Runtime env config | No |
