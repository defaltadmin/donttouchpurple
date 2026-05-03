# Don't Touch Purple — Changelog

# DTP v5.5.0 — Planned Changes (Phases E–K)


## v5.5.0 — (Unreleased)

### Phase E — Rewards Hub (replaces Daily Challenges button)

- **E1**: New pill-shaped "Rewards Hub" button between username and energy bar — single icon with notification badge (numbered red dot) showing unclaimed rewards count
- **E2**: Rewards Hub popup contains 3 tabs: Daily Check-in, Daily Tasks, Weekly Tasks
- **E3**: Daily Check-in tab — login streak with claim button; no longer dismissible by tapping outside (modal is persistent until explicitly closed with ✕)
- **E4**: Daily Tasks tab — 3 daily challenges with progress bars and individual claim buttons
- **E5**: Weekly Tasks tab — tasks include: reach top 10 leaderboard this week, play both Classic and Evolve, play X rounds, reach milestone score; dust rewards on claim
- **E6**: Notification badge on hub icon counts total unclaimed claimable rewards (login + completed tasks)
- **E7**: Removed "Daily Challenges" button from bottom nav; moved "Reach X streak" objective pill into Rewards Hub
- **E8**: `dtp-login-claimed` key updated — popup no longer dismissible by outside tap; must use ✕ or Claim button

### Phase F — UI Declutter

- **F1**: Game Over screen simplified — auto-save and auto-submit score to leaderboard (remove name input + Save button)
- **F2**: Game Over screen removes: Peak Streak, Ticks, Dust Earned stats, Personal Best display, daily objective progress, Replay Seed button, Report a Bug link
- **F3**: Game Over screen keeps: score (large), dust earned shown as heart icon inline with score, Again + Menu buttons; adds small bug report icon (🐛) in corner
- **F4**: Energy bar moved out of main HUD into its own popup — tapping energy icon opens popup with "Refill 1 game" and "Refill to Full" options and cost display
- **F5**: Main menu bottom nav simplified — remove Daily Challenges entry; hub icon replaces it
- **F6**: Leaderboard capped at top 10 entries only (remove "Show all" expand); personal best shown as a separate pinned row at bottom of leaderboard if not in top 10

### Phase G — Rare Color Mode UX

- **G1**: Remove text badge "⚠️ Don't touch X — N left" — replace with a non-text indicator: pulsing colored ring around the entire grid border that matches the rare color, with N dots/pips that disappear one by one as ticks count down
- **G2**: Rare color background gradient clears when returning to menu (same fix as previous rare badge issue — ensure full state reset on screen change)
- **G3**: Bot assist: bot must never tap the rare color cell during rare mode

### Phase H — Bot Mode Fixes

- **H1**: Bot icon repositioned — moved to top-right corner of HUD (above grid, not overlapping), never clipped by rotating grid
- **H2**: Bot handles multi-tap requirement blocks correctly — sends required number of taps to same cell
- **H3**: Bot handles hold blocks correctly — sends hold-start and hold-end events with correct duration
- **H4**: Bot never taps rare color cell during rare mode (same as G3 — implement once, reference both)
- **H5**: Bot tap animation: instead of cells silently disappearing, show the circular ripple/pop animation (same as human tap) when bot taps a cell

### Phase I — Cell Tap Animation + Hold Block ✅ DONE

- **I1**: Circular ripple animation on cell tap — originates from tap point, expands to cell edges; applies to both human taps and bot taps
- **I2**: Hold block redesigned — shows a proper hold-button icon (finger press icon or circular hold indicator) with an arc/ring progress bar showing hold duration remaining; current implementation has no visual progress
- **I3**: NaN dust bug fixed — `dustEarned` calculation guarded against undefined/NaN values before display and before adding to wallet

### Phase J — Background Overhaul Round 2 ✅ DONE

- **J1**: PulseField.tsx — concentric expanding squares with corner block shapes; replaces BlockOrbit
- **J2**: GlitchGrid.tsx — 5×5 static grid with randomised glitch flashes; replaces DataStream
- **J3**: AmbientFlow.tsx — slow diagonal drift of faint geometric shapes; replaces CellBreath
- **J4**: All new backgrounds use low BASE_SPEED constants (~60% slower than replaced components)
- **J6**: All new canvas components use position:fixed + 100vw × 100vh
- **J7**: AmbientFlow uses 3 shape types (square, diamond, triangle) — no single shape dominates

### Phase K — Grid Slide Mechanic ✅ DONE

- **K1**: tryShuffleCells() method — 1-2 cells slide to adjacent empty slot per trigger
- **K2**: Only fires in Evolve mode at gridStage >= 3, every 40-60 ticks (nextShuffleTick)
- **K3**: slideAnim Record<idx, {fromIdx, startMs}> on PlayerState drives CSS translate transition (200ms ease-out)
- **K4**: Hold and ice cells excluded from shuffle (mid-tap state integrity)
- **K5**: cellShuffle event added to GameEvent union in types.ts; emitted on each shuffle

---




## v5.4.0 — 2026-05-03

### Phase A — Bug Fixes
- **A1**: Rare badge clears on menu return (`snapshotRef.current = null` + `screen === "playing"` guard)
- **A2**: Pastel theme contrast fixed (hardcoded `#fff` → `var(--text)` in `game.css`)
- **A3**: Evolve tutorial once-only (`dtp-evolve-tutorial-seen` flag)
- **A4**: Bot mode grid fixed (`setBotAssist()` now calls `startBot()`/`stopBot()`)

### Phase B — Backgrounds Overhaul
- **B0**: Shop tab order changed (BG first, Themes second)
- **B1–B3**: Rewrote `VoidTunnel.tsx`, `StarWarp.tsx`, `GridPulse.tsx` with DTP block shapes
- **B4**: Created 5 new backgrounds: `PurpleCascade.tsx`, `BlockOrbit.tsx`, `DataStream.tsx`, `CellBreath.tsx`, `WarpGate.tsx`
- **B5**: Updated `config/powerupWeights.ts` with new background entries
- **B6**: Added new themes (Toxic, Inferno, Ocean, Gold Rush) to `SHOP_THEMES`

### Phase C — Daily Rewards System
- **C1**: Created `utils/dustAnimation.ts` for dust fly-to-wallet animation
- **C2**: Created `LoginStreakPopup.tsx` with streak tracker and reward system
- **C3**: Created `DailyChallengesPopup.tsx` with 3 daily challenges per day
- **C4**: Added popup CSS animations to `styles/game.css`
- **C5**: Added login streak check on app start with `getObjectiveStreak()`
- **C6**: Wired popup handlers and JSX into `App.tsx` with challenge progress tracking

## v5.5.0 — 2026-05-04 (Unreleased)

### Phase E — Rewards Hub ✅ DONE
- E1–E8: RewardsHub.tsx created; 3-tab modal (Check-in, Daily, Weekly); notification badge on hub icon; login streak auto-opens hub; no outside-click dismiss; Daily Challenges button replaced; weekly task tracking with dtp-weekly-* keys

### Phase F — UI Declutter ✅ DONE
- F1: Auto-submit score on game over (no name input)
- F2: Removed recap stats, prevBest, daily objective progress, Replay Seed, Bug link from GameOver
- F3: Score + dust inline; small 🐛 corner icon; Again + Share + Board + Menu buttons only
- F4: Energy popup modal (icon opens popup with refill options)
- F5: Daily Challenges nav entry removed (consolidated into Rewards Hub)
- F6: Leaderboard capped at 10; personal best pinned row if not in top 10

### Phase G — Rare Color Mode UX ✅ DONE
- G1: Text badge replaced with pulsing colored ring around viewport + pip dots countdown
- G2: Rare gradient clears on menu return (screen === "playing" guard)
- G3: Bot never taps rare color (startBot uses dynamic rareColorNow)

### Phase H — Bot Mode Fixes ✅ DONE
- H1: Bot 🤖 icon moved to header-right HUD (never clipped by rotating grid)
- H2: Bot taps ice cells (removed ice exclusion from startBot filter)
- H3: Bot handles hold blocks (holdStart + holdEnd with correct duration)
- H4: Same fix as G3 — rareColorNow guard in startBot
- H5: Bot tap triggers pop animation + ok sound

### Phase I — Cell Tap Animation + Hold Block (pending)
- I1: Circular ripple ::after animation on .cell--pop (CSS-only, 380ms ease-out)
- I2: Hold block redesigned — conic-gradient arc ring + finger icon via HoldCellDisplay component
- I3: NaN guards on earned/newDust/bonusDust in handleEngineGameOver; dustRef as source of truth

### Phase J — Background Overhaul Round 2 (pending)
- J1: PulseField.tsx — concentric expanding squares with corner block shapes; replaces BlockOrbit
- J2: GlitchGrid.tsx — 5×5 static grid with randomised glitch flashes; replaces DataStream
- J3: AmbientFlow.tsx — slow diagonal drift of faint geometric shapes; replaces CellBreath
- J4: All new backgrounds use low BASE_SPEED constants (~60% slower than replaced)
- J6: All new canvas components use position:fixed + 100vw × 100vh
- J7: AmbientFlow uses 3 shape types (square, diamond, triangle)

### Phase K — Grid Slide Mechanic (pending)
- K1: tryShuffleCells() method — 1-2 cells slide to adjacent empty slot per trigger
- K2: Only fires in Evolve mode at gridStage >= 3, every 40-60 ticks (nextShuffleTick)
- K3: slideAnim Record<idx, {fromIdx, startMs}> on PlayerState drives CSS translate transition (200ms ease-out)
- K4: Hold and ice cells excluded from shuffle (mid-tap state integrity)
- K5: cellShuffle event added to GameEvent union in types.ts; emitted on each shuffle

### Phase L — Stability, Security & Resilience ✅ DONE (new)
- L1: safeGet/safeSet/safeGetJSON utility — hardens all localStorage access against private mode throws
- L2: scoreSubmittedRef — prevents duplicate Firestore score writes per session
- L3: processTick wrapped in try/catch — engine crash triggers graceful game over instead of silent freeze
- L4: startBot() double-start guard — clears existing botIntervalId before creating new interval
- L5: Dust init integrity check — clamps to 0 if NaN / negative / > 9M on load
- L6: CSP meta tag in index.html — restricts script/connect sources to self + Firebase
- L7: checkTop10Achievement() — auto-marks weekly top-10 task when leaderboard fetch confirms it

### v5.5.0 complete ✅
All phases E–L implemented. Phase L stability additions included.

---

## v5.4.0 — 2026-05-03
- **D1**: Added `inputMode` to `GameConfig` interface in `engine/types.ts`
- **D2**: Updated `App.tsx` to pass `inputMode: "keys" | "touch"` to engine config
- **D3**: Modified `GameEngine.ts` to skip grid rotation when `inputMode === 'keys'`
- **D4**: Keys mode now locks grid rotation so keyboard inputs remain consistent

---

## v5.3.2 — 2026-05-02

### Critical Bug Fixes

**Fix 1 — Powerup Spawn Logic Bug**
- Fixed powerup selection in `spawnActive()` that used wrong denominator
- Changed from `if (roll < cursor / totalWeight)` to direct cumulative check `if (roll < cursor)`
- Added proper guard: `if (powerupEligible && totalWeight > 0)`
- `engine/GameEngine.ts` - `spawnActive()` function

**Fix 2 — Memory Leak: Hold Timers Not Cleared**
- Added cleanup in `destroy()` method to clear hold timers
- Clears all pending hold timers and tap buffers on engine destroy
- Prevents memory leaks when engine is recreated
- `engine/GameEngine.ts` - `destroy()` method

**Fix 3 — Game Over Timer Leak**
- Added cleanup at start of `triggerGameOver()` 
- Clears tap buffer and hold timers before stopping engine
- Prevents pending taps from firing after game over
- `engine/GameEngine.ts` - `triggerGameOver()` method

---

## v5.3.1 — 2026-05-02

### New Features

**GROUP 5 — Daily Objective Streak**
- Added `getObjectiveStreak()` and `incrementObjectiveStreak()` to `config/dailyObjective.ts`
- Updated `markObjectiveComplete()` to call `incrementObjectiveStreak()`
- Added streak badge display in `StartScreen.tsx` when objective is completed

**GROUP 6 — Personal Best Delta Flash**
- Added `pbFlashedRef` to track when player beats their personal best
- Added effect in `App.tsx` to show "🎉 New Best!" toast when player exceeds PB
- Resets `pbFlashedRef.current = false` on each game start

**GROUP 7 — Debounce `fbSyncDust`**
- Added debounce mechanism to `fbSyncDust()` in `services/firebase.ts`
- Uses 5-second debounce to prevent rapid consecutive Firestore writes
- Stores latest dust value and only syncs after inactivity period

**GROUP 8 — Bot Visibility Guard**
- Updated bot assist in `engine/GameEngine.ts` to check pattern mask before tapping
- Bot now only taps cells that are visible in the current pattern (not hidden by mask)
- Uses `validSlots` Set to filter `missedCells`

**GROUP 10 — Shop Tab Persistence**
- Added localStorage persistence for shop tab selection (`dtp-shop-tab`)
- Shop now remembers last active tab (Themes, Badges, Skins, Powers, BG) between sessions
- Tab state initializes from localStorage on component mount

**GROUP 11 — Tutorial Step Persistence**
- Added localStorage persistence for tutorial step (`dtp-tutorial-step`)
- Tutorial now resumes from last viewed step if interrupted
- Clears saved step when tutorial completes

**GROUP 12 — Leaderboard Mode Filter Persistence**
- Added mode filter (Classic/Evolve) to `LeaderboardPanel.tsx`
- Filter state persisted in localStorage (`dtp-lb-mode`)
- Leaderboard now shows filtered entries based on selected mode

**GROUP 13 — WhatsNew Tab Update**
- Added "New!" badge to WhatsNew component when version changes
- Badge shows only when `dtp_last_version` differs from current `WHATS_NEW_VERSION`
- Properly uses `__APP_VERSION__` injected by Vite

### Bug Fixes

**Fix 1 — Remove duplicate setScreen("gameover") in handleEngineGameOver**
- Removed the first `setScreen("gameover")` that appeared before the daily objective check.
- Screen transition now happens exactly once, after all score/dust/objective logic completes.

**Fix 2 — Remove showRecap from HUD/game-area gate**
- Removed `showRecap` from all conditions that hide/show the game area or HUD.
- RecapScreen now renders as an overlay sibling, not inside a conditional that hides everything else.

**Fix 3 — Remove damagePulse state**
- Deleted the `damagePulse` useState declaration and all references (setState calls, JSX className conditions).
- The `body.classList.add('damage-pulse')` approach already handles the vignette — the state variable was dead code causing unnecessary re-renders.

**Fix 4 — Move energy check before tutorial in startGame**
- Reordered `startGame` so the tutorial display (`gamesPlayed < 3`) comes after the energy/dust check, not before.
- Function now checks energy first and returns early if insufficient, then proceeds to tutorial logic if energy is available.

**Fix 5 — Merge RecapScreen into GameOver, delete RecapScreen.tsx**
- Deleted `src/components/Screens/RecapScreen.tsx`.
- Removed `showRecap`, `recapData` state and all code that sets them from App.tsx.
- Removed the `<RecapScreen>` JSX block from App.tsx.
- Added recap props to `GameOver.tsx`: `recapScore`, `recapPrevBest`, `recapPeakStreak`, `recapTicks`, `recapDustEarned`, `recapObjective`.
- GameOver now renders recap stats (peak streak, ticks survived, dust earned, daily objective progress bar) inline.
- Fixed syntax errors (missing commas in `Math.max()` calls and `onTap` arrow functions) introduced during edits.

**Fix — Bot document.hidden guard**
- `GameEngine.ts` `startBot()` interval: added `document.hidden` check so bot pauses when tab is backgrounded.

**Fix — Firestore score cap tightened**
- `firestore.rules`: reduced score cap from 100,000 to 9,999; added score-per-tick ratio guard (score ≤ tick × 3 + 50).

**Fix 1 — Remove no-op visibilitychange handler (App.tsx)**
- Deleted the empty `handleVisibilityChange` listener that did nothing but add/remove itself.
- The `useBackgroundController` hook now owns visibility handling (see Fix 11).

**Fix 2 — Add `best1`/`best2`/`gameMode` to `handleEngineGameOver` deps**
- Previously missing from the `useCallback` dependency array, causing stale closures on best-score checks.
- `App.tsx` line 440: changed `}, [numPlayers, dust, playerName, toast$]);` → `}, [numPlayers, dust, playerName, toast$, best1, best2, gameMode]);`

**Fix 3 — Make `gamesPlayed` reactive**
- Changed from static `parseInt(localStorage.getItem(...))` to `useState` with `setGamesPlayed`.
- `handleTutorialClose` now calls `setGamesPlayed(next)` after incrementing.
- `startGame` now increments `gamesPlayed` for non-tutorial starts (adds `gamesPlayed` to deps).

**Fix 4 — Memoize `backgroundMap`**
- Wrapped the background component map in `React.useMemo(() => ({ ... }), [])` to avoid re-creation every render.
- `App.tsx` lines 472–478.

**Fix 5 — Add Bot Assist keyboard shortcut to HowToPlay**
- Added `<kbd>B</kbd>` entry to the keyboard shortcuts section in `components/Screens/HowToPlay.tsx`.

**Fix 6 — Memoize `getBotAccuracy` / stop reading localStorage per call**
- `getLifetimeDustSpent` and `getBotAccuracy` now use `useCallback` with proper deps.
- Updated `dustCallbacks` deps to include `getBotAccuracy`: `}, [spendDust, getBotAccuracy]);`

**Fix 7 — Rare mode pre-warning toast**
- Added pre-warn one score-window (3 ticks) before rare mode activates at score % 47.
- `engine/GameEngine.ts` `processTick()`: emits `⚠️ Danger color changing soon!` before the `s1 % 50 < 4` trigger window.

**Fix 8 — Daily objective completion celebration**
- Replaced quiet toast with extended 3.5s display: `setToast('🎯 Daily Complete! +${reward} 💜')` with `setTimeout(..., 3500)`.
- Added Sentry breadcrumb `daily_complete` and `fbLogEvent("daily_complete", ...)`.

**Fix 9 — Remove `autoFocus` on mobile for name input**
- `NameChangeForm` autoFocus now conditional: `autoFocus={!('ontouchstart' in window)}`.

**Fix 10 — EnergyDrop mislabeled as multiplier trigger**
- `App.tsx` lines 1211/1214: changed `pwrToastP1?.includes("multiplier")` → `pwrToastP1?.includes("⚡")` to match actual powerup toast emoji.

**Fix 11 — FreezeDrop/EnergyDrop never reset**
- Rewrote both components with proper `useEffect` cleanup: `if (!active) return;` + `setVisible(true)` + `setTimeout(() => setVisible(false), 1100)` + cleanup.
- Matched `ShieldDrop.tsx` pattern; both now properly disappear after animation.

**Fix 12 — WhatsNew version sync guard**
- Added `// VERSION MUST MATCH package.json on every release` comment.
- Replaced hardcoded `"5.3.1"` with `__APP_VERSION__` injected by Vite `define` in `vite.config.ts`.
- `components/Screens/WhatsNew.tsx` now declares `declare const __APP_VERSION__: string;`.

**Fix 13 — Service worker cache auto-versioning**
- `public/sw.js`: changed `CACHE_NAME = 'dtp-v5-2-4'` → `'dtp-v__SW_VERSION__'`.
- `vite.config.ts`: added `writeBundle` plugin that replaces `__SW_VERSION__` with `pkg.version` in `dist/sw.js` after build.
- Also added `__APP_VERSION__` define for runtime access.

**Fix 14 — Bundle splitting: lazy-load Firebase**
- Removed static `import { fbAddScoreGlobal, ... } from "./services/firebase"` from App.tsx.
- Added `getFirebase()` hook: `firebaseRef.current = await import('./services/firebase')` — Firebase SDK only loads when first needed.
- Updated all call sites: `handleEngineGameOver`, `startGame`, `submitScore`, `fbGetStreak` useEffect, `LeaderboardPanel` prop.

**Fix 15 — Lazy-load background components**
- Replaced static `import VoidTunnel/StarWarp/GridPulse/PurpleRain` with `React.lazy(() => import(...))`.
- Wrapped background render in `<Suspense fallback={null}>`.
- Reduces initial bundle size significantly.

**Fix 16 — Lazy-load Sentry + safe wrapper**
- `main.tsx`: replaced static `import * as Sentry` with conditional dynamic import only on `game.mscarabia.com`.
- Added `safeSentry` wrapper in App.tsx: wraps all `Sentry.addBreadcrumb/captureException/setTags/setContext` in try/catch to handle ad-blockers.
- All Sentry calls in App.tsx now use `safeSentry.*`.

**Fix 17 — Score-per-tick sanity check in `submitScore`**
- Added guard: `if (score && tick > 0 && score / tick > MAX_SCORE_PER_TICK)` where `MAX_SCORE_PER_TICK = 20`.
- Rejects impossible scores before they hit Firestore; reports via `safeSentry.captureException`.

**Fix 18 — Add missing Sentry breadcrumbs**
- `startGame`: added `tutorial_shown` breadcrumb when `gamesPlayed < 3`.
- `handleEngineGameOver`: added `daily_complete` breadcrumb + `fbLogEvent`.
- `ShopPanel.tsx`: updated `spend()` to accept `itemId`/`category`, fires `fbLogEvent("shop_purchase", ...)` and `Sentry.addBreadcrumb` on every purchase.
- Updated all buy functions (`buyTheme`, `buyBadge`, `buySkin`, `buyBackground`, `buyPowerup`) to pass through metadata.

### Engine Fixes (2-may-sonnet batch)

**GameEngine.ts — Bot `Math.random()` → `this.rng()`**
- `processTick()` bot assist section line 432: replaced `if (Math.random() > accuracy)` with `if (this.rng() > accuracy)` — uses seeded RNG for deterministic replay.

**firebase.ts — Lazy firestore module loader**
- Added `getFbModules()` cache: deduplicates `import("firebase/firestore")` calls across `fbAddScoreGlobal`, `fbFetchTop20Global`, `fbSyncDust`, `fbCheckWeeklyBonus`.
- All inline `await import("firebase/firestore")` calls replaced with `await getFbModules()`.

**firestore.rules — Tightened validation**
- Added `validScore()`, `validInitials()`, `validBadge()`, `validDate()` helper functions.
- Added score-per-tick guard: `request.resource.data.score <= request.resource.data.tick * 3 + 50` when tick is present.
- `dust_wallet` rules simplified: merged create+update into single rule with `allow create, update: if ...`.
- All rules now use helper functions for consistency.

**useBackground.ts — `document.hidden` check + visibility wiring**
- Added `applyState` helper that checks `shouldAnimate && !document.hidden`.
- `register()` now applies state immediately with `document.hidden` check.
- Added `visibilitychange` listener inside the hook — owns tab-visibility handling; empty handler in App.tsx is now safe to delete.

**EvolveTutorial.tsx — Guard Next button during auto-advance**
- Added `isAutoAdvance = current.duration > 0` check.
- Next button now `disabled={isAutoAdvance}` with reduced opacity and `cursor: default`.
- Prevents double-advance when auto-timer fires simultaneously with click.

**ShopPanel.tsx — Sentry breadcrumb + fbLogEvent on purchases**
- `spend()` helper now accepts `itemId?: string` and `category?: string`.
- On successful purchase: fires `fbLogEvent("shop_purchase", { item, category, cost, dustAfter })` and `Sentry.addBreadcrumb({ category: "shop", message: ... })`.
- All buy functions updated to thread `itemId` and category through.

### Technical Improvements
- Bundle size reduced via lazy-loaded Firebase, Sentry, and background components.
- All dynamic `import()` calls deduplicated via cache patterns.
- Sentry ad-blocker safe: all calls wrapped in `safeSentry` try/catch.
- Score validation: client-side sanity check rejects impossible scores before Firebase write.
- Version sync: `package.json` → Vite `define` → `WhatsNew.tsx` + service worker (no more drift).
- `useBackgroundController` now fully owns visibility + pause state (removed responsibility from App.tsx).

**Status**: Ready for testing and deployment.

---

## v5.3.0 — 2026-05-01

### Major Features

**Rare Mode Colorblind Support**
- Danger cells now use distinct shapes (triangle, diamond, square, roundedTriangle) in addition to color changes.
- Colorblind players see clear emoji overlays on rare cells.
- Full integration with existing rare mode system.

**Background Pause System**
- All animated canvas backgrounds (PurpleRain, StarWarp, VoidTunnel, GridPulse) now properly pause when:
  - Game is paused
  - Tab is hidden (visibilitychange)
  - Reduced motion preference is enabled
  - Game is not in playing phase
- Significantly improves battery life and performance on mobile.

**Cell System Improvements**
- Major refactor of Cell component for better maintainability.
- Restored full support for hold cells, ice counters, keyboard labels, and press feedback.
- Simplified prop passing from PlayerPanel.

**Interactive First-Run Tutorial**
- New guided tutorial for first 3 games.
- Teaches core rules, rare mode, powerups, and colorblind shape system.

### Technical Improvements
- `useBackgroundController` hook for centralized background management.
- Cleaner Cell → PlayerPanel data flow.
- Fixed multiple App.tsx import and state issues during stabilization.

**Status**: Stabilized and ready for testing.

---

## AI Review Master Packet

Use this single file as the review handoff for Grok, Claude, ChatGPT, Gemini, or any other AI reviewer. It contains the project summary, history, current fixes, review instructions, and phased roadmap.

### Review Persona for External AIs

You are reviewing **Don't Touch Purple**, a fast, arcade-style reaction game built with React, TypeScript, Vite, Firebase, and Sentry.

Adopt this persona:
- Be a senior game/product/code reviewer: direct, practical, and specific.
- Preserve the game's playful identity: cheeky, kinetic, competitive, slightly savage, but never mean-spirited or generic.
- Think like a mobile-first arcade designer and a TypeScript engineer at the same time.
- Prioritize retention, clarity, fairness, performance, shareability, privacy, and trust.
- Call out bugs and risks clearly, with file names and exact reasoning.
- Separate confirmed issues from guesses. If something cannot be verified from the files, say so.
- Recommend scoped changes that fit the current architecture.
- Prefer free or generous-tier tools and workflows because this is an indie web game.

Tone and style:
- Concise but thorough.
- No corporate fluff.
- Use priority labels: Critical, High, Medium, Low, Nice-to-have.
- Include specific implementation suggestions.
- Respect the current game language: bold purple arcade UI, emoji-heavy feedback, short punchy copy, fast taps, local multiplayer, progression/shop/dust economy.

### Files to Upload With This Changelog

Upload these first:
- `package.json`
- `App.tsx`
- `main.tsx`
- `engine/GameEngine.ts`
- `engine/DifficultyScaler.ts`
- `engine/types.ts`
- `hooks/useGameEngine.ts`
- `hooks/useInputHandler.ts`
- `config/difficulty.ts`
- `config/gridPatterns.ts`
- `config/powerupWeights.ts`
- `config/dailyObjective.ts`
- `services/firebase.ts`
- `firestore.rules`
- `firestore.indexes.json`
- `functions/src/index.ts`
- `public/manifest.json`
- `public/sw.js`
- `components/Screens/StartScreen.tsx`
- `components/Screens/GameOver.tsx`
- `components/Screens/HowToPlay.tsx`
- `components/Screens/WhatsNew.tsx`
- `components/Leaderboard/LeaderboardPanel.tsx`
- `components/Shop/ShopPanel.tsx`
- `components/Settings/SettingsDrawer.tsx`
- `components/Cell/index.tsx`
- `components/HUD/PwrBar.tsx`
- `styles/game.css`
- `__tests__/GameEngine.test.ts`
- `__tests__/DifficultyScaler.test.ts`
- `__tests__/configIntegrity.test.ts`

Optional if the reviewer accepts more files:
- `components/Backgrounds/*.tsx`
- `components/HUD/*.tsx`
- `components/Settings/*.tsx`
- `vite.config.ts`
- `tsconfig.json`
- `firebase.json`

Do **not** upload `.env`, `.env.local`, `.env.production`, `node_modules`, `dist`, coverage output, or zip files.

### Current Stabilization Status (v5.3.0)

Current stabilization status (v5.3.0):
- Rare Mode Colorblind Support: Complete
- Background Pause System: Complete
- Cell Refactor: Complete and tested
- First-Run Tutorial: Integrated (shows on first 3 games)
- Remaining work: Full manual QA on mobile + rare mode shape visibility under colorblind filters

### Prompt to Send With the Files

Review this game project: **Don't Touch Purple**.

It is a React + TypeScript + Vite arcade reaction game with Classic mode, Evolve mode, Duo local multiplayer, powerups, daily objectives, dust economy, shop unlocks, Firebase global leaderboard/streaks, PWA support, and Sentry monitoring.

Read `CHANGELOG.md` first so you understand what has already been fixed and what is still planned. Then analyze the uploaded source files.

Return the review in this format:

1. **Executive verdict**
   - What is already strong?
   - What is most likely holding the game back?
2. **Confirmed bugs and risks**
   - List by severity.
   - Include file names and exact logic involved.
   - Separate true bugs from possible concerns.
3. **Gameplay and retention**
   - Difficulty curve, fairness, clarity, progression, rewards, streaks, replay seeds, shop, daily objective, bot assist, powerups.
   - Suggest changes that create "one more run" energy.
4. **UX and accessibility**
   - Mobile layout, touch/keyboard controls, colorblind mode, motion, audio/haptics, readable UI, onboarding, pause/game-over flow.
5. **Security and backend**
   - Firebase config, Firestore rules, leaderboard cheating, dust wallet trust, Cloud Functions, privacy banner, data model.
   - Recommend free-tier-safe improvements.
6. **Performance and PWA**
   - Bundle size, code splitting, dynamic imports, canvas backgrounds, service worker cache strategy, offline behavior, low-end mobile risks.
7. **Monitoring and analytics**
   - Sentry setup, useful breadcrumbs/tags, privacy-safe analytics/events, crash/session monitoring, deploy health checks.
8. **Test plan**
   - Exact tests to add next for engine, React flows, Firebase/rules, PWA, and mobile behavior.
9. **Prioritized roadmap**
   - Quick wins this week.
   - Medium work next.
   - Bigger bets later.

Constraints:
- Keep the core identity: fast, purple, funny, competitive, arcade-like.
- Prefer free tools or generous free tiers.
- Do not suggest paid systems unless there is a strong free option first.
- Keep recommendations concrete and implementable.
- If proposing code changes, describe where they should go and why.

## AI Review Roadmap Phases

### Phase 0 — Completed in Current Session

- Fixed leaderboard score submission shape by adding the required ISO `date` field before calling Firebase.
- Fixed Firestore dust wallet sync rules so existing wallet documents can be updated, not only created.
- Added dust wallet validation so the document ID must match the stored wallet name.
- Sanitized `fbSyncDust()` name and dust values before writing.
- Improved Firebase code splitting by removing static `firebase/app` and `firebase/functions` imports from `services/firebase.ts`.
- Updated service worker cache name from stale `dtp-v2-5-0` to `dtp-v5-2-4`.
- Restricted the service worker runtime cache to same-origin GET requests only.
- Avoided caching failed responses and external Firebase/API requests.
- Added Sentry tags for screen, game mode, input mode, player count, practice mode, and colorblind mode.
- Added Sentry game context for seed, tick, phase, score, streak, health, grid stage, pattern index, and current danger color.
- Added Sentry breadcrumbs for game start, pause, resume, game over, energy refill, and score submit.
- Added Sentry exception capture for failed leaderboard submissions instead of silently swallowing the error.
- Added `fbLogEvent()` privacy-safe Firebase Analytics wrapper with dynamic loading and safe parameter trimming.
- Logged `game_start`, `game_over`, `energy_refill`, `score_submit`, and `setting_changed` events when Analytics is supported.
- Added score payload normalization before leaderboard writes: score clamp, initials sanitization, date fallback, mode normalization, and badge sanitization.
- Tightened Firestore rules to reject extra fields, require ISO date format, limit badge length, and constrain dust wallet fields.
- Added unit tests for Firebase score/date normalization helpers.
- Added a persisted reduced-motion setting that honors the browser preference on first load, disables animated backgrounds, suppresses screen shake, and calms CSS motion.
- Added a separate persisted haptics toggle so vibration can be controlled independently from sound.
- Added a no-dependency `pnpm check:bundle` budget script for built JS/CSS assets.
- Added GitHub Actions CI to install dependencies, run tests, build, and enforce the bundle budget on pushes/PRs.
- Consolidated the Grok/external AI review packet into this changelog.

### Phase 1 — High-Impact Quick Wins

- Add Sentry breadcrumbs for shop purchase, daily completion, rare-mode start, bot assist activation, and replay seed usage.
- Expand Firebase Analytics coverage to shop purchase, daily completion, rare-mode start, bot assist activation, replay seed usage, settings changes, and tutorial completion.
- Add Firebase Remote Config for difficulty constants, powerup weights, dust prices, daily objective rewards, and feature flags.
- Expand reduced-motion coverage after visual QA if any remaining cell effects feel too intense.
- Add visual QA for haptics and reduced-motion behavior on actual mobile devices.
- Add leaderboard submission feedback when Firebase save fails and the game falls back to local-only.
- Align `package.json`, `WhatsNew`, service worker cache name, and changelog release headings before every deployment.

### Phase 2 — Fairness, Security, and Trust

- Move leaderboard writes through a Cloud Function.
- Validate score submissions server-side using mode, score, tick, seed, duration, and rough score-per-tick limits.
- Add per-device rate limits to leaderboard and streak functions.
- Add Firebase App Check for hosted builds.
- Add Firestore rules tests for `lb_global`, `dust_wallet`, and future server-owned collections.
- Decide whether dust is purely local fun currency or a server-trusted economy. If trusted, move dust updates server-side.
- Add a server-written score audit collection for suspicious scores instead of blocking too aggressively.

### Phase 3 — Retention and Game Feel

- Add daily/weekly challenge seeds with fixed leaderboards.
- Add share links that include mode and seed, so friends can instantly replay the same run.
- Add personal run history: last 10 scores, best streak, best seed, best stage.
- Add medals per mode: Bronze, Silver, Gold, Purple Legend.
- Add streak milestones with small cosmetic rewards.
- Add first-run interactive tutorial for the first 10 seconds of play.
- Add optional ghost/replay preview for personal best seed attempts.
- Add clearer rare-mode warning transitions for colorblind players using icon/shape changes, not color alone.

### Phase 4 — Performance and PWA

- Use bundle visualization to split Firebase, Sentry, settings/shop, and leaderboard routes into separate chunks.
- Lazy-load heavy animated backgrounds and shop-only backgrounds.
- Pause canvas backgrounds when the tab is hidden, game is paused, or reduced motion is enabled.
- Add low-power mode for older phones.
- Replace broad runtime service worker caching with a clearer static-asset strategy.
- Add update-available UI when a new service worker version is installed.
- Add Lighthouse CI checks for performance, accessibility, best practices, and PWA.

### Phase 5 — Testing and Automation

- Add tests for score submission payload shape.
- Add tests for dust sync behavior and Firestore rules.
- Add replay seed determinism tests across multiple engine runs.
- Add rare color mode transition tests.
- Add energy refill, full refill, and no-energy UI tests.
- Add Playwright mobile smoke tests for menu, gameplay, pause, game over, shop, leaderboard, and settings.
- Add accessibility checks with `axe-core`.
- Add Lighthouse CI or Playwright visual smoke tests as a second CI job.

### Free Tools Worth Using

- **Firebase Analytics**: event funnels and retention basics.
- **Firebase Remote Config**: tune game balance without redeploying.
- **Firebase App Check**: reduce backend abuse.
- **Sentry**: errors, breadcrumbs, release health, sampled session replay.
- **Lighthouse CI**: free PWA/performance/accessibility checks.
- **Playwright**: mobile browser smoke tests.
- **axe-core**: accessibility scans.
- **rollup-plugin-visualizer** or `vite-bundle-visualizer`: bundle inspection.
- **GitHub Actions**: test/build/deploy checks.
- **PostHog free tier**: product analytics if Firebase Analytics is not enough.

## Game Overview

**Don't Touch Purple** is a fast-paced reaction game built with React + TypeScript, featuring:
- **Classic Mode**: Avoid purple cells as they appear on a 3×3 grid
- **Evolve Mode**: Progressive difficulty with pattern unlocks, rare color modes, and special cells (ice, hold, powerups)
- **Duo Mode**: Two-player local multiplayer on a shared screen

**Tech Stack**: React 18, Vite, Firebase (Firestore + Functions), TypeScript, Vitest, Sentry

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

## v5.3.0 — 2026-05-01

### New Features — Rare Mode Colorblind Support

- **Shape-based cell rendering for rare mode**
  - Added `shape?: CellShape` to `BaseCell` type (propagates to all `ActiveCell` union types)
  - Rare danger cells now render with distinct shapes (triangle, diamond, circle, square, roundedTriangle)
  - `engine/types.ts`

- **Rare mode config system**
  - Added `RARE_MODE_CONFIGS` record mapping color names to shape/emoji configs
  - Added `getRareModeConfig()` helper for shape/emoji lookup by color name
  - `config/gridPatterns.ts`

- **GameEngine rare mode shape assignment**
  - Added `rareShape?: CellShape` parameter to `spawnActive()` function
  - Rare danger cells now get `shape` property assigned when spawned
  - Updated `processTick()` and `devForcePattern()` to pass `rareShape`
  - `engine/GameEngine.ts`

- **Cell component refactored for simplicity**
  - Now accepts full `cell: ActiveCell` object instead of individual props
  - Imports `getRareModeConfig()` itself (removes prop drilling)
  - Uses unified `cell-shape--${shape}` class system
  - Powerup icons rendered via `cell-icon` class
  - `components/Cell/index.tsx`

- **PlayerPanel simplified**
  - Cell usage now passes `cell` object + `colorblindMode` only
  - Removed deprecated props: `rareShape`, `isRareDanger`, `rareEmoji`, `iceCount`, `holdRequired`, `holdStart`
  - `components/HUD/PlayerPanel.tsx`

- **CSS Shape System for Colorblind Support**
  - Added `.cell-shape--circle`, `.cell-shape--square`, `.cell-shape--triangle`, `.cell-shape--roundedTriangle`, `.cell-shape--diamond`
  - Added `.cell-rare-emoji` for colorblind emoji overlay
  - Added `.cell.rare-danger` for enhanced danger cell visibility
  - Added `.cell-icon` for powerup/special icons
  - Added `.cell.clicked` for disabled state
  - Mobile touch-action improvement (`touch-action: manipulation`)
  - `styles/game.css`

### Bug Fixes

- **Cell shape rendering** — Aligned Cell component with new `.cell-shape--*` naming convention
- **getRareModeConfig robustness** — Added `String()` cast and `.trim()` for safety

---

## v5.2.4 — 2026-05-01

### Bug Fixes

- **Invisible grid root cause fixed**
  - Removed duplicate `.game-area` definition in `game.css` that caused layout collapse and incorrect padding precedence.
  - Correct definition with `display: flex` now applies properly.
  - `styles/game.css`

### New Features

- **PurpleRain Default Background**
  - Added `PurpleRain.tsx` animated canvas background (28 drifting shapes, sine-wave breathing opacity).
  - Set as the default background when no other background is equipped.
  - Respects `--purple` CSS variable for theme support.
  - `components/Backgrounds/PurpleRain.tsx` and `App.tsx`

### UI Improvements

- **Bot Assist Pill Styles**
  - Added `.bot-assist-btn` styles to `game.css` matching the existing pill-row aesthetic.
  - Includes hover states, active gradient pulse animation, and disabled opacity.
  - `styles/game.css`

- **Shop Refinement**
  - `StarWarp` background demoted to shop-only (paid item), making room for `PurpleRain` as the new free default.
  - `App.tsx`

## Unreleased Review Notes — formerly drafted as v5.3.2

### Bug Fixes

- **`FreezeDrop` and `EnergyDrop` animations never reset**
  - Both components set `visible = true` on activation but never set it back to `false`
  - The emoji would float on screen permanently after the first powerup pickup
  - Fixed by adding a 1100ms timeout (matching the CSS animation duration) to hide both
  - `ShieldDrop` was already correct — used as the reference
  - `components/Animations/FreezeDrop.tsx`, `components/Animations/EnergyDrop.tsx`

- **`fbGetStreak` never passed `deviceId` to Cloud Function**
  - `updateStreak` Cloud Function requires `deviceId` but the client call omitted it
  - Function always threw `"deviceId required"` in production, silently falling back to local streak
  - Fixed by passing `getDeviceId()` in the callable payload
  - `services/firebase.ts`

- **`WhatsNew` version was `"2.5.0"` — out of sync with `package.json` `"5.2.4"`**
  - The modal would never show for any existing user since the stored key already matched
  - Updated to `"5.3.1"` with current feature list
  - `components/Screens/WhatsNew.tsx`

- **`manifest.json` incorrect PWA icon purpose**
  - `"purpose": "any maskable"` on a single generic SVG is incorrect
  - Maskable icons require specific safe-zone padding; a favicon SVG doesn’t have it
  - Changed to `"purpose": "any"` to avoid Android home screen display issues
  - `public/manifest.json`

### Scanner Findings (Confirmed False Positives)

- `delete ref.anim[idx]` — `anim` is `Record<number, string>` (object), not an array. Correct usage. No change.

### Tests

- **33/33 passing**, 0 TypeScript errors

---


### Critical Bug Fix

- **Game damage logic was inverted — now correct**
  - Previously: not tapping the danger color (purple/rare) on tick expiry caused damage
  - Now: not tapping a **safe** color on tick expiry causes damage
  - Tapping the danger color yourself still causes damage (unchanged)
  - Danger color cells that expire untapped now disappear harmlessly
  - Rare color mode follows the same corrected logic
  - `engine/GameEngine.ts` `processTick()` — inverted condition from `c.type === dangerColor` to `c.type !== dangerColor`

### Security

- **Firebase config moved to environment variables**
  - All Firebase credentials removed from `services/firebase.ts` source code
  - Values now read from `import.meta.env.VITE_FIREBASE_*` at build time
  - `.env` file created with actual values (already in `.gitignore`)
  - `.env.example` created as a reference template for new developers
  - `services/firebase.ts`, `.env`, `.env.example`

### Tests

- **Test suite updated to match corrected game logic — 33/33 passing**
  - `"damages the player when danger cells are not tapped in time"` → renamed and rewritten to test safe-cell miss damage
  - `"absorbs damage with a shield"` → rewritten to test shield absorption on danger color **tap** (not tick expiry)
  - `__tests__/GameEngine.test.ts`

### Scanner Findings (False Positives)

- `delete ref.anim[idx]` flagged as array deletion — `anim` is `Record<number, string>` (object), not an array. `delete` on object properties is correct. No change needed.

---


### Bug Fixes

- **HowToPlay durations corrected**
  - Freeze description fixed: "5 seconds" → "15 seconds" (matches actual `GAME` constant)
  - Multiplier description fixed: "8 seconds" → "24 seconds" (matches actual `GAME` constant)
  - `components/Screens/HowToPlay.tsx`

- **Daily objective completed-dates array no longer grows forever**
  - `loadCompletedDates()` now prunes entries older than 7 days before returning
  - Prevents unbounded localStorage growth after extended play
  - `config/dailyObjective.ts`

- **Energy "Full Refill" button now works**
  - `onRefillFull` was previously wired as `() => {}` (no-op) in `App.tsx`
  - Now correctly calculates cost for all missing pips, deducts dust, fills energy to max, and shows toast
  - `App.tsx`

- **Duplicate `mulberry32` removed from GameEngine**
  - Removed local copy of the PRNG function; now imports the canonical version from `DifficultyScaler.ts`
  - `engine/GameEngine.ts`

- **Bot uses seeded RNG instead of `Math.random()`**
  - `startBot()` error-rate check now uses `this.rng()` for deterministic replay
  - `engine/GameEngine.ts`

- **Medpack health now capped at `MAX_HEARTS`**
  - `ref.health += 1` replaced with `ref.health = Math.min(GAME.MAX_HEARTS, ref.health + 1)`
  - Prevents health exceeding the maximum even if a medpack spawns at full health
  - `engine/GameEngine.ts`

- **Exit-to-menu now uses a styled modal instead of `window.confirm()`**
  - Replaced blocking browser dialog with an in-game confirmation modal
  - Uses existing `modal-overlay` / `modal-panel` CSS classes — no new styles needed
  - `App.tsx`

### QOL Improvements

- **"🎉 New Best!" badge on Game Over screen**
  - Shown with a pop animation when the player beats their previous best score
  - `prevBest` is captured at game-over time (before `best1`/`best2` state updates) so the comparison is accurate
  - `components/Screens/GameOver.tsx`, `App.tsx`

- **Streak-lost toast**
  - When a player loses a streak of 5 or more by hitting the danger color, a `💔 N streak lost!` toast fires
  - Works for both tick-based misses (processTick) and direct taps (_processTap)
  - `engine/GameEngine.ts`

- **Rare mode turns-left indicator in PwrBar**
  - When rare color mode is active (e.g. "Don't Touch Red"), a draining `⚠️` pill now appears in the PwrBar
  - Shows remaining turns with a progress bar tinted in the rare color
  - `components/HUD/PwrBar.tsx`, `App.tsx`

### Monitoring

- **Sentry error tracking integrated**
  - `@sentry/react` installed and initialized in `main.tsx`
  - Only enabled on `game.mscarabia.com` (disabled in local dev)
  - `ErrorBoundary.componentDidCatch` now reports to Sentry with component stack
  - `tracesSampleRate: 0.1` (10% of transactions to stay within free tier)
  - `sendDefaultPii: false`
  - `main.tsx`, `App.tsx`

---

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

### v5.2.3 — 2026-05-01

### New Features

1. **Bot Assist Feature**
   - **Toggle-based activation** (not hold-based) — click once to activate, click again to deactivate
   - **Dust as fuel** — each bot tap costs 3 dust directly (not time-based)
   - **Strategic decision** — forces choice between saving dust for shop vs spending on bot
   - **Accuracy scales with lifetime dust spent**:
      - 0–500 dust spent → 85% accuracy
      - 500–2000 → 90% accuracy
      - 2000+ → 95% accuracy (never perfect)
   - **Minimum buffer** — bot won't activate if dust < 30
   - **Cost model**:
      - Stage 1 (2 cells/tick) → ~6 dust/tick max
      - Stage 9 (5 cells/tick) → ~15 dust/tick max
      - 500 dust → ~33–83 ticks of full coverage depending on stage
   - **UI**: Small toggle button below grid, shows 🤖 OFF / 🤖 ON · 3💜/tap
   - **Keyboard shortcut**: B key toggles bot assist for P1
   - **Auto-deactivate**: Button pulses when active, bot turns off automatically when dust < 30

2. **Implementation Details**
   - **Engine** (`engine/GameEngine.ts`):
      - Added `botAssistActive` state, `setBotAssist()` and `getBotAssistActive()` methods
      - Added bot assist logic in `processTick()` — taps missed cells with accuracy check
      - Emits `botTap` event with player, idx, and dustCost
   - **Types** (`engine/types.ts`):
      - Added `botAssist` config to `GameConfig` interface
      - Added `botTap` event to `GameEvent` union
   - **Hook** (`hooks/useGameEngine.ts`):
      - Added `setBotAssist` callback and `botAssistActive` state
      - Accepts `dustCallbacks` parameter for synchronous dust reads
      - Handles `botTap` event to trigger dust re-renders
   - **UI** (`components/HUD/PlayerPanel.tsx`):
      - Added bot assist toggle button with ON/OFF states
      - Button grays out when dust < 30 with tooltip
      - Active state pulses with CSS animation
   - **App** (`App.tsx`):
      - Added `dustRef` for synchronous engine reads
      - Added `getLifetimeDustSpent()` and `getBotAccuracy()` functions
      - Added `spendDust()` function that tracks lifetime dust spent
      - Passes `dustCallbacks` to `useGameEngine`
      - Added B key keyboard shortcut for P1 bot toggle
      - Passes bot props to PlayerPanel (P1 and P2 in duo mode)

### Tests

- **All 33 tests passing**
   - `DifficultyScaler.test.ts`: 8 tests
   - `configIntegrity.test.ts`: 5 tests
   - `engine/GameEngine.test.ts`: 3 tests
   - `GameEngine.test.ts`: 17 tests (added bot assist tests)

---

### v5.2.2 — 2026-05-01

### New Features

1. **Animated Backgrounds (Canvas Wallpapers)**
   - **3 Canvas components** created in `components/Backgrounds/`:
      - `VoidTunnel.tsx` — Concentric ellipses shrinking to center (purple hue), ~50 lines
      - `StarWarp.tsx` — Dots accelerating outward from center, ~50 lines
      - `GridPulse.tsx` — CSS animated perspective grid floor with pulse effect
   - **Shop integration** (`config/powerupWeights.ts`):
      - Added `SHOP_BACKGROUNDS` array with 4 items (Default + 3 animated)
      - Each has `id`, `name`, `icon`, `cost`, `desc`, `component` fields
   - **ShopPanel.tsx**: Added "🌌 BG" tab with buy/equip functionality
   - **App.tsx**: Added `equippedBackground` state, renders active background component during gameplay
   - **Performance**: All canvases run at 60fps, zero storage, pointer-events: none, z-index: -1

### Bug Fixes

- **TypeScript errors fixed**
   - Added `equippedBackground` to `ShopData` type and load/save functions
   - Added `persistDust` and `switchPlayer` callback stubs in App.tsx
   - Fixed `EnergyBar` props (changed `count` to `energy`)
   - Added `dustConsumed` to `GameEvent` type in `engine/types.ts`
   - Fixed `p1`/`p2` definite assignment in `GameEngine.ts` with `!` assertion
   - Added `startBot`, `stopBot`, `isBotActive` to `UseGameEngineReturn` type

### Tests

- **All 25 tests passing**
   - `DifficultyScaler.test.ts`: 8 tests
   - `configIntegrity.test.ts`: 5 tests
   - `engine/GameEngine.test.ts`: 3 tests
   - `GameEngine.test.ts`: 9 tests

---

### v5.2.1 — 2026-05-01

### Bug Fixes (Sonnet Report — Share Screen & Seed Replay)

- **Share screen seed bug fixed**
  - `handleEngineGameOver` now accepts `gameSeed` as 4th parameter from engine callback
  - Seed is captured at gameOver event time (before setTimeout delay), not from stale `snapshotRef`
  - `useGameEngine.ts` gameOver handler now captures `snap.gameSeed` before setTimeout and passes to `onGameOverRef.current()`
  - `App.tsx` line 285: updated `handleEngineGameOver` signature to `(engineWinner, p1Score, p2Score, gameSeed?)`
  - Prevents seed from being 0 due to stale snapshot ref after game over delay

- **gameMode={mode} bug fixed**
  - `App.tsx` line 810: Changed `gameMode={mode}` to `gameMode={gameMode}`
  - `mode` was undefined — the actual variable is `gameMode`
  - Caused runtime error when ShopPanel mounted with undefined gameMode prop

- **ShareCard "Copy seed" now queues replay**
  - `GameOver.tsx` `copySeed()` now saves seed to `localStorage.pendingReplaySeed`
  - Button label changed from "📋" to "▶ Replay" with tooltip "Copy seed & queue replay"
  - Clicking copies seed AND queues it for replay on next game start

- **SettingsDrawer now has Replay Seed section**
  - Added `customSeed`, `onCustomSeedChange`, `onPlayWithSeed` props to `SettingsDrawerProps`
  - New UI section at bottom of drawer with seed input field and play button
  - Input filters to digits only, max 12 characters
  - Play button saves seed to localStorage, sets pending replay, closes drawer, and starts game

### Tests

- **All 25 tests passing**
  - `DifficultyScaler.test.ts`: 8 tests
  - `configIntegrity.test.ts`: 5 tests
  - `engine/GameEngine.test.ts`: 3 tests
  - `GameEngine.test.ts`: 9 tests

---

### v5.2.0 — 2026-04-30

### New Features

1. **Seed Replay Feature**
   - **GameOver.tsx**: Added "▶ Replay Seed" button that saves seed to `localStorage.pendingReplaySeed` and starts game immediately
   - **StartScreen.tsx**: Added banner showing "Replay Seed: XXXXXXXX" with Play/Clear buttons
   - **App.tsx**: Added `pendingReplaySeed` state, `clearReplaySeed` handler, passes props to StartScreen and GameOver
   - **useGameEngine.ts**: Updated `start` function to accept `forceSeed?: number`
   - **GameEngine.ts**: Updated `start(forceSeed?)` to use provided seed or generate new one via `makeGameSeed()`
   - **How it works**: Click "Replay Seed" on GameOver → saves seed → StartScreen shows banner → Play uses saved seed → Clear removes it

2. **Animated Backgrounds (Canvas Wallpapers)**
   - **5 Canvas components** created in `components/Backgrounds/`:
     - `VoidTunnel.tsx` — Perspective rings shrinking to center (purple hue), ~50 lines
     - `StarWarp.tsx` — White dots accelerating outward from center, ~50 lines
     - `GridPulse.tsx` — CSS animated perspective grid floor with pulse effect
     - `Plasma.tsx` — Sine-wave color field shifting slowly, ~50 lines
     - `ParticleWeb.tsx` — Connected dots drifting with purple accents, ~50 lines
   - **Shop integration** (`config/powerupWeights.ts`):
     - Added `SHOP_BACKGROUNDS` array with 5 items (300-600 dust each)
     - Each has `id`, `name`, `icon`, `cost`, `desc`, `component` fields
   - **ShopPanel.tsx**: Added "🌌 BG" tab with buy/equip functionality
   - **App.tsx**: Added `equippedBackground` state, renders active background component during gameplay
   - **Performance**: All canvases run at 60fps, zero storage, pointer-events: none, z-index: -1

3. **Bot Assist Mode ("Dust Guard")**
   - **GameEngine.ts**: Added bot state and logic:
     - `botActive`, `botIntervalRef`, `dustSpentTotal` state variables
     - `startBot()`: Starts interval that auto-taps missed non-danger cells every 1s
     - `stopBot()`: Clears interval
     - `isBotActive()`: Returns bot status
     - **Reaction delay**: `200ms - (dustSpent * 0.5ms)`, floor at 80ms
     - **Error rate**: `stage * 2%` (max 18% at stage 9)
     - Consumes 10 dust/second while active
     - Emits `dustConsumed` events
   - **useGameEngine.ts**: Exposed `startBot`, `stopBot`, `isBotActive` methods
   - **PlayerPanel.tsx**: Added Bot Assist button:
     - Shows only in Evolve mode, not in practice mode
     - "🤖 Hold to Assist · 10💜/s" pill button at bottom center
     - Disabled if dust < 50
     - Hold to activate, release to stop
     - Glows when active
   - **App.tsx**: Passed `onStartBot`, `onStopBot`, `isBotActive()`, `dust` to PlayerPanel

### UI Improvements

- **Hearts capped at 7 (5 base + 2 bonus)**
  - `components/HUD/Hearts.tsx` now limits display to MAX_HEARTS + 2
  - Row 2 only renders up to 2 bonus hearts

- **Shop powerups locked in Classic mode**
  - Added 🔒 lock icon and "Powerups only work in Evolve mode" message
  - `components/Shop/ShopPanel.tsx` now accepts `gameMode` prop
  - `App.tsx` passes `mode` to ShopPanel
  - Prevents confusion from buying unusable powerups

### Bug Fixes

- **Share screen seed preservation fixed**
  - Added `gameSeedState` to capture seed at game over time
  - `handleEngineGameOver` now saves `snapshotRef.current?.gameSeed` to state
  - GameOver component uses `gameSeedState` instead of `snapshot.gameSeed`
  - Prevents seed from being 0/undefined when GameOver renders

- **All 25 tests passing**
  - `DifficultyScaler.test.ts`: 9 tests
  - `configIntegrity.test.ts`: 5 tests
  - `GameEngine.test.ts`: 8 tests
  - `engine/GameEngine.test.ts`: 3 tests

### Deployment

- **Firebase configuration**
  - API key restricted to `game.mscarabia.com` in Firebase Console
  - Firestore rules deployed with client-side write support for Spark plan
  - Hosting deployed to https://dont-touch-purple.web.app
  - Code pushed to https://github.com/defaltadmin/donttouchpurple.git
  - Commits: `6b9b6e4`, `3291a8e`, `315e33f`, `f3a45ee`, `30b06ab`, `aabea90`, `723eda4`, `5a51fcf`

## v5.1.1 — 2026-04-30

### Bug Fixes

- **High score logic corrected**
  - `handleEngineGameOver` now checks `gameMode` to update the correct best score (Classic vs Evolve)
  - Previously, p1Score always updated Classic best and p2Score updated Evolve best regardless of actual mode played
  - `App.tsx` lines 276-286
