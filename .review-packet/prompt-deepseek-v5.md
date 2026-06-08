# DTP Code Review — v7.7.0

**Project**: Don't Touch Purple — reflex-based grid-tapping game
**Stack**: React 18, TypeScript 5, Vite 7, Firebase, OGL/WebGL, Cloudflare Workers, GSAP
**Date**: 2026-06-08
**Reviewer**: DeepSeek
**Repo**: https://github.com/defaltadmin/donttouchpurple

## Build Status
- Typecheck: 0 errors
- Tests: 230/230 pass (21 files)
- Build: Clean (14.08s, 975 modules)

## Recent Changes (since v7.6.1)

```
1921bda fix: multi-agent audit quick wins — dust sync, dev mode, GPU layers, perf
8ab589a fix: game engine stability — bomb persistence, P2 bot, delta timer bailout, perf
5420573 fix: council audit — phase guard, privacy crash, score loss, RNG determinism
5eee4b1 fix: add background:#000 inline style to prevent white flash before CSS loads
ad66a16 fix: statically import English translations to prevent raw key flash on load
28d5b06 fix: GA method name, enable sourcemaps, init Firebase functions
cce2eb2 fix: resolve 4 audit findings — CSS class toggle, static import, sourcemap hidden, sentry upload scope
6f31e05 fix: resolve WARN-007, CRIT-002, INFO-003, INFO-004 — rm secret key, ensureAuth race, dead clientDate, WeakMap comment
89ccf67 fix: security hardening — local JWT verification, i18n allowlist, log sanitization, gradient cache, querySelectorAll ref pattern, version sync 7.7.0
cc2fe34 chore: untrack dev artifacts, embedded git repos, agent files from repo index
```

## Architecture

```
App.tsx (state machine)
  ├── engine/ (no React imports)
  │   ├── GameEngine.ts — main loop, player state, boss events
  │   ├── subsystems/ (TickProcessor, CellLifecycle, BotController, EventOrchestrator, ScoreTracker)
  │   └── DifficultyScaler.ts
  ├── components/ (Screens, HUD, Backgrounds, Cell, Settings, UI)
  ├── hooks/ (16 custom hooks — useGameEngine bridge)
  ├── services/ (firebase, sentry, monitoring, analytics, web-vitals)
  ├── workers/ (score-validator — Cloudflare Worker)
  ├── config/ (gameBalance, difficulty, keybindings, achievementDefs)
  ├── utils/ (achievements, i18n, settings, state-guard, score-sync, challenge-link)
  ├── contexts/ (GameContext, DustContext)
  └── styles/ (game.css, enhancements.css, fx-enhancements.css, performance.css)
```

## Instructions

Review the following source files for **security, correctness, edge cases, and performance issues**.

For each finding, provide:
```
### [ID] — Title
- **Severity**: Critical/High/Medium/Low/Info
- **Category**: Security/Stability/Performance/UX/Code Quality/Architecture
- **File + Line**: exact location
- **Description**: what's wrong
- **Impact**: what could happen
- **Fix**: how to fix it
```

## Source Files

### package.json
```json
{
  "name": "dont-touch-purple",
  "version": "7.7.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build": "tsc && vite build",
    "deploy": "pnpm build && powershell -Command \"Compress-Archive -Path dist\\* -DestinationPath htdocs.zip -Force\"",
    "lint": "eslint . --ext .ts,.tsx --fix"
  },
  "dependencies": {
    "firebase": "^12.13.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "ogl": "^1.0.11",
    "gsap": "^3.15.0",
    "framer-motion": "^12.38.0",
    "gameanalytics": "^4.4.7",
    "@sentry/react": "^10.51.0",
    "web-vitals": "^4.2.1"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "vite": "^7.3.3",
    "vitest": "^4.1.6",
    "@playwright/test": "^1.59.1",
    "wrangler": "^4.92.0"
  }
}
```

### engine/types.ts
```typescript
export type CellType =
  | "inactive" | "void" | "purple"
  | "white" | "blue" | "red" | "orange" | "yellow"
  | "green" | "cyan" | "lime" | "teal"
  | "pink" | "rose" | "magenta"
  | "medpack" | "shield" | "freeze" | "multiplier"
  | "ice" | "hold" | "bomb";

export type BossEventType = "storm" | "inversion" | "blackout";
export type GameMode = "classic" | "evolve";
export type NumPlayers = 1 | 2;
export type Winner = "p1" | "p2" | "tie" | null;

type BaseCell = { idx: number; clicked: boolean; shape?: CellShape };
export type RegularCell = BaseCell & { type: CellType };
export type IceCell = BaseCell & { type: "ice"; iceCount: number };
export type HoldCell = BaseCell & { type: "hold"; holdRequired: number; holdStart?: number; spawnedAt: number };
export type PowerupCell = BaseCell & { type: "medpack" | "shield" | "freeze" | "multiplier" };
export type BombCell = BaseCell & { type: "bomb"; expiresAt: number };
export type ActiveCell = RegularCell | IceCell | HoldCell | PowerupCell | BombCell;

export interface PlayerState {
  cells: CellType[];
  active: ActiveCell[];
  score: number;
  streak: number;
  alive: boolean;
  anim: Record<number, string>;
  health: number;
  shield: boolean;
  shieldCount: number;
  freezeEnd: number;
  multiplierEnd: number;
  gridStage: number;
  stageProgress: number;
  patternIdx: number;
  storedFreezeCharges: number;
  storedShieldCharges: number;
  pendingStageUpdate?: boolean;
  slideAnim?: Record<number, { fromIdx: number; startMs: number; gen: number }>;
  nextShuffleTick: number;
}

export interface GameSnapshot {
  tick: number;
  evolveTick: number;
  gameSeed: number;
  p1: PlayerState;
  p2: PlayerState;
  cellShape: CellShape;
  rareMode: RareColorMode;
  spinLevel: number;
  paused: boolean;
  phase: "playing" | "paused" | "gameover" | "humanlimit";
  grid: { cols: number; rows: number; mask: number[] | null };
  bossEvent: BossEvent | null;
  activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null;
  isInverted: boolean;
  isBlackout: boolean;
}
```

### config/gameBalance.ts
```typescript
// Game balance constants
export const GRID_SIZE = 5;
export const TICK_INTERVAL = 1000; // ms
export const INITIAL_HEALTH = 3;
export const MAX_HEALTH = 5;
export const STREAK_BONUS_THRESHOLD = 5;
export const PURPLE_PENALTY = -1;
export const WHITE_SCORE = 1;
export const BLUE_SCORE = 2;
export const RED_SCORE = 3;
export const BOMB_TIMER = 8000; // ms
export const ICE_TAPS = 3;
export const HOLD_DURATION = 1500; // ms
export const FREEZE_DURATION = 5000; // ms
export const MULTIPLIER_DURATION = 8000; // ms
export const SHIELD_DURATION = 10000; // ms
export const BOSS_DURATION = 15000; // ms
export const MAX_BOMBS_PER_PLAYER = 1;
export const MAX_ACTIVE_CELLS = 8;
export const RARE_MODE_TURNS = 5;
export const EVOLVE_STAGES = 3;
```

### utils/i18n.ts
```typescript
// i18n with static import of English fallback
import en from "../locales/en.json";
const translations: Record<string, Record<string, string>> = { en };
let currentLocale = "en";

export function t(key: string, locale?: string): string {
  return translations[locale || currentLocale]?.[key] ?? en[key] ?? key;
}

export function setLocale(locale: string): void {
  currentLocale = locale;
  if (!translations[locale]) {
    // Lazy-load other locales
    import(`../locales/${locale}.json`).then((mod) => {
      translations[locale] = mod.default;
    }).catch(() => {});
  }
}
```

### workers/score-validator.ts
```typescript
// Cloudflare Worker for score validation
// Features:
// - HMAC-SHA256 signature verification
// - JWT token validation (local, no Firebase Admin SDK dependency)
// - Rate limiting via KV (30 req/min per IP)
// - Practice/godMode score rejection (403)
// - App Check token validation
// - CORS headers for game.mscarabia.com

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Firebase-AppCheck" }
      });
    }

    // Rate limit check
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const { success } = await env.RATE_LIMITER.limit({ key: ip, limit: 30, window: 60 });
    if (!success) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 });

    // Parse body
    const body = await request.json();
    const { score, signature, gameSeed, playerName, token } = body;

    // Verify HMAC signature
    const expectedSig = await createHMAC(JSON.stringify({ score, gameSeed, playerName }), env.HMAC_KEY);
    if (signature !== expectedSig) return new Response(JSON.stringify({ error: "invalid_signature" }), { status: 403 });

    // Verify JWT locally (no Firebase Admin SDK)
    const payload = verifyLocalJWT(token, env.JWT_SECRET);
    if (!payload) return new Response(JSON.stringify({ error: "invalid_token" }), { status: 403 });

    // Reject practice/godMode scores
    if (body.mode === "practice" || body.godMode) return new Response(JSON.stringify({ error: "practice_mode_not_allowed" }), { status: 403 });

    // Verify score bounds
    if (typeof score !== "number" || score < 0 || score > 999999) return new Response(JSON.stringify({ error: "invalid_score" }), { status: 400 });

    return new Response(JSON.stringify({ valid: true }), { headers: { "Content-Type": "application/json" } });
  }
};
```

### utils/state-guard.ts
```typescript
// HMAC-SHA256 state signing for session snapshots
// Key derived from HKDF(sessionStorage nonce)
// Prevents tampering of game state in sessionStorage

import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";

const NONCE_KEY = "dtp_nonce";

function getOrCreateNonce(): string {
  let nonce = sessionStorage.getItem(NONCE_KEY);
  if (!nonce) {
    nonce = crypto.randomUUID();
    sessionStorage.setItem(NONCE_KEY, nonce);
  }
  return nonce;
}

function deriveKey(nonce: string): Uint8Array {
  return hkdf(sha256, new TextEncoder().encode(nonce), new Uint8Array(32), new Uint8Array(0), 32);
}

export function signSnapshot(state: string): string {
  const nonce = getOrCreateNonce();
  const key = deriveKey(nonce);
  return hex(hmac(sha256, key, new TextEncoder().encode(state)));
}

export function verifySnapshot(state: string, sig: string): boolean {
  const nonce = sessionStorage.getItem(NONCE_KEY);
  if (!nonce) return false;
  const key = deriveKey(nonce);
  const expected = hex(hmac(sha256, key, new TextEncoder().encode(state)));
  return constantTimeEqual(sig, expected);
}
```

### services/monitoring.ts
```typescript
// Unified monitoring — merges errorLogger, error-tracker, metrics, devLog
import * as Sentry from "@sentry/react";

const isDev = import.meta.env.DEV;

export function logError(error: Error, context?: Record<string, unknown>): void {
  console.error(error, context);
  if (!isDev) {
    Sentry.captureException(error, { extra: context });
  }
}

export function logMetric(name: string, value: number): void {
  if (!isDev) {
    Sentry.metrics.increment(name, value);
  }
}

export function devLog(...args: unknown[]): void {
  if (isDev) console.log(...args);
}
```

### services/firebase.ts
```typescript
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}

// App Check
initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});
```

### utils/settings.ts
```typescript
// Settings manager with safeSet for localStorage quota handling
function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded");
      return false;
    }
    throw e;
  }
}

function safeGet(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
```

### hooks/useGameEngine.ts
```typescript
// Bridge between GameEngine and React
// - Creates GameEngine instance on mount
// - Listens for GameEvents and dispatches to React state
// - Exposes snapshotRef for non-render consumers
// - Cleans up timers on unmount

export function useGameEngine(config: GameConfig) {
  const engineRef = useRef<GameEngine | null>(null);
  const snapshotRef = useRef<GameSnapshot | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);

  useEffect(() => {
    const engine = new GameEngine(config);
    engineRef.current = engine;

    engine.on("tick", (s) => {
      snapshotRef.current = s;
      setSnapshot(s);
    });

    engine.start();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  return { snapshot, snapshotRef, engine: engineRef };
}
```
