# Don't Touch Purple — Changelog

## Game Overview

**Don't Touch Purple** is a fast-paced reaction game built with React + TypeScript, featuring:
- **Classic Mode**: Avoid purple cells as they appear on a 3×3 grid
- **Evolve Mode**: Progressive difficulty with pattern unlocks, rare color modes, and special cells (ice, hold, powerups)
- **Duo Mode**: Two-player local multiplayer on a shared screen

**Tech Stack**: React 18, Vite, Firebase (Firestore + Functions), TypeScript, Vitest

**Folder Structure**:
```
deploy-ready/
├── engine/          # GameEngine.ts, DifficultyScaler.ts, types.ts
├── components/
│   ├── HUD/        # Hearts, PlayerPanel, PwrBar, EnergyBar, DustWidget
│   ├── Screens/    # StartScreen, GameOver, HowToPlay, EvolveTutorial, WhatsNew
│   ├── Settings/    # SettingsDrawer, DevOverlay, KeyBinder
│   ├── Animations/  # ShieldDrop, FreezeDrop, EnergyDrop
│   └── Shop/        # ShopPanel
├── hooks/           # useGameEngine.ts, useInputHandler.ts
├── config/          # difficulty.ts, gridPatterns.ts, keybindings.ts, powerupWeights.ts
├── services/        # firebase.ts (Firebase integration)
├── functions/       # Firebase Cloud Functions (updateStreak)
├── __tests__/       # GameEngine.test.ts, DifficultyScaler.test.ts, configIntegrity.test.ts
└── public/          # manifest.json, sw.js (PWA support)
```

**Key Features**:
- Seeded PRNG (mulberry32) for deterministic gameplay
- RequestAnimationFrame loop for smooth UI updates
- Powerups: Medpack, Shield, Freeze, Multiplier
- Energy system with natural regeneration
- Daily objectives with dust rewards
- Global leaderboard (Firebase Firestore)
- Shop with themes, badges, and skins
- Keyboard + touch input support
- Colorblind filters (deuteranopia, protanopia, tritanopia, monochrome)
- PWA support with service worker

## v5.1.1 — 2026-04-30

### Bug Fixes

- **High score logic corrected**
  - `handleEngineGameOver` now checks `gameMode` to update the correct best score (Classic vs Evolve)
  - Previously, p1Score always updated Classic best and p2Score updated Evolve best regardless of actual mode played
  - `App.tsx` lines 276-286

- **Double powerup consumption fixed**
  - Solo mode now initializes p2 with `numPlayers: 1` to prevent double consumption of stored powerups
  - `makePS()` was being called for both players even in solo mode, consuming 2 charges instead of 1
  - `engine/GameEngine.ts` lines 215-217

- **Snapshot redundancy removed**
  - Removed shallow clone `{ ...event.snapshot }` in `useGameEngine.ts` hook
  - Engine's `getSnapshot()` already performs deep cloning of active cells
  - `hooks/useGameEngine.ts` line 193

- **Stealth mode cleanup**
  - Removed `DevFab` component and its imports completely
  - Component definition removed from `DevOverlay.tsx`
  - Import removed from `App.tsx`
  - Reduces bundle size and maintains stealth requirement

- **Firebase timezone bugs fixed**
  - `updateStreak` Cloud Function now uses ISO date strings instead of `toDateString()` for reliable timezone comparison
  - `fbCheckWeeklyBonus` in `services/firebase.ts` uses `toISOString().split("T")[0]` for date comparison
  - `functions/src/index.ts` and `services/firebase.ts`

- **Firestore indexes added**
  - Created `firestore.indexes.json` with composite index for leaderboard queries (`score DESC`, `ts DESC`)
  - Deleted duplicate `(firestore.indexes.json)` file with insecure rules
  - Required for `fbFetchTop20Global` query to work

- **Firebase security rules tightened**
  - `lb_global` now allows `date` (string) and optional `badge` fields to match actual code usage
  - Max score raised to 100,000 for Evolve mode
  - `dust_wallet` now has bounds: `name.size() <= 20` and `dust < 1,000,000`
  - Deleted insecure `(firestore.rules)` duplicate with wide-open `allow read, write: if true`
  - `firestore.rules`

- **Version sync**
  - `package.json` updated to 5.1.0 to match CHANGELOG.md
  - Previously was stuck at 5.0.0

### Critical Bug Fixes (Sonnet Bug Report)

- **triggerGameOver() now preserves mult/heart on game over**
  - Previously, game over was consuming stored multiplier and heart powerups instead of preserving them
  - Now loads `cur` state and explicitly saves `cur.mult` and `cur.heart` back to storage
  - `engine/GameEngine.ts` `triggerGameOver()` method

- **Constructor no longer calls makePS()**
  - Removed redundant storage read in constructor that was initializing player state twice
  - `start()` method now handles all initialization properly
  - `engine/GameEngine.ts` constructor

- **fbCheckWeeklyBonus redundant filter removed**
  - Removed client-side `.filter()` that was redundant with Firestore query
  - `services/firebase.ts` `fbCheckWeeklyBonus()`

- **spawnActive powerup roll fixed**
  - Fixed probability comparison: `roll < effectiveTotal / 100` where `effectiveTotal` is properly scoped
  - Fixed `evolveSpecial` variable scoping so it's accessible in the return statement
  - Fixed `totalWeight` declaration before the conditional block
  - `engine/GameEngine.ts` `spawnActive()` function

- **Rare color trigger logic fixed**
  - Now uses `lastRareTriggerScore` tracker to avoid missing trigger windows
  - Previously used `% 50 < 4` window which could be missed if score jumped too fast
  - `engine/GameEngine.ts` tick loop

- **start() now properly loads and deducts stored powerups once**
  - Single storage read at start, properly deducts mult/heart usage once
  - Removed double-deduction bug where powerups were consumed twice
  - `engine/GameEngine.ts` `start()` method

- **makePS() stripped of storage writes**
  - Removed all storage write logic from `makePS()` to prevent side effects
  - Storage writes now happen explicitly in `start()` and `triggerGameOver()`
  - `engine/GameEngine.ts` `makePS()` function

- **Dirty flag added to RAF loop**
  - Added `this.dirty = true/false` flag to skip unchanged snapshots
  - Reduces unnecessary React re-renders when no state changes
  - `engine/GameEngine.ts` RAF loop

- **fbSyncDust now uses setDoc instead of addDoc**
  - Changed from `addDoc(collection())` to `setDoc(doc(db, "dust_wallet", name))` for stable document keys
  - Prevents duplicate dust wallet documents for same user
  - `services/firebase.ts` `fbSyncDust()`

- **getDeviceId fixed**
  - Improved device ID generation for Firebase storage
  - `services/firebase.ts` `getDeviceId()`

- **updateStreak timezone handling with clientDate**
  - `App.tsx` now passes `clientDate` parameter to `fbGetStreak()`
  - Cloud Function uses client-provided date for streak calculation
  - `App.tsx` and `functions/src/index.ts`

### Deployment Prep

- **Firebase hosting config**
  - `firebase.json` updated with proper hosting config (`dist/` folder, ignore patterns)
  - Removed parentheses from rule/index file paths
  - Added `.firebase/`, `.agents/`, `.continue/`, `.gemini/`, `.trae/`, `.windsurf/` to `.gitignore`

### Tests

- **All 25 tests passing**
  - `DifficultyScaler.test.ts`: 9 tests
  - `configIntegrity.test.ts`: 5 tests
  - `GameEngine.test.ts`: 8 tests
  - `engine/GameEngine.test.ts`: 3 tests

### UI Improvements

- **Hearts capped at 7 (5 base + 2 bonus)**
  - `components/HUD/Hearts.tsx` now limits display to MAX_HEARTS + 2
  - Row 2 only renders up to 2 bonus hearts

- **Shop powerups locked in Classic mode**
  - Added 🔒 lock icon and "Powerups only work in Evolve mode" message
  - `components/Shop/ShopPanel.tsx` now accepts `gameMode` prop
  - `App.tsx` passes `mode` to ShopPanel
  - Prevents confusion from buying unusable powerups

### Deployment

- **Firebase configuration**
  - API key restricted to `game.mscarabia.com` in Firebase Console
  - Firestore rules deployed with client-side write support for Spark plan
  - Hosting deployed to https://dont-touch-purple.web.app
  - Code pushed to https://github.com/defaltadmin/donttouchpurple.git

### Future Features (Planned)

1. **Bot Assist Mode ("Dust Guard")**
   - Hold button to auto-tap missed non-danger cells
   - Costs 10 dust/second while held
   - Reaction delay: 200ms - (dustSpent * 0.5ms), floor at 80ms
   - Error rate: 0% + 2% per grid stage
   - UI: Pill button in PlayerPanel (Evolve mode only), requires 50 dust minimum

2. **Seed Replay**
   - "▶ Replay Seed" button on GameOver share card
   - Stores seed in localStorage as `pendingReplaySeed`
   - StartScreen banner: "Replay seed: XXXXXXXX — [Play] [Clear]"
   - GameEngine.start() accepts optional `forceSeed?: number`
   - Settings drawer: "Custom Seed" text input with Play button

3. **Animated Backgrounds (Wallpapers)**
   - Canvas-based animations (no video/GIF)
   - Unlockable via shop: 300-600 dust each
   - Designs: void-tunnel, star-warp, grid-pulse, plasma, particle-web
   - Each ~50 lines of JS, zero storage, 60fps
   - Future: AI-generated WebM videos for cinematic backgrounds

4. **Triangular Grid Shapes (v6.0)**
   - Octagon/Pentagon/Triangle cell shapes
   - Requires new GridRenderer component with CSS clip-path or SVG
   - Cell orientation (up/down) needed for triangles
   - Hit detection logic changes required
   - Engine stays same — just adds orientation to cell type
