# Engine Audit — 2026-05-30

8 files reviewed: GameEngine.ts, DifficultyScaler.ts, TickProcessor.ts, CellLifecycle.ts, BotController.ts, EventOrchestrator.ts, ScoreTracker.ts, types.ts

## Findings: 1 Critical, 1 High, 4 Medium, 8 Low

### Critical (1) — FIXED

#### FINDING 1 — Evolve mode death at 0.5 health
- **Files:** GameEngine.ts:643-644, TickProcessor.ts:163, TickProcessor.ts:382
- **Issue:** `if (ref.health < 1)` triggers game over at 0.5 health (not 0). In evolve mode with 0.5 damage per hit, expected hits-to-death = 10, actual = 9. All 3 damage paths affected.
- **Fix:** Changed to `if (ref.health <= 0)` in all 3 locations.

### High (1) — DEFERRED

#### FINDING 9 — No engine unit tests
- **Issue:** `engine/__tests__/` directory has zero test files (fractionalHealth.test.ts is at project root). For a game engine with fractional health, boss events, delta timers, difficulty scaling, and cell spawn distributions — no safety net.
- **Note:** Deferred — 232 tests exist in the broader project.

### Medium (4) — 3 FIXED

#### FINDING 2 — Medpack overcap — FIXED
- **File:** GameEngine.ts:605-609
- **Issue:** `ref.health += 1` without cap. In evolve mode with fractional health (e.g. 4.5), health exceeds MAX_HEARTS (5).
- **Fix:** `ref.health = Math.min(GAME.MAX_HEARTS, ref.health + 1)`

#### FINDING 3 — Clock domain: bomb expiresAt vs delta timer
- **File:** TickProcessor.ts:359 vs 59-60
- **Issue:** `expiresAt` uses `Date.now()` but delta timer uses `performance.now()` deltas. Can desync under NTP adjustments.
- **Note:** Visual countdown is display-only; actual explosion is delta-timer-controlled. Low practical impact.

#### FINDING 4 — ref.active.push(bomb) in-place mutation — FIXED
- **File:** TickProcessor.ts:361
- **Issue:** Violates "cell arrays replaced each tick" rule. `ref.active.push(bomb)` mutates shared reference.
- **Fix:** `ref.active = [...ref.active, bomb]`

#### FINDING 6 — holdProgress field doesn't exist on any cell type — FIXED
- **File:** GameEngine.ts:836-837
- **Issue:** `devSpawnSpecialCell` sets `holdProgress` (doesn't exist on HoldCell type). Correct fields are `holdRequired` + `spawnedAt`.
- **Fix:** Replaced with correct field names.

### Low (8)
- FINDING 5: devSpawnSpecialCell mutates cells via Record cast (dev-only)
- FINDING 7: _cachedNow scope — only used by tick processor, not tap handlers (correct behavior)
- FINDING 8: Duplicate _slotsCache WeakMaps (different value types, no conflict)
- FINDING 10: Bomb delta timer stale pattern (edge case)
- FINDING 11: Dynamic import in boss completion callback (non-critical feature)
- FINDING 12: shieldBoss score window can be missed by large bonuses
- FINDING 13: DDA reaction time includes all tap types (inflates reaction, makes game easier)
- FINDING 14-15: Dead code (liteMode, double _sessionStartTime init)

## Architecture Assessment: STRONG
- Clock domain convention documented at GameEngine.ts:1-8
- Delta timer pattern correctly handles batched callbacks
- TickProcessor has comprehensive error recovery (try/catch around processTick)
- Cell arrays replaced each tick (now enforced after fix #4)
- BotController checks document.hidden
- DifficultyScaler reads overrides on each call (not frozen at load)
- Bomb fuse uses delta timers, not setTimeout
