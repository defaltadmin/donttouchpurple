# Round 3 Fix Verification — Minimax 2.7

You audited Don't Touch Purple v7.5.3 and found 17 issues (0 critical, 5 medium, 12 low/info). The FIX_PLAN_v7.5.3.md was reviewed and the following fixes were applied.

---

## Fixes Applied

### FIX-001: IDB Eviction Race Condition (MEDIUM → LOW)

**Your diagnosis:** Multiple tabs calling `enqueue()` simultaneously can exceed the 100-item cap.

**Assessment:** The fix in FIX_PLAN was nearly identical to the existing code. The existing code already uses a single transaction for count+evict+add. The multi-tab race is theoretical — IDB transactions are serialized per database, so concurrent `enqueue()` calls from different tabs would queue, not interleave.

**Additional fix applied:** The `cursorReq.onerror` handler was empty, silently dropping scores on cursor failure. Fixed:

```typescript
// Before:
cursorReq.onerror = () => { /* cursor eviction is best-effort */ };

// After:
cursorReq.onerror = () => { store.add({ ...score, queuedAt: Date.now() }); };
```

**Verify:** Is `store.add()` safe inside `cursorReq.onerror`? If the store is corrupted, will this also fail?

---

### FIX-002: Score Validation Formula (MEDIUM)

**Your diagnosis:** `safeTick * 15 + 300` allows 9300 at tick 600. Actual max ~8-12 pts/tick.

**Fix applied in `workers/score-validator.ts`:**

```typescript
// Before:
if (data.score > safeTick * 15 + 300) {

// After:
if (data.score > Math.floor(safeTick * 8 * 1.5)) { // 8 pts/tick avg with 50% buffer
```

**Verify:**
1. Is `8 * 1.5 = 12` pts/tick the right cap? What's the actual theoretical maximum?
2. Should the buffer be larger (e.g., 100%) to account for streak bonuses, multipliers, and stage bonuses?

---

### FIX-004: Boss Trigger 2-Player Score (MEDIUM)

**Your diagnosis:** Boss trigger only checks `p1.score`, ignoring P2 in 2-player mode.

**Fix applied in `engine/subsystems/TickProcessor.ts`:**

```typescript
// Before:
if (ctx.p1.score >= ctx.nextBossTriggerScore) this._triggerBossEvent(ctx);

// After:
const effectiveScore = ctx.numPlayers === 2 ? ctx.p1.score + ctx.p2.score : ctx.p1.score;
if (effectiveScore >= ctx.nextBossTriggerScore) this._triggerBossEvent(ctx);
```

**Verify:**
1. Is combined score the right approach, or should it be `max(p1, p2)`?
2. Does `_triggerBossEvent` handle 2-player mode correctly (affects both players)?

---

### FIX-005: Rare Color Warning (LOW)

**Your diagnosis:** Client shows warnings for rare colors even if server never sends them.

**Assessment:** The code already has a `s1 > 0` guard:
```typescript
if (s1 > 0) this.emit({ type: "rareColor", color: s1 });
```

**Status:** Already handled. No fix needed.

---

### Additional Fixes (from Sonnet review)

1. **Boss pause-expiry** — `engine/GameEngine.ts`: Stale bossEvent cleared on `resume()`
2. **useDailyProgress JSON.parse** — `hooks/useDailyProgress.ts`: try-catch added
3. **Bomb defuse lifetime counter** — `engine/GameEngine.ts`: Uses localStorage instead of per-game counter

---

## Items From FIX_PLAN Not Applied

### FIX-003: Session Snapshot Race (MEDIUM)

**Your diagnosis:** `visibilitychange` handler writes snapshot without game engine lock.

**Assessment:** The `visibilitychange` handler calls `this.saveSessionSnapshot()` which reads `this.phase`, `this.p1`, `this.bossEvent` — all synchronous reads. JavaScript is single-threaded, so there's no race between the handler and the game loop. The snapshot is a point-in-time capture, which is the correct behavior.

**Status:** Not a bug. No fix needed.

---

### FIX-006: Boss Handler Race (MEDIUM)

**Your diagnosis:** `start()` detaches boss handler, calls `deactivate()`, re-attaches — but `_triggerBossEvent` could fire between detach and re-attach.

**Assessment:** `start()` is called when the game begins. `_triggerBossEvent` only fires during `processTick()` which only runs when `phase === 'playing'`. Since `start()` sets `phase = 'playing'` AFTER re-attaching the handler, there's no window for `_triggerBossEvent` to fire.

**Status:** Not a bug. No fix needed.

---

### FIX-007: Race Between scoreSync.flush() and IDB.enqueue() (MEDIUM)

**Your diagnosis:** `flush()` and `enqueue()` could interleave in the same transaction.

**Assessment:** `flush()` and `enqueue()` open separate IDB transactions. IDB transactions are serialized — they don't interleave. The worst case is `enqueue()` seeing the pre-flush state, which just means the new score gets flushed in the next cycle. Not a data loss scenario.

**Status:** Not a bug. No fix needed.

---

### FIX-008: Boss Trigger Logic — Wrong Score Variable (MEDIUM)

**Your diagnosis:** Uses `p1.score` instead of `effectiveScore`.

**Assessment:** This is the same as FIX-004. Already fixed.

**Status:** Duplicate of FIX-004.

---

### FIX-009: WebGL Context Loss Handler Missing (LOW)

**Your diagnosis:** No WebGL context loss handler in GridRenderer.ts.

**Assessment:** GridRenderer.ts uses HTML Canvas 2D, not WebGL. WebGL context loss only applies to OGL backgrounds, which already have handlers in each background component (Nebula, Aurora, DigitalRain, etc.).

**Status:** Not applicable. No fix needed.

---

### FIX-010: Race in Event Listener Cleanup (LOW)

**Your diagnosis:** Event listeners detached after `stopListening()` called.

**Assessment:** Same as FIX-006. `processTick()` only runs when `phase === 'playing'`. Cleanup happens in `destroy()` or `start()` which both set phase before cleanup. No race.

**Status:** Not a bug. No fix needed.

---

### FIX-011: Dead Code — Boss Event Types (LOW)

**Your diagnosis:** Storm/blackout definitions are dead code.

**Fix applied:** Added comments marking entries as dead in `engine/subsystems/EventOrchestrator.ts`.

---

### FIX-012: No Server-Side Logging for Validation Failures (LOW/INFO)

**Your diagnosis:** `score-validator.ts` returns 400 but doesn't log.

**Assessment:** Cloudflare Workers automatically log all requests and responses. Adding explicit logging would increase Worker CPU time and cost. The 400 status code is sufficient for monitoring.

**Status:** No fix needed. Cloudflare handles this.

---

## Deliverable

For each fix applied, confirm:
- ✅ Fix is correct and complete
- ⚠️ Fix is correct but incomplete
- ❌ Fix is wrong

For each "not a bug" assessment, confirm:
- ✅ Assessment is correct
- ❌ Assessment is wrong (it IS a bug, explain why)

Also: are there any NEW issues introduced by the fixes?
