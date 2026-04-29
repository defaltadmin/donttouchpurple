# Sonnet Evaluation Prompt — Don't Touch Purple v5.1.1

## Context
You are evaluating **Don't Touch Purple** game (v5.1.1) after two rounds of AI-assisted development:
- **Round 1 (opencode/big-pickle)**: Implemented v5.1.0 with Evolve mode, RAF loop, seeded PRNG, new features
- **Round 2 (Gemini)**: Audited codebase, found 5 bugs, proposed fixes
- **Round 3 (opencode/big-pickle)**: Implemented all fixes from Gemini's audit

## Game Overview
**Don't Touch Purple** is a fast-paced reaction game built with React + TypeScript:
- **Classic Mode**: Avoid purple cells on a 3×3 grid
- **Evolve Mode**: Progressive difficulty with pattern unlocks, rare color modes, special cells (ice, hold, powerups)
- **Duo Mode**: Two-player local multiplayer on shared screen

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

## What Was Done (v5.1.1 Fixes)

### Bugs Fixed:
1. **High score logic** (`App.tsx` lines 276-286)
   - Previously: p1Score always updated Classic best, p2Score updated Evolve best (wrong)
   - Fixed: Now checks `gameMode` to update correct best score

2. **Double powerup consumption** (`engine/GameEngine.ts` lines 215-217)
   - Previously: `makePS()` called for both players in solo mode, consuming 2 charges
   - Fixed: Solo mode initializes p2 with `numPlayers: 1`

3. **Snapshot redundancy** (`hooks/useGameEngine.ts` line 193)
   - Previously: Hook did shallow clone `{ ...event.snapshot }` on every tick
   - Fixed: Removed redundant clone (engine already deep-clones in `getSnapshot()`)

4. **Stealth mode cleanup** (`App.tsx`, `DevOverlay.tsx`)
   - Removed `DevFab` component and imports completely
   - Reduces bundle size, maintains stealth requirement

5. **Firebase timezone bugs** (`functions/src/index.ts`, `services/firebase.ts`)
   - `updateStreak` Cloud Function: Uses ISO date strings instead of `toDateString()`
   - `fbCheckWeeklyBonus`: Uses `toISOString().split("T")[0]` for reliable date comparison

6. **Firestore indexes** (`firestore.indexes.json`)
   - Created composite index for leaderboard queries (`score DESC`, `ts DESC`)
   - Deleted duplicate `(firestore.indexes.json)` with insecure rules

7. **Firebase security rules** (`firestore.rules`)
   - `lb_global`: Now allows `date` (string) and optional `badge` fields
   - Max score raised to 100,000 for Evolve mode
   - `dust_wallet`: Added bounds (`name.size() <= 20`, `dust < 1,000,000`)
   - Deleted insecure `(firestore.rules)` with wide-open access

8. **Version sync** (`package.json`)
   - Updated to 5.1.0 to match CHANGELOG.md

### Current State:
- ✅ All 25/25 tests passing
- ✅ Build successful (314KB JS, 62KB CSS)
- ✅ Git log (5 commits on `feature/sonnet-patch-all`):
  ```
  7f76d0a docs: add game overview and complete v5.1.1 changelog
  c76bcf0 chore: update firebase.json hosting config
  e1536f4 fix: firebase timezone bugs, firestore indexes, engine refinements
  6ed2f5b v5.1.0 - Evolve mode, RAF loop, seeded PRNG, new features
  ```
- ✅ Workspace clean (no uncommitted changes)
- ✅ Firebase config files properly configured for deployment

## Gemini's Audit (Round 2 Findings)

Gemini identified these 5 critical issues that were all fixed:

1. **High Score Logic Bug**: Scores were being saved to wrong mode leaderboards
2. **Double Powerup Consumption**: Solo mode consumed 2 powerup charges instead of 1
3. **Snapshot Redundancy**: Unnecessary shallow clone in React hook
4. **Stealth Mode Cleanup**: DevFab component still present after Task 6 removal requirement
5. **Version Sync**: package.json at 5.0.0, CHANGELOG at 5.1.0

Gemini's assessment after fixes: *"Workspace is clean and deployment-ready."*

## What You Should Evaluate

### Primary Tasks:
1. **Code Review**:
   - Review `engine/GameEngine.ts` (617 lines) - Core game logic with mulberry32 PRNG, RAF loop
   - Review `App.tsx` (998 lines) - Main component with game flow, high score logic
   - Review `services/firebase.ts` (149 lines) - Firebase integration
   - Review `functions/src/index.ts` (34 lines) - Cloud Functions

2. **Bug Hunt**:
   - Are there any remaining bugs Gemini/opencode missed?
   - Check edge cases in duo mode, Evolve mode progression, powerup logic
   - Verify Firebase security rules are complete and secure

3. **Improvements**:
   - What performance optimizations are possible?
   - Code quality issues (type safety, error handling, etc.)?
   - Missing features that would improve gameplay?
   - Firebase cost optimization (Spark free tier)?

4. **Deployment Readiness**:
   - Is the codebase ready for Firebase deployment?
   - Any missing config or setup steps?
   - PWA configuration complete?

### Specific Questions:
- Is the mulberry32 PRNG implementation correct for duo mode sync?
- Are there any race conditions in the RAF loop + setTimeout tick system?
- Should `fbCheckWeeklyBonus` use server timestamps instead of client date?
- Is the `dust_wallet` collection secure against spam (anyone can write any name)?
- Should the `updateStreak` function validate the deviceId more strictly?

### Deliverables Expected:
1. List of any bugs/issues found (if any)
2. Top 5 improvement recommendations with priority
3. Deployment checklist (what to do before `firebase deploy`)
4. Suggested next features (if any)

---

**Branch**: `feature/sonnet-patch-all`
**Commit to review**: `7f76d0a` (latest)
**Test command**: `npx vitest run`
**Build command**: `pnpm run build`

Start your evaluation now.
