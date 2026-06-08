# Game Engine Stability Audit — Council Review Packet
## Date: 2026-06-02
## Version: v7.6.1
## Context: Pre-launch final review

### Recently Fixed (DO NOT re-report)
- Bomb persistence across ticks (TickProcessor.ts:184)
- P2 bot broken by P1 early-return guard (BotController.ts:44)
- Delta timer callbacks fire after game-over (TickProcessor.ts:77)
- isActive() ignoring P2 (BotController.ts:112)
- _slotsCache WeakMap miss for classic mode (TickProcessor.ts:58)
- Inline array allocation per-tick (SPECIAL_TYPES, POWERUP_TYPES Sets)
- Duplicate storm/shuffle branches (TickProcessor.ts:213)

### Known Accepted Patterns (DO NOT flag)
- Bomb expiration uses captured pattern by design (TickProcessor:390-392)
- Firebase client-side API keys are identifiers, not secrets
- holdStart/holdEnd are dev-only tools (intentional dead code in production)
- Gradient objects encode spatial state — per-frame creation is correct for animated elements
- 'use client' does NOT eliminate SSR pre-rendering in static export

### Files to Review
Focus on actual bugs, logic errors, race conditions, and edge cases. NOT style, naming, or documentation.

| File | Focus Area |
|------|------------|
| engine/GameEngine.ts | Main loop, state machine, input handling, game-over conditions |
| engine/subsystems/TickProcessor.ts | Tick loop, cell lifecycle, boss events, delta timers |
| engine/subsystems/CellLifecycle.ts | Cell spawn/despawn, pattern selection, powerup weights |
| engine/subsystems/EventOrchestrator.ts | Boss event types, durations, triggers |
| engine/DifficultyScaler.ts | Difficulty curve, PRNG (mulberry32), spin config |
| utils/boss-engine.ts | Boss state machine, combo system, shield hits |
| engine/subsystems/BotController.ts | Bot P1/P2 logic, dust spending, accuracy |
| engine/subsystems/ScoreTracker.ts | Score calculation, streak bonuses |
| config/difficulty.ts | Balance constants |
| config/gameBalance.ts | Timing, thresholds |
| utils/score-sync.ts | IndexedDB queue, score submission |
| utils/error-tracker.ts | Error tracking, Sentry integration |

### Specific Concerns to Investigate
1. Score sync race conditions — can scores be lost between sessionStorage and IndexedDB?
2. Boss event transitions — can events overlap or leave stale state?
3. Evolve mode fractional death — health <= 0 check (never health < 1)
4. RNG determinism — does mulberry32 produce same sequence for same seed?
5. Energy regen — is ENERGY_REGEN_MS timer correct across tab switches?
6. Achievement system — can achievements fire multiple times?
7. Daily challenge — seed consistency, timezone handling (UTC boundaries)
8. Memory leaks — are all timers/intervals cleaned up on dispose?

### Output Format
Per finding:
- File:Line
- Type: bug | edge-case | logic-error | race-condition | memory-leak
- Severity: Critical | High | Medium | Low
- What: 1-line description
- Code: the problematic snippet
- Fix: suggested fix

Report ONLY things that could actually break in production. Not style, not naming, not documentation.

---

## Audit Findings

### Finding 1

- **File:Line**: `engine/subsystems/TickProcessor.ts:99`
- **Type**: logic-error
- **Severity**: High
- **What**: Tap processing at line 99-100 can trigger game over, but no `ctx.phase` guard exists after it — the rest of the tick (auto-miss damage, cell respawn, DDA recording, spin level increment, survival bonus toasts, tick sound) runs with phase="gameover", mutating state and emitting spurious events.
- **Code**:
  ```typescript
  ctx._flushTapBuffer(1);
  if (ctx.numPlayers === 2) ctx._flushTapBuffer(2);
  ctx.evolveTick += 1;
  // ... ~110 more lines of state mutation with no phase check
  ```
  `_flushTapBuffer` → `_processTap` → `_processTapDanger` → `triggerGameOver()` sets `ctx.phase = "gameover"`. But the next ~110 lines still execute, calling `haptics.levelUp()`, `ctx.dda.recordAttempt(...)`, `ctx.spinLevel += 1`, `ctx.emit({type:"sound",name:"tick"})`, survival bonus toasts, etc.
- **Fix**: Add phase bail-out after tap buffer flush:
  ```typescript
  ctx._flushTapBuffer(1);
  if (ctx.numPlayers === 2) ctx._flushTapBuffer(2);
  if (ctx.phase !== "playing") return;
  ```

### Finding 2

- **File:Line**: `engine/GameEngine.ts:962`
- **Type**: bug
- **Severity**: High
- **What**: `localStorage.getItem('dtp-games-played')` without try-catch in `triggerGameOver()`. In Firefox private browsing or sandboxed iframes, `localStorage.getItem` throws. This prevents the cleanup timeout (line 981), DDA reset (line 999), daily challenge markComplete (line 1001), and stored powerup save (line 991-996) from executing — corrupting state for the next game.
- **Code**:
  ```typescript
  // Line 962-964
  const gamesPlayed = Math.max(0, Math.min(99999,
    parseInt(localStorage.getItem('dtp-games-played') || '0') || 0
  )) + 1;
  achievementSystem.check('games_50', () => gamesPlayed >= 50);
  achievementSystem.check('games_200', () => gamesPlayed >= 200);
  ```
  If this throws, lines 974-1003 (counter reset, cleanup timeout, DDA reset, daily mark, powerup save) never execute.
- **Fix**: Wrap in try-catch or use a safe wrapper:
  ```typescript
  let gamesPlayed = 0;
  try {
    gamesPlayed = Math.max(0, Math.min(99999,
      parseInt(localStorage.getItem('dtp-games-played') || '0') || 0
    )) + 1;
  } catch {
    gamesPlayed = 1;
  }
  ```

### Finding 3

- **File:Line**: `engine/GameEngine.ts:645`
- **Type**: logic-error
- **Severity**: Low
- **What**: After `triggerGameOver()` sets phase="gameover" and emits game-over events, `_processTapDanger` continues with `_purpleTaps` increment, achievement check, `ref.cells` mutation, and extra `emitSnapshot()`. Duplicate snapshot after game-over causes unnecessary React re-render.
- **Code**:
  ```typescript
  if (ref.health <= 0) { ref.alive = false; this.triggerGameOver(winner); }
  // ... still runs:
  this._purpleTaps = (this._purpleTaps ?? 0) + (cell.type === 'purple' ? 1 : 0);
  achievementSystem.check('secret_purple_tap', () => (this._purpleTaps ?? 0) >= 10);
  ref.cells = activeToCellsP(ref.active, pat);
  this.dirty = true;
  this.emitSnapshot();
  ```
- **Fix**: `return` after `triggerGameOver()`:
  ```typescript
  if (ref.health <= 0) { ref.alive = false; this.triggerGameOver(winner); return; }
  ```

### Findings Resolved (no longer present in source)

| Concern | Status | Note |
|---------|--------|------|
| `freeze_5` achievement reads `_shieldCollected` | ✅ Fixed | Source line 698 already uses `_freezeCollected` |
| Inline array allocation per tick | ✅ Fixed | `SPECIAL_TYPES`/`POWERUP_TYPES` are module-level Sets |
| Bomb timer re-uses stale pattern ref | Accepted by design | Comment at TickProcessor:393 explains |

### Clean Files (no production bugs found)

- `engine/DifficultyScaler.ts` — mulberry32 is deterministic; spin config correctly uses epoch seeding; `makeGameSeed` produces valid unsigned 32-bit integer
- `engine/subsystems/CellLifecycle.ts` — WeakMap slot caching correct; randCell/powerup weights correct; `spawnActive` properly handles rareColor override
- `engine/subsystems/EventOrchestrator.ts` — Single-element `BOSS_ROTATION` is intentional; getNextBossTriggerScore correct
- `engine/subsystems/ScoreTracker.ts` — Pure functions, correct streaks/bonuses
- `utils/boss-engine.ts` — Combo window, shield phases, and disposal are correct. `_defeatPhase` correctly phases up to 3 then deactivates
- `engine/subsystems/BotController.ts` — P1/P2 loop correct; dust exhaustion break exits inner loop (outer continues to next player, re-reads dust); timeout closure captures cell type correctly
- `config/difficulty.ts` and `config/gameBalance.ts` — Constants are valid
- `utils/score-sync.ts` — Offline queue + flush flow is correct. `removeAndUpdate` atomicity prevents data loss. SessionId deduplication prevents double-submit
- `utils/error-tracker.ts` — Clean re-export
