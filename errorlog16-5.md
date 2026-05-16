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

**Issues 1–12 from Gemini CLI. Issues 13–25 from Amazon Q. Issues 26–31 added from current session code review.**
**Status: ✅ FIXED = Already resolved in v7.5.0 or v7.5.1**