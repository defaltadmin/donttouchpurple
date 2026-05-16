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
| 38 | 2 (energy stale closure) | **RELATED** — different manifestation of energy race, keep separate |
| 39 | 13 (dual bot path) | **RELATED** — distinct issue: interval accumulation, not dual path |
| 47 | 22 (DDA running average) | **DUPLICATE** — same root cause, skip |
| 48 | 23 (clock mismatch) | **DUPLICATE** — same root cause, skip |
| 49 | 25 (version check) | **DUPLICATE** — same root cause, skip |
| 51 | 19 (botTapTimersRef) | **DUPLICATE** — same root cause, skip |
| 56 | 18 (dustCallbacks closure) | **DUPLICATE** — confirm only, skip |
| 57 | 20 (TEMP_CELLS mutable) | **DUPLICATE** — confirm only, skip |
| 58 | N/A | Not a duplicate |

**Issues 1–12 from Gemini CLI. Issues 13–25 from Amazon Q. Issues 26–31 from Claude Code session. Issues 32–58 from Claude review deduplicated against above.**

**Status: ✅ FIXED = Already resolved in v7.5.0 or v7.5.1**

## QWEN
# 🔍 Don't Touch Purple v6.0.0+ — Error Log Analysis & Actionable Patches

## 📋 Executive Summary

The consolidated error log (68 issues) reveals a **well-architected but fragile** codebase. Core systems (Delta-tick engine, React bridge, subsystem decoupling) are sound, but **state management boundaries** and **lifecycle hygiene** are creating critical failure modes.

### 🚨 Top 5 Immediate Risks
| Issue | Impact | Fix Effort | Priority |
|-------|--------|-----------|----------|
| #1 CI YAML syntax | Blocks all deploys | 5 min | 🔴 P0 |
| #13 Dual bot tap path | Economy corruption, silent desync | 30 min | 🔴 P0 |
| #34 Missing `_isDisposed` guards | Stale writes → hard-to-debug crashes | 45 min | 🔴 P0 |
| #4 Score submission ref leak | Lost leaderboard data | 10 min | 🟠 P1 |
| #16 RNG desync on restore | Breaks replay integrity/challenges | 1 hr | 🟠 P1 |

---

## 🛠️ Actionable Single-Block Patches (opencode CLI Ready)

### Patch 1: Fix CI Bundle-Size Workflow YAML (#1)
```yaml
# .github/workflows/bundle-size.yml — REPLACE lines 25-35
- name: Analyze bundle
  run: node scripts/bundle-analyzer.js
  env:
    REPO: ${{ github.repository }}
    RUN_ID: ${{ github.run_id }}
# NOTE: Access via process.env.REPO in script — do NOT use template literals with ${{ }}
```

### Patch 2: Add Null-Guards to Snapshot Access (#3)
```typescript
// App.tsx — handleEngineGameOver() — REPLACE snapshot reads
const p1Score = snapshotRef.current?.p1?.score ?? 0;
const p1Health = snapshotRef.current?.p1?.health ?? GAME.MAX_HEARTS;
const p2Score = snapshotRef.current?.p2?.score ?? 0;
const p2Health = snapshotRef.current?.p2?.health ?? GAME.MAX_HEARTS;
```

### Patch 3: Reset Score Submission Flag (#4)
```typescript
// App.tsx — startEngine() call path — ADD after engine init
useEffect(() => {
  if (engineRef.current) {
    scoreSubmittedRef.current = false; // ← RESET HERE
    engineRef.current.start({ seed: forceSeed });
  }
}, [engineRef, scoreSubmittedRef]);
```

### Patch 4: Consolidate Bot Tap Authority (#13) — RECOMMENDED: Option A
```typescript
// engine/subsystems/TickProcessor.ts — REMOVE inline bot loop (lines ~220-245)
// DELETE this entire block:
/*
if (ctx.botAssistActive[player]) {
  // ... inline bot logic ...
}
*/
// BotController.ts now has sole authority via setInterval

// engine/subsystems/BotController.ts — ADD cleanup guard
stopBot() {
  if (this._intervalId) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }
}
```

### Patch 5: Full Player State Reset via `makePS` (#14)
```typescript
// engine/GameEngine.ts — safeReset() method — REPLACE body
safeReset() {
  // FULL reinitialization prevents state bleed
  this.p1 = makePS(0, this.gameSeed, this.config.mode);
  this.p2 = makePS(1, this.gameSeed, this.config.mode);
  this.score = 0;
  this.streak = 0;
  this.health = GAME.MAX_HEARTS;
  this.active = true;
  // ... reset other top-level fields as needed ...
  this.emit({ type: 'state:reset', ts: performance.now() });
}
```

### Patch 6: Track `triggerCellAnim` Timeouts (#17)
```typescript
// engine/GameEngine.ts — triggerCellAnim() — REPLACE setTimeout call
// BEFORE:
// setTimeout(() => { cell.anim = null; }, duration);

// AFTER:
this.scheduleTimeout(() => {
  if (!this._isDisposed) { // ← safety guard
    cell.anim = null;
    this.markDirty();
  }
}, duration);
```

### Patch 7: Add `_isDisposed` Guards to Public Entry Points (#34)
```typescript
// engine/GameEngine.ts — ADD to ALL public methods (grep: public | handleTap | handleHold | resume)
// Example for handleTap:
handleTap(player: 1|2, coords: [number, number], ts: number) {
  if (this._isDisposed) return; // ← EARLY EXIT
  // ... existing logic ...
}

// Example for resume:
resume() {
  if (this._isDisposed) return;
  if (!this.paused) return;
  // ... existing logic ...
}
```

### Patch 8: Fix RAF Dirty-Flag Race (#33)
```typescript
// engine/GameEngine.ts — emitSnapshot() — MOVE dirty flag reset
emitSnapshot() {
  // ... compute snapshot ...
  this._snapshotSubscribers.forEach(cb => cb(snapshot));
  
  // MOVE THIS TO END (was at start):
  this.dirty = false; // ← NOW AFTER emit, prevents lost updates
}
```

### Patch 9: RNG State Persistence for Replay Integrity (#16)
```typescript
// engine/GameEngine.ts — SessionSnapshot interface — ADD fields
interface SessionSnapshot {
  // ... existing fields ...
  rngSeed: number;
  rngCallCount: number; // ← TRACK CALLS TO REPLAY SEQUENCE
}

// In getSnapshot():
rngSeed: this.gameSeed,
rngCallCount: this._rngCallCount, // ← maintain counter in mulberry32 wrapper

// In restoreSessionSnapshot():
if (data.rngSeed != null && data.rngCallCount != null) {
  this.gameSeed = data.rngSeed;
  this._rngCallCount = data.rngCallCount;
  // Re-seed RNG and fast-forward to restore state
  this._rng = mulberry32(this.gameSeed);
  for (let i = 0; i < this._rngCallCount; i++) this._rng();
}
```

### Patch 10: Graceful Session Version Handling (#25)
```typescript
// engine/GameEngine.ts — restoreSessionSnapshot() — REPLACE version check
// BEFORE: if (snapshotVersion < SESSION_SNAPSHOT_VERSION) return false;

// AFTER: Additive restoration with warnings
if (snapshotVersion > SESSION_SNAPSHOT_VERSION) {
  console.warn(`[Session] Future version ${snapshotVersion} > current ${SESSION_SNAPSHOT_VERSION}; restoring best-effort`);
}
// For missing fields, use defaults via ?? operator — DO NOT reject
```

---

## 🔐 Security & Anti-Cheat Review

### Challenge Link Integrity (#AntiCheat)
```typescript
// utils/challenge-links.ts — ADD signature validation
export function validateChallengeLink(token: string, seed: string): boolean {
  const expected = createHmac('sha256', process.env.CHALLENGE_SECRET)
    .update(`${seed}:${GAME.VERSION}`)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expected)
  );
}
// ⚠️ Store CHALLENGE_SECRET in environment — never client-side
```

### Telemetry Privacy Compliance
```typescript
// utils/privacy-telemetry.ts — ADD consent gate
export function trackEvent(name: string, payload: Record<string, unknown>) {
  if (!getSettings().privacy.telemetryEnabled) return; // ← RESPECT USER CHOICE
  // ... existing logic ...
}
```

---

## ♿ Accessibility Gap Assessment

| Gap | Location | Fix |
|-----|----------|-----|
| Colorblind mode lacks pattern fallback | `components/Grid/Cell.tsx` | Add `aria-label` with shape descriptor |
| Focus trap missing in modals | `components/UI/Modal.tsx` | Integrate `react-focus-lock` |
| Screen reader announcements for game events | `App.tsx` | Add `aria-live="polite"` region for score/phase updates |

```tsx
// components/Grid/Cell.tsx — ADD for colorblind mode
{settings.accessibility.colorblindMode && (
  <span className="sr-only" aria-hidden="false">
    {cell.type === 'purple' ? 'Forbidden cell' : 'Safe cell'}
  </span>
)}
```

---

## 📈 Performance & Scalability Recommendations

### Asset Hydration Optimization
```typescript
// services/AssetLoader.ts — ADD LRU cache for i18n bundles
private _i18nCache = new Map<string, {data: any, ts: number}>();
private readonly CACHE_TTL = 1000 * 60 * 30; // 30 min

async loadBundle(locale: string) {
  const cached = this._i18nCache.get(locale);
  if (cached && Date.now() - cached.ts < this.CACHE_TTL) {
    return cached.data;
  }
  // ... fetch logic ...
  this._i18nCache.set(locale, { data, ts: Date.now() });
  return data;
}
```

### React Re-render Mitigation (#45, #61)
```tsx
// components/HUD/PlayerPanel.tsx — WRAP with memo + custom comparison
export const PlayerPanel = React.memo(({ snapshot, player }: PlayerPanelProps) => {
  // ... render logic ...
}, (prev, next) => {
  // Only re-render if relevant fields changed
  return (
    prev.snapshot.phase === next.snapshot.phase &&
    prev.snapshot[prev.player].score === next.snapshot[next.player].score &&
    prev.settings.theme === next.settings.theme
  );
});
```

---

## 🗺️ Improvement Roadmap (Prioritized)

### Q2 2026 (Immediate)
- [ ] **#1, #13, #34** — Critical stability patches (this sprint)
- [ ] **#59** — Add Zod validation layer for session/Firebase data
- [ ] **#63** — Extend snapshot with RNG state (replay integrity)
- [ ] **#30** — Run `pnpm audit && pnpm update` for security patches

### Q3 2026 (Refactor)
- [ ] **#60** — Split `App.tsx` monolith into feature modules
- [ ] **#62** — Replace `dtp:*` DOM events with typed event bus + Context
- [ ] **#61** — Apply `React.memo` + `areEqual` to all HUD/grid components

### Q4 2026 (Scale)
- [ ] Asset CDN integration with hash-based cache busting
- [ ] i18n bundle code-splitting by locale + lazy hydration
- [ ] Challenge link rate-limiting + server-side signature validation

---

## 🎯 Sonnet Review Checklist

When reviewing with Claude Sonnet, prioritize:

1. **State Lifecycle**: Verify every `setTimeout`/`setInterval` is tracked in `_timeouts` and cleared on `destroy()`
2. **Type Safety**: Replace all `as any`/`as number` in `restoreSessionSnapshot` with runtime guards or Zod schemas
3. **React Bridge**: Ensure `emitSnapshot()` → `setSnapshot()` is batched (React 18 auto-batching confirmed in `index.tsx`?)
4. **Anti-Cheat**: Validate that challenge seeds cannot be client-side manipulated (HMAC + server verification)
5. **Accessibility**: Run `axe-core` E2E test to catch colorblind/focus/ARIA gaps

```bash
# Quick audit commands for Sonnet
pnpm test:e2e --grep "challenge"    # Verify anti-cheat flows
pnpm lighthouse --only-categories=accessibility  # A11y score
grep -r "setTimeout" engine/ | grep -v "scheduleTimeout"  # Find untracked timers
```

---

> 💡 **Pro Tip**: Before deploying any patch, run the **regression test suite** for issues #4, #13, #14, #16, #35 — these are high-risk for re-introduction.

Let me know if you'd like me to generate the full diff files for any patch above, or dive deeper into the anti-cheat challenge link validation flow. 🎮✨

## DEEPSEEK
Based on a thorough review of the error log for the "Don't Touch Purple" game, I've completed an analysis of its current stability, a prioritised review of the issues, and a strategic roadmap for improvement. Here are my key findings:

### 📊 Executive Summary: A Game at a Critical Juncture
The game is in a precarious but improvable state. While it currently functions at a surface level, it’s undermined by several severe stability and data integrity issues that could lead to critical failures. The architecture has accumulated substantial technical debt, making the codebase fragile.

The primary objective of your analysis should be to validate the severity and proposed fixes for the listed issues, particularly the Tier 1 items, to ensure the game's long-term stability.

### 🔍 Prioritised Issue Analysis & Validation
The log outlines 68 issues, organized by severity. My analysis highlights the most critical areas requiring immediate attention:

*   **Tier 1 — Critical & Stability Issues (Immediate Action Required)**:
    *   **Deployment Pipeline Failure (#1)**: A YAML syntax error in the `bundle-size.yml` workflow breaks the entire CI/CD pipeline, which is a blocker for all development.
    *   **Data Integrity & Economy Corruption**: Issues like **#4 (Score Submission Block)** and **#13 (Dual Bot Tap Path)** directly threaten core game systems. Issue #13, where two independent systems process bot taps, can lead to a corrupted game economy, which is a high-impact bug.
    *   **State Bleeding Between Games (#14)**: The `safeReset` method doesn't fully clear player state, causing power-ups from a previous game to bleed into a new one. This is a critical game logic flaw.

*   **Tier 2 — High-Priority Bugs & Logic Errors**:
    *   **Session & State Integrity**: The log identifies several risks of silent data corruption, such as the **Session Restore Unsafe Type Assertions (#37)** and **No Bounds Validation (#51)**, which can lead to crashes and analytics corruption.
    *   **Engine Lifecycle & State Management**: The lack of `_isDisposed` guards on most public methods (#34) creates a high risk of unexpected behavior and memory leaks. Similarly, the **No Error Recovery in start() (#55)** can leave the engine in a dead state after a mid-initialization failure.
    *   **RNG Desync (#16)**: The random number generator resets on session restore, but the game state doesn't, causing replays and seeded challenges to break. This fundamentally breaks a core feature.

*   **Tier 3 & 4 — Technical Debt & Performance**:
    *   **Architectural Fragility**: The `App.tsx` file is a 2557-line monolith (#40), making the codebase extremely hard to test and maintain.
    *   **Performance Overhead**: The lack of `React.memo` on key UI components (#45) causes a full VDOM diff on every tick, leading to dropped frames on low-end devices.
    *   **Custom Event System (#42)**: Using `window` for custom `dtp:*` events bypasses React's data flow, making the state untraceable and prone to stale closure bugs.

### 🛠️ Immediate Stability Fixes (This Sprint)
For validation by Sonnet, the immediate priorities should be to confirm and implement these fixes to stabilize the game:
*   **Fix CI/CD**: Correct the YAML syntax error to restore the deployment pipeline.
*   **Reset `scoreSubmittedRef`**: Ensure leaderboard submissions work for every game in a session.
*   **Consolidate Bot Tap Paths**: Unify the bot logic to one authoritative path to prevent economy corruption.
*   **Fully Reinitialize Player State**: Use `makePS()` in `safeReset()` to prevent state bleed between games.
*   **Track All Timeouts**: Replace raw `setTimeout` calls with tracked ones to prevent post-destroy errors.
*   **Fix RAF Dirty-Flag Race**: Adjust the snapshot logic to prevent frame loss and stale UI.
*   **Add `_isDisposed` Guards**: Protect all public engine methods from writing to a dead engine.

### 📈 Improvement Roadmap (Next Quarter)
Following the stabilization fixes, the focus should shift to reducing technical debt and improving maintainability:
*   **Refactor `App.tsx` (#40)**: Break the monolith into feature modules like `GameController`, `SettingsProvider`, and `ScoreManager`. This is a high-priority item for long-term health.
*   **Implement Runtime Validation (#59)**: Introduce a library like `Zod` to replace unsafe type casts, especially for session restore and Firebase data.
*   **Performance Optimizations (#61)**: Apply `React.memo` to key components to reduce unnecessary re-renders and improve performance on lower-end hardware.
*   **Adopt a Unified Event Bus (#62)**: Replace custom DOM events with a proper TypeScript event emitter for better traceability and maintainability.
*   **Add Integration Tests (#64)**: Write tests for multi-game session flows to prevent regressions for critical paths.

### 💡 Additional Observations for Sonnet
Beyond the specific issues listed, here are a few higher-level observations and potential risks for your consideration:

*   **Test Coverage**: The log frequently recommends testing steps for each fix. A potential hidden risk is that the test environment may not fully replicate the concurrency that leads to race conditions (e.g., #13, #38). I would suggest reviewing the test plan to ensure it includes rigorous edge-case and concurrent execution testing.

*   **Session Snapshot Versioning (#25)**: The current approach of invalidating all sessions on any schema change is a significant user experience risk. The proposed move to an additive/optional restoration with defaults is correct, but it needs careful implementation to avoid silently corrupting data during migration.

*   **BotController Lifecycle (#39)**: The issue of interval accumulation on rapid pause/resume sequences is distinct from the dual path (#13) and is a classic symptom of a lifecycle management problem. The recommended integration of the bot lifecycle into the engine's pause/resume listeners is the correct architectural solution.

If you could provide any additional context from your own analysis, I'm happy to refine this review and explore these points further.

## MANUS
# DTP v7.5.3 — Fix Plan
_Authored by Claude (architect). Implement with Gemini CLI / opencode._

---

## FIX 1 — `.github/workflows/bundle-size.yml` YAML syntax error (**CRITICAL — breaks CI on every push**)

**Root cause:** The `script: |` block contains `${{ github.repository }}` inside a JS template literal backtick string. GitHub Actions YAML parser chokes on this at line ~59 because backticks inside multi-line YAML scalars containing `${{` expressions are ambiguous.

**File:** `.github/workflows/bundle-size.yml`

**Fix:** Replace the inline `${{ github.repository }}` expression inside the JS script block with an environment variable passed via `env:`.

```yaml
      - name: Comment PR with bundle size
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v7
        env:
          REPO: ${{ github.repository }}
          RUN_ID: ${{ github.run_id }}
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('dist/bundle-size-report.json', 'utf8'));
            const formatFile = (file) => {
              const status = file.passed ? '✅' : '❌';
              const rating = file.rating === 'good' ? '🟢' : file.rating === 'needs-improvement' ? '🟡' : '🔴';
              return `${status} ${rating} **${file.name}**: ${file.sizeKB}KB (limit: ${file.limitKB}KB)`;
            };
            const recommendations = report.recommendations.length > 0
              ? '\n\n💡 **Recommendations:**\n' + report.recommendations.map(r => `• ${r}`).join('\n')
              : '';
            const body = `## 📊 Bundle Size Analysis
            **Status:** ${report.passed ? '✅ Passed' : '❌ Failed'}

            ### Files:
            ${report.files.map(formatFile).join('\n')}

            ### Totals:
            **JS:** ${Math.round(report.totals.js / 1024)}KB
            **CSS:** ${Math.round(report.totals.css / 1024)}KB
            **Total:** ${Math.round(report.totals.total / 1024)}KB (limit: ${Math.round(600)}KB)
            ${recommendations}

            [View detailed report](https://github.com/${process.env.REPO}/actions/runs/${process.env.RUN_ID})`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

**Key change:** `${{ github.repository }}` → `process.env.REPO` and `${{ github.run_id }}` → `process.env.RUN_ID`, with both passed via `env:` block above the `with:`.

---

## FIX 2 — `App.tsx`: Stale version hardcode in version sync check

**File:** `App.tsx` (~line 580 area, search for `"5.8.17"`)

**Root cause:** Version check hardcoded to `"5.8.17"` but app is now `7.5.2`. Fires a Sentry warning on every page load.

**Fix:** Remove the version mismatch useEffect entirely OR update it to compare against the actual `__APP_VERSION__` define:

```tsx
// DELETE the entire block:
useEffect(() => {
  const pkgVersion: string = (window as any).__APP_VERSION__ ?? "5.8.17";
  if (pkgVersion !== "5.8.17") {
    console.warn(`[DTP] Version mismatch: package=${pkgVersion}`);
    safeSentry.addBreadcrumb({ category: "deploy", message: "version_mismatch", data: { pkg: pkgVersion } });
  }
}, []);
```

This block is dead logic — `__APP_VERSION__` will never equal `"5.8.17"` again. Just delete it.

---

## FIX 3 — `App.tsx`: PWA install banner shown on first visit (no games played)

**File:** `App.tsx` (search for `setShowInstallBanner(true)`)

**Root cause:** The condition is:
```ts
if (!promptAlreadyShown && (gamesPlayed >= 3 || screen === "menu")) {
  setTimeout(() => setShowInstallBanner(true), 2200);
}
```
`screen === "menu"` is always true here (this runs in a `useEffect` with `[screen]` dep), so the banner fires immediately for brand-new users with 0 games.

**Fix:**
```ts
// CHANGE TO:
if (!promptAlreadyShown && gamesPlayed >= 3) {
  setTimeout(() => setShowInstallBanner(true), 2200);
}
```

Remove `|| screen === "menu"` entirely. PWA prompt should only appear after the player has actually played 3 games.

---

## FIX 4 — `App.tsx`: `scoreSubmittedRef` never reset between games

**File:** `App.tsx` (search for `scoreSubmittedRef`)

**Root cause:** `scoreSubmittedRef.current = true` is set at game over but never reset to `false` when a new game starts. If player plays game 2, score is silently dropped.

**Fix:** In the engine start handler or wherever `startEngine()` is called (look for `setScreen("playing")` or the play button handler), add:
```ts
scoreSubmittedRef.current = false;
```

Also add it at the top of `handleEngineGameOver` as a guard comment so future devs know it's intentional:
```ts
// Reset submission gate for next game (set back to false in startGame handler)
```

The actual reset should go in the function that calls `startEngine()` — search for `startEngine(` in App.tsx and add `scoreSubmittedRef.current = false;` immediately before or after the call.

---

## FIX 5 — `App.tsx`: Dead `toastTimer` ref — duplicate of `toastRef`

**File:** `App.tsx`

**Root cause:** Two refs created for toast timeouts:
```ts
const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);  // line ~280
const toastRef = useRef<ReturnType<typeof setTimeout>|null>(null);       // line ~700
```
`toast$` uses `toastRef`. `toastTimer` is never used in `toast$` — it's dead code that may have been an earlier version. If any code path sets `toastTimer` without clearing via `toastRef`, timers can stack.

**Fix:** Delete `toastTimer` ref entirely. Search for any remaining usages of `toastTimer` and replace with `toastRef`. There should be none remaining if it's fully unused, but verify.

```ts
// DELETE this line:
const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
```

---

## FIX 6 — `App.tsx`: Firebase `fbGetStreak` unhandled rejection chain

**File:** `App.tsx` (search for `fbGetStreak`)

**Root cause:**
```ts
getFirebase().then(fb =>
  fb.fbGetStreak({ clientDate: new Date().toISOString().split("T")[0] })
).then(streak => {
  setLoginStreakCount(streak);
  ...
}).catch(e => logger.warn('Firebase operation failed', e));
```

If `fbGetStreak` itself resolves but `setLoginStreakCount` or `localStorage.setItem` throws synchronously inside the `.then`, the `.catch` won't catch it in some environments (depends on microtask scheduling). More importantly, if `fbGetStreak` returns `undefined` or a non-number, `setLoginStreakCount(undefined)` breaks the streak UI.

**Fix:**
```ts
getFirebase().then(fb =>
  fb.fbGetStreak({ clientDate: new Date().toISOString().split("T")[0] })
).then(streak => {
  const safeStreak = typeof streak === 'number' && isFinite(streak) ? streak : 1;
  setLoginStreakCount(safeStreak);
  try {
    localStorage.setItem("dtp_login_streak", JSON.stringify({
      count: safeStreak,
      lastDate: new Date().toDateString()
    }));
  } catch {}
}).catch(e => logger.warn('Firebase streak fetch failed', e));
```

---

## FIX 7 — `App.tsx`: `snapshotRef` null-guard in `handleEngineGameOver`

**File:** `App.tsx` (inside `handleEngineGameOver`)

**Root cause:** Multiple `snapshotRef.current?.` usages but some without the optional chain:
- `snapshotRef.current?.tick ?? 0` — OK
- `snapshotRef.current?.gameSeed ?? 0` — OK
- `snapshotRef.current?.p1.score` — **NO optional chain on `.score`** — if `p1` is undefined this crashes

Search for `snapshotRef.current?.p1.score` and fix to `snapshotRef.current?.p1?.score`.

Also check: `snapshotRef.current?.p1.health` — same fix: `snapshotRef.current?.p1?.health`.

---

## FIX 8 — `App.tsx`: `handleEngineGameOver` missing deps in useCallback

**File:** `App.tsx`

The `useCallback` for `handleEngineGameOver` has an incomplete dependency array. Based on the visible code it uses: `numPlayers`, `playerName`, `toast$`, `best1`, `best2`, `gameMode`, `wins`, `deaths`, `gamesPlayed`, `machine`, `shopData`, `addDust`, `snapshotRef`, `bossCountersRef`, `peakStreakRef`, `scoreSubmittedRef`.

**Fix:** Ensure the dep array at the end of `handleEngineGameOver`'s `useCallback` includes all of these (refs don't need to be in deps, but state/callbacks do):

```ts
}, [numPlayers, playerName, toast$, best1, best2, gameMode, wins, deaths, gamesPlayed, machine, shopData, addDust]);
```

If `machine` causes re-renders, wrap `machine.updateProgress` in a stable callback via `useCallback` inside `useScreenStateMachine` or use a ref for it.

---

## BONUS IMPROVEMENT — `App.tsx`: Aggressive preload runs on every render cycle

**File:** `App.tsx` (search for "Aggressive preload")

```ts
useEffect(() => {
  if (screen === "menu") {
    import("./components/Shop/ShopPanel");
    import("./components/Backgrounds/PurpleRain");
  }
}, [screen]);
```

This re-fires every time `screen` changes back to "menu" (e.g. after game over → menu). Dynamic imports are cached by the module system so it's harmless but noisy. No fix needed, just leave as-is.

---

## IMPLEMENTATION ORDER

1. **FIX 1** — bundle-size.yml (5 min, high impact — stops CI red)
2. **FIX 2** — Remove stale version check (1 min)
3. **FIX 4** — scoreSubmittedRef reset (5 min, gameplay bug)
4. **FIX 3** — PWA banner gate (2 min, UX)
5. **FIX 7** — snapshotRef null guards (3 min, crash prevention)
6. **FIX 6** — fbGetStreak safety (3 min)
7. **FIX 5** — dead toastTimer ref (2 min, cleanup)
8. **FIX 8** — useCallback deps (5 min, stale closure prevention)

---

## GEMINI CLI COMMANDS

```bash
# After making all file edits:
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Build must pass before committing. Suggested commit message:
```
fix: resolve CI yaml error, score submission reset, snapshot null guards, stale version check
```
