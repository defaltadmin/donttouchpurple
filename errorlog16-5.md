# 🚨 DTP Error Log — 2026-05-16
**Status:** Consolidated for Sonnet / Claude Analysis  
**Total Issues:** 68 (consolidated from multiple review passes)  
**Fixed in v7.5.0+:** Issues 2, 7, 8, 10, 11, 12  

---

## 🛑 CRITICAL & STABILITY ISSUES (Tier 1)

### 1. CI Failure: Bundle Size Workflow YAML Syntax Error
- **File:** `.github/workflows/bundle-size.yml`
- **Error:** YAML parser fails due to `${{ github.repository }}` inside JS template literal.
- **Impact:** ⚠️ **BREAKS CI ON EVERY PUSH** — Cannot deploy.
- **Severity:** CRITICAL
- **Fix:** Pass `REPO` and `RUN_ID` via `env:` block; use `process.env.REPO` / `process.env.RUN_ID`.
- **Test:** Run `pnpm build && npm run deploy` locally; verify workflow passes.

### 3. Crash Risk: Snapshot Null-Guards Missing
- **File:** `App.tsx` (in `handleEngineGameOver`)
- **Error:** No optional chaining on `snapshotRef.current.p1` / `p2` before `.score` / `.health` access.
- **Impact:** Potential crash if game ends in unexpected state; hard-to-debug UI errors.
- **Severity:** HIGH
- **Fix:** Use `snapshotRef.current?.p1?.score ?? 0`.
- **Test:** Force game-over with null p1/p2; verify no crash.

### 4. Data Loss: Score Submission Block (Leaderboard Corruption)
- **File:** `App.tsx`
- **Error:** `scoreSubmittedRef.current` set to `true` at game over, never reset to `false`.
- **Impact:** Second+ games in session won't submit to leaderboard; lost revenue/engagement signal.
- **Severity:** HIGH
- **Fix:** Reset to `false` in `startEngine()` call path.
- **Test:** Play 2 games in same session; verify both appear on leaderboard.

### 13. Dual Bot Tap Path — Dust Economy Corruption
- **Files:** `engine/subsystems/BotController.ts`, `engine/subsystems/TickProcessor.ts`
- **Error:** Two independent bot execution paths run simultaneously:
  - `BotController` fires on `setInterval`
  - `TickProcessor` has inline bot loop gated by `ctx.botAssistActive[player]`
- **Impact:** Cells marked `clicked` twice → silent grid desync; dust double-spent; invisible player cost.
- **Severity:** CRITICAL
- **Fix:** Consolidate to one authoritative path:
  - Option A: Remove `TickProcessor` inline loop; drive entirely from `BotController`.
  - Option B: Remove `BotController.setInterval`; call from `processTick()` only.
- **Recommendation:** Choose Option A (cleaner subsystem boundary).
- **Test:** Enable bot; log tap count vs. cell count; verify 1:1 ratio.

### 14. `safeReset` Leaves Stale Player State (Invisible Powerup Carryover)
- **File:** `engine/GameEngine.ts` (`safeReset` method)
- **Error:** Resets `score`, `streak`, `health`, `active` only. Leaves: `anim`, `shield`, `shieldCount`, `freezeEnd`, `multiplierEnd`, `storedFreezeCharges`, `storedShieldCharges`, `accuracyWindow`, `comboBonus`.
- **Impact:** Powerup state bleeds into next game; invisible shield; multiplier active on fresh start; stage mismatch.
- **Severity:** HIGH
- **Fix:** Call `this.p1 = makePS(...)` and `this.p2 = makePS(...)` to fully reinitialize, or rename `safeReset` → `resetForReplay` and clarify purpose.
- **Test:** Enable shield, die, restart in same session; verify no shield on new game.

### 17. `triggerCellAnim` Timeout Not Tracked — Fires After Destroy
- **File:** `engine/GameEngine.ts` (`triggerCellAnim` method)
- **Error:** Raw `setTimeout` NOT added to `this._timeouts`; won't clear on `destroy()`, `stop()`, or `clearAllTimeouts()`.
- **Impact:** Stale state writes post-destroy; potential "Cannot set property on dead engine" errors; React warnings on unmounted component.
- **Severity:** HIGH
- **Fix:** Replace raw `setTimeout` with `this.scheduleTimeout(...)` so it's tracked.
- **Test:** Hot-reload component during cell animation; verify no console errors.

---

## ⚠️ HIGH-PRIORITY ISSUES (Tier 2: Bugs + Logic Errors)

### 2. Energy System Stale Closure Bug ✅ **FIXED in v7.5.0**
- **File:** `hooks/useEnergyStore.ts`
- **Status:** Resolved.

### 5. UX: PWA Install Banner Gate (First-Visit Friction)
- **File:** `App.tsx`
- **Error:** Shows install banner on `screen === "menu"` even if `gamesPlayed === 0`.
- **Impact:** Annoying first-visit UX; premature install prompt before player engagement.
- **Severity:** MEDIUM
- **Fix:** Gate behind `gamesPlayed >= 3`.

### 6. Firebase Streak Safety (Type Validation + LocalStorage Quota)
- **File:** `App.tsx` (`fbGetStreak`)
- **Error:** No type validation on Firebase response; `localStorage.setItem` lacks `try-catch` for `QuotaExceeded`.
- **Impact:** Malformed data crashes UI; quota exceeded silently breaks streak tracking.
- **Severity:** MEDIUM
- **Fix:** Add `isFinite` checks; wrap `localStorage` in `try-catch` with fallback.

### 15. `holdTimers` Map Stores Dummy `null` (Misleading Code)
- **File:** `engine/GameEngine.ts` (`handleHoldStart` method)
- **Error:** `holdTimers.set(key, { timer: null as unknown as NodeJS.Timeout, ... })` — `timer` field is not used; actual hold tracking is via `_deltaTimers`.
- **Impact:** Misleading for maintainers; wrong place to look for cleanup logic.
- **Severity:** MEDIUM (code clarity)
- **Fix:** Remove `timer` field entirely, or store actual delta timer ID.

### 16. RNG Out-of-Sync After Session Restore (Replay Divergence)
- **File:** `engine/GameEngine.ts` (`restoreSessionSnapshot` method)
- **Error:** Calls `mulberry32(this.gameSeed)` (resets RNG to position 0) but `tickCount` may be restored to e.g. 200. RNG has advanced 200 steps but we re-init it to 0.
- **Impact:** Replays diverge after session restore; cell patterns don't match original run; seeded challenges break.
- **Severity:** HIGH (breaks replay system)
- **Fix:** Either (a) fast-forward RNG by replaying `tickCount` calls, or (b) save/restore RNG state directly (add RNG snapshot to session data).
- **Recommendation:** Add `rngState` to session snapshot; restore that on load.

### 21. `getSnapshot` Recomputes `isInverted`/`isBlackout` on Every Frame (CPU Waste + Non-Determinism)
- **File:** `engine/GameEngine.ts` (`getSnapshot` method)
- **Error:** Calls `Date.now()` and dereferences `bossEvent` up to 60 times/sec; not memoized.
- **Impact:** Minor CPU overhead; snapshot not pure — two calls in same tick can differ if boss expires between them.
- **Severity:** MEDIUM
- **Fix:** Compute once per tick in `processTick()`; store as `_isBlackout` field; read from field in `getSnapshot()`.

### 23. Clock Mismatch: `performance.now()` vs `Date.now()` in Input Pipeline
- **Files:** `utils/input-smoothing.ts`, `engine/GameEngine.ts`
- **Error:** `InputBuffer.register()` uses `performance.now()` (monotonic); `_flushTapBuffer` checks with `Date.now()` (wall clock).
- **Impact:** Currently safe (separate systems); but refactoring to merge them will silently break.
- **Severity:** MEDIUM (latent hazard)
- **Fix:** Standardize on `performance.now()` throughout game timing.

### 24. `triggerGameOver` Emits Events After `stop()` Kills RAF (Phase Inconsistency)
- **File:** `engine/GameEngine.ts` (`triggerGameOver` method)
- **Error:** Calls `this.stop()` (kills RAF + tick timer), then emits `phaseChange` / `gameOver`. No more snapshots fire after stop, so UI sees old snapshot with new event.
- **Impact:** UI briefly shows wrong phase; game-over screen renders on stale "playing" snapshot.
- **Severity:** MEDIUM
- **Fix:** Emit final snapshot BEFORE `stop()`, or emit snapshot explicitly after phase change.

### 25. Session Snapshot Version Check Rejects All Older Snapshots (Session Loss on Deploy)
- **File:** `engine/GameEngine.ts` (`restoreSessionSnapshot` method)
- **Error:** Checks `if (snapshotVersion < SESSION_SNAPSHOT_VERSION) return false`, discarding all older versions.
- **Impact:** Every deploy that adds fields invalidates all active sessions mid-game; players lose progress on page refresh.
- **Severity:** HIGH (data loss risk)
- **Fix:** Use additive/optional restoration with `?? default`; only bump version for **breaking** changes. Document what constitutes a breaking change.

### 35. Tap Buffer Not Cleared on Pause — Stale Tap Fires After Resume
- **File:** `engine/GameEngine.ts` (`pause()` method)
- **Error:** Clears tick timer but not `this.tapBuffer`. Buffered tap (within 50ms) survives pause. On `resume()` → `processTick()` → `_flushTapBuffer()` fires it against new game state.
- **Impact:** Phantom tap on resume; unintended damage or score.
- **Severity:** MEDIUM
- **Fix:** Reset `this.tapBuffer = { 1: null, 2: null }` in `pause()`.
- **Test:** Tap, pause within 50ms, resume; verify tap doesn't register.

### 37. Session Restore Uses Unsafe Type Assertions (Silent Corruption)
- **File:** `engine/GameEngine.ts:887-962` (`restoreSessionSnapshot` method)
- **Error:** Dozens of `as number`, `as boolean`, `as any` from unvalidated `Record<string, unknown>`. Malformed data → `undefined` → `?? 0` restores wrong state.
- **Impact:** Silent corruption of health, score, etc. if session data is wrong version or corrupted.
- **Severity:** HIGH
- **Fix:** Use runtime validation (zod/io-ts) or add `typeof`/`isFinite` guards before every cast; log warnings on failure.

### 38. Energy `spendEnergy` Double-Spend Race (Related to #2)
- **File:** `hooks/useEnergyStore.ts:43-51`
- **Error:** Reads `energyDataRef.current.count` to guard, then calls `setEnergyData(prev => ...)`. Between guard and update, concurrent call can spend energy that should fail.
- **Impact:** Player can start more games than they have energy for; economy corruption.
- **Severity:** HIGH
- **Fix:** Move guard INSIDE updater: `setEnergyData(prev => { if (prev.count <= 0) return prev; ... })`.

### 51. `restoreFromSession` No Bounds Validation (NaN/Negative Health Cascade)
- **File:** `engine/GameEngine.ts:765-769`
- **Error:** Direct assignment of `data.hearts`, `data.score`, `data.timeLeft` with no clamping. `hearts: -100` or `score: NaN` propagate.
- **Impact:** Negative health, NaN scores → UI crashes, analytics corruption.
- **Severity:** HIGH
- **Fix:** Clamp all numeric fields: `hearts = Math.max(0, Math.min(GAME.MAX_HEARTS, data.hearts ?? GAME.MAX_HEARTS))`.

### 55. No Error Recovery in `start()` — Mid-Init Exception Leaks Engine
- **File:** `engine/GameEngine.ts:229-268`
- **Error:** If any line throws (e.g., `localStorage.setItem` quota exceeded), engine left with `phase = "playing"` but no timers running.
- **Impact:** Dead engine; game appears stuck; no feedback to user.
- **Severity:** HIGH
- **Fix:** Wrap `start()` body in try-catch; reset to safe state on failure; emit error toast.

---

## 🎮 GAMEPLAY & LOGIC BUGS (Tier 3: Game Balance + UX)

### 39. BotController Interval Accumulation on Rapid Pause/Resume (Distinct from #13)
- **File:** `engine/subsystems/BotController.ts`
- **Error:** `startBot()` creates `setInterval(1000ms)`; `stopBot()` clears it. If `pause()` / `resume()` called rapidly, intervals accumulate.
- **Impact:** Bot taps accumulate; dust double-spent; phantom taps.
- **Severity:** MEDIUM
- **Fix:** Integrate bot lifecycle into pause/resume via `_pauseListeners` / `_resumeListeners`.

### 40. App.tsx Monolith (2557 Lines, 170+ State Vars, 50+ `useEffect`)
- **File:** `App.tsx`
- **Error:** Single component with tightly coupled side effects. `resumeEngine()` called from manual resume AND visibility handler — can double-resume. Duplication in `startGame()` / `handleTutorialClose()`.
- **Impact:** Impossible to test; every change risks unrelated breakage; maintenance nightmare.
- **Severity:** MEDIUM (technical debt, not functional)
- **Refactor Recommendation:**
  - `GameController` — engine lifecycle
  - `SettingsProvider` — settings state
  - `ScreenRouter` — screen state machine
  - `ScoreManager` — leaderboard, submission
  - `ProgressTracker` — daily objectives, achievements
- **Timeline:** Q2 2026

### 41. Incomplete `useGameEngine` Dependency Array (Config Stale Reads)
- **File:** `hooks/useGameEngine.ts:314`
- **Error:** Deps `[config.mode, config.numPlayers, config.speedMult]`. Changes to `config.inputMode`, `config.godMode`, `config.storage`, `config.botAssist` never recreate engine.
- **Impact:** Engine uses stale config; `inputMode` toggle requires page reload.
- **Severity:** MEDIUM
- **Fix:** Add all config properties to dep array, OR use mutable ref-based config the engine reads on each access.

### 42. Custom DOM Events (`dtp:*`) Bypass React Data Flow
- **Files:** `App.tsx` (6+ `window.addEventListener`), `engine/GameEngine.ts:133-141`
- **Error:** Events like `dtp:boss:update`, `dtp:combo`, `dtp:daily-complete`, `dtp:feature-unlocked` dispatched on `window` for cross-component state.
- **Impact:** Data flow untraceable; stale closure risk; components mount after dispatch miss events.
- **Severity:** MEDIUM (code quality)
- **Fix:** Replace with React Context + typed event bus.

### 43. `safeSentry` Silently Swallows All Errors
- **File:** `App.tsx:108-113`
- **Error:** `try { Sentry.method() } catch { /* silent */ }` with empty catch. If Sentry init throws, all subsequent calls also fail silently.
- **Impact:** Sentry can be broken for weeks without signal.
- **Severity:** MEDIUM
- **Fix:** Add `console.warn` inside catch; better: use optional chaining `Sentry.addBreadcrumb?.()`.

### 44. `startGame` / `handleTutorialClose` ~80% Code Duplication
- **File:** `App.tsx:1504-1546` vs `1549-1589`
- **Error:** Both contain identical logic: validate energy → set gamesPlayed → reset scoreSubmittedRef → startEngine → handle replay seed. ~25 lines verbatim.
- **Impact:** Bug-fix asymmetry; one path fixed, other doesn't.
- **Severity:** LOW (code quality)
- **Fix:** Extract `launchGame(forceSeed?)` called by both.

### 45. No `React.memo` on PlayerPanel/HUD/Grid Components (Performance Regression)
- **Files:** `components/HUD/PlayerPanel.tsx`, `components/HUD/Hearts.tsx`, grid cells
- **Error:** Every engine tick → `setSnapshot()` → full tree re-render. No `React.memo` to bail out on unchanged props.
- **Impact:** Full VDOM diff 3-4+ times/sec; dropped frames on low-end devices.
- **Severity:** MEDIUM
- **Fix:** Wrap in `React.memo` with custom `areEqual` for snapshot props.
- **Measurement:** Run Profiler; check re-render count per tick.

### 46. Visibility Change + Manual Pause Race (Auto-Resume Override)
- **File:** `App.tsx:1102-1131`
- **Error:** Visibility handler calls `pauseEngine()` on hidden, `resumeEngine()` on visible. If user pauses manually, then hides tab, auto-resume overrides pause intent.
- **Impact:** Game auto-resumes when tab returns despite explicit pause.
- **Severity:** MEDIUM
- **Fix:** Track pause source (manual vs. auto); only auto-resume if pause was auto-triggered by previous visibility change.

---

## 🔴 ENGINE STATE & REACT BRIDGE (Critical Analysis — Tier 2)

### 32. `setTimeout` Tick Loop Fires React State Outside Batching (Performance)
- **Files:** `engine/GameEngine.ts:314` → `processTick()` → `emit()` → `hooks/useGameEngine.ts:172`
- **Error:** `setTimeout` chain; each tick calls `ctx.emit()` → subscriber `setSnapshot()`. React 17/legacy mode = **no batching** = multiple re-renders per tick.
- **Impact:** Performance degradation on low-end devices.
- **Severity:** MEDIUM
- **Fix:** Wrap in `unstable_batchedUpdates` (React 17) or ensure React 18 concurrent mode (automatic batching).
- **Current Setup:** React 18 used; should batch automatically. **Check if concurrent mode enabled in `index.tsx`.**

### 33. RAF + setTimeout Dirty-Flag Race Can Lose Snapshots
- **Files:** `engine/GameEngine.ts:284-305` (`startSnapshotRaf`), `307-319` (`scheduleTick`)
- **Error:** RAF loop emits when `dirty === true`. If two ticks before RAF fires (frame drop), first snapshot overwritten. `emitSnapshot()` sets `dirty = false` at **start**, not end.
- **Impact:** UI skips frames; stale phase data on game-over.
- **Severity:** HIGH
- **Fix:** Set `dirty = false` at **end** of `emitSnapshot()`. Add `phase === "playing"` guard inside RAF body.

### 34. `_isDisposed` Missing on Most Public Entry Points (Stale State Writes)
- **File:** `engine/GameEngine.ts`
- **Error:** Only `start()` (line 230) checks `_isDisposed`. Missing from: `resume()`, `handleTap()`, `handleHoldStart()`, `handleHoldEnd()`, dev methods.
- **Impact:** Silent writes to dead engine; hard-to-trace bugs on unmount.
- **Severity:** HIGH
- **Fix:** Add `if (this._isDisposed) return;` to ALL public entry points.
- **Audit:** Grep for `public\|handleTap\|handleHold\|resume` and add guard to each.

### 36. `_tickCtx` Getters Return Stale State After Destroy (Dead Context)
- **File:** `engine/GameEngine.ts:150-185`
- **Error:** `_tickCtx` created once in constructor via `const self = this`. After `destroy()`, getters frozen. `processTick()` checks `ctx.phase !== "gameover"` on dead state.
- **Impact:** Logic executes on dead engine; emit on empty listener set; triggerGameOver on dead state.
- **Severity:** HIGH
- **Fix:** Add `_isDisposed` getter to `_tickCtx`; check at start of `processTick()`.

### 49. Boss Event `scheduleTimeout` Can Fire on Disposed Engine
- **File:** `engine/subsystems/TickProcessor.ts:440-446`
- **Error:** `ctx.scheduleTimeout(cb, durationMs)` fires after boss duration. If destroy runs after timeout scheduled but before callback fires, writes to dead state.
- **Impact:** Write to dead engine; React warning on unmounted component.
- **Severity:** MEDIUM
- **Fix:** Add `_isDisposed` check inside timeout callback before mutating ctx.

### 50. Gamepad Callbacks Stale After Engine Destroy (Closure Leak)
- **File:** `engine/GameEngine.ts:143-147`
- **Error:** Gamepad listener captured in constructor closure. `_gamepadUnsub` stored for cleanup. If `destroy()` misses unsub (e.g., hot-reload), stale callbacks fire on dead engine.
- **Impact:** Gamepad events on dead engine; hard crash if `this.p1` undefined.
- **Severity:** MEDIUM
- **Fix:** Add `_isDisposed` check at top of gamepad callback.

### 52. Constructor Starts Side-Effects Before `start()` Call (Memory Leak)
- **File:** `engine/GameEngine.ts:120-194`
- **Error:** Constructor inits audio engine, subscribes gamepad, registers DOM listeners, imports settings. If `start()` never called (page load without game), these persist entire page lifetime.
- **Impact:** Memory leak on SPA navigation without game start; gamepad polling + audio overhead.
- **Severity:** HIGH
- **Fix:** Defer gamepad/audio/analytics init to `start()`. Constructor only sets up tick context and state.

### 53. `_sessionAutoSaveInterval` Timer Fires During Pause (Wasted CPU)
- **File:** `engine/GameEngine.ts:744-756`
- **Error:** Auto-save interval every 5s not cleared on `pause()`. Guard `if (!this.paused)` inside callback works, but timer keeps firing and re-checking.
- **Impact:** Unnecessary wakeups during pause.
- **Severity:** LOW
- **Fix:** Clear interval in `pause()`; re-create in `resume()`.

### 54. `pause()` Emits `phaseChange` Before `emitSnapshot()` (Phase Inconsistency)
- **File:** `engine/GameEngine.ts:355-356`
- **Error:** Order: emit `phaseChange: "paused"` → then `emitSnapshot()`. React processes event immediately, but snapshot still carries `phase: "playing"`.
- **Impact:** Brief phase inconsistency; UI flicker.
- **Severity:** LOW
- **Fix:** Swap order: `emitSnapshot()` first, then `phaseChange`.

---

## 🧹 TECHNICAL DEBT & CODE QUALITY (Tier 4)

### 9. Stale Version Check Hardcoded (Sentry Noise)
- **File:** `App.tsx`
- **Error:** Hardcoded check for version `"5.8.17"` in a `useEffect`.
- **Impact:** Constant Sentry warnings on page load.
- **Severity:** LOW
- **Fix:** Delete the `useEffect` block.

### 10. Dead Code: Unused Refs and Params ✅ **PARTIALLY FIXED in v7.5.0**
- **File:** `App.tsx` (`toastTimer` ref is duplicate).
- **File:** `hooks/useScreenStateMachine.ts` (`payload` param in `transition` is unused).
- **Status:** `useScreenStateMachine` fixed; `App.tsx` may still have duplicate.
- **Severity:** LOW
- **Fix:** Audit and remove all unused symbols.

### 18. `useGameEngine` Stale `dustCallbacks` Closure
- **File:** `hooks/useGameEngine.ts:152-163, 314`
- **Error:** Deps `[config.mode, config.numPlayers, config.speedMult]` don't include `dustCallbacks`. If parent re-renders with new callback references, engine uses stale ones.
- **Impact:** Bot reads old dust context; dust spend targets wrong context.
- **Severity:** MEDIUM
- **Fix:** Store `dustCallbacks` in `useRef`; read from `.current` inside engine callbacks.

### 19. `botTapTimersRef` Grows Unbounded (Memory Leak During Long Sessions)
- **File:** `hooks/useGameEngine.ts`
- **Error:** Every bot tap pushes two `setTimeout` IDs; only cleared on unmount. Long sessions accumulate O(n) entries.
- **Impact:** Memory pressure during long sessions; slow unmount cleanup.
- **Severity:** MEDIUM
- **Fix:** Splice completed timers out of array in callback, or use `Set` with delete on completion.

### 20. `TEMP_CELLS` Shared Mutable Array (Module-Level State)
- **File:** `engine/subsystems/CellLifecycle.ts:11, 33-48`
- **Error:** Module-level `const` array reused across all `activeToCellsP()` calls; mutated in place.
- **Impact:** Currently safe (sync JS); latent hazard if async path introduced.
- **Severity:** LOW
- **Fix:** Allocate fresh array per call, or document constraint with warning comment.

### 26. BotController Emit Cast Still Required (Type Safety)
- **File:** `engine/GameEngine.ts:189`
- **Error:** `emit: (event) => this.emit(event as any)` — cast required because BotController callback type is generic, not full `GameEvent` union.
- **Impact:** Type safety weakened.
- **Severity:** LOW
- **Fix:** Update BotController emit callback type to accept `GameEvent` directly.

### 27. Unused Imports in App.tsx (Lint Noise — ~20 warnings)
- **File:** `App.tsx`
- **Error:** Unused imports: `sessionManager`, `analytics`, `LazyHydrate`, `LoginStreakPopup`, `DailyChallengesPopup`, etc.
- **Impact:** ~20 lint warnings per run; noise in feedback.
- **Severity:** LOW
- **Fix:** Remove unused imports or add eslint-disable comments.

### 28. utils/index.ts Broken Barrel Exports (Export Inconsistency)
- **File:** `utils/index.ts`
- **Error:** Commented-out exports that don't exist: `gameanalytics`, `clarity`, `AssetGate`, `pendingScoresDb`, `storage`, `devLog`, `cleanupPattern`, `dustAnimation`, `i18nKeys`.
- **Impact:** TypeScript errors if code tries to import from barrel.
- **Severity:** LOW
- **Fix:** Delete barrel file or restore proper exports.

### 29. `_currentThemeId` Declared But Never Set (Dead Code)
- **File:** `engine/GameEngine.ts`
- **Error:** `private _currentThemeId = 'default'` added to fix `as any` cast but never assigned anywhere.
- **Impact:** Dead field that always returns `'default'`.
- **Severity:** LOW
- **Fix:** Remove field or implement theme-aware session tracking.

### 47. `_cachedMask` Identity Check Fails on Array Mutation (Cache Invalidation)
- **File:** `engine/GameEngine.ts:796-799`
- **Error:** Cache key is `pat.mask !== this._cachedMaskSrc` — reference check only. If code mutates `pat.mask` in place (reference unchanged, content changed), cache returns stale data.
- **Impact:** Stale grid layout rendered after pattern mutation.
- **Severity:** MEDIUM
- **Fix:** Add content hash/version alongside reference check; deep-clone mask on write.

### 48. `devForcedPwr` Reset Logic Skips If P2 Dead
- **File:** `engine/subsystems/TickProcessor.ts:189`
- **Error:** Consumed only when `pi === (numPlayers === 1 ? 0 : 1)` (second player). If P2 dead and skipped, `devForcedPwr` never cleared — persists forever.
- **Impact:** Dev-forced powerup never consumed if P2 dead; dev tools behave unpredictably.
- **Severity:** LOW (dev-only feature)
- **Fix:** Always consume `devForcedPwr` after first successful spawn, regardless of player.

### 56. Confirm: `useGameEngine` `dustCallbacks` Stale Closure (Same as #18)
- **Status:** Already documented in #18. **No duplicate entry needed.**

### 57. Confirm: `TEMP_CELLS` Shared Mutable Array (Same as #20)
- **Status:** Already documented in #20. **No duplicate entry needed.**

### 58. Duplicate `toastTimer` Refs in App.tsx
- **File:** `App.tsx:252` and `App.tsx:652`
- **Error:** Two `useRef<ReturnType<typeof setTimeout> | null>` for toast timers (`toastTimer` + `toastRef`); one unused.
- **Impact:** Maintenance confusion; minor overhead.
- **Severity:** LOW
- **Fix:** Keep one, remove the other.

---

## 🛠️ CONFIGURATION & TOOLING (Tier 4)

### 7. Dependency Conflict: Sentry Tracing ✅ **FIXED in v7.5.0**
- **Status:** Resolved.

### 8. Build Noise: Duplicate Manual Chunks ✅ **FIXED in v7.5.0**
- **Status:** Resolved.

### 11. Node.js 18 EOL ✅ **FIXED in v7.5.0**
- **Status:** Updated to Node 20.

### 12. TSConfig Missing Paths ✅ **FIXED in v7.5.0**
- **Status:** Added `services/` and `utils/` to include.

### 30. Dependabot Vulnerabilities
- **Project:** 11 open vulnerabilities (4 high, 7 moderate)
- **Impact:** Security risk; outdated dependencies.
- **Severity:** MEDIUM
- **Fix:** Run `pnpm audit` and `pnpm update` to patch.
- **Timeline:** ASAP

### 31. ESLint v8 Deprecated
- **File:** `package.json`
- **Error:** `eslint@8` no longer supported.
- **Impact:** Will stop receiving updates.
- **Severity:** MEDIUM
- **Fix:** Upgrade to ESLint v9 and related plugins.
- **Timeline:** Q2 2026

---

## 🆕 IMPROVEMENT ROADMAP (Not Bugs, But Recommended Enhancements)

### 59. Add Runtime Validation Layer (Zod/io-ts)
- **Rationale:** Many unsafe type casts (#37, #51) could be replaced with schema validation.
- **Scope:** Session restore, Firebase data, localStorage reads.
- **Effort:** 2-3 days
- **Priority:** HIGH
- **Timeline:** Q2 2026

### 60. Refactor App.tsx Into Feature-Based Modules
- **Rationale:** 2557 lines is unmaintainable (#40).
- **Modules:**
  - `GameController` (engine lifecycle)
  - `SettingsProvider` (settings + keybindings)
  - `ScreenRouter` (screen state machine)
  - `ScoreManager` (leaderboard, submission)
  - `ProgressTracker` (daily, achievements, streaks)
- **Effort:** 1 week
- **Priority:** HIGH
- **Timeline:** Q2 2026

### 61. Implement React.memo + Custom `areEqual` for Game Components
- **Scope:** `PlayerPanel`, HUD components, grid cells.
- **Measurement:** Baseline with React Profiler, target <1 re-render per tick.
- **Effort:** 1-2 days
- **Priority:** MEDIUM
- **Timeline:** Q2 2026

### 62. Add Unified Event Bus (Replace `dtp:*` DOM Events)
- **Rationale:** Custom DOM events (#42) are error-prone and hard to trace.
- **Implementation:** Simple TypeScript event emitter + React Context.
- **Effort:** 2-3 days
- **Priority:** MEDIUM
- **Timeline:** Q2 2026

### 63. Extend Session Snapshot to Include RNG State
- **Rationale:** Fix RNG divergence issue (#16).
- **Implementation:** Save `rngSeed`, `rngCallCount` (or full state); restore on load.
- **Effort:** 1 day
- **Priority:** HIGH (replay integrity)
- **Timeline:** Q2 2026

### 64. Add Integration Tests for Multi-Game Session Flow
- **Coverage:**
  - Energy spend on start
  - Score submission per game
  - Pause/resume behavior
  - Visibility handler interactions
- **Effort:** 2-3 days
- **Priority:** MEDIUM
- **Timeline:** Q2 2026

### 65. Implement Graceful Error Boundary for Engine Failures
- **Rationale:** Catch exceptions in `start()`, engine tick, emit, etc.; show user-friendly error toast.
- **Effort:** 1-2 days
- **Priority:** MEDIUM
- **Timeline:** Q2 2026

### 66. Add Telemetry/Logging for Stale Closure Bugs
- **Rationale:** Hard to debug when dustCallbacks, gamepad callbacks, Sentry errors are silently stale.
- **Implementation:** Log every callback invocation with source + timestamp.
- **Effort:** 1 day
- **Priority:** LOW
- **Timeline:** Q3 2026

### 67. Performance: Batch Renderer Updates Explicitly
- **Rationale:** Ensure React 18 batching is always active (#32).
- **Implementation:** Test with React DevTools Profiler; confirm single re-render per tick.
- **Effort:** <1 day (profiling + verification)
- **Priority:** MEDIUM
- **Timeline:** Q2 2026

### 68. Document Breaking vs. Non-Breaking Session Schema Changes
- **Rationale:** Session restore version check (#25) needs clear policy.
- **Document:**
  - What counts as breaking (removed field, type change, moved field)
  - What counts as non-breaking (new optional field, field rename w/ migration)
  - How to bump version number
- **Effort:** <1 day
- **Priority:** LOW (guidance)
- **Timeline:** Immediately after #59

---

## 📊 SUMMARY TABLE

| Tier | Category | Count | Severity | Status |
|------|----------|-------|----------|--------|
| 1 | Critical & Stability | 5 | CRITICAL/HIGH | 4 unresolved, 1 fixed |
| 2 | High-Priority Bugs | 19 | HIGH/MEDIUM | 18 unresolved, 1 fixed |
| 3 | Gameplay & UX | 7 | MEDIUM/LOW | 7 unresolved |
| 4 | Technical Debt | 21 | LOW/MEDIUM | 2 fixed, 19 unresolved |
| 5 | Tooling & Config | 6 | MEDIUM/LOW | 4 fixed, 2 unresolved |
| 6 | Improvement Roadmap | 10 | — (enhancements) | 0 (planned) |
| **TOTAL** | — | **68** | — | **6 fixed, 62 unresolved** |

---

## 🎯 IMMEDIATE ACTION ITEMS (Priority: This Sprint)

1. **#1** — Fix CI workflow YAML syntax (blocks deployments)
2. **#4** — Reset `scoreSubmittedRef` on game start (data loss)
3. **#13** — Consolidate bot tap paths (economy corruption)
4. **#14** — Use `makePS()` in `safeReset()` (state bleed)
5. **#17** — Track `triggerCellAnim` timeouts (crash risk)
6. **#33** — Fix RAF dirty-flag race (frame loss)
7. **#34** — Add `_isDisposed` guards to public methods (stale writes)

**Estimated Effort:** 3-4 days (1 sprint)

---

## 📝 NOTES FOR SONNET / CLAUDE REVIEWER

- **Deduplication Key:** Issues #2, #7, #8, #10, #11, #12 marked ✅ FIXED; issues #56, #57 consolidated (no separate entries).
- **Severity Ranking:** CRITICAL > HIGH > MEDIUM > LOW. Focus on Tier 1–2 first.
- **Testing Focus:** Add regression tests for #4, #13, #14, #16, #25, #35, #37, #51, #55 to prevent re-introduction.
- **Refactoring Priority:** #40, #61, #62 are large efforts but high ROI (maintainability + performance).
- **Security:** #30, #31 should be resolved ASAP via `pnpm audit` + dependency upgrades.

---

**Last Updated:** 2026-05-16  
**Compiler:** Claude 3.5 Sonnet (combined review from Gemini, Amazon Q, manual code audit)
