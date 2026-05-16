# 🚨 DTP Error Log — 2026-05-16
**Status:** Consolidated for Sonnet / Claude Analysis  
**Total Issues:** 72 (consolidated from multiple review passes)  
**Fixed in v7.5.0+:** Issues 2, 7, 8, 10, 11, 12  

---

## 🛑 CRITICAL & STABILITY ISSUES (Tier 1)

### 1. CI Failure: Bundle Size Workflow YAML Syntax Error
- **File:** `.github/workflows/bundle-size.yml`
- **Error:** YAML parser fails due to `${{ github.repository }}` inside JS template literal.
- **Impact:** ⚠️ **BREAKS CI ON EVERY PUSH** — Cannot deploy.
- **Severity:** CRITICAL
- **Fix:** Pass `REPO` and `RUN_ID` via `env:` block; use `process.env.REPO` / `process.env.RUN_ID`.

### 3. Crash Risk: Snapshot Null-Guards Missing
- **File:** `App.tsx` (in `handleEngineGameOver`)
- **Error:** No optional chaining on `snapshotRef.current.p1` / `p2` before `.score` / `.health` access.
- **Impact:** Potential crash if game ends in unexpected state; hard-to-debug UI errors.
- **Severity:** HIGH
- **Fix:** Use `snapshotRef.current?.p1?.score ?? 0`.

### 4. Data Loss: Score Submission Block (Leaderboard Corruption)
- **File:** `App.tsx`
- **Error:** `scoreSubmittedRef.current` set to `true` at game over, never reset to `false`.
- **Impact:** Second+ games in session won't submit to leaderboard; lost revenue/engagement signal.
- **Severity:** HIGH
- **Fix:** Reset to `false` in `startEngine()` call path.

### 13. Dual Bot Tap Path — Dust Economy Corruption
- **Files:** `engine/subsystems/BotController.ts`, `engine/subsystems/TickProcessor.ts`
- **Error:** Two independent bot execution paths run simultaneously.
- **Impact:** Cells marked `clicked` twice → silent grid desync; dust double-spent.
- **Severity:** CRITICAL
- **Fix:** Consolidate to one authoritative path (Option A: drive entirely from `BotController`).

### 14. `safeReset` Leaves Stale Player State (Invisible Powerup Carryover)
- **File:** `engine/GameEngine.ts` (`safeReset` method)
- **Error:** Resets `score`, `streak`, `health`, `active` only. Leaves: `anim`, `shield`, `freezeEnd`, etc.
- **Impact:** Powerup state bleeds into next game; stage mismatch.
- **Severity:** HIGH
- **Fix:** Fully reinitialize via `makePS()` or rename to clarify partial reset.

---

## ⚠️ HIGH-PRIORITY BUGS (Tier 2: Logic & Integrity)

### 16. RNG Out-of-Sync After Session Restore (Replay Divergence)
- **File:** `engine/GameEngine.ts` (`restoreSessionSnapshot` method)
- **Error:** PRNG re-seeded to 0 but `tickCount` is restored to advanced value.
- **Impact:** Determinism broken after refresh; cell patterns don't match original run.
- **Severity:** HIGH
- **Fix:** Add `rngCallCount` to session snapshot and fast-forward PRNG on restore.

### 33. RAF + setTimeout Dirty-Flag Race Can Lose Snapshots
- **File:** `engine/GameEngine.ts`
- **Error:** `emitSnapshot()` sets `dirty = false` at start, not end.
- **Impact:** UI skips frames; stale phase data on transitions.
- **Severity:** HIGH
- **Fix:** Set `dirty = false` at **end** of `emitSnapshot()`.

### 34. `_isDisposed` Missing on Public Entry Points
- **File:** `engine/GameEngine.ts`
- **Error:** Most methods lack disposal checks.
- **Impact:** Silent writes to dead engine; hard-to-trace bugs on unmount.
- **Severity:** HIGH
- **Fix:** Add `if (this._isDisposed) return;` to all public methods.

### 59. Snapshot Reference Leak — Player Cells Array (NEW: DeepSeek Finding)
- **File:** `engine/GameEngine.ts` (`getSnapshot` method)
- **Error:** `getSnapshot` clones `p1.active` but spreads `...this.p1`, leaking the `cells: CellType[]` array reference.
- **Impact:** `React.memo` misses updates because `snap.p1.cells === prev.p1.cells` even if contents changed.
- **Severity:** MEDIUM-HIGH
- **Fix:** Explicitly clone the cells array in `getSnapshot`.

---

## 🧹 TECHNICAL DEBT & ROADMAP (Tier 3)

### 40. App.tsx Monolith (2557 Lines)
- **Error:** Single component with tightly coupled side effects.
- **Severity:** MEDIUM
- **Fix:** Refactor into `GameController`, `SettingsProvider`, `ScreenRouter`, etc.

### 61. Incomplete Dependency Array in `App.tsx` (NEW: DeepSeek Finding)
- **Error:** `useCallback` hooks (like `handleEngineGameOver`) use many state variables but have incomplete dependency arrays.
- **Impact:** Stale closures; game over logic uses old settings/scores.
- **Fix:** Populate dependency arrays fully.

---

## 📊 SUMMARY TABLE

| Category | Count | Status |
|----------|-------|--------|
| Tier 1: Critical | 5 | Unresolved |
| Tier 2: High Priority | 15 | Unresolved |
| Tier 3: Technical Debt | 30 | Unresolved |
| Tier 4: Fixed | 6 | ✅ FIXED |
| **TOTAL** | **72** | **66 Unresolved** |

---
**Prepared by Gemini CLI & consolidated from DeepSeek/Claude findings.**
