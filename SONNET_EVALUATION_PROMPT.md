# Sonnet Evaluation Prompt — Don't Touch Purple v5.1.1

## Context
You are evaluating **Don't Touch Purple** game (v5.1.1) after three rounds of AI-assisted development:
- **Round 1 (opencode/big-pickle)**: Implemented v5.1.0 with Evolve mode, RAF loop, seeded PRNG, new features
- **Round 2 (Gemini)**: Audited codebase, found 5 bugs, proposed fixes
- **Round 3 (opencode/big-pickle)**: Implemented all fixes from Gemini's audit
- **Round 4 (opencode/big-pickle)**: Fixed 6 more bugs (makePS storage, devForcePattern, stored powerup zeroing, dirty flag, fbSyncDust, fbCheckWeeklyBonus, getDeviceId, updateStreak timezone)

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
├── config/          # difficulty.ts, gridPatterns.ts, keybindings.ts, powerupWeights.ts, dailyObjective.ts
├── services/        # firebase.ts (Firebase integration)
├── functions/       # Firebase Cloud Functions (updateStreak)
├── __tests__/       # GameEngine.test.ts, DifficultyScaler.test.ts, configIntegrity.test.ts
└── public/          # manifest.json, sw.js (PWA support)
```

## What Was Done (v5.1.1 Fixes)

### Bugs Fixed (11 total):

**Engine/GameEngine.ts (4 fixes):**
1. **makePS double powerup consumption** - Stripped storage writes from `makePS()`, moved to `start()` - loads stored once, deducts mult/heart once
2. **devForcePattern missing p1.cells** - Now updates `p1.cells` after spawning active cells
3. **activateStoredFreeze/Shield zeroing mult/heart** - Now preserves `mult` and `heart` values when saving
4. **RAF loop dirty flag** - Only emits snapshot when state changes (`dirty = true`), reduces unnecessary renders

**services/firebase.ts (4 fixes):**
5. **fbSyncDust** - Replaced `addDoc` with `setDoc(doc(db, "dust_wallet", name)` for stable keys
6. **fbCheckWeeklyBonus** - Added `where("date", ">=", oneWeekAgo)` for server-side filtering
7. **getDeviceId** - Wrapped in try/catch, returns `crypto.randomUUID()` as fallback
8. **fbGetStreak** - Now accepts `{ clientDate? }` param and forwards to Cloud Function

**functions/src/index.ts (1 fix):**
9. **updateStreak timezone** - Uses `clientDate` from client if valid ISO format, else falls back to server-computed date

**App.tsx (1 fix):**
10. **fbGetStreak call** - Now passes `{ clientDate: new Date().toISOString().split("T")[0] }`

**firestore.indexes.json (1 fix):**
11. **Composite index** - Added `date ASC + score DESC` for lb_global collection

### Current State:
- ✅ All 25/25 tests passing
- ✅ Build successful (314KB JS, 62KB CSS)
- ✅ Git log (8 commits on master):
  ```
  6b9b6e4 fix: 6 bugs - makePS storage, devForcePattern, stored powerup zeroing, dirty flag, fbSyncDust, fbCheckWeeklyBonus, getDeviceId, updateStreak timezone
  e60f70c fix: 4 bugs - makePS double-consume, devForcePattern cells, stored powerup zeroing, RAF dirty flag
  0bdd1a7 docs: add comprehensive Sonnet evaluation prompt with game overview
  7f76d0a docs: add game overview and complete v5.1.1 changelog with all fixes
  c76bcf0 chore: update firebase.json hosting config for deployment
  e1536f4 fix: firebase timezone bugs, firestore indexes, and game engine refinements
  40a68d1 chore: optimize for Firebase Spark (Free) tier
  6ed2f5b v5.1.0 - Evolve mode, RAF loop, seeded PRNG, new features
  ```
- ✅ Workspace clean (no uncommitted changes)
- ✅ Firebase config files properly configured for deployment

## Files to Evaluate (Priority Order)

### Priority 1: Engine Files (Most Impactful)

**1. engine/GameEngine.ts** (636 lines) - Core game logic
- **Seeded PRNG (mulberry32)** - Lines 11-19, used for deterministic gameplay
- **RAF loop** - Lines 237-246, `startSnapshotRaf()` with dirty flag optimization
- **Game tick** - Lines 304-398, `processTick()` handles cell spawning, damage, powerups
- **Powerup logic** - `spawnActive()` (lines 67-132), `activateStoredFreeze/Shield()` (lines 551-572)
- **Duo mode** - Both players share same RNG instance for sync
- **Score/damage** - Evolve mode: 0.5 damage, Classic: 1 damage
- **Rare color mode** - Lines 312-328, 5-10 turns duration

**2. engine/types.ts** (43 lines) - Data shapes
- `GameSnapshot`, `PlayerState`, `ActiveCell`, `GameConfig` interfaces
- Check if types are complete and properly typed

**3. config/difficulty.ts** - Tuning constants
- `GAME` object (MAX_HEARTS, TICK_MS, HUMAN_LIMIT_TICK, etc.)
- `DIFFICULTY` array (tick → ms mapping)
- `computeMs()`, `makeGameSeed()`, `getSpinConfig()` functions
- Verify decay curve is fair and engaging

**4. config/gridPatterns.ts** - Stage/pattern definitions
- `STAGES` (7 stages for Classic mode)
- `EVOLVE_PATTERNS` (multiple patterns with minStage, cols, rows, mask)
- `RARE_COLORS` array
- Check if patterns provide good progression

### Priority 2: UI/UX (If you want improvements)

**5. components/HUD/PlayerPanel.tsx** - Main game grid + interaction
- Cell rendering, animations, key badges
- Powerup drop animations
- Check for performance issues with 25 cells

**6. components/Screens/StartScreen.tsx** - Menu with mode selection
- Energy system display
- Daily objective widget
- Shop/tutorial navigation

**7. components/Screens/GameOver.tsx** - Game over screen
- Score display, high score logic
- Leaderboard check, share functionality

**8. hooks/useGameEngine.ts** (309 lines) - React hook
- Wraps GameEngine for React
- Event handling (sound, toast, damage, shake, etc.)
- Timer cleanup on unmount
- Check for memory leaks or missing cleanups

### Priority 3: Monetization/Retention

**9. config/dailyObjective.ts** - Daily challenges
- Objective generation, completion checking
- Dust rewards (500 dust bonus)
- Check if objectives are achievable and engaging

**10. config/powerupWeights.ts** - Powerup spawn rates
- `POWERUP_TABLE` with weights for medpack, shield, freeze, multiplier
- Check if weights create balanced gameplay

**11. services/firebase.ts** (139 lines) - Firebase integration
- `fbAddScoreGlobal()` - Leaderboard submissions
- `fbFetchTop20Global()` - Leaderboard fetching
- `fbSyncDust()` - Dust wallet sync (now uses setDoc)
- `fbCheckWeeklyBonus()` - Weekly bonus check (now server-side date filter)
- `fbGetStreak()` - Login streak (now with clientDate timezone fix)

## What You Should Evaluate

### Primary Tasks:
1. **Code Review**:
   - Review `engine/GameEngine.ts` - Is the core loop correct? Any race conditions?
   - Review `engine/types.ts` - Are types complete and accurate?
   - Review `config/difficulty.ts` - Is the difficulty curve well-tuned?
   - Review `config/gridPatterns.ts` - Do patterns provide good progression?

2. **Bug Hunt**:
   - Are there any remaining bugs Gemini/opencode missed?
   - Check edge cases in duo mode, Evolve mode progression, powerup logic
   - Verify Firebase security rules are complete and secure
   - Check if dirty flag RAF optimization has any issues

3. **Improvements**:
   - **Performance**: Any optimizations possible in RAF loop or cell rendering?
   - **Code Quality**: Type safety, error handling, missing edge cases?
   - **Game Balance**: Is Evolve mode difficulty curve fair? Powerup weights balanced?
   - **Firebase Optimization**: Spark free tier cost optimization?

4. **Deployment Readiness**:
   - Is the codebase ready for Firebase deployment?
   - Any missing config or setup steps?
   - PWA configuration complete (manifest.json, sw.js)?

### Specific Questions:
- Is the mulberry32 PRNG implementation correct for duo mode sync?
- Are there any race conditions in the RAF loop + setTimeout tick system?
- Should `fbCheckWeeklyBonus` use the composite index we added to firestore.indexes.json?
- Is the `dust_wallet` collection secure against spam (anyone can write any name)?
- Should the `updateStreak` function validate the deviceId more strictly?
- Is the dirty flag implementation in RAF loop correct? Any snapshots being missed?
- Are the powerup weights in `config/powerupWeights.ts` balanced for fun gameplay?
- Does the damage calculation (0.5 in Evolve, 1 in Classic) feel right?

### Deliverables Expected:
1. **Bug Report**: List of any bugs/issues found (if any)
2. **Top 5 Improvement Recommendations** with priority (high/medium/low)
3. **Game Balance Analysis**: Difficulty curve, powerup weights, progression feel
4. **Performance Audit**: RAF loop, rendering, Firebase query optimization
5. **Deployment Checklist**: What to do before `firebase deploy`
6. **Suggested Next Features** (if any) - What would improve player retention/monetization?

---

**Branch**: `master` (all commits merged)
**Latest Commit**: `6b9b6e4` (all 11 bug fixes)
**Test Command**: `npx vitest run`
**Build Command**: `pnpm run build`

**Start your evaluation with the engine files** — that's where the most impactful improvements will be (feel, difficulty curve, powerup balance). Once you read those, you can give a concrete list of what's actually worth fixing vs what's already solid.

### Key Files to Read First:
1. `engine/GameEngine.ts` - Read the entire file (636 lines)
2. `engine/types.ts` - Read the entire file (43 lines)
3. `config/difficulty.ts` - Check tuning constants
4. `config/gridPatterns.ts` - Verify stage/pattern definitions

Then optionally:
5. `components/HUD/PlayerPanel.tsx` - UI/UX improvements
6. `hooks/useGameEngine.ts` - Hook optimization
7. `config/dailyObjective.ts` - Retention features
8. `config/powerupWeights.ts` - Monetization balance

Start now.
