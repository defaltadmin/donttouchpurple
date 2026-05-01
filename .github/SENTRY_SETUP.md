# Sentry Setup Guide - Don't Touch Purple

## Overview

Sentry is an error tracking and monitoring platform that captures crashes, exceptions, and user sessions in real-time. Your game now has two Sentry projects configured:

1. **Frontend (React app)**: `donttouchpurple-web`
2. **Backend (Firebase Cloud Functions)**: `donttouchpurple-functions`

This guide walks you through completing the setup.

---

## STEP 1: Create Free Sentry Account

1. Go to **https://sentry.io/auth/register/**
2. Sign up with email/GitHub (free tier: 10k errors/month)
3. Create organization name (e.g., "Don't Touch Purple")

---

## STEP 2: Create Frontend Project

1. From Sentry dashboard, click **Projects** → **Create Project**
2. Select **React** platform
3. Name: `donttouchpurple-web`
4. Set alert frequency: "one alert per minute"
5. Click **Create Project**
6. **Copy the DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

---

## STEP 3: Create Backend Project (Optional - For Cloud Functions)

1. Repeat Step 2 above
2. Select **Node.js** platform
3. Name: `donttouchpurple-functions`
4. **Copy the DSN**

---

## STEP 4: Add DSN to Environment Files

Frontend DSN is already set up in `.env.local` and `.env.production`:

### `.env.local` (Development)
```bash
VITE_SENTRY_DSN=https://YOUR_FRONTEND_DSN@ingest.sentry.io/YOUR_PROJECT_ID
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

### `.env.production` (Production/Deployed)
```bash
VITE_SENTRY_DSN=https://YOUR_FRONTEND_DSN@ingest.sentry.io/YOUR_PROJECT_ID
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Replace** `YOUR_FRONTEND_DSN` and `YOUR_PROJECT_ID` with values from Sentry dashboard.

---

## STEP 5: Test Sentry Integration

### Local Testing (Development)

1. Start dev server: `pnpm dev`
2. Open browser console and manually trigger error:
   ```javascript
   throw new Error("Test Sentry integration");
   ```
3. Error should appear in Sentry dashboard within 5-10 seconds
4. Check **Sentry → donttouchpurple-web → Issues** to see it

### Production Testing (After Deployment)

Once deployed to Firebase Hosting:
1. Navigate to https://dont-touch-purple.web.app
2. Trigger a game error or navigate to a non-existent page
3. Check Sentry dashboard → **Issues** tab

---

## What Sentry Now Tracks

✅ **Uncaught Exceptions**: JavaScript errors, crashes, null pointer exceptions

✅ **Error Boundaries**: React component rendering failures (captured in App.tsx ErrorBoundary)

✅ **Firebase Failures**: Failed database reads/writes (db initialization)

✅ **User Sessions**: Browser type, device, OS, location (basic telemetry)

✅ **Stack Traces**: Full error context with source maps (when available)

---

## Configuration Details

### Frontend (`main.tsx`)
- Sentry initializes at app startup
- DSN read from `.env.VITE_SENTRY_DSN`
- Environment sent with every error (dev vs prod)
- 10% of transactions traced (`tracesSampleRate: 0.1`)

### React Error Boundary (`App.tsx`)
- `componentDidCatch()` captures React errors
- Errors logged to Sentry with component stack
- User still sees error UI + reload button

### Firebase Service (`services/firebase.ts`)
- DB initialization errors captured
- Firebase exceptions tagged with `component: "firebase-init"`

---

## Sentry Dashboard Features

### Issues Tab
- View all errors grouped by type
- Click error to see full stack trace
- See affected users and browsers
- Mark as resolved

### Performance Tab
- See transaction times
- Identify slow operations

### Alerts Tab
- Get notified on new errors (email by default)
- Configure thresholds (e.g., alert if 10+ errors/minute)

### Release Tracking
- Link errors to specific app versions
- Track which version introduced bugs

---

## Next Steps (Optional Enhancements)

### 1. Add Version Tracking
```typescript
// In main.tsx, after Sentry.init():
Sentry.setTag("app_version", "5.1.0");
```

### 2. Capture Custom Events
```typescript
// Track important game milestones
Sentry.captureMessage(`Game Over: Score ${score}`, "info");
```

### 3. Set User Context
```typescript
// When player logs in or sets name
Sentry.setUser({ 
  username: playerName,
  ip_address: "{{ ip_address }}" // Sentry auto-captures
});
```

### 4. Tag Errors by Game Mode
```typescript
// In handleEngineGameOver
Sentry.setTag("game_mode", gameMode); // "classic" or "evolve"
Sentry.captureMessage(`Game Over`, "info");
```

### 5. Monitor Firebase Functions
```typescript
// In functions/src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN, // Backend project DSN
  environment: process.env.ENVIRONMENT || "production",
});
```

---

## Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN**: Verify `VITE_SENTRY_DSN` is correct
   ```bash
   cat .env.local | grep SENTRY
   ```

2. **Check Environment**: Ensure `VITE_SENTRY_ENVIRONMENT` is set
   ```bash
   cat .env.local | grep SENTRY_ENVIRONMENT
   ```

3. **Enable in Dev**: Development mode has `tracesSampleRate: 0.1` (only 10% of errors tracked by default for performance)
   - To test locally, increase to `1.0` temporarily

4. **Check Browser Console**: Look for Sentry initialization logs
   ```javascript
   console.log("Sentry DSN:", window.__SENTRY_DSN__);
   ```

### High Error Volume

- Reduce `tracesSampleRate` in `.env.production` (e.g., `0.05` = 5%)
- Adjust alert thresholds in Sentry dashboard
- Filter out known/acceptable errors in Sentry settings

---

## Security Notes

⚠️ **Never commit `.env.local` or `.env.production`** with real DSNs to git.
- Both files are in `.gitignore` ✅
- DSN is frontend-specific (not a secret) but still good practice to exclude

📌 **Set production DSN in Firebase hosting config** when deploying:
1. Firebase Console → Project Settings
2. Add `VITE_SENTRY_DSN` environment variable
3. Deploy: `firebase deploy`

---

## Free Tier Limits

- **10,000 errors/month** on free tier
- **5 team members**
- **90-day event retention**
- Enough for indie game (~100-500 active players)
- Scale up when hitting limits: $29/mo = 1 million errors/month

---

## Files Modified

- `main.tsx` — Sentry initialization
- `App.tsx` — Error boundary capture
- `services/firebase.ts` — Firebase error tracking
- `.env.local` — Development DSN config
- `.env.production` — Production DSN config
- `.gitignore` — Added `.env*` patterns
- `tsconfig.json` — Added Vite types

---

## Testing Checklist

- [ ] Sentry account created
- [ ] Frontend project created in Sentry
- [ ] Frontend DSN copied to `.env.local`
- [ ] Dev server started: `pnpm dev`
- [ ] Test error triggered in console: Appears in Sentry within 10s
- [ ] Error boundary tested: Breaks app → error captured
- [ ] Tests still pass: `pnpm test`
- [ ] Production DSN added to `.env.production`
- [ ] Firebase project DSN created (optional)

---

Ready to deploy! 🚀 Your game now has crash reporting.
