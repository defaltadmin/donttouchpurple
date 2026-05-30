# Services + Workers Audit — 2026-05-30

## Security Assessment: STRONG

### SEC-001 (Critical from previous audit): RESOLVED
- VITE_CHALLENGE_SECRET no longer in client code
- challenge-link.ts calls Worker API (/api/sign-challenge, /api/verify-challenge)
- Worker uses server-side env var CHALLENGE_HMAC_SECRET
- .env.example still references VITE_CHALLENGE_SECRET but it's unused in source

### SEC-004 (App Check): RESOLVED
- firebase.ts:101-114 now initializes App Check with ReCaptchaV3Provider in production

### Worker Security (score-validator.ts): EXCELLENT
- Origin validation with allowlist (lines 117-121, 143-145)
- CORS with validated origin reflection
- Rate limiting: 30/min sign, 60/min verify, 8/min scores
- Firebase ID token verification with iss+aud validation (lines 241-250)
- Constant-time HMAC compare (lines 108-111)
- Input validation: score 0-9999, initials regex, mode enum, sessionId bounds
- Practice/god mode rejection (line 295)
- Seed length cap (256 chars) to prevent memory exhaustion

### firebase.ts
- fbSyncDust: accepts client dust value but capped 0-9,999,999, writes only to authenticated user's doc (low risk — soft currency)
- Auth: anonymous sign-in, failure is non-fatal (Firestore rules reject unauthenticated)
- Lazy initialization: all Firebase modules loaded on-demand

### monitoring.ts
- Line 99: `process.env.NODE_ENV === 'development'` — Node.js pattern in Vite project. Should be `import.meta.env.DEV`. Low severity (Vite may inline-define it).
- ErrorTracker: offline queue with 20-entry cap, Sentry flush on reconnect
- safeSet used for quota-sensitive localStorage writes

### web-vitals.ts
- Module augmentation pattern (lines 120-138) patches recordPerformanceMetric onto MetricsService — fragile if load order changes. Low severity (both imported from same monitoring.ts).

### gameanalytics.ts
- Clean: prod-only init, env-gated keys, try/catch around all GA calls

### errorLogger.ts + metrics.ts
- Clean: re-exports from unified monitoring.ts

## Summary
- **0 Critical** (SEC-001 resolved)
- **0 High** 
- **1 Medium**: process.env.NODE_ENV in monitoring.ts (Vite compat)
- **1 Low**: web-vitals module augmentation fragility
- **Overall**: Services layer is production-ready
