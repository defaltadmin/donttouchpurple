# Don't Touch Purple — Changelog

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
