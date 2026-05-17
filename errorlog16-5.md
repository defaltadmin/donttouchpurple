# DTP Error Log — 2026-05-16 (Updated 2026-05-17)

**Status:** Full codebase review completed 2026-05-17. Previous fixes preserved below.

---

## Previous Fixes (pre-2026-05-17)

| # | Issue | File | Status |
|---|-------|------|--------|
| 1 | CI YAML syntax — `${{` inside template literal breaks deploy | `.github/workflows/bundle-size.yml` | ✅ FIXED v7.5.3 |
| 2 | Energy stale closure — `spendEnergy` reads stale `energyData.count` | `hooks/useEnergyStore.ts` | ✅ FIXED v7.5.0 |
| 3 | Snapshot null-guards — missing `?.` on `p1.score`/`p2.score` | `App.tsx` | ✅ FIXED v7.5.3 |
| 4 | scoreSubmittedRef never resets — second game silently drops score | `App.tsx` | ✅ CONFIRMED OK |
| 5 | PWA banner gates on `screen === "menu"` — fires on first visit | `App.tsx` | ✅ FIXED v7.5.3 |
| 6 | Firebase streak lacks type guards — breaks on `undefined` | `App.tsx` | ✅ FIXED v7.5.3 |
| 7 | @sentry/tracing v7 vs @sentry/react v10 mismatch | | ✅ FIXED v7.5.0 |
| 8 | Duplicate Vite manual chunks | | ✅ FIXED v7.5.0 |
| 9 | Hardcoded version "5.8.17" check — dead code | | ✅ FIXED v7.5.3 |
| 10 | useScreenStateMachine unused `payload` param | | ✅ FIXED v7.5.0 |
| 11 | 11 Dependabot vulnerabilities | | ✅ FIXED |
| 12 | ESLint v8 deprecated → v9 flat config | | ✅ FIXED |
| 13 | Dual bot tap path | `TickProcessor.ts` | ✅ FIXED |
| 14 | safeReset incomplete | `GameEngine.ts` | ✅ FIXED |
| 15 | holdTimers stores `null` as timeout handle | `GameEngine.ts` | ✅ FIXED |
| 16 | RNG desync on restore | `GameEngine.ts` | ✅ FIXED |
| 17 | triggerCellAnim timeout not tracked | `GameEngine.ts` | ✅ FIXED |
| 18 | dustCallbacks stale closure | `useGameEngine.ts` | ✅ CONFIRMED OK |
| 19 | botTapTimersRef grows unbounded | `useGameEngine.ts` | ✅ FIXED |
| 20 | TEMP_CELLS shared mutable array | `CellLifecycle.ts` | 🟡 LOW RISK |
| 21 | getSnapshot recomputes isInverted/isBlackout every RAF | `GameEngine.ts` | ✅ FIXED |
| 22 | DDA running average never resets | `dda.ts` | ✅ FIXED |
| 23 | Mixed performance.now() vs Date.now() clocks | | 🟡 LOW RISK |
| 24 | triggerGameOver emits phaseChange after stop() | `GameEngine.ts` | ✅ FIXED |
| 25 | Session version check rejects forward-compatible snapshots | `GameEngine.ts` | ✅ FIXED |
| 26 | Unhandled promise rejections silent | `App.tsx` | ✅ FIXED |

---

## Phase 1: Critical Bugs (2026-05-17 review)

| # | Issue | File | Lines | Status |
|---|-------|------|-------|--------|
| C1 | Boss event never completes — `_defeatPhase()` calls `activate()` which resets phase to 1 | `utils/boss-engine.ts` | 52-64, 16 | ✅ FIXED |
| C2 | Boss combo timer leaks on re-trigger — old timeout not cleared | `utils/boss-engine.ts` | 29-41 | ✅ FIXED |
| C3 | Double-save overwrites mult deduction — second `saveStoredPowerups` spreads original `stored` | `engine/GameEngine.ts` | 261-262 | ✅ FIXED |
| C4 | `safeReset(false)` permanently kills settings listener — `start()` never re-subscribes | `engine/GameEngine.ts` | 393-396 | ✅ FIXED |
| C5 | Delta timer additions during callback silently lost — `filter()` overwrites new entries | `engine/subsystems/TickProcessor.ts` | 63-67 | ✅ FIXED |
| C6 | `peakStreakRef` never updated — streak daily objectives always 0 | `hooks/useAppOrchestrator.ts` | 56, 92-96 | ✅ FIXED |
| C7 | Stale closures on wins/deaths/gamesPlayed — rapid game-overs lose results | `hooks/useAppOrchestrator.ts` | 58-105 | ✅ FIXED |
| C8 | `GAME_MAX_ENERGY=100` vs actual `GAME.MAX_ENERGY=5` | `contexts/DustContext.tsx` | 45 | ✅ FIXED |
| C9 | Audio volume option silently ignored — `opts.volume` never applied to GainNode | `utils/audio.ts` | 54-72 | ✅ FIXED |
| C10 | `bombUrgent` always truthy — operator precedence with `??` | `components/Cell/index.tsx` | 89 | ✅ FIXED |
| C11 | PurpleRain draws square on top of every circle | `components/Backgrounds/PurpleRain.tsx` | 84-90 | ✅ FIXED |

---

## Phase 2: High Severity

| # | Issue | File | Lines | Status |
|---|-------|------|-------|--------|
| H1 | Death events poison DDA reaction window — injects 0ms, increases difficulty on death | `utils/dda.ts` | 57-60 | ✅ FIXED |
| H2 | `onDamage`/`onBossEvent`/`onBombDefused` stale closures — not in dependency array | `hooks/useGameEngine.ts` | 150-276, 320 | ✅ FIXED |
| H3 | Bot tap `spendDust(0)` is no-op — `useAppResources` skips amount=0 | `hooks/useGameEngine.ts` + `hooks/useAppResources.ts` | 240, 99 | ✅ FIXED |
| H4 | Privacy `deleteAll()` misses many keys — data deletion incomplete | `utils/privacy.ts` | 3-7 | ✅ FIXED |
| H5 | IDB connections never closed — leaks over time | `utils/idb.ts` | all | ✅ FIXED |
| H6 | Analytics/error-tracker `_flush()` discards data — never transmits | `utils/analytics.ts` + `utils/error-tracker.ts` | 24-31, 25-32 | ℹ️ BY DESIGN — primary analytics via Firebase/GameAnalytics |
| H7 | StartScreen locked options can be activated — precedence bug | `components/Screens/StartScreen.tsx` | 52 | ✅ FIXED |

---

## Phase 3: Moderate Severity

| # | Issue | File | Lines | Status |
|---|-------|------|-------|--------|
| M1 | Bomb explosion uses stale grid pattern | `engine/subsystems/TickProcessor.ts` | 381-382 | ✅ FIXED |
| M2 | Session key mismatch: `dtp:session` vs `dtp:game-session` | `engine/GameEngine.ts` + `engine/subsystems/SessionPersistor.ts` | 98, 4 | ✅ FIXED |
| M3 | Energy can go negative | `hooks/useAppOrchestrator.ts` | 109 | ✅ FIXED |
| M4 | Lifetime dust tracking over-counts | `hooks/useAppResources.ts` | 102 | ✅ FIXED |
| M5 | Duplicate energy regeneration intervals | `hooks/useEnergyStore.ts` | all | ℹ️ N/A — useAppResources not actively used |
| M6 | ScrambleText division by zero for strings > 9 chars | `components/UI/ScrambleText.tsx` | 33 | ✅ FIXED |
| M7 | i18n only replaces first placeholder occurrence | `utils/i18n.ts` | 49 | ✅ FIXED |
| M8 | Achievement `load()` doesn't restore dates | `utils/achievements.ts` | 45-49 | ✅ FIXED |
| M9 | Timezone-inconsistent daily objective dates | `config/dailyObjective.ts` | 132-149 | ✅ FIXED |
| M10 | Shallow config merge loses nested properties | `utils/game-config.ts` | 24-38 | ✅ FIXED |
| M11 | GameContext/UIContext values not memoized | `contexts/GameContext.tsx` + `contexts/UIContext.tsx` | 60, 77 | ✅ FIXED |
| M12 | Sentry.addBreadcrumb without safe wrapper | `App.tsx` | 712,713,1075,1084,1535 | ⏭️ SKIPPED — App.tsx has pre-existing type errors |
| M13 | ShopPanel powerup inventory stale after purchase | `components/Shop/ShopPanel.tsx` | 160 | ✅ FIXED |
| M14 | Duplicate Hearts components with inconsistent max | `components/HUD/ScoreDisplay.tsx` | 8-39 | ✅ FIXED |

---

## Phase 4: Performance

| # | Issue | File | Lines | Status |
|---|-------|------|-------|--------|
| P1 | MouseFollower re-renders React every animation frame | `components/Backgrounds/MouseFollower.tsx` | 28-47 | ✅ FIXED — direct DOM manipulation |
| P2 | Plasma: ~130K fillRect calls per frame | `components/Backgrounds/Plasma.tsx` | 46-55 | ✅ FIXED — ImageData instead of fillRect |
| P3 | PwrBar interval runs when component returns null | `components/HUD/PwrBar.tsx` | 8-11 | ✅ FIXED — conditional interval |
| P4 | ScoreDisplay forceUpdate at 100ms unconditionally | `components/HUD/ScoreDisplay.tsx` | 54-58 | ✅ FIXED — removed polling, uses tick prop |
| P5 | PlayerPanel defeats React.memo every tick | `App.tsx` | 2387-2407 | ⏭️ SKIPPED — App.tsx has pre-existing type errors |
| P6 | useOffsetCursor RAF loop runs when idle | `hooks/useOffsetCursor.ts` | 44-56 | ✅ FIXED — stops loop when idle |
| P7 | useInputHandler updates both player sets on every key press | `hooks/useInputHandler.ts` | 125-126 | ✅ FIXED — only updates relevant player |

---

## Phase 5: Low Severity / Code Quality

| # | Issue | File | Status |
|---|-------|------|--------|
| L1 | App.tsx 2560-line monolith | `App.tsx` | 🔴 TODO |
| L2 | Hardcoded dev password "mscarabia" | `components/Settings/DevOverlay.tsx` | 🔴 TODO |
| L3 | Two separate PillRow components | `components/Settings/PillRow.tsx` + `StartScreen.tsx` | 🔴 TODO |
| L4 | Sentry imported eagerly in App.tsx, negating lazy load in main.tsx | `App.tsx` | 🔴 TODO |
| L5 | Dead code in ScoreTracker.ts | `engine/subsystems/ScoreTracker.ts` | 🔴 TODO |
| L6 | Duplicate IDB implementations | `utils/idb.ts` + `utils/pendingScoresDb.ts` | 🔴 TODO |
| L7 | Inconsistent localStorage key naming | multiple | 🔴 TODO |
| L8 | `as any` casts throughout | multiple | 🔴 TODO |
| L9 | holdTimers slow leak within long game | `engine/GameEngine.ts` | 🔴 TODO |
| L10 | skipParticles set but never read | `engine/GameEngine.ts` | 🔴 TODO |
| L11 | onPause/onResume no unsubscribe | `engine/GameEngine.ts` | 🔴 TODO |
| L12 | HMAC secret in client bundle | `utils/challenge-link.ts` | 🔴 TODO |
| L13 | Module-level side effects in settings.ts | `utils/settings.ts` | 🔴 TODO |
| L14 | Duplicate evolve pattern (indices 3 and 25) | `config/gridPatterns.ts` | 🔴 TODO |
| L15 | Score sync new session ID per retry | `utils/score-sync.ts` | 🔴 TODO |
| L16 | state-guard quota handler deletes ALL data | `utils/state-guard.ts` | 🔴 TODO |
| L17 | FID metric declared but never observed | `utils/perf-monitor.ts` | 🔴 TODO |
| L18 | gamepad.ts drops release events | `utils/gamepad.ts` | 🔴 TODO |
| L19 | doNotTrack uses deprecated property | `utils/analytics.ts` | 🔴 TODO |
| L20 | FreezeDrop/EnergyDrop never call onComplete | `components/Animations/` | 🔴 TODO |
| L21 | DailyChallengesPopup claimed set stale on prop change | `components/Screens/DailyChallengesPopup.tsx` | 🔴 TODO |
| L22 | SettingsDrawer language falls through to French | `components/Settings/SettingsDrawer.tsx` | 🔴 TODO |
| L23 | gestures.ts destroy() replaces DOM element, breaks React | `utils/gestures.ts` | 🔴 TODO |
| L24 | device.ts simpleHash high collision probability | `utils/device.ts` | 🔴 TODO |
| L25 | rhythmFeedback state persists across sessions | `utils/feedback-rhythm.ts` | 🔴 TODO |
| L26 | preloader-v2 AudioContext without user gesture | `utils/preloader-v2.ts` | 🔴 TODO |

---

## Phase 6: Security Audit (2026-05-17 skill review)

| # | Issue | File | Lines | Severity | Status |
|---|-------|------|-------|----------|--------|
| S1 | HMAC secret bundled in client JS (VITE_CHALLENGE_SECRET) | `utils/challenge-link.ts` | 6-8 | Critical | ✅ FIXED — removed weak fallback, signing disabled without env var |
| S2 | GameAnalytics secret key bundled in client JS | `services/gameanalytics.ts` | 4 | Critical | ℹ️ BY DESIGN — GA SDK uses client-side keys by design |
| S3 | IS_PROD includes localhost — dev writes to production Firestore | `services/firebase.ts` | 16-22 | High | ✅ FIXED — removed localhost/127.0.0.1 |
| S4 | No VITE_CHALLENGE_SECRET in .env — weak fallback used | `utils/challenge-link.ts` | 8 | High | ✅ FIXED — no more fallback, signing disabled without secret |
| S5 | Firestore rules allow unauthenticated writes without rate limiting | `firestore.rules` | 30-61 | High | ℹ️ TODO — requires Firebase Auth implementation |
| S6 | Client-server score cap mismatch (99999 vs 9999) | `services/firebase.ts` + `firestore.rules` | 47, 7 | High | ✅ FIXED — aligned to 9999 |
| S7 | Prototype pollution via settingsManager.set() | `utils/settings.ts` | 43 | Medium | ✅ FIXED — filter to known keys only |
| S8 | stateGuard.parse() returns unvalidated JSON | `utils/state-guard.ts` | 6-16 | Medium | ℹ️ ALREADY SUPPORTS — validator parameter exists |
| S9 | errorTracker.capture() unsafe JSON.parse | `utils/error-tracker.ts` | 17 | Medium | ✅ FIXED — Array.isArray check |
| S10 | idb.enqueue() accepts arbitrary objects without validation | `utils/idb.ts` | 25-33 | Medium | ✅ FIXED — added connection caching and proper typing |
| S11 | Firestore rules allow unauthenticated dust wallet manipulation | `firestore.rules` | 49-61 | Medium | ℹ️ TODO — requires Firebase Auth implementation |
| S12 | leaderboard.ts writes to collection not protected by rules | `services/leaderboard.ts` + `firestore.rules` | 95-101 | Medium | ℹ️ DEAD CODE — only imported in tests |
| S13 | safeStore clears ALL game data on quota error | `utils/state-guard.ts` | 18-28 | Medium | ✅ FIXED — priority-based cleanup strategy |
| S14 | Device fingerprinting without consent check | `utils/device.ts` | 2-18 | Low | 🔴 TODO |
| S15 | Predictable device IDs via Math.random() fallback | `services/firebase.ts` | 232-238 | Low | 🔴 TODO |
| S16 | Privacy deleteAll() may skip entries during iteration | `utils/privacy.ts` | 42-48 | Low | 🔴 TODO |
| S17 | settingsManager merges without key whitelist | `utils/settings.ts` | 35 | Low | ✅ FIXED — key whitelist in constructor |

---

## Phase 7: Stability Analysis (2026-05-17 skill review)

| # | Issue | File | Lines | Severity | Status |
|---|-------|------|-------|----------|--------|
| ST1 | Bot setTimeout callbacks fire on disposed engine | `engine/subsystems/BotController.ts` | 74-78 | Medium | ✅ FIXED — track and clear tap timeouts |
| ST2 | safeReset re-subscribes to settings asynchronously while start() runs synchronously | `engine/GameEngine.ts` | 397-407 | Low | 🔴 TODO |
| ST3 | Config change during gameOver delay loses onGameOver callback | `hooks/useGameEngine.ts` | 153-323 | Low-Medium | 🔴 TODO |
| ST4 | Delta timer callbacks can trigger game over mid-tick, rest of tick continues | `engine/subsystems/TickProcessor.ts` | 64-72 | Medium | ✅ FIXED — check phase after delta timer batch |
| ST5 | Error recovery leaves phase in "paused" instead of "gameover" | `engine/GameEngine.ts` | 430-437 | Medium | ℹ️ ALREADY HANDLED — TickProcessor catch sets gameover, doesn't re-throw |
| ST6 | localStorage quota failure silently loses powerup inventory | `hooks/useGameEngine.ts` | 33-37 | Medium | 🔴 TODO |
| ST7 | bossEngine.deactivate() does not clear combo timer | `utils/boss-engine.ts` | 69 | Low-Medium | ✅ FIXED — call resetCombo() in deactivate() |
| ST8 | Window event listeners leaked in constructor, never removed in destroy() | `engine/GameEngine.ts` | 133-141 | Medium | ✅ FIXED — store refs and remove in destroy() |
| ST9 | Session restore with tampered tickCount causes infinite RNG loop | `engine/GameEngine.ts` | 903-904 | Low | ✅ FIXED — cap rngStepsToSkip |

---

## Phase 8: Frontend/Visual Review (2026-05-17 skill review)

| # | Issue | File | Lines | Severity | Status |
|---|-------|------|-------|----------|--------|
| V1 | Clickable cells lack role="button" and aria-label | `components/Cell/index.tsx` | 134 | High | ✅ FIXED — added role, tabIndex, aria-label |
| V2 | Toast has no role="alert" / aria-live | `components/HUD/Toasts.tsx` | 9 | High | ✅ FIXED — added role="alert" aria-live="assertive" |
| V3 | Plasma full-resolution ImageData is CPU-heavy; render to smaller canvas | `components/Backgrounds/Plasma.tsx` | 46-67 | High | ✅ FIXED — render to quarter-res offscreen canvas, scale up |
| V4 | PulseField canvas dimensions reset every frame, clearing buffer | `components/Backgrounds/PulseField.tsx` | 17-18 | High | ✅ FIXED — move to resize handler |
| V5 | StartScreen icon-only buttons lack aria-label | `components/Screens/StartScreen.tsx` | 356-361 | High | ✅ FIXED — added aria-label to all icon buttons |
| V6 | GameOver share modal has no focus trap, no Escape handler, no dialog role | `components/Screens/GameOver.tsx` | 120-170 | High | ✅ FIXED — added role="dialog", aria-modal, Escape handler |
| V7 | Unsafe as any cast for BombCell | `components/Cell/index.tsx` | 89 | Medium | ✅ FIXED — typed import for BombCell |
| V8 | Stale Date.now() for bomb urgency fallback | `components/Cell/index.tsx` | 89 | Medium | 🔴 TODO |
| V9 | Redundant settingsManager.get() on every cell render | `components/Cell/index.tsx` | 130 | Medium | ✅ FIXED — use colorblindMode prop |
| V10 | Speed bar missing role="progressbar" | `components/HUD/ScoreDisplay.tsx` | 42-46 | Medium | 🔴 TODO |
| V11 | EnergyBar pips container missing ARIA attributes | `components/HUD/EnergyBar.tsx` | 36 | Medium | 🔴 TODO |
| V12 | EnergyBar refill buttons have no accessible labels | `components/HUD/EnergyBar.tsx` | 57-63 | Medium | 🔴 TODO |
| V13 | DustWidget no ARIA attributes | `components/HUD/DustWidget.tsx` | 9-12 | Medium | 🔴 TODO |
| V14 | ShieldDrop onComplete in deps can cause animation re-fires | `components/Animations/ShieldDrop.tsx` | 21 | Medium | 🔴 TODO |
| V15 | FreezeDrop/EnergyDrop onComplete accepted but never called | `components/Animations/` | 15 | Medium | ✅ FIXED — onComplete called on timeout |
| V16 | PulseField rareColor hex-alpha concatenation assumes hex input | `components/Backgrounds/PulseField.tsx` | 34 | Medium | 🔴 TODO |
| V17 | PwrBar hardcoded magic numbers for powerup durations | `components/HUD/PwrBar.tsx` | 11 | Medium | 🔴 TODO |
| V18 | MouseFollower RAF loop runs continuously even when stationary | `components/Backgrounds/MouseFollower.tsx` | 28-46 | Medium | ✅ FIXED in Phase 4 — stops loop when idle |

---

## Tests Added (2026-05-17)

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `__tests__/boss-engine.test.ts` | 10 tests | Boss activation, phase progression, combo system, timer cleanup |
| `__tests__/dda.test.ts` | 10 tests | Death poisoning fix, sliding window, emergency drop, reset |
| `__tests__/achievements.test.ts` | 11 tests | Register, check, unlock, load/save, progress tracking |
| `__tests__/dailyObjective.test.ts` | 12 tests | Objective generation, streak tracking, UTC consistency, mark complete |

**Total: 136 tests passing across 14 test files** (86 existing + 43 new + 7 fractional health)

---

## Tier 2: Visual Polish (2026-05-17 autonomous run)

| # | Feature | Files | Status |
|---|---------|-------|--------|
| T2-1 | Wire dead CSS features (combo heat, dust gained, speed warning, ice flash, heart gain) | ScoreDisplay, DustWidget, Hearts, enhancements.css | ✅ FIXED |
| T2-2 | Fix heart loss animation target | Hearts.tsx | ✅ FIXED |
| T2-3 | Score count-up animation with overshoot curve | ScoreDisplay.tsx | ✅ FIXED |
| T2-4 | PwrBar fade-out on expiry (300ms) + 50ms smoother drain | PwrBar.tsx | ✅ FIXED |
| T2-5 | Staggered GameOver buttons (framer-motion, 80ms stagger) | GameOver.tsx | ✅ FIXED |
| T2-6 | Powerup icon entrance bounce (framer-motion spring) | Cell/index.tsx | ✅ FIXED |
| T2-7 | HowToPlay entrance animations (framer-motion stagger) | HowToPlay.tsx | ✅ FIXED |
| T2-8 | Boss health bar framer-motion entrance + shield break animation | App.tsx | ✅ FIXED |
| T2-9 | Powerup screen effects (freeze vignette, shield glow, multiplier flash) | App.tsx, enhancements.css | ✅ FIXED |
| T2-10 | Liquid glass PLAY button (21st.dev inspired glassmorphism) | enhancements.css | ✅ FIXED |
| T2-11 | NewBestBanner gold gradient + spring entrance | GameOver.tsx, enhancements.css | ✅ FIXED |
| T2-12 | Reduced motion selective targeting (preserve functional transitions) | performance.css | ✅ FIXED |

**All 12 Tier 2 tasks complete. Branch pushed.**

### Tier 3 (Performance) — Remaining
- Split App.tsx monolith (2500 lines, 70+ useState)
- Lazy-import Sentry (~50-80KB savings)
- Cache Date.now() per tick (10+ calls per frame)
- Memo GameContext/UIContext values
- Stop idle RAF loops
- Throttle mousemove spotlight

### Tier 4 (Security) — Remaining
- Add Firebase Auth to Firestore rules
- Rotate committed secrets (.env.local)
- Add session snapshot bounds checking
- Add security headers to firebase.json
