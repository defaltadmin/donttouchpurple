# Round 3 Fix Verification — DeepSeek

You reviewed Don't Touch Purple v7.5.3 in Round 3 and found 3 issues. Here's what happened:

---

## Your Finding #1 (HIGH) — scoreSync.flush() delete-then-re-enqueue data loss

**Status: DISMISSED — You reviewed stale code.**

The code you cited:
```typescript
const toDelete = [...succeededIds, ...failedIds, ...permanentIds];
if (toDelete.length > 0) await idb.removeItems(toDelete);
for (const id of failedIds) { await idb.enqueue(...); }
```

This is **NOT the current code**. It was already fixed in Round 2.5 (commit `357a0b9`). The current code in `utils/score-sync.ts`:

```typescript
// Atomic: delete succeeded+permanent, update failed in-place (prevents data loss on page close)
const toRemove = [...succeededIds, ...permanentIds];
const updates = failedIds.map(id => {
  const item = pending.find(p => p.id === id);
  const attempts = (item?.attempts || 0) + 1;
  const backoffMs = Math.min(1000 * Math.pow(2, attempts), 30 * 60 * 1000);
  return { id, patch: { attempts, nextRetry: Date.now() + backoffMs } };
});
await idb.removeAndUpdate(toRemove, updates);
```

And `utils/idb.ts` has the `removeAndUpdate()` method:
```typescript
async removeAndUpdate(removeIds: number[], updates: { id: number; patch: Partial<QueuedScore> }[]): Promise<void> {
  // Single IDB transaction — atomic
  const tx = db.transaction(this.STORE, 'readwrite');
  for (const id of removeIds) store.delete(id);
  for (const { id, patch } of updates) {
    const getReq = store.get(id);
    getReq.onsuccess = () => { if (getReq.result) store.put({ ...getReq.result, ...patch }); };
  }
}
```

**Why this was wrong:** You reviewed the Round 2 code, not the Round 2.5 code. The fix was already applied before your review.

---

## Your Finding #2 (MEDIUM) — slideAnim generation counter missing

**Status: DISMISSED — You reviewed stale code.**

The code you cited:
```typescript
ref.slideAnim[toIdx] = { fromIdx, startMs: Date.now() };
ctx.scheduleTimeout(() => {
  if (ref.slideAnim) { delete ref.slideAnim[toIdx]; }
}, BALANCE.shuffle.slideCleanupMs);
```

This is **NOT the current code**. It was already fixed in Round 2.5 (commit `357a0b9`). The current code in `engine/subsystems/TickProcessor.ts`:

```typescript
if (!ref.slideAnim) ref.slideAnim = {};
const gen = (ref.slideAnim[toIdx]?.gen ?? -1) + 1;
ref.slideAnim[toIdx] = { fromIdx, startMs: Date.now(), gen };

ctx.scheduleTimeout(() => {
  // Only delete if no newer animation was placed at this index
  if (ref.slideAnim?.[toIdx]?.gen === gen) {
    ref.slideAnim = { ...ref.slideAnim }; delete ref.slideAnim[toIdx];
  }
  ctx.dirty = true;
}, BALANCE.shuffle.slideCleanupMs);
```

And `engine/types.ts` has the updated type:
```typescript
slideAnim?: Record<number, { fromIdx: number; startMs: number; gen: number }>;
```

**Why this was wrong:** Same reason — you reviewed Round 2 code, not Round 2.5.

---

## Your Finding #3 (LOW) — Bomb defuse achievement per-game, not cumulative

**Status: FIXED.**

**Your diagnosis:** `_bombDefuseCount` resets to 0 in `start()`. 10 defuses in one game is very hard.

**Fix applied in `engine/GameEngine.ts`:**

```typescript
// Before:
this._bombDefuseCount = (this._bombDefuseCount ?? 0) + 1;
achievementSystem.check('bomb_defuse', () => this._bombDefuseCount >= 10);
achievementSystem.check('bomb_master', () => this._bombDefuseCount >= 50);

// After:
const lifetime = (parseInt(localStorage.getItem('dtp_total_bomb_defuses') ?? '0') || 0) + 1;
try { localStorage.setItem('dtp_total_bomb_defuses', String(lifetime)); } catch {}
achievementSystem.check('bomb_defuse', () => lifetime >= 10);
achievementSystem.check('bomb_master', () => lifetime >= 50);
```

**Verify:**
1. Is `localStorage` the right persistence for lifetime achievement counters?
2. Should the per-game `_bombDefuseCount` field be removed entirely, or kept for other uses?
3. Is `parseInt(...) || 0` safe for handling corrupted localStorage values?

---

## Other Fixes Applied (from Sonnet/Minimax reviews)

1. **Boss pause-expiry** — `engine/GameEngine.ts`: Stale bossEvent cleared on `resume()`
2. **Score validation** — `workers/score-validator.ts`: `*15+300` → `*8*1.5`
3. **2-player boss trigger** — `engine/subsystems/TickProcessor.ts`: Combined p1+p2 score
4. **useDailyProgress JSON.parse** — `hooks/useDailyProgress.ts`: try-catch added
5. **IDB cursor error** — `utils/idb.ts`: Fallback `store.add()` on eviction failure
6. **Dead code annotated** — `engine/subsystems/EventOrchestrator.ts`: storm/blackout marked dead

---

## What We Need From You

1. **Re-review the current code** — Your Round 3 review cited code that was already fixed. Please re-read the actual files before submitting findings.
2. **Verify the bomb defuse fix** — Confirm the localStorage approach is correct.
3. **Check for new issues** — The Round 2.5 fixes + Round 3 fixes may have introduced new patterns worth reviewing.

## Deliverable

- Confirm the bomb defuse fix is correct (or suggest alternatives)
- Report any NEW issues found in the current codebase (not previously reported)
- Confirm which "Confirmed Correct" items from your Round 3 review still hold
