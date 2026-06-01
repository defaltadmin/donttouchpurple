# Amazon Q Scan — Full Remediation List
Generated: 2026-06-01
Scopes: engine/, hooks/, services/, utils/, workers/, config/, App.tsx, components/, website/src/

---

## VERDICT LEGEND
- ✅ FIX — Real issue, implement the fix
- ❌ FALSE POSITIVE — Do not touch
- ⚠️ REVIEW — Low risk but worth a look

---

## FALSE POSITIVES — DO NOT TOUCH (32 findings)

These were flagged by the scanner but are all intentional or safe:

| Detector | Files | Reason |
|----------|-------|--------|
| hardcoded-credentials (8x) | `services/firebase.ts`, `.env*` | Firebase client config keys are public identifiers, not secrets. Security is in Firestore rules + App Check. |
| sql-injection (1x) | `services/firebase.ts` | Uses Firestore REST API, not SQL. No injection surface. |
| ssrf (4x) | `utils/audio.ts`, `workers/score-validator.ts` | Fetches from hardcoded known URLs only. No user-controlled URL input. |
| code-injection (8x) | `engine/GameEngine.ts` (4), `utils/i18n.ts` (2), `engine/subsystems/TickProcessor.ts` (1), `utils/boss-engine.ts` (1) | Template literals with internal game state, not user input. No eval/Function() usage. |
| log-injection — numbers (many) | Various | Logger calls with numeric game values (score, tick, seed). Numbers cannot contain newline injection. |
| xss/localStorage — game progress (1x) | `hooks/useDailyProgress.ts` | Stores structured game progress (play counts, scores). Not rendered as HTML. Not an XSS surface. |

---

## REAL FIXES — IMPLEMENT THESE (8 findings)

---

### ✅ FIX 1 — CWE-79/80 XSS — GameOver.tsx (HIGH)

**File:** `components/Screens/GameOver.tsx:217-218`

**What:** The `bugHref` mailto link includes `navigator.userAgent` and `window.location.pathname` in the email body via `encodeURIComponent`. The scanner flagged this as XSS. While `encodeURIComponent` does encode for URL context, `navigator.userAgent` is attacker-controllable in some environments and the value is also rendered into the `href` attribute.

**Actual risk:** Low in practice (mailto: links don't execute scripts), but the pattern is worth hardening.

**Fix:** Strip non-printable and control characters from `navigator.userAgent` before including it:

```tsx
// In GameOver.tsx, update the bugHref useMemo:
const bugHref = React.useMemo(() => {
  const safeUA = navigator.userAgent.replace(/[\r\n\t<>"'`]/g, ' ').slice(0, 200);
  const safePath = window.location.pathname.replace(/[\r\n<>"'`]/g, '').slice(0, 100);
  return `mailto:info@mscarabia.com?subject=${encodeURIComponent(`DTP Bug Report (Seed: ${gameSeed})`)}&body=${encodeURIComponent(
    `Score: ${p1Score}\nMode: ${mode}\nSeed: ${gameSeed}\nTick: ${tick}\nHealth: ${p1.health}\nSpin: ${spinLevel}\nStreak: ${p1.streak}\n\nUA: ${safeUA}\nURL: ${safePath}\nScreen: ${window.innerWidth}×${window.innerHeight}\n\n(describe what happened)\n`
  )}`;
}, [p1Score, mode, gameSeed, tick, p1.health, spinLevel, p1.streak]);
```

---

### ✅ FIX 2 — CWE-117 Log Injection — App.tsx line 341 (HIGH)

**File:** `App.tsx:341-342`

**What:** Raw Firebase error object passed to logger.

**Current code:**
```ts
}).catch(e => logger.warn('Firebase streak fetch failed', e));
```

**Fix:**
```ts
}).catch(e => {
  const msg = e instanceof Error ? e.message.replace(/[\r\n]/g, ' ') : String(e).replace(/[\r\n]/g, ' ');
  logger.warn('Firebase streak fetch failed', msg);
});
```

---

### ✅ FIX 3 — CWE-117 Log Injection — App.tsx line 497 (HIGH)

**File:** `App.tsx:497-498`

**What:** Raw Firebase error object passed to logger in `handleEngineGameOver`.

**Current code:**
```ts
}).catch(e => logger.warn('Firebase operation failed', e));
```

**Fix:**
```ts
}).catch(e => {
  const msg = e instanceof Error ? e.message.replace(/[\r\n]/g, ' ') : String(e).replace(/[\r\n]/g, ' ');
  logger.warn('Firebase operation failed', msg);
});
```

---

### ✅ FIX 4 — CWE-117 Log Injection — App.tsx line 575 (HIGH)

**File:** `App.tsx:575-576`

**What:** Raw Firebase error object passed to logger in daily objective completion handler.

**Current code:**
```ts
getFirebase().then(fb => fb.fbLogEvent("daily_complete", { reward: completed.reward, objective: obj.type })).catch(e => logger.warn('Firebase operation failed', e));
```

**Fix:**
```ts
getFirebase()
  .then(fb => fb.fbLogEvent("daily_complete", { reward: completed.reward, objective: obj.type }))
  .catch(e => {
    const msg = e instanceof Error ? e.message.replace(/[\r\n]/g, ' ') : String(e).replace(/[\r\n]/g, ' ');
    logger.warn('Firebase operation failed', msg);
  });
```

---

### ✅ FIX 5 — CWE-117 Log Injection — ErrorBoundary.tsx line 17 (HIGH)

**File:** `components/ErrorBoundary.tsx:17-18`

**What:** Raw error + errorInfo passed to `console.error` in error boundary.

**Current code:**
```ts
console.error('[DTP] Error caught by boundary:', error, errorInfo);
```

**Fix:**
```ts
console.error('[DTP] Error caught by boundary:', error?.message?.replace(/[\r\n]/g, ' ') ?? String(error));
```

---

### ✅ FIX 6 — CWE-117 Log Injection — ChunkErrorBoundary.tsx line 14 (HIGH)

**File:** `components/ChunkErrorBoundary.tsx:14-15`

**What:** Raw error passed to `console.error` in chunk error boundary.

**Current code:**
```ts
console.error(`[DTP] Chunk load failed for ${this.props.name}:`, error);
```

**Fix:**
```ts
console.error(`[DTP] Chunk load failed for ${this.props.name}:`, error?.message?.replace(/[\r\n]/g, ' ') ?? String(error));
```

---

### ✅ FIX 7 — CWE-117 Log Injection — GridErrorBoundary.tsx line 16 (HIGH)

**File:** `components/HUD/GridErrorBoundary.tsx:16-17`

**What:** Raw error + errorInfo passed to `logger.error` in grid error boundary.

**Current code:**
```ts
logger.error('[DTP] Grid render error:', error, errorInfo);
```

**Fix:**
```ts
logger.error('[DTP] Grid render error:', error?.message?.replace(/[\r\n]/g, ' ') ?? String(error));
```

---

### ✅ FIX 8 — Missing SRI Hash — website/src/app/layout.tsx line 51 (LOW)

**File:** `website/src/app/layout.tsx:51-52`

**What:** Google Fonts stylesheet loaded from external CDN without a Subresource Integrity (SRI) hash. If the CDN is compromised, it could serve malicious CSS.

**Current code:**
```tsx
<link
  href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap"
  rel="stylesheet"
/>
```

**Note:** Google Fonts dynamically generates CSS per user-agent, so a static SRI hash is not feasible for this CDN. The practical fix is to self-host the fonts instead.

**Fix option A — Self-host fonts (recommended):**
1. Download font files from https://fonts.google.com/
2. Place in `website/public/fonts/`
3. Define `@font-face` rules in `globals.css`
4. Remove the `<link>` tags from `layout.tsx`

**Fix option B — Add CSP font-src restriction (quick mitigation):**
Add to `website/public/_headers`:
```
Content-Security-Policy: font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com
```
This limits font loading to the known Google Fonts domain only.

---

## ALREADY FIXED BY OTHER AI (do not re-apply)

These were fixed in a prior pass — listed here for completeness:

| Fix | File | What |
|-----|------|------|
| Logger | `services/gameanalytics.ts` | `console.log/error` → `logger` |
| Env var | `services/monitoring.ts` | `process.env.NODE_ENV` → `import.meta.env.DEV` |
| safeSet | `utils/perf-monitor.ts` | `localStorage.setItem` → `safeSet` |
| safeSet | `hooks/useDailyProgress.ts` | `localStorage.setItem` for login streak → `safeSet` |
| Dead var | `hooks/useDailyProgress.ts` | Removed redundant `todayISO` duplicate |

---

## SUMMARY TABLE

| # | Severity | File | Issue | Action |
|---|----------|------|-------|--------|
| 1 | High | `components/Screens/GameOver.tsx:217` | CWE-79 XSS — navigator.userAgent in href | ✅ Fix |
| 2 | High | `App.tsx:341` | CWE-117 Log injection — Firebase catch | ✅ Fix |
| 3 | High | `App.tsx:497` | CWE-117 Log injection — Firebase catch | ✅ Fix |
| 4 | High | `App.tsx:575` | CWE-117 Log injection — Firebase catch | ✅ Fix |
| 5 | High | `components/ErrorBoundary.tsx:17` | CWE-117 Log injection — console.error | ✅ Fix |
| 6 | High | `components/ChunkErrorBoundary.tsx:14` | CWE-117 Log injection — console.error | ✅ Fix |
| 7 | High | `components/HUD/GridErrorBoundary.tsx:16` | CWE-117 Log injection — logger.error | ✅ Fix |
| 8 | Low | `website/src/app/layout.tsx:51` | CDN font load — no SRI / self-host | ✅ Fix |
| — | — | 32 other findings | False positives (see above) | ❌ Skip |
