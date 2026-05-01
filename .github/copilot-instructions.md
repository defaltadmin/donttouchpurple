# Copilot Instructions for Don't Touch Purple

## Project Overview

**Don't Touch Purple** is a fast-paced reaction game built with **React 18 + TypeScript** and **Vite**. The game features multiple modes (Classic, Evolve, Duo), Firebase integration (Firestore + Cloud Functions), PWA support, and extensive game mechanics including powerups, daily objectives, and a global leaderboard.

**Tech Stack**: React 18, TypeScript, Vite, Vitest, Firebase (Firestore + Functions), jsdom

---

## Build, Test & Lint Commands

### Development
- **Dev server**: `pnpm dev` (runs Vite on localhost:5173)
- **Production build**: `pnpm build` (runs TypeScript check + Vite build → `dist/`)
- **Preview**: `pnpm preview` (serves built app locally)

### Testing & Type Checking
- **Run tests**: `pnpm test` (runs Vitest in run mode)
- **Type check**: `pnpm typecheck` (runs TypeScript without emit)
- **Single test file**: `pnpm test -- __tests__/GameEngine.test.ts`

### Deployment
- **Deploy to Firebase**: `pnpm build && powershell -Command "Compress-Archive -Path dist\\* -DestinationPath htdocs.zip -Force"`
  - Builds dist/, creates htdocs.zip, uploads to Firebase Hosting

### Test Setup
- Tests configured in `vite.config.ts` with `jsdom` environment
- Setup file: `test/setup.ts` (clears localStorage before/after each test)
- Jest type definitions available via `@types/jest`

---

## Architecture

### Core Engine (`engine/`)

**GameEngine.ts** is the heart of the game — a state machine that manages:
- **Player state** for both P1 and P2 (`PlayerState` interface)
- **Cell generation** and lifecycle (spawn, resolve, remove)
- **Scoring, health, streak tracking**
- **Powerups** (medpack, shield, freeze, multiplier) with charge management
- **Game modes** (classic vs evolve with progressive difficulty)
- **RAF loop** for 60fps updates with dirty flag to prevent unnecessary re-renders
- **Seeded PRNG** (mulberry32) for deterministic replays
- **Bot assist mode** ("Dust Guard") for auto-clicking with configurable error rates

**DifficultyScaler.ts**: Computes difficulty curves
- Maps score → speed, cell spawn frequency, animation speed
- `computeMs()` returns millisecond values; `speedPct()` returns percentages (0-100)

**types.ts**: Shared type definitions
- Cell types (colors, powerups, special: ice, hold)
- Game modes and player state structure
- Powerup storage format (`StoredPowerups`: freeze/shield/mult/heart)

### Hooks (`hooks/`)

**useGameEngine.ts**: React wrapper around GameEngine
- Manages engine lifecycle (creation, start, stop)
- Syncs engine snapshot to React state (RequestAnimationFrame updates)
- Handles input events → engine callbacks
- Manages audio, stored powerups (localStorage)
- Exposes engine methods: `start()`, `tick()`, `handleTap()`, `startBot()`, `stopBot()`

**useInputHandler.ts**: Keyboard + touch input handler
- Listens for P1/P2 key events
- Handles both keyboard and mobile touch
- Triggers engine callbacks on input

### Config (`config/`)

**difficulty.ts**: Game balance constants
- Spawn rates, health values, powerup probabilities
- `GAME` object with all configuration
- `LS_KEYS` object for localStorage keys

**gridPatterns.ts**: Grid layout for Evolve mode
- `STAGES` array: 9 progressive stages with cell distributions
- `EVOLVE_PATTERNS` array: pattern variations per stage

**powerupWeights.ts**: Shop items & probabilities
- `SHOP_THEMES`, `SHOP_BACKGROUNDS`: purchasable cosmetics
- Powerup spawn weights (medpack, shield, freeze, multiplier)

**keybindings.ts**: Keyboard configuration
- Default P1/P2 keybindings (WASD, arrows)
- Functions: `loadKeys()`, `saveKeys()`, `toLabel()`

**dailyObjective.ts**: Daily objective generator
- Generates objective at midnight (ISO date-based)
- Types: `TAPS`, `SCORE`, `TIME`, `POWERUPS_USED`

### React Components (`components/`)

**HUD/** — In-game UI
- `Hearts.tsx`: Health display (capped at 7: 5 base + 2 bonus)
- `PwrBar.tsx`: Powerup indicator
- `EnergyBar.tsx`: Energy regeneration display
- `DustWidget.tsx`: Dust/currency display
- `PlayerPanel.tsx`: P1/P2 actions, bot assist button, mode toggle

**Screens/**
- `StartScreen.tsx`: Main menu, mode selection, replay seed banner
- `GameOver.tsx`: Score display, seed sharing, replay button
- `HowToPlay.tsx`: Tutorial
- `EvolveTutorial.tsx`: Intro for Evolve mode
- `WhatsNew.tsx`: Changelog

**Settings/**
- `SettingsDrawer.tsx`: Keybindings, audio, colorblind filters, volume, custom seed input
- `KeyBinder.tsx`: Rebinding UI
- `DevOverlay.tsx`: Dev-only testing tools

**Shop/**
- `ShopPanel.tsx`: Buy themes, backgrounds, powerups (powerups locked in Classic mode)

**Backgrounds/**
- Canvas animations: `VoidTunnel.tsx`, `StarWarp.tsx`, `GridPulse.tsx`
- Render at z-index: -1, pointer-events: none, run at 60fps

**Animations/**
- `ShieldDrop.tsx`, `FreezeDrop.tsx`, `EnergyDrop.tsx`: Floating indicator animations

### Services (`services/`)

**firebase.ts**: Firestore integration
- `fbSyncDust()`: Write dust wallet to Firestore (uses `setDoc()`)
- `fbFetchTop20Global()`: Leaderboard query
- `fbCheckWeeklyBonus()`: Streak bonus logic
- `fbGetStreak()`: Retrieve streaks
- `getDeviceId()`: Device fingerprinting for storage

### Firebase (`functions/`)

**Cloud Functions** (`functions/src/index.ts`)
- `updateStreak()`: Server-side streak update with timezone handling
- Receives `clientDate` (ISO string) to ensure consistent timezone behavior

### Tests (`__tests__/`)
- `GameEngine.test.ts`: Engine state transitions, powerup logic, game over conditions
- `DifficultyScaler.test.ts`: Speed curves and difficulty scaling
- `configIntegrity.test.ts`: Config sanity checks (weights sum, no missing keys)

---

## Key Conventions

### State Management
- **GameEngine** is the single source of truth; React reads snapshots
- **Dirty flag** in RAF loop prevents re-renders when nothing changes
- **localStorage** stores: keybindings, settings, progress, stored powerups, pending replay seed
- **Firestore** stores: dust wallet, leaderboard, streak data

### Powerup System
- **Stored powerups** (multiply, heart, shield, freeze) are deducted once at game start
- `StoredPowerups` interface tracks counts; stored as JSON in localStorage
- Active powerups (pickup during game) managed in `PlayerState`
- Bot assist costs 10 dust/second with reaction delay: `200ms - (dustSpent * 0.5ms)` (min 80ms)

### Game Modes
- **Classic**: Fixed 3×3 grid, simple spawning rules
- **Evolve**: Progressive stages (0–9), increasing complexity, pattern unlocks
- Powerups only work in Evolve mode (locked in shop during Classic)

### Cell Types & Resolution
- **Colors**: white, blue, red, orange, yellow, green, cyan, lime, teal, pink, rose, magenta, purple (avoid!)
- **Powerups**: medpack, shield, freeze, multiplier
- **Special**: ice (requires multiple taps), hold (require sustained hold)
- **Active cells** track `clicked` status and store animation metadata

### Event System
- Engine emits: `spawn`, `hit`, `miss`, `gameOver`, `powerupActivate`, `rareColorTrigger`, `dustConsumed`
- useGameEngine transforms events into React state updates
- GameOver captures seed immediately to prevent stale references

### Seeded PRNG & Replay
- `mulberry32` seeding function for deterministic gameplay
- Seed stored at game start, captured at game over (before setTimeout)
- Replay feature: save seed to localStorage, game reads it on next start
- `SettingsDrawer` allows custom seed input for testing

### TypeScript Conventions
- Strict mode enabled
- Type definitions for all engine types in `engine/types.ts`
- Props interfaces: `*Props` suffix (e.g., `PlayerPanelProps`)
- Optional fields use `?` and destructuring with defaults in components

### Testing
- Vitest with jsdom environment
- localStorage cleared before/after tests via `test/setup.ts`
- Mock game states to test edge cases (rare colors, powerup logic, stage transitions)
- All 25 tests passing; run single test with `pnpm test -- filename`

### Colorblind Support
- Built-in filters: deuteranopia, protanopia, tritanopia, monochrome
- CSS filters applied globally; selected in SettingsDrawer
- Shapes used as secondary cues (square, circle, triangle, roundedTriangle)

---

## File Organization Notes

- **No .github directory yet** — this file creates it
- **Firebase config**: `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `.firebaserc`
- **Vite config**: `vite.config.ts` (React plugin, jsdom test env, `./` base for relative imports)
- **TypeScript**: `tsconfig.json` (strict mode, JSX: react-jsx)
- **Styles**: `styles/game.css` (imported in App.tsx)
- **Public assets**: `public/` (manifest.json for PWA, sw.js service worker)
- **Build output**: `dist/` (excluded from git via .gitignore)
- **Ignore patterns**: `.firebase/`, `.agents/`, `.continue/`, `.gemini/`, `.trae/`, `.windsurf/`

---

## Important Notes

### Firebase
- Cloud Functions require TypeScript compilation before deploy
- Security rules enforce write bounds: score ≤ 100,000, dust < 1,000,000
- Composite indexes required for leaderboard queries (defined in `firestore.indexes.json`)
- API key restricted to `game.mscarabia.com` in Firebase Console

### Performance
- RAF loop with dirty flag reduces React re-renders significantly
- Canvas backgrounds run at 60fps with no storage overhead
- Shallow cloning removed from snapshot syncing (engine already deep-clones active cells)

### Common Pitfalls
- **Double powerup consumption**: Ensure `numPlayers` is set correctly (1 for solo, 2 for duo) in engine initialization
- **Stale seed references**: Always capture seed at game over before setTimeout
- **Timezone bugs**: Use ISO date strings for Firestore streak comparisons
- **Powerup deduction**: Happens once at `start()`, not in constructor or `makePS()`

---

## Error Tracking (Sentry)

The game now has Sentry error monitoring configured:
- **Frontend project**: `donttouchpurple-web` (React app)
- **Backend project**: `donttouchpurple-functions` (Cloud Functions, optional)
- **Setup**: See `.github/SENTRY_SETUP.md` for complete guide
- **Configuration**: DSNs stored in `.env.local` and `.env.production` (not committed)
- **What's tracked**: Uncaught exceptions, React error boundaries, Firebase failures, stack traces

When adding new features:
- Use `Sentry.captureMessage()` to log important events
- Use `Sentry.setTag()` to add context (e.g., game mode, stage)
- Errors in error boundaries are automatically captured

---

## Useful Links

- **Deployed**: https://dont-touch-purple.web.app
- **Repository**: https://github.com/defaltadmin/donttouchpurple.git
- **Sentry Dashboard**: https://sentry.io (error monitoring)
- **Firebase Console**: Configure API keys, rules, indexes, and hosting
- **Vite Docs**: https://vitejs.dev
- **React 18 Docs**: https://react.dev
- **Vitest Docs**: https://vitest.dev
