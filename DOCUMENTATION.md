# Don't Touch Purple — Documentation

## Overview

Don't Touch Purple (DTP) is a reflex-based grid-tapping game built with React 19, TypeScript 5, Vite 7, Firebase, and OGL/WebGL backgrounds. Players tap colored cells on a grid while avoiding purple cells. The game features multiple modes, boss events, power-ups, and a global leaderboard.

## Architecture

```
App.tsx (state machine, orchestrator)
├── engine/ (pure game logic, zero React imports)
│   ├── GameEngine.ts (main engine, tick scheduling, lifecycle)
│   ├── DifficultyScaler.ts (adaptive difficulty)
│   └── subsystems/
│       ├── TickProcessor.ts (cell spawning, effects, scoring)
│       ├── CellLifecycle.ts (click handling, special cells)
│       ├── BotController.ts (P1/P2 bot assist)
│       ├── EventOrchestrator.ts (boss events, rare colors)
│       └── ScoreTracker.ts (score/streak management)
├── components/ (React UI layer)
│   ├── Screens/ (StartScreen, GameOver, PauseOverlay, HowToPlay)
│   ├── HUD/ (GameArea, PlayerPanel, GameHeader, PwrBar)
│   ├── Cell/ (individual cell rendering)
│   ├── Backgrounds/ (19 WebGL/canvas backgrounds)
│   ├── Settings/ (DevOverlay, SettingsDrawer, QuickSettings)
│   └── Shop/ (ShopPanel, cosmetics)
├── hooks/ (React ↔ engine bridge)
│   ├── useGameEngine.ts (main bridge, snapshot → React state)
│   ├── useScreenStateMachine.ts (screen transitions)
│   ├── useInputHandler.ts (keyboard/gamepad/touch input)
│   └── useBackground.ts (background pause/resume coordination)
├── utils/ (shared utilities)
│   ├── score-sync.ts (offline queue, IndexedDB, Cloudflare Worker)
│   ├── boss-engine.ts (boss state machine singleton)
│   ├── privacy.ts (GDPR data management)
│   └── ... (30+ utility modules)
├── services/ (external integrations)
│   ├── firebase.ts (Auth, Firestore, Analytics, leaderboard)
│   └── errorTracking.ts (Sentry integration)
├── workers/ (Cloudflare Worker)
│   └── score-validator.ts (server-side anti-cheat, rate limiting)
└── config/ (game balance, patterns, difficulty)
    ├── difficulty.ts (constants, LS_KEYS)
    ├── gridPatterns.ts (Classic stages + Evolve patterns)
    └── powerupWeights.ts (shop economy, backgrounds)
```

## Game Modes

### Classic Mode
- Fixed grid progression through stages (3x3 → 4x4 → 5x5)
- Increasing speed and cell density
- Boss events at score milestones
- Game over when health reaches 0

### Evolve Mode
- Dynamic grid patterns from EVOLVE_PATTERNS (27 patterns)
- Adaptive difficulty via DifficultyScaler
- Power-ups: freeze, shield, multiplier
- Bot assist available for P1 and P2

## Key Systems

### Game Loop
1. `GameEngine.start()` initializes PlayerState, resets RNG, schedules first tick
2. `TickProcessor.processTick()` runs every `computeMs()` interval:
   - Spawns new active cells via `CellLifecycle`
   - Processes delta timers (bomb fuse, boss expiry, animations)
   - Updates difficulty via `DifficultyScaler`
   - Emits snapshot to React via `emitSnapshot()`
3. React receives snapshot → `useGameEngine` → `setSnapshot()` → re-renders UI
4. User input → `useInputHandler` → `engine.tap()` / `engine.holdStart()` / `engine.holdEnd()`

### Cell Lifecycle
- Cells spawn as `ActiveCell` objects in `p1.active[]`
- Types: score, bonus, purple, bomb, hold, ice, powerup
- Click handling in `CellLifecycle.handleTap()`: validates cell, applies effects, updates score
- `activeToCellsP()` converts active array to fixed-size grid for rendering

### Boss Events
- `EventOrchestrator` triggers boss events at score milestones
- Boss types: inversion (reverse controls), shield (block taps)
- Duration enforced via delta timers in `TickProcessor`
- `bossEngine` singleton manages boss state across sessions

### Score Submission
1. Game over → `ScoreTracker` computes final score
2. `scoreSync.queue()` stores in IndexedDB
3. `scoreSync.flush()` sends to Cloudflare Worker
4. Worker validates: Firebase auth token, rate limit, score bounds, tick cap, sessionId, badge
5. Worker writes to Firestore `lb_global` collection
6. Client reads leaderboard via `fbFetchTop20Global()`

### Background System
- 19 backgrounds: PurpleRain (default), Nebula, AuroraBorealis, DigitalRain, GlitchGrid, etc.
- Each registers with `useBackgroundController` for pause/resume coordination
- WebGL backgrounds handle context loss/recovery
- All backgrounds check `document.hidden` to skip rendering in background tabs
- CSS orbs (.orb-1/2/3) only render when default background is equipped

### State Machine (Screens)
- States: loading, menu, playing, paused, gameover
- Transitions defined in `VALID_TRANSITIONS` map
- `useScreenStateMachine` uses functional `setCurrent` to avoid stale closures

## Data Storage

### sessionStorage (game state, cleared on tab close)
- `dtp:session` — game session snapshot (score, hearts, timeLeft, engineSnapshot)
- `dtp:game-seed` — current game seed for deterministic RNG

### localStorage (persistent across sessions)
- `dtp:settings` — user preferences (haptics, sound, volume)
- `dtp:best-classic` / `dtp:best-evolve` — high scores
- `dtp:daily-completed` — daily challenge state
- `dtp:dev` — dev mode flag
- `dtp:errors` — error tracker queue
- `dtp_login_streak` — daily login streak
- `dtp-device-id` — anonymous device identifier

### IndexedDB (offline queue)
- Score submissions queued when offline
- Flushed on `online` event
- 100-item cap with oldest-first eviction

### Firestore (cloud)
- `lb_global/{docId}` — global leaderboard entries
- `dust_wallet/{uid}` — player dust balance (document ID = UID)
- `player_stats/{uid}` — player statistics

## Security

### Client-Side
- `stateGuard.sanitize()` validates game state against template
- `safeSet()` wraps localStorage writes with quota handling
- CSP configured via `firebase.json` headers (production only)
- Firebase App Check initialized in production

### Server-Side (Cloudflare Worker)
- Firebase ID token verification via Google tokeninfo endpoint
- Origin header validation (allowlist)
- IP-based rate limiting (8 requests/minute)
- Score bounds validation (0-9999)
- Tick cap (600, matching Firestore rule)
- SessionId length validation (8-64 chars)
- Badge validation ([a-zA-Z0-9_-], max 24 chars)
- Anti-cheat formula: `score > safeTick * 15 + 300`

### Firestore Rules
- `lb_global`: read public, write requires auth + valid fields + tick <= 600 + dust < 10M
- `dust_wallet`: read/write requires auth + UID match

## Testing

### Unit Tests (164 tests, 16 files)
- Engine tests: GameEngine lifecycle, tick processing, cell mechanics
- Config tests: difficulty scaling, grid patterns, powerup weights
- Utility tests: state guard, IDB, session, privacy
- Run: `pnpm test`

### E2E Tests (Playwright)
- Smoke test: full game flow from menu to game over
- Run: `pnpm test:e2e`

### Type Check
- `pnpm typecheck` — TypeScript strict mode

### Lint
- `pnpm lint` — ESLint with zero warnings policy

## Build & Deploy

```bash
pnpm dev          # Dev server (localhost:5173)
pnpm typecheck    # TypeScript validation
pnpm test         # Unit tests (vitest)
pnpm test:e2e     # E2E tests (Playwright)
pnpm build        # Production build
pnpm lint         # ESLint fix
```

### CI/CD (GitHub Actions)
- `ci.yml` — typecheck + test + build on Node 22/24
- `bundle-size.yml` — bundle size monitoring
- `release.yml` — version bump + changelog

### Deployment
- Frontend: Firebase Hosting (dont-touch-purple.web.app)
- Worker: Cloudflare Workers (game.mscarabia.com)
- Database: Firestore (us-central1)

## Recent Changes (2026-05-24)

### Bug Fixes (4 commits)
- Grid spawn: memoized onBossEvent/onBombDefused callbacks (were causing engine recreation every render)
- Play button: clamped MagneticButton displacement (±8px, reduced activation zone)
- Dev mode: removed import.meta.env.DEV guard on password check
- Backgrounds: CSS orbs + ParticleLayer hidden when canvas background equipped

### Performance Optimizations
- Cell wrapped in React.memo (most rendered component)
- Stable callbacks via ref pattern in PlayerPanel
- botTapFx Map pre-compute (O(1) per-cell lookup)
- scoreFloats filter memoized in GameArea

### Production Audit (70 findings, 55 fixed)
- 5 Critical, 13 High, 25 Medium — all fixed
- 17 Low — 15 fixed, 2 remaining
- Key fixes: bomb shuffle desync, worker auth token, CSP domain, dust/tick cap alignment, GDPR gap, stale closure leaks, dead code cleanup

### New Tools
- agentmemory MCP server (persistent memory across sessions)
- phantom-ui skeleton loader (8kb, framework-agnostic)
- 6 skills from skills.sh
- 12-factor-agents design principles in AGENTS.md
- Multiplayer roadmap (Cloudflare Durable Objects)

## Project Rules (from AGENTS.md)

1. Pure game logic in `engine/` — zero React imports
2. Cell arrays replaced each tick — never mutate in place
3. sessionStorage for game state (not localStorage)
4. Generation counter for callbacks referencing cell indices
5. data-testid on all key interactive elements
6. CSS vars from DESIGN.md — no hardcoded hex colors
7. RAF idle skip — check `document.hidden`, skip render when no active entities
8. WebGL context loss handlers on all OGL backgrounds
9. React.memo for external library components in expensive contexts
10. safeSet wrapper for localStorage writes that grow (quota handling)
