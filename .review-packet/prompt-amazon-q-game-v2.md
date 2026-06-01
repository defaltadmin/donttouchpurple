# Don't Touch Purple — Code Review for Amazon Q

**Project**: Don't Touch Purple — reflex-based grid-tapping game
**Stack**: React 18, TypeScript 5, Vite 7, Firebase, OGL/WebGL, GSAP
**Version**: 7.6.1
**Live**: https://game.mscarabia.com
**GitHub**: https://github.com/defaltadmin/donttouchpurple
**Date**: 2026-06-01
**Previous Reviews**: Sonnet v7.6.1, DeepSeek v7.6.1 (findings already applied)

## Review Instructions

Review this codebase for:
1. **Security** — Firebase rules, CSP, XSS, state tampering, input validation, Worker auth
2. **Performance** — Core Web Vitals, bundle size, GPU, memory leaks, render perf
3. **Stability** — race conditions, memory leaks, edge cases, error handling
4. **Code Quality** — TypeScript strictness, dead code, patterns, maintainability
5. **Game Logic** — tick processing, cell lifecycle, boss events, difficulty scaling
6. **Architecture** — separation of concerns, state management, hook design

For each finding:
- **Severity**: Critical / High / Medium / Low / Info
- **Category**: Security / Performance / Stability / Quality / Game / Architecture
- **File + Line**: exact location in source
- **Description**: what's wrong and why it matters
- **Fix**: specific code change (not vague advice)

IMPORTANT:
- Read inline comments before flagging — some patterns are intentional (e.g., bomb uses captured pattern at spawn time, not current pattern)
- Firebase client-side API keys are NOT secrets — they're public identifiers
- Cell arrays are replaced each tick (immutable by design) — this is not a bug
- `sessionStorage` is used intentionally (not localStorage) for game state
- The game engine in `engine/` has ZERO React imports — this is an architectural requirement
- Background components use OGL (not three.js) — `.destroy()` does not exist on OGL Renderer; use `WEBGL_lose_context`
- `createRadialGradient` bakes center coordinates — cannot be cached for moving particles

## Key Files to Review

### Core Engine (pure logic, no React)
- `engine/GameEngine.ts` — main loop, player state, boss events
- `engine/subsystems/TickProcessor.ts` — cell spawning, difficulty scaling
- `engine/subsystems/CellLifecycle.ts` — click handling, special cell effects
- `engine/subsystems/BotController.ts` — bot assist AI
- `engine/DifficultyScaler.ts` — difficulty curve

### React Layer
- `App.tsx` — main state machine, screen management (~1900 lines)
- `hooks/useGameEngine.ts` — bridge between React and engine
- `components/Screens/` — StartScreen, GameOver, PauseOverlay, RewardsHub
- `components/HUD/` — ScoreDisplay, EnergyBar, PlayerPanel, GameArea
- `components/Cell/` — cell rendering, click handling
- `components/Backgrounds/` — 15 OGL/WebGL themes

### Services & Config
- `services/firebase.ts` — Firebase init, auth, analytics
- `services/firestoreService.ts` — Firestore CRUD
- `config/gameBalance.ts` — all balance constants
- `utils/score-sync.ts` — score submission queue (IndexedDB)
- `utils/state-guard.ts` — HMAC session signing

### Security
- `firestore.rules` — Firestore security rules (App Check enforced)
- `workers/score-validator.ts` — Cloudflare Worker for score validation
- `workers/wrangler.toml` — Worker config
- `index.html` — CSP meta tag (removed; production CSP via firebase.json)

### Tests
- `engine/__tests__/` — GameEngine, TickProcessor, CellLifecycle tests
- `__tests__/` — score-sync, state-guard, challenge-link tests
- **230 tests, 21 files, all passing**

## Known False Positives (do NOT flag these)

1. **Bomb uses captured pattern (TickProcessor.ts:390-392)** — Intentional: "Use the pattern captured at spawn time (pat), not the current one, because the grid may have changed during the fuse delay."
2. **Firebase API keys in code** — Client-side identifiers, not secrets. Security is in Firestore rules + App Check.
3. **Cell arrays replaced each tick** — Immutable by design. Not a mutation bug.
4. **`sessionStorage` not `localStorage`** — Intentional: game state should not persist across tabs.
5. **CSS classes `dtp-btn.previewing`, `dtp-combo-popup`, `dtp-boss-hp`** — Audit says unused but they ARE used in TSX.
6. **`metrics.ts`** — web-vitals.ts imports and monkey-patches it; needs careful handling, not blind deletion.
7. **`rafIdRef` in useGameEngine** — Used for tick snapshot debounce (rAF coalescing), not unused.

## Build Status

| Check | Status |
|-------|--------|
| Typecheck | 0 errors |
| Tests | 230/230 pass (21 files) |
| Build | Clean |
| Lint | Pre-existing worker globals only (21 issues, not from this codebase) |
| Vulnerabilities | 0 (root) |
| App Check | Enforced on Firestore |

## Commands

```bash
pnpm typecheck    # TypeScript validation
pnpm test         # Unit tests (vitest, 230 tests)
pnpm build        # Production build
pnpm lint         # ESLint fix
```

## Project Structure

```
App.tsx (state machine)
  ├── engine/ (pure logic, no React)
  │   ├── GameEngine.ts — main loop, player state, boss events
  │   ├── subsystems/TickProcessor.ts — cell spawning, difficulty scaling
  │   ├── subsystems/CellLifecycle.ts — click handling, special cell effects
  │   ├── subsystems/BotController.ts — bot assist AI (single path)
  │   └── DifficultyScaler.ts — difficulty curve
  ├── components/ (React UI)
  │   ├── Screens/ — StartScreen, GameOver, PauseOverlay, RewardsHub, Shop
  │   ├── HUD/ — ScoreDisplay, EnergyBar, Hearts, PlayerPanel, GameArea
  │   ├── Backgrounds/ — 15 OGL/WebGL themes
  │   ├── Cell/ — cell rendering, click handling, inline spark canvas
  │   ├── Settings/ — SettingsDrawer, DevOverlay, QuickSettings
  │   └── UI/ — LottiePlayer, Icon, MagneticButton
  ├── hooks/ (16 custom hooks)
  ├── services/ (firebase, firestore, sentry, web-vitals, gameanalytics)
  ├── workers/ (score-validator.ts — Cloudflare Worker)
  ├── config/ (gameBalance, difficulty, keybindings)
  ├── utils/ (achievements, challenge-link, score-sync, state-guard)
  ├── contexts/ (GameContext, DustContext)
  └── styles/ (game.css, enhancements.css, fx-enhancements.css, performance.css)
```

## Output Format

For each finding, use this format:

```
### [SEVERITY] [CATEGORY] — Short Title
- **File**: `path/to/file.ts:123`
- **Description**: What's wrong and why
- **Fix**: Specific code change
```

Group findings by severity (Critical first, then High, Medium, Low, Info).
End with a summary table: | Severity | Count | Description |
