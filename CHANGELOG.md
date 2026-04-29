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

### Deployment Prep

- **Firebase hosting config**
  - `firebase.json` updated with proper hosting config (`dist/` folder, ignore patterns)
  - Removed parentheses from rule/index file paths
  - Added `.firebase/`, `.agents/`, `.continue/`, `.gemini/`, `.trae/`, `.windsurf/` to `.gitignore`
