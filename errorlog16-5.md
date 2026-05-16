# 🚨 DTP Error Log — 2026-05-16
**Status:** Compiled for Sonnet / Claude Analysis

---

## 🛑 Critical & Stability Issues

### 1. CI Failure: Bundle Size Workflow YAML Syntax
- **File:** `.github/workflows/bundle-size.yml`
- **Error:** YAML parser failure due to `${{ github.repository }}` inside a JS template literal.
- **Impact:** Breaks CI on every push.
- **Fix:** Pass `REPO` and `RUN_ID` via `env:` block and use `process.env`.

### 2. Logic Bug: Energy System Stale Closure
- **File:** `hooks/useEnergyStore.ts`
- **Error:** `spendEnergy` reads `energyData.count` from a stale closure.
- **Impact:** Low-energy guards fail silently; players can spend energy they don't have.
- **Fix:** Read from `energyDataRef.current` inside the `useCallback`.
- **Status:** ✅ FIXED in v7.5.0

### 3. Crash Risk: Snapshot Null-Guards
- **File:** `App.tsx` (inside `handleEngineGameOver`)
- **Error:** Missing optional chaining on `p1` and `p2` before accessing `.score` or `.health`.
- **Impact:** Potential crash if game ends in an unexpected state.
- **Fix:** Update to `snapshotRef.current?.p1?.score`.

### 4. Data Loss: Score Submission Reset
- **File:** `App.tsx`
- **Error:** `scoreSubmittedRef.current` is set to `true` at game over but never reset to `false`.
- **Impact:** Second and subsequent games in a session won't submit scores to the leaderboard.
- **Fix:** Reset to `false` in the `startEngine` call path.

---

## 🐛 Gameplay & Logic Bugs

### 5. UX: PWA Install Banner Gate
- **File:** `App.tsx`
- **Error:** Logic shows banner on `screen === "menu"` even if 0 games played.
- **Impact:** Annoying first-visit experience.
- **Fix:** Restrict to `gamesPlayed >= 3` only.

### 6. Integration: Firebase Streak Safety
- **File:** `App.tsx`
- **Error:** `fbGetStreak` lacks type validation and rejection handling for `localStorage.setItem`.
- **Impact:** UI breaks if Firebase returns unexpected data or if QuotaExceeded occurs.
- **Fix:** Add `isFinite` checks and wrap `localStorage` in `try-catch`.

---

## 🧹 Technical Debt & Cleanup

### 7. Dependency Conflict: Sentry Tracing
- **File:** `package.json`
- **Error:** `@sentry/tracing` (v7) coexists with `@sentry/react` (v10).
- **Impact:** Major version mismatch; potential runtime conflicts.
- **Fix:** Remove `@sentry/tracing` (functionality is now in the main SDK).
- **Status:** ✅ FIXED in v7.5.0

### 8. Build Noise: Duplicate Manual Chunks
- **File:** `vite.config.ts`
- **Error:** Exact duplicate of lines 49-59 found in lines 60-70.
- **Impact:** Confusion for maintainers; first block always wins.
- **Fix:** Delete the duplicate block.
- **Status:** ✅ FIXED in v7.5.0

### 9. Build Noise: Stale Version Check
- **File:** `App.tsx`
- **Error:** Hardcoded check for version `"5.8.17"`.
- **Impact:** Constant Sentry warnings on page load for version mismatches.
- **Fix:** Delete the `useEffect` block.

### 10. Dead Code: Unused Refs and Params
- **File:** `App.tsx` (`toastTimer` ref is dead/duplicate).
- **File:** `hooks/useScreenStateMachine.ts` (`payload` param in `transition` is unused).
- **Impact:** Minor maintenance overhead.
- **Fix:** Delete unused symbols.
- **Status:** ✅ FIXED in v7.5.0 (useScreenStateMachine payload)

---

## ⚙️ Configuration Improvements

### 11. Tooling: Node.js 18 EOL
- **File:** `.github/workflows/bundle-size.yml`
- **Fix:** Update `node-version` to `'20'`.
- **Status:** ✅ FIXED in v7.5.0

### 12. Tooling: TSConfig Missing Paths
- **File:** `tsconfig.json`
- **Fix:** Add `services/` and `utils/` to `include` array.
- **Status:** ✅ FIXED in v7.5.0

---

## 🔴 Game State — Engine Issues (Added by Amazon Q, 2026-05-16)

### 13. Dual Bot Tap Path — Dust Double-Spend Risk
- **Files:** `engine/subsystems/BotController.ts`, `engine/subsystems/TickProcessor.ts`
- **Error:** Two independent bot execution paths exist simultaneously. `BotController` runs on a `setInterval` and `TickProcessor` has its own inline bot loop gated by `ctx.botAssistActive[player]`. Both can be active at the same time if `botAssist` config is set AND `BotController.start()` is called. The same cell can be tapped twice and dust spent twice per tick.
- **Impact:** Dust economy corruption; cells marked `clicked` twice causing silent no-ops that desync the grid state.
- **Fix:** Designate one authoritative bot path. Either remove the `TickProcessor` inline bot loop and rely solely on `BotController`, or remove `BotController`'s interval and drive it entirely from `processTick`. The two must not coexist.

### 14. `safeReset` Leaves Stale Player State
- **File:** `engine/GameEngine.ts` (`safeReset` method)
- **Error:** `safeReset` resets `score`, `streak`, `health`, and `active` but does NOT reset: `anim`, `shield`, `shieldCount`, `freezeEnd`, `multiplierEnd`, `storedFreezeCharges`, `storedShieldCharges`, `gridStage`, `stageProgress`, `patternIdx`, `pendingStageUpdate`, or `slideAnim`. If called mid-game (e.g. from a dev tool or error recovery path), the player restarts with active shields, freeze timers, and wrong grid stage.
- **Impact:** Invisible powerup state carried into new game; potential stage mismatch causing wrong grid patterns to spawn.
- **Fix:** Replace the partial mutation in `safeReset` with a full `start()` call, or call `makePS()` to reinitialize both `p1` and `p2` from scratch.

### 15. `holdTimers` Map Stores `null` as Timer Handle
- **File:** `engine/GameEngine.ts` (`handleHoldStart` method)
- **Error:** `holdTimers.set(key, { timer: null as unknown as NodeJS.Timeout, cell, player })` — the actual hold expiry is tracked via `_deltaTimers`, not a real `NodeJS.Timeout`. However `handleHoldEnd` calls `clearTimeout(entry.timer)` on that null handle. This is a no-op but masks the real intent and will silently fail if the delta timer system is ever bypassed or refactored.
- **Impact:** Hold cells may not clean up correctly under edge cases; misleading code that will confuse future maintainers.
- **Fix:** Remove the `timer` field from the `holdTimers` map entirely since the delta timer is the real mechanism, or store the actual delta timer ID instead.

### 16. RNG Out-of-Sync After Session Restore
- **File:** `engine/GameEngine.ts` (`restoreSessionSnapshot` method)
- **Error:** `restoreSessionSnapshot` calls `mulberry32(this.gameSeed)` which resets the RNG to position 0 of the seed sequence. But `tickCount` may be restored to e.g. 200, meaning the RNG has already been consumed ~200+ times. Post-restore cell spawns will use the wrong part of the sequence, breaking determinism.
- **Impact:** Replays and challenge seeds will diverge after a session restore. Cell patterns after restore won't match the original run.
- **Fix:** Either (a) fast-forward the RNG by replaying `tickCount` calls after restore, or (b) save and restore the RNG state directly (current call count / internal state of `mulberry32`) in the session snapshot.

### 17. `triggerCellAnim` Timeout Not Tracked — Fires After Destroy
- **File:** `engine/GameEngine.ts` (`triggerCellAnim` method)
- **Error:** The `setTimeout` inside `triggerCellAnim` uses a raw `setTimeout` that is NOT added to `this._timeouts`. It therefore won't be cleared by `clearAllTimeouts()`, `stop()`, or `destroy()`. If the component unmounts or the engine is destroyed mid-animation, the callback fires and writes to `ref.anim` on a dead object.
- **Impact:** Stale state writes post-destroy; potential React state update on unmounted component warnings; in worst case, a reference to a garbage-collected player state.
- **Fix:** Replace the raw `setTimeout` with `this.scheduleTimeout(...)` so it is tracked and cleared on destroy.

### 18. `useGameEngine` Stale `dustCallbacks` Closure
- **File:** `hooks/useGameEngine.ts`
- **Error:** The `useEffect` that creates the engine has deps `[config.mode, config.numPlayers, config.speedMult]`. The `dustCallbacks` object is captured in the closure at mount time. If the parent passes inline arrow functions for `getDust`/`spendDust`/`getAccuracy`, those references change every render but the engine never recreates — it keeps calling the original stale closures.
- **Impact:** Bot assist reads stale dust values; dust spend calls may target a stale context (e.g. old `DustContext` state).
- **Fix:** Either add `dustCallbacks` to the dep array (will recreate engine on every render — bad), or store `dustCallbacks` in a `useRef` and read from `.current` inside the engine config callbacks.

### 19. `botTapTimersRef` Grows Unbounded
- **File:** `hooks/useGameEngine.ts`
- **Error:** Every bot tap pushes two `setTimeout` IDs into `botTapTimersRef.current` (one for highlight, one for fx). These are only cleared on unmount. During a long session with active bot assist, this array can grow to thousands of entries, all of which are iterated on cleanup.
- **Impact:** Memory pressure during long sessions; O(n) cleanup on unmount.
- **Fix:** Splice completed timer IDs out of the array inside the timeout callback, or use a `Set` and delete on completion.

### 20. `TEMP_CELLS` Shared Mutable Array in `activeToCellsP`
- **File:** `engine/subsystems/CellLifecycle.ts`
- **Error:** `TEMP_CELLS` is a module-level mutable array reused across all calls to `activeToCellsP`. The function mutates it in-place and returns a `.slice()`. This is safe in single-threaded JS but fragile — any future async path (e.g. a Web Worker port) or a call that doesn't `.slice()` the result will share the same reference.
- **Impact:** Currently safe but a latent correctness hazard. If `activeToCellsP` is ever called without consuming the `.slice()` result immediately, callers will share state.
- **Fix:** Allocate a fresh array per call, or document the constraint explicitly with a comment warning against async use.

### 21. `getSnapshot` Recomputes `isInverted`/`isBlackout` on Every RAF Frame
- **File:** `engine/GameEngine.ts` (`getSnapshot` method)
- **Error:** Both `isInverted` and `isBlackout` call `Date.now()` and dereference `bossEvent` on every snapshot emission (up to 60 times/sec). These are not memoized.
- **Impact:** Minor CPU overhead; more importantly, the snapshot is not a pure function of engine state — two calls in the same tick can return different values if a boss event expires between them.
- **Fix:** Compute these once per tick in `processTick` and store as `_isInverted`/`_isBlackout` fields (the engine already has `_isInverted` — extend the pattern to `_isBlackout` and read from fields in `getSnapshot`).

### 22. `DynamicDifficulty.compute()` Running Average Never Resets
- **File:** `utils/dda.ts`
- **Error:** `metrics.accuracy` and `metrics.avgReactionMs` are computed as cumulative running averages over the entire session (`tickCount` as denominator). Early-game poor performance permanently drags down the accuracy metric even after the player improves, because the denominator keeps growing.
- **Impact:** DDA becomes less responsive over long sessions; a player who dies early but improves will never get difficulty increased back to appropriate levels.
- **Fix:** Use a sliding window (e.g. last 20 attempts) for accuracy and reaction metrics instead of a lifetime average.

### 23. `InputBuffer` Debounce Uses `performance.now()` but Tap Buffer Uses `Date.now()`
- **Files:** `utils/input-smoothing.ts`, `engine/GameEngine.ts`
- **Error:** `InputBuffer.register()` timestamps with `performance.now()` (monotonic, relative to page load). `_flushTapBuffer` checks `Date.now() - entry.ts > TAP_BUFFER_MS` where `entry.ts` is set with `Date.now()` (wall clock). These two clocks are not interchangeable — `performance.now()` starts at 0, `Date.now()` is a Unix timestamp in ms. If any code ever mixes them in a comparison, the result is nonsensical.
- **Impact:** Currently safe because the two systems don't cross-compare, but a single refactor that mixes them will produce a silent always-true or always-false condition.
- **Fix:** Standardize on one clock throughout the input pipeline. `performance.now()` is preferred for game timing.

### 24. `triggerGameOver` Emits `phaseChange` After `stop()` Cancels RAF
- **File:** `engine/GameEngine.ts` (`triggerGameOver` method)
- **Error:** `triggerGameOver` calls `this.stop()` (which cancels the RAF loop and tick timer) then emits `phaseChange` and `gameOver` events. The RAF loop is already dead at this point, so `emitSnapshot` is never called after the phase change. The final snapshot consumers receive may still show `phase: "playing"`.
- **Impact:** UI may briefly show the wrong phase; game-over screen may render on top of a stale "playing" snapshot.
- **Fix:** Call `this.emitSnapshot()` once after setting `this.phase = "gameover"` and before `this.stop()`, or emit the final snapshot explicitly after the phase change events.

### 25. Session Snapshot Version Check Rejects Forward-Compatible Snapshots
- **File:** `engine/GameEngine.ts` (`restoreSessionSnapshot` method)
- **Error:** The version check `if (snapshotVersion < SESSION_SNAPSHOT_VERSION) return false` discards any snapshot from an older version. This is correct for breaking changes but the current version bump strategy is not documented — any field addition bumps the version and silently discards all existing user sessions on deploy.
- **Impact:** Every deploy that adds a field to the session snapshot will invalidate all active user sessions, causing players mid-game to lose progress on page refresh.
- **Fix:** Use additive/optional field restoration with `?? default` (already done for most fields) and only bump the version for genuinely breaking schema changes. Document what constitutes a breaking change.

---

## 🆕 Additional Issues (Added from Code Review)

### 26. BotController Emit Cast Still Required
- **File:** `engine/GameEngine.ts:189`
- **Error:** `emit: (event) => this.emit(event as any)` — the `as any` cast remains because BotController callback has generic `{ type: string; [k: string]: unknown }` type, not the full GameEvent union.
- **Impact:** Type safety weakened; requires BotController type update to remove.
- **Fix:** Update BotController's emit callback type to accept `GameEvent` directly, or use a more specific union.

### 27. Unused Imports in App.tsx (Lint Noise)
- **File:** `App.tsx`
- **Error:** 20+ unused imports: `sessionManager`, `analytics`, `LazyHydrate`, `LoginStreakPopup` (component), `DailyChallengesPopup` (component), etc.
- **Impact:** ~20 lint warnings on every run; reduces signal-to-noise ratio.
- **Fix:** Remove unused imports or add eslint-disable comments for intentional imports.

### 28. utils/index.ts Broken Barrel Exports
- **File:** `utils/index.ts`
- **Error:** Multiple exports commented out that don't exist: `gameanalytics`, `clarity`, `AssetGate`, `pendingScoresDb`, `storage`, `devLog`, `cleanupPattern`, `dustAnimation`, `i18nKeys`. Some modules export functions/classes, not objects.
- **Impact:** TypeScript may have errors if code tries to import from this barrel file.
- **Fix:** Either restore proper exports or delete the barrel file and let consumers import directly.

### 29. `_currentThemeId` Declared But Never Set
- **File:** `engine/GameEngine.ts`
- **Error:** `private _currentThemeId = 'default'` was added to fix an `as any` cast, but the field is never assigned anywhere in the codebase.
- **Impact:** Dead field that will always be `'default'`; placeholder code that was added to fix a type error without actual functionality.
- **Fix:** Either implement theme-aware session tracking or remove the field if not needed.

### 30. Dependabot Vulnerabilities
- **Project:** 11 open vulnerabilities (4 high, 7 moderate)
- **Impact:** Security risk; outdated dependencies
- **Fix:** Run `pnpm audit` and `pnpm update` to patch vulnerabilities

### 31. ESLint v8 Deprecated
- **File:** `package.json`
- **Error:** `eslint@8` is deprecated and no longer supported.
- **Impact:** Will stop receiving updates; should upgrade to ESLint v9.
- **Fix:** Upgrade eslint and related plugins to v9

---

## 🔴 Deep Engine & React Bridge Analysis (Claude Review, continues from #32)

### 32. `setTimeout` Tick Loop Fires React State Outside Batching
- **Files:** `engine/GameEngine.ts:314` → `processTick()` → `emit()` → `hooks/useGameEngine.ts:172`
- **Error:** Game loop uses `setTimeout` chain. Each tick calls `ctx.emit()` → subscriber calls `setSnapshot()`. In React 17/legacy mode this runs **outside React's batching** — each `setSnapshot` triggers a synchronous re-render before the next statement.
- **Impact:** Multiple synchronous re-renders per tick; performance degradation on low-end devices.
- **Fix:** Wrap subscriber state updates in `unstable_batchedUpdates` (React 17) or ensure React 18 concurrent mode (automatic batching).

### 33. RAF + setTimeout Dirty-Flag Race Can Lose Snapshots
- **Files:** `engine/GameEngine.ts:284-305` (`startSnapshotRaf`), `307-319` (`scheduleTick`)
- **Error:** RAF loop emits snapshots when `dirty === true`. If two ticks process before an RAF cycle fires (frame drop), first snapshot is overwritten. Also `emitSnapshot()` sets `dirty = false` at start (line 429), but the RAF guard `dirty && phase !== "gameover"` passes before the check — if `gameOver` fires between guard and emit, stale "playing" snapshot is emitted.
- **Impact:** UI skips frames; React receives stale phase data on game-over transition.
- **Fix:** Set `dirty = false` at end of `emitSnapshot()` not start. Add `phase === "playing"` guard inside RAF body.

### 34. `_isDisposed` Missing on resume/handleTap/handleHoldStart
- **File:** `engine/GameEngine.ts:375` (`destroy` sets `_isDisposed = true`)
- **Error:** Only `start()` (line 230) checks `_isDisposed`. `resume()` (359), `handleTap()` (449), `handleHoldStart()` (588), `handleHoldEnd()` (615), dev methods don't. Can be called after `destroy()` from unmounted component's async callback.
- **Impact:** Silent writes to dead engine state; hard-to-trace bugs on unmount.
- **Fix:** Add `if (this._isDisposed) return;` to all public entry points.

### 35. Tap Buffer Not Cleared on Pause — Stale Tap Fires After Resume
- **File:** `engine/GameEngine.ts:346-357` (`pause()`)
- **Error:** `pause()` clears tick timer but NOT `this.tapBuffer`. Buffered tap (within 50ms window) survives pause. On `resume()` → next `processTick()` → `_flushTapBuffer()` fires it against new cells.
- **Impact:** Phantom tap on resume; player may take unintended damage or score.
- **Fix:** Reset `this.tapBuffer = { 1: null, 2: null }` in `pause()`.

### 36. `_tickCtx` Getters Return Stale State After Destroy
- **File:** `engine/GameEngine.ts:150-185`
- **Error:** `_tickCtx` created once in constructor with getters wrapping `this` via `const self = this`. After `destroy()`, all getters return frozen/dead state. `processTick()` checks `ctx.phase !== "playing"` but after destroy the phase may still be `"playing"`.
- **Impact:** Logic executes on dead engine; `emit()` calls on empty listener set; `triggerGameOver()` on dead state.
- **Fix:** Add `_isDisposed` getter to `_tickCtx` and check at start of `processTick()`.

### 37. Session Restore Uses Unsafe Type Assertions — Silent Corruption
- **File:** `engine/GameEngine.ts:887-962`
- **Error:** Dozens of `as number`, `as boolean`, `as any` from `Record<string, unknown>`. Malformed data silently produces `undefined` → `NaN` → `?? 0` kicks in restoring wrong state. No validation between JSON parse and assignment.
- **Impact:** Silent state corruption on corrupted or version-mismatched session data.
- **Fix:** Use runtime schema validation (zod/io-ts) or add `typeof`/`isFinite` guards before every cast with `logger.warn` on failure.

### 38. Energy `spendEnergy` Double-Spend Race on Rapid Calls (related to #2)
- **File:** `hooks/useEnergyStore.ts:43-51`
- **Error:** `spendEnergy` reads `energyDataRef.current.count` to check if energy available, then calls `setEnergyData(prev => ...)`. Between reading the ref and flushing the update, a second concurrent `spendEnergy` call can also pass the guard. Two games can start on 1 energy.
- **Impact:** Energy economy corruption; player starts more games than they have energy for.
- **Note:** Related to #2 (#2 was about stale closure reading `energyData` directly — that was the `useCallback` issue. This is a race condition on the ref-based guard.)
- **Fix:** Use `setEnergyData(prev => { if (prev.count <= 0) return prev; ... })` — check INSIDE the updater, not before it.

### 39. BotController Interval Accumulation on Rapid Pause/Resume (distinct from #13)
- **File:** `engine/subsystems/BotController.ts`
- **Error:** #13 covers dual bot PATH (two code paths running simultaneously). This issue: `startBot()` creates `setInterval(1000ms)` via `bot.start()`, `stopBot()` clears it. If `pause()`/`resume()` cycles rapidly with `setBotAssist()` in between, intervals can orphan if disposal timing slips.
- **Impact:** Bot taps accumulate; dust double-spent; phantom taps beyond what #13 describes.
- **Fix:** Integrate bot lifecycle into pause/resume using `_pauseListeners`/`_resumeListeners`.

---

## 🐛 Gameplay & Logic Bugs (Claude Review)

### 40. App.tsx Monolith — 2557 Lines, 170+ State Vars, 50+ `useEffect`
- **File:** `App.tsx`
- **Error:** Single component with tightly coupled side effects. `resumeEngine()` called from both manual resume AND visibility handler — can double-resume. `startGame()` and `handleTutorialClose()` share ~80% identical code (lines 1504-1589).
- **Impact:** Impossible to test or maintain; every change risks unrelated breakage.
- **Fix:** Split into `GameController`, `SettingsProvider`, `ScreenRouter`, `ScoreManager`, `ProgressTracker`.

### 41. Incomplete `useGameEngine` Dependency Array
- **File:** `hooks/useGameEngine.ts:314`
- **Error:** Deps `[config.mode, config.numPlayers, config.speedMult]`. Changes to `config.inputMode`, `config.godMode`, `config.storage`, or `config.botAssist` never recreate the engine. `godMode` is handled via separate `devSetGodMode()` effect, but `inputMode`/`storage` changes are silently ignored.
- **Impact:** Engine uses stale config for some properties; `inputMode` toggle requires page reload.
- **Fix:** Add all config properties to dep array, or use mutable ref-based config the engine reads on each access.

### 42. Custom DOM Events (`dtp:*`) Bypass React Data Flow
- **Files:** `App.tsx` (6+ `window.addEventListener` for `dtp:*`), `engine/GameEngine.ts:133-141`
- **Error:** Events like `dtp:boss:update`, `dtp:combo`, `dtp:daily-complete`, `dtp:feature-unlocked` dispatched on `window` for cross-component state. Bypasses React's prop/context system.
- **Impact:** Data flow untraceable; stale closure risk; manual cleanup required; components mount after dispatch miss events.
- **Fix:** Replace with React Context for UI state and a typed event bus for cross-cutting concerns.

### 43. `safeSentry` Silently Swallows All Errors
- **File:** `App.tsx:108-113`
- **Error:** Every `safeSentry` method wraps in `try { Sentry.method() } catch { /* Sentry unavailable */ }` with empty catch. If Sentry SDK throws at init, all subsequent calls also silently fail.
- **Impact:** Sentry can be broken for weeks without any signal; debugging Sentry issues impossible.
- **Fix:** At minimum `console.warn` inside catch. Better: use optional chaining `Sentry.addBreadcrumb?.()` instead of try-catch.

### 44. `startGame` / `handleTutorialClose` ~80% Code Duplication
- **File:** `App.tsx:1504-1546` vs `1549-1589`
- **Error:** Both contain identical logic: validate energy → set gamesPlayed → reset scoreSubmittedRef → startEngine → handle replay seed. ~25 lines duplicated verbatim. Any fix to one must be manually replicated.
- **Impact:** Bug-fix asymmetry; one path gets fixed, the other doesn't.
- **Fix:** Extract shared game-start logic into single `launchGame(forceSeed?)` function called by both.

### 45. No `React.memo` on PlayerPanel/HUD/Grid Components
- **Files:** `components/HUD/PlayerPanel.tsx`, `components/HUD/Hearts.tsx`, etc.
- **Error:** Every engine tick calls `setSnapshot()` creating new object → re-renders entire game tree. None of the game-area components use `React.memo` to bail out on unchanged props.
- **Impact:** Full VDOM diff of game tree 3-4+ times/second; dropped frames on low-end devices.
- **Fix:** Add `React.memo` to `PlayerPanel`, HUD, grid cells with custom `areEqual` for snapshot props.

### 46. Visibility Change + Manual Pause Race
- **File:** `App.tsx:1102-1131`
- **Error:** Visibility handler calls `pauseEngine()` on hidden, `resumeEngine()` on visible. If user pauses manually, then hides tab and returns, auto-resume fires and overrides user's pause intent.
- **Impact:** Game auto-resumes when tab returns even if user explicitly paused.
- **Fix:** Track whether last pause was manual vs. auto. Only auto-resume if pause was auto-triggered by previous visibility change.

---

## 🧹 Technical Debt (Claude Review)

### 47. `_cachedMask` Identity Check Fails on Mutated Source Arrays
- **File:** `engine/GameEngine.ts:796-799`
- **Error:** Cache key is `pat.mask !== this._cachedMaskSrc` — reference identity check. If any code mutates the `pat.mask` array in place (reference unchanged but content changed), cache returns stale mask data.
- **Impact:** Stale grid layout rendered after pattern mutation.
- **Fix:** Add content hash or version alongside reference check. Deep-clone mask on write to ensure immutability.

### 48. `devForcedPwr` Reset Logic Depends on Player Index — Skips If Dead
- **File:** `engine/subsystems/TickProcessor.ts:189`
- **Error:** Consumed only when `pi === (numPlayers === 1 ? 0 : 1)` (second player). If P2 is dead and skipped, `devForcedPwr` never cleared — persists forever across ticks.
- **Impact:** Dev-forced powerup never consumed if P2 dead; dev tools behave unpredictably.
- **Fix:** Always consume `devForcedPwr` after first successful spawn, regardless of which player gets it.

### 49. Boss Event `scheduleTimeout` Can Fire on Disposed Engine
- **File:** `engine/subsystems/TickProcessor.ts:440-446`
- **Error:** `ctx.scheduleTimeout(cb, durationMs)` fires after boss duration. `clearAllTimeouts()` on destroy() normally prevents this — but only if `destroy()` runs before the timeout. If user navigates away fast, callback writes to dead `_tickCtx`.
- **Impact:** Write to dead engine state; possible React warning on unmounted component.
- **Fix:** Add `_isDisposed` check inside the timeout callback before mutating ctx state.

### 50. Gamepad Callbacks Stale After Engine Destroy
- **File:** `engine/GameEngine.ts:143-147`
- **Error:** Gamepad listener captured in constructor closure. `_gamepadUnsub` stored for cleanup. If `destroy()` misses the unsub call (e.g. hot-reload), stale callbacks fire on dead engine.
- **Impact:** Gamepad events on dead engine; hard crash if `this.p1` is undefined.
- **Fix:** Add `_isDisposed` check at top of gamepad callback.

### 51. `restoreFromSession` No Bounds Validation
- **File:** `engine/GameEngine.ts:765-769`
- **Error:** Direct assignment of `data.hearts`, `data.score`, `data.timeLeft` with no clamping. `hearts: -100` or `score: NaN` propagate directly into game state.
- **Impact:** Negative health, NaN scores cascade into UI crashes and analytics corruption.
- **Fix:** Clamp values: `hearts = Math.max(0, Math.min(GAME.MAX_HEARTS, data.hearts ?? GAME.MAX_HEARTS))`.

### 52. Constructor Starts Side-Effects Before `start()` Call
- **File:** `engine/GameEngine.ts:120-194`
- **Error:** Constructor inits audio engine, subscribes to gamepad, registers DOM event listeners, imports settings module. If `start()` is never called (e.g. page load without game start), these persist entire page lifetime.
- **Impact:** Memory leak on SPA navigation without game start; unnecessary gamepad polling and audio init.
- **Fix:** Defer gamepad/audio/analytics init to `start()`. Constructor only sets up tick context and state.

### 53. `_sessionAutoSaveInterval` Timer Fires During Pause
- **File:** `engine/GameEngine.ts:744-756`
- **Error:** Auto-save interval every 5s is not cleared on `pause()`. Guard `if (!this.paused)` inside callback works, but the timer itself keeps firing and re-checking.
- **Impact:** Unnecessary timer wakeups during pause (minor but wasteful).
- **Fix:** Clear interval in `pause()`, re-create in `resume()`.

### 54. `pause()` Emits `phaseChange` Before `emitSnapshot()`
- **File:** `engine/GameEngine.ts:355-356`
- **Error:** Order: emit `phaseChange: "paused"` → then `emitSnapshot()`. React processes `phaseChange` immediately, but snapshot emitted still carries `phase: "playing"` briefly.
- **Impact:** Brief phase inconsistency; UI flicker between playing and paused states.
- **Fix:** Swap order: `emitSnapshot()` first, then `phaseChange`.

### 55. No Error Recovery in `start()` — Mid-Init Exception Leaks Engine
- **File:** `engine/GameEngine.ts:229-268`
- **Error:** If any line between `this.stop()` and `this.scheduleTick()` throws (e.g. `localStorage.setItem` quota exceeded), engine is left with `phase = "playing"` but no timers running.
- **Impact:** Dead engine; game appears stuck with no feedback to user.
- **Fix:** Wrap `start()` body in try-catch, reset to safe state on failure, emit error toast.

### 56. `useGameEngine` `dustCallbacks` Stale Closure (confirm #18)
- **File:** `hooks/useGameEngine.ts:152-163,314`
- **Error:** Already logged as #18. Confirmed: `dustCallbacks` captured in engine constructor closure at mount time. Dep array doesn't include `dustCallbacks`, so stale references for `getDust`/`spendDust`/`getAccuracy` persist across renders.
- **Fix:** Store `dustCallbacks` in `useRef` and read from `.current` inside engine config callbacks.

---

## ⚙️ Configuration & Build (Claude Review)

### 57. Module-Level `TEMP_CELLS` Buffer is Shared Mutable State (confirm #20)
- **File:** `engine/subsystems/CellLifecycle.ts:11,33-48`
- **Error:** Already logged as #20. Module-level `const` array reused across all `activeToCellsP()` calls. Mutated in place, `.slice()` returned. Safe in sync JS but latent hazard — if async path is added or caller doesn't slice, callers share mutable reference.
- **Fix:** Allocate fresh array per call instead of reusing shared buffer.

### 58. Duplicate `toastTimer` Refs in App.tsx
- **File:** `App.tsx:252` and `App.tsx:652`
- **Error:** Two `useRef<ReturnType<typeof setTimeout> | null>` for toast timers (`toastTimer` + `toastRef`). One is unused/duplicate.
- **Impact:** Minor maintenance overhead; confusion about which timer is authoritative.
- **Fix:** Keep one, remove the other.

---

## 🔮 Duplicate/Overlap Index (save Sonnet reading time)

| My # | Maps to Existing # | Relationship |
|------|-------------------|--------------|
| 29 | 17 (triggerCellAnim timeout) | **DUPLICATE** — same issue, skip |
| 33 | 24 (triggerGameOver stop before snapshot) | **DUPLICATE** — same issue, skip |
| 34 | 14 (safeReset leaves state) | **DUPLICATE** — same root cause, skip |
| 35 | 16 (RNG out of sync) | **DUPLICATE** — same root cause, skip |
| 38 | 4 (scoreSubmittedRef never reset) | **DUPLICATE** — same root cause, skip |
| 39 | 13 (dual bot path) | **RELATED** — distinct issue: interval accumulation, not dual path |
| 47 | 22 (DDA running average) | **DUPLICATE** — same root cause, skip |
| 48 | 23 (clock mismatch) | **DUPLICATE** — same root cause, skip |
| 49 | 25 (version check) | **DUPLICATE** — same root cause, skip |
| 51 | 19 (botTapTimersRef) | **DUPLICATE** — same root cause, skip |
| 56 | 18 (dustCallbacks closure) | **DUPLICATE** — confirm only, skip |
| 57 | 20 (TEMP_CELLS mutable) | **DUPLICATE** — confirm only, skip |
| 58 | 66 sync with #58 below | Keep separate |
| 61-67 | 11, 12, 8, 9, 10 | Already in file above |

**Issues 1–12 from Gemini CLI. Issues 13–25 from Amazon Q. Issues 26–31 from Claude Code session. Issues 32–58 from Claude review deduplicated against above.**

**Status: ✅ FIXED = Already resolved in v7.5.0 or v7.5.1**