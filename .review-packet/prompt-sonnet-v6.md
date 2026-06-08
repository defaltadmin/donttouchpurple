# DTP Code Review -- v7.8.0

**Project**: Don't Touch Purple — reflex-based grid-tapping game
**Stack**: React 18, TypeScript 5, Vite 7, Firebase (Firestore + Auth + Analytics + App Check), OGL/WebGL backgrounds, Cloudflare Workers, GSAP, framer-motion
**Date**: 2026-06-08
**Previous review**: v7.7.0 (Sonnet v5, 2026-06-08)
**Repo**: https://github.com/defaltadmin/donttouchpurple

## Build Status

| Gate | Status |
|------|--------|
| Typecheck | 0 errors |
| Tests | 230/230 pass (21 files) |
| Build | Clean (14.08s, 975 modules) |
| Lint | 0 errors, 0 warnings |
| Bundle | Firebase 532KB, Sentry 424KB within 600KB limit |

## Recent Changes (since v7.7.0)

4 commits on main since last review:

| Commit | Description |
|--------|-------------|
| `8355d2a` | chore: rm unused deps, dead components, dead CSS |
| `fd031f1` | fix(ui): wire score floats and share modal |
| `7f3d798` | fix(perf): remove settings dynamic import race |
| `9602dbc` | chore: gitignore .openclaude-agents.json |

### Key Fixes in v7.8.0
- **Dead code removal**: Removed `@microsoft/clarity`, `blendy` deps; removed `BorderGlow.tsx`, `ParticleLayer.tsx` + CSS
- **Score floats wired**: `ScoreFloat.tsx` now receives active refs for P1+P2 — float animations fire on score change (was previously disconnected)
- **ShareModal wired**: ShareModal now opens on GameOver share button click (was previously disconnected from the hook)
- **Settings import race fixed**: Dynamic `import()` → static import for SettingsDrawer (eliminates Vite chunk warning and async race)
- **Hardcoded hex → CSS vars**: Moved inline colors to CSS custom properties in `game.css`, `fx-enhancements.css`
- **ShareModal a11y**: Added `aria-modal`, `aria-label`, `role="dialog"`, focus trap, Escape-to-close
- **Git history repair**: `.openclaude-agents.json` (Groq API key) scrubbed from 8-commit range via filter-branch; force-pushed

## Architecture

```
App.tsx (state machine, ~1878 lines)
  ├── engine/ (pure logic, no React)
  │   ├── GameEngine.ts — main loop, player state, boss events
  │   ├── subsystems/TickProcessor.ts — cell spawning, difficulty scaling
  │   ├── subsystems/CellLifecycle.ts — click handling, special cell effects
  │   ├── subsystems/BotController.ts — bot assist AI
  │   ├── subsystems/EventOrchestrator.ts — event coordination
  │   ├── subsystems/ScoreTracker.ts — score calculation
  │   └── DifficultyScaler.ts — difficulty curve
  ├── components/ (React UI)
  │   ├── Screens/ — StartScreen, GameOver, PauseOverlay, RewardsHub, Shop
  │   ├── HUD/ — ScoreDisplay, EnergyBar, Hearts, PlayerPanel, GameArea
  │   ├── Backgrounds/ — 15 OGL/WebGL + Canvas themes
  │   ├── Cell/ — cell rendering, click handling, inline spark canvas
  │   ├── Settings/ — SettingsDrawer, DevOverlay, QuickSettings
  │   └── UI/ — LottiePlayer, Icon, MagneticButton
  ├── hooks/ (16 custom hooks)
  ├── services/ (firebase, sentry, monitoring, analytics, web-vitals)
  ├── workers/ (score-validator — Cloudflare Worker)
  ├── config/ (gameBalance, difficulty, keybindings, achievementDefs, gridPatterns, powerupWeights)
  ├── utils/ (achievements, i18n, settings, state-guard, score-sync, challenge-link, etc.)
  ├── contexts/ (GameContext, DustContext)
  └── styles/ (game.css, enhancements.css, fx-enhancements.css, performance.css)
```

## Key Files (included in zip)

### engine/GameEngine.ts (~1500+ lines)
Main game loop with RAF-based tick system. Key methods:
- `start()`, `pause()`, `resume()`, `reset()` — lifecycle
- `handleTap()` — routes to CellLifecycle
- `_processTapIce/Bomb/Powerup/Danger/Safe/CheckAchievements` — decomposed tap handler
- Boss event system (storm, inversion, blackout)
- Player state management (health, score, streak, powerups)
- 33 achievements registered from `config/achievementDefs.ts`

### engine/subsystems/TickProcessor.ts
- Cell spawning logic per difficulty level
- 8 EVOLVE_PATTERNS with stage progression
- Purple cell ratio control (10-25%)
- Powerup spawn weights from config
- Bomb spawning with timer management

### engine/subsystems/CellLifecycle.ts
- Click handling for each cell type
- Ice cell multi-tap tracking
- Hold cell duration tracking
- Bomb defuse/explode logic
- Achievement trigger checks
- Boss event effects (inversion swaps colors, blackout hides grid)

### engine/subsystems/BotController.ts
- Single-path bot assist
- P2 bot for 2-player mode
- Difficulty-scaled accuracy (0.3-0.95)
- Configurable via botAssist config

### services/monitoring.ts
Unified monitoring: errorLogger + errorTracker + metricsService + devLog

### workers/score-validator.ts
Cloudflare Worker for score validation:
- HMAC signature verification
- JWT token validation (local, no Firebase Admin)
- Rate limiting via KV
- Practice/godMode rejection (403)

### utils/state-guard.ts
- HMAC-SHA256 session signing
- Challenge-link verification flow
- Game state tamper protection

## Included Source Files (in zip)
The zip contains ALL source files organized by directory:
- `engine/` — complete engine code
- `components/` — all React components
- `hooks/` — all custom hooks
- `services/` — Firebase, Sentry, monitoring, analytics
- `utils/` — all utilities
- `config/` — all configuration
- `contexts/` — React contexts
- `styles/` — CSS files
- `workers/` — Cloudflare Worker
- `public/` — static assets
- `e2e/` — Playwright tests
- `src/` — entry points
- `package.json`, `tsconfig.json`, `vite.config.ts`
- `CHANGELOG.md`, `HANDOFF.md`, `DESIGN.md`

## Review Focus Areas

### 1. Security
- JWT verification in Worker (local, no Firebase Admin SDK)
- HMAC challenge signing flow
- App Check enforcement on Firestore
- XSS prevention (user input sanitization)
- CSP headers
- Secret exposure (GA keys, Firebase config)
- Any remaining hardcoded credentials in git history

### 2. Stability
- RAF-based game loop edge cases (tab hidden, large delta)
- Bomb timer persistence across ticks
- P2 bot sync in multiplayer
- Phase guards preventing out-of-order mutations
- Memory leaks (timer cleanup, event listener removal)
- Score float animation cleanup on unmount

### 3. Performance
- Cell array replacement (no mutation) per tick
- RAF idle skip when document.hidden
- WeakMap caches for spawn slot computation
- Gradient object caching
- Component memoization (React.memo)
- Chunk splitting (17 entry points)
- Bundle size (game-core 321KB, react-vendor 163KB gzip)

### 4. UX
- Colorblind mode (rare color mode with shape + emoji distinction)
- Boss event UX (storm shake, inversion color swap, blackout dim)
- Bomb countdown ring animation
- Toast queue (6s display, 5.5s fade)
- Bot tap visual feedback
- Touch vs keyboard input modes
- ShareModal UX (focus trap, close behavior, mobile responsiveness)

### 5. Code Quality
- 33 achievements loaded from array config (not 33 register() calls)
- _processTap() split into 6 focused methods
- Monitoring consolidated into single service
- App.tsx still ~1878 lines (deferred split due to cross-coupled state)
- Dead code removal (BorderGlow, ParticleLayer, unused deps)
- Settings import converted from dynamic to static (good pattern)
