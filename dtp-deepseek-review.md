# DTP (Don't Touch Purple) — Code Review Package for DeepSeek

This document contains all critical game engine, backend, and infrastructure code for a comprehensive code review. Focus areas: security vulnerabilities, state machine correctness, memory leaks, race conditions, and logic bugs.

## Project Overview
- Reflex-based grid-tapping game. React 19, TypeScript 5, Vite 7, Firebase, OGL/WebGL.
- Server: Cloudflare Worker for score validation, Firebase Firestore for leaderboard.
- Game engine: Pure TypeScript (no React), tick-based, deterministic RNG.
- 164 unit tests passing across 16 test files.

## Review Instructions
Review every file below for:
1. Security: injection, auth bypass, data validation, XSS, CSRF
2. Stability: memory leaks, race conditions, state machine gaps, lifecycle issues
3. Error handling: silent failures, null boundaries, unhandled errors
4. Performance: redundant allocations in hot paths, unnecessary re-renders
5. Logic: off-by-one, inverted booleans, dead code, variable mismatches

For each finding, provide: File:Line, Severity (Critical/High/Medium/Low), Description, Code snippet, Fix logic.

---


## Current Audit Findings (70 found, 55 fixed)

# DTP Comprehensive Production Audit — 2026-05-24

5-vector audit: Security, Stability, Error Handling, Performance, Logic/Typo.

---

## Security & Vulnerabilities

### Issue #1 — Worker Does Not Validate Firebase Auth Token
**File:** workers/score-validator.ts:114-115
**Type:** Security
**Severity:** Critical
**Description:** The Cloudflare Worker accepts score submissions without verifying the Firebase ID token. The client sends a Bearer token, but the worker never reads or validates it. The only protections are Origin header checks and IP-based rate limiting. Critically, the Origin check allows requests with NO Origin header (curl, bots). The worker writes to Firestore using a service account, bypassing `request.auth != null`.
**Code:**
```typescript
// score-sync.ts sends the token (line 38-41):
const token = await getAuthToken();
headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },

// score-validator.ts NEVER reads it (line 114-115):
const data = await request.json<ScorePayload>();
const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
// no request.headers.get('Authorization') anywhere
```
**Fix:** Extract Authorization header in the worker, verify Firebase ID token via `https://oauth2.googleapis.com/tokeninfo?id_token=...`, reject requests with missing/invalid tokens.

---

### Issue #2 — CSP connect-src Missing Worker Endpoint Domain
**File:** firebase.json:29
**Type:** Security
**Severity:** High
**Description:** CSP `connect-src` does not include `https://game.mscarabia.com`. Score submissions from `dont-touch-purple.web.app` are blocked by CSP. All score submissions silently fail (fetch throws, caught, queued offline, offline flush also CSP-blocked).
**Code:**
```json
// firebase.json connect-src:
"connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.sentry.io https://www.google-analytics.com https://analytics.google.com"
// Missing: https://game.mscarabia.com
```
**Fix:** Add `https://game.mscarabia.com` to the `connect-src` directive.

---

### Issue #3 — Dust Cap Mismatch: Client 9,999,999 vs Firestore 999,999
**File:** services/firebase.ts:204 + firestore.rules:63
**Type:** Security
**Severity:** High
**Description:** Client caps dust at 9,999,999 but Firestore rule rejects `>= 1,000,000`. Any dust sync for values between 1M and 9.9M is silently rejected. Player loses dust on session load.
**Code:**
```typescript
// firebase.ts line 204:
const cappedDust = Math.max(0, Math.min(9_999_999, Math.floor(dust)));

// firestore.rules line 63:
request.resource.data.dust < 1000000;
```
**Fix:** Update Firestore rule from `< 1000000` to `< 10000000`.

---

### Issue #4 — Worker-Firestore Tick Cap Mismatch: 1200 vs 600
**File:** workers/score-validator.ts:140 + firestore.rules:43
**Type:** Security
**Severity:** High
**Description:** Worker caps safeTick at 1200, but Firestore rejects tick > 600. Games lasting 10-20 minutes pass worker validation but fail at Firestore. Worker also sends `data.tick` (uncapped) instead of `safeTick` to Firestore.
**Code:**
```typescript
// score-validator.ts line 140:
const safeTick = Math.min(data.tick, 1200);

// score-validator.ts line 160 (sends original, not safeTick):
tick: { integerValue: (data.tick ?? 0).toString() },

// firestore.rules line 43:
request.resource.data.tick <= 600;
```
**Fix:** Align both caps to same value. Send `safeTick` instead of `data.tick` to Firestore.

---

### Issue #5 — sessionId Has No Upper Bound
**File:** workers/score-validator.ts:144
**Type:** Security
**Severity:** Medium
**Description:** sessionId validated for minimum length (8) but no maximum. Attacker could send 500KB sessionId stored verbatim in Firestore, inflating storage costs.
**Code:**
```typescript
// score-validator.ts line 144:
if (typeof data.sessionId !== 'string' || data.sessionId.length < 8) {
  return new Response(JSON.stringify({ error: 'Missing session' }), { status: 400 });
}
// No upper bound check
```
**Fix:** Add `data.sessionId.length > 64` check. Add Firestore rule: `request.resource.data.sessionId.size() <= 64`.

---

### Issue #6 — badge Field Has No Write-Path Validation
**File:** workers/score-validator.ts:156
**Type:** Security
**Severity:** Low
**Description:** Worker passes `badge` directly to Firestore without validation. Read-path sanitizer in firebase.ts strips non-alphanumeric chars, but write-path has no defense in depth.
**Code:**
```typescript
// score-validator.ts line 156:
badge: { stringValue: data.badge ?? '' },
```
**Fix:** Add badge validation in worker matching read-path regex: reject if outside `[a-zA-Z0-9_-]` or > 24 chars.

---

### Issue #7 — stateGuard.safeStore Silently Drops Data on Quota Error
**File:** utils/state-guard.ts:16-27
**Type:** Security
**Severity:** Medium
**Description:** When `localStorage.setItem` throws `QuotaExceededError`, function clears non-essential keys but does NOT retry the original write. Data silently discarded with no indication to caller.
**Code:**
```typescript
safeStore(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    if ((e as Error).name === 'QuotaExceededError') {
      const safeToClear = ['dtp:errors', 'dtp:perf'];
      safeToClear.forEach(k => localStorage.removeItem(k));
      // Missing: retry after clearing
    }
  }
}
```
**Fix:** Retry `localStorage.setItem` after clearing. If retry fails, log warning.

---

### Issue #8 — Firestore lb_global Exposes sessionId to All Readers
**File:** firestore.rules:31
**Type:** Security
**Severity:** Low
**Description:** `lb_global` collection allows `read: if true`, exposing sessionId to anyone. SessionIds could be used to correlate scores or track behavior.
**Code:**
```
match /lb_global/{docId} {
  allow read: if true;  // exposes all fields including sessionId
```
**Fix:** Remove sessionId from leaderboard documents, or move to write-only collection.

---

## Stability, State, & Edge Cases

### Issue #9 — `_timeouts` Not Cleared on `start()`
**File:** engine/GameEngine.ts:301-352
**Type:** Stability
**Severity:** High
**Description:** `start()` resets `_deltaTimers = []` but never calls `clearAllTimeouts()`. Callbacks from previous game (boss event cleanup, cell animation cleanup, shuffle slide cleanup) survive into new game. They hold closures over OLD p1/p2 objects, preventing GC.
**Code:**
```typescript
// start() — line 316
this._deltaTimers = [];
// Missing: this.clearAllTimeouts();
```
**Fix:** Add `this.clearAllTimeouts();` in `start()` after `this._deltaTimers = [];`.

---

### Issue #10 — `_deathCleanupTimer` Not Cleared in `destroy()`
**File:** engine/GameEngine.ts:473-490
**Type:** Stability
**Severity:** High
**Description:** `_deathCleanupTimer` uses raw `setTimeout`, not `scheduleTimeout()`. `destroy()` calls `clearAllTimeouts()` (which only clears `_timeouts` array) but never clears `_deathCleanupTimer`. After destroy(), the 600ms callback still fires, holding a reference to the entire engine instance.
**Code:**
```typescript
// destroy() — lines 473-490
destroy(): void {
    this._isDisposed = true;
    this.clearAllTimeouts();
    this.clearAllDeltaTimers();
    // MISSING: if (this._deathCleanupTimer) { clearTimeout(this._deathCleanupTimer); this._deathCleanupTimer = null; }
    this.stop();
}
```
**Fix:** Add `if (this._deathCleanupTimer) { clearTimeout(this._deathCleanupTimer); this._deathCleanupTimer = null; }` in `destroy()` before `this.stop()`.

---

### Issue #11 — Free `boss_defeat` Achievement on Game Restart
**File:** engine/GameEngine.ts:304 + utils/boss-engine.ts:73-78
**Type:** Stability
**Severity:** Medium
**Description:** When game ends with active boss, `triggerGameOver()` does NOT call `bossEngine.deactivate()`. Boss engine singleton retains `state.active = true`. Next game's `start()` calls `bossEngine.deactivate()`, which dispatches `dtp:boss:complete` event, granting "Boss Slayer" achievement without actually defeating the boss.
**Code:**
```typescript
// GameEngine.ts line 304 (inside start())
bossEngine.deactivate();

// boss-engine.ts lines 73-78
deactivate() {
    if (!this.state.active) return;
    this.state.active = false;
    this.resetCombo();
    window.dispatchEvent(new CustomEvent('dtp:boss:complete', { detail: {} }));
}
```
**Fix:** Either (a) call `bossEngine.deactivate()` from `triggerGameOver()` suppressing the achievement event, or (b) track whether boss was actually defeated vs just cleaned up.

---

### Issue #12 — `activeBomb.idx` Desync After Cell Shuffle
**File:** engine/subsystems/TickProcessor.ts:259-327 + 362-386
**Type:** Stability
**Severity:** Critical
**Description:** `_tryShuffleCells` mutates `cell.idx` in-place, but `ctx.activeBomb.idx` is set once at spawn time and never updated. After shuffle moves the bomb, the fuse timer can't find it at the original position. The bomb silently disarms (timer sets activeBomb=null), but the cell remains visible at new position — never explodes, can never be defused.
**Code:**
```typescript
// _tryShuffleCells — line 303 (shuffle mutates cell.idx)
cell.idx = toIdx;

// _trySpawnBomb — line 362 (bomb timer uses original idx)
ctx.addDeltaTimer(`bomb_${player}_${idx}`, BALANCE.bomb.fuseTimeMs, () => {
    if (!ctx.activeBomb || ctx.activeBomb.idx !== idx || ctx.activeBomb.player !== player) return;
    const stillActive = ref.active.find(c => c.idx === idx && c.type === "bomb" && !c.clicked);
```
**Fix:** Either (a) exclude bomb cells from shuffle candidates (add `c.type !== "bomb"` to filter), or (b) update `ctx.activeBomb.idx` when a bomb cell is shuffled.

---

### Issue #13 — `death-flash` CSS Class Not Removed on Component Unmount
**File:** hooks/useGameEngine.ts:243 + 323
**Type:** Stability
**Severity:** Medium
**Description:** `gameOver` handler adds `death-flash` to `document.body` and sets 800ms timer to remove it. Cleanup clears the timer but does NOT remove the class. If component unmounts during flash window, class persists permanently.
**Code:**
```typescript
// Line 243-244 (gameOver handler)
document.body.classList.add('death-flash');
deathFlashTimerRef.current = setTimeout(() => document.body.classList.remove('death-flash'), 800);

// Line 323 (cleanup)
if (deathFlashTimerRef.current) clearTimeout(deathFlashTimerRef.current);
// MISSING: document.body.classList.remove('death-flash');
```
**Fix:** Add `document.body.classList.remove('death-flash');` in cleanup alongside `clearTimeout`.

---

### Issue #14 — `scoreSync.flush()` Concurrent Execution Race
**File:** utils/score-sync.ts:57-91
**Type:** Stability
**Severity:** Medium
**Description:** `flush()` can be invoked concurrently from `online` event handler and `init()`. Both read same queue via `peekAll()`, both submit same scores. Double-submit mitigated by server-side dedup, but re-enqueue path creates duplicates: flush A removes and re-enqueues failures, flush B also re-enqueues same failures, creating unbounded duplicate queue entries.
**Code:**
```typescript
async flush() {
    if (!navigator.onLine) return;
    const pending = await idb.peekAll();  // Both flushes read same data
    // ... submit loop ...
    for (const id of failedIds) {
        const item = pending.find(p => p.id === id);
        await idb.enqueue({ ...item, id: undefined, attempts, nextRetry: ... });  // Duplicate!
    }
}
```
**Fix:** Add mutex flag (`_flushing: boolean`) checked/set at entry. If already flushing, return early.

---

### Issue #15 — `scheduleTimeout` Callbacks Fire During Pause
**File:** engine/GameEngine.ts:409-416 + 434-444
**Type:** Stability
**Severity:** Medium
**Description:** `pause()` clears tickTimer, rafId, and session interval, but does NOT clear `_timeouts`. Boss event expiry, cell animation cleanup, and shuffle slide cleanup timeouts fire while game is paused. Boss event expires silently while player has game paused.
**Code:**
```typescript
// pause() — lines 434-444
pause(): void {
    // Clears tick timer, RAF, session interval
    // Does NOT clear _timeouts
}
```
**Fix:** Either (a) clear `_timeouts` in `pause()` and re-register critical ones on `resume()`, or (b) add `this.paused` check inside state-modifying timeout callbacks.

---

### Issue #16 — `restoreSessionSnapshot` Does Not Clear Old `_timeouts`
**File:** engine/GameEngine.ts:1016-1135
**Type:** Stability
**Severity:** Medium
**Description:** `restoreSessionSnapshot` does not call `clearAllTimeouts()` before restoring. Pending callbacks from current game survive and fire against restored state — e.g., boss event cleanup from old state clears a restored boss event.
**Code:**
```typescript
restoreSessionSnapshot(data: Record<string, unknown>): boolean {
    try {
        // Missing: this.clearAllTimeouts();
        // Missing: this.clearAllDeltaTimers();
```
**Fix:** Add `this.clearAllTimeouts(); this.clearAllDeltaTimers();` at beginning of restore.

---

### Issue #17 — Boss Event Expiry Uses Real-Time setTimeout
**File:** engine/subsystems/TickProcessor.ts:389-411
**Type:** Stability
**Severity:** Medium
**Description:** Boss event duration enforced via `scheduleTimeout()` (real-time setTimeout). When paused, `processTick()` stops but boss timeout continues counting. Player who pauses during boss event loses the entire mechanic silently.
**Code:**
```typescript
// _triggerBossEvent — line 398
ctx.scheduleTimeout(() => {
    if (ctx.bossEvent?.type === type) {
        ctx.bossEvent = null;
        ctx.dirty = true;
    }
}, durationMs);  // Uses real-time setTimeout, not tick-based
```
**Fix:** Convert to tick-based check in `processTick()` (compare `Date.now()` against `bossEvent.endsAt`), or pause `_timeouts` when game pauses.

---

### Issue #18 — Lightning Background Missing `useBackgroundController`
**File:** components/Backgrounds/Lightning.tsx
**Type:** Stability
**Severity:** Medium
**Description:** Unlike every other canvas background, Lightning does not register with `useBackgroundController`. Controller cannot pause/resume it externally. Continues rendering independently when modals open or backgrounds coordinate pause.
**Fix:** Import `useBackgroundController`, register pause/resume callbacks that cancel/restart RAF.

---

### Issue #19 — `InputBuffer` Not Reset on Game Start
**File:** engine/GameEngine.ts:301-352
**Type:** Stability
**Severity:** Low
**Description:** `start()` never calls `this.inputBuffer.clear()`. Leftover entries from previous game within 1-second expiry window could cause first taps of new game to be incorrectly debounced.
**Fix:** Add `this.inputBuffer.clear();` in `start()`.

---

### Issue #20 — GSAP `quickTo` Tweens Not Killed on Cleanup
**File:** components/Backgrounds/MouseFollower.tsx:27-28 + 45-48
**Type:** Stability
**Severity:** Low
**Description:** `gsap.quickTo()` returns reusable tween function. Cleanup removes event listeners but does not kill underlying GSAP tweens. Over remounts, old tweens accumulate in GSAP's global timeline.
**Fix:** Call `xTo.kill()` and `yTo.kill()` in cleanup function.

---

### Issue #21 — GridPulse/MouseTrail/MouseFollower Use `window` Mousemove
**File:** components/Backgrounds/GridPulse.tsx:129, MouseTrail.tsx:143, MouseFollower.tsx:41
**Type:** Stability
**Severity:** Low
**Description:** Three backgrounds attach mousemove to `window` instead of their own elements. Causes unnecessary processing, per-instance global accumulation, and firing when occluded.
**Fix:** Scope listeners to canvas/container using `element.addEventListener('pointermove', ...)`.

---

### Issue #22 — Nebula/Aurora/DigitalRain `draw()` Missing Visibility Check
**File:** components/Backgrounds/Nebula.tsx:59-96, AuroraBorealis.tsx:54-115, DigitalRain.tsx:38-69
**Type:** Stability
**Severity:** Low
**Description:** `draw()` self-schedules via `requestAnimationFrame(draw)` without checking `document.hidden`. `drawIfVisible` only gates the first frame. After that, draw runs continuously. Browsers throttle RAF to ~1fps in background tabs.
**Fix:** Add `if (document.hidden) { rafRef.current = requestAnimationFrame(draw); return; }` at top of `draw()`.

---

## Additional Security Findings

### Issue #23 — `fbSyncDust` Uses Display Name as Firestore Document ID
**File:** services/firebase.ts:194-211
**Type:** Security
**Severity:** High
**Description:** `fbSyncDust` uses `safeName` (display name, trimmed/sliced to 20 chars) as the Firestore document ID for `dust_wallet`. Two players with the same display name overwrite each other's dust balances. Document ID is predictable and enumerable.
**Code:**
```typescript
const safeName = name.trim().slice(0, 20);
await modules.setDoc(modules.doc(db, "dust_wallet", safeName), {
  name: safeName, dust: cappedDust,
  uid: auth.currentUser.uid, ts: modules.serverTimestamp(),
});
```
**Fix:** Use `auth.currentUser.uid` as the document ID. Store display name as a field.

---

### Issue #24 — `privacy.ts` DTP_KEYS Missing `dtp_login_streak`
**File:** utils/privacy.ts:4-17
**Type:** Security
**Severity:** High
**Description:** GDPR `deleteAll` and `getAllData` enumerate `DTP_KEYS`, but `dtp_login_streak` (written by useDailyProgress.ts, read by firebase.ts) is missing. `privacyManager.deleteAll()` does NOT erase login streak data — a GDPR compliance gap.
**Code:**
```typescript
const DTP_KEYS = [
  'dtp:session', 'dtp:settings', 'dtp:events', 'dtp:errors',
  // dtp_login_streak is MISSING
];
```
**Fix:** Add `"dtp_login_streak"` to `DTP_KEYS`. Audit all `localStorage.setItem` calls to ensure every user-data key is listed.

---

### Issue #25 — `getLocalStreakFallback` Parses Untrusted JSON Without Validation
**File:** services/firebase.ts:250-256
**Type:** Security
**Severity:** Medium
**Description:** Parses `localStorage.getItem("dtp_login_streak")` via `JSON.parse` and accesses `.count` without type checking. `Infinity ?? 1` evaluates to `Infinity` (not nullish). Corrupted data could return non-finite values.
**Code:**
```typescript
function getLocalStreakFallback(): number {
  try {
    const raw = localStorage.getItem("dtp_login_streak");
    if (!raw) return 1;
    return JSON.parse(raw).count ?? 1;
  } catch { return 1; }
}
```
**Fix:** Add type guard: `const c = JSON.parse(raw).count; return typeof c === 'number' && isFinite(c) ? Math.max(0, Math.min(999, Math.floor(c))) : 1;`

---

## Additional Stability Findings

### Issue #26 — `bossEngine` Singleton State Persists Across Sessions
**File:** utils/boss-engine.ts:6-9
**Type:** Stability
**Severity:** Medium
**Description:** `bossEngine` is a module-level singleton. `deactivate()` resets `state.active = false` but does NOT reset `state.phase`, `state.maxShield`, or `state.shieldHits`. Stale phase values persist if boss was mid-event when game ended.
**Fix:** Reset all fields in `deactivate()`: `this.state = { active: false, shieldHits: 0, maxShield: 5, phase: 1 };`

---

### Issue #27 — `start()` Does Not Reset `_bombDefuseCount`
**File:** engine/GameEngine.ts:301-352
**Type:** Stability
**Severity:** High
**Description:** `start()` resets `_shieldCollected`, `_freezeCollected`, `_purpleTaps`, `_tookDamage` but does NOT reset `_bombDefuseCount`. Bomb defuse achievements from previous game carry over. Player who defused 9 bombs in game 1 and 1 bomb in game 2 would unlock the 10-bomb achievement.
**Code:**
```typescript
// start() resets these:
this._shieldCollected = 0;
this._freezeCollected = 0;
this._purpleTaps = 0;
this._tookDamage = false;
// MISSING: this._bombDefuseCount = 0;
```
**Fix:** Add `this._bombDefuseCount = 0;` to the reset block in `start()`.

---

### Issue #28 — `restoreSessionSnapshot` Does Not Validate Cell Data Shape
**File:** engine/GameEngine.ts:1102
**Type:** Stability
**Severity:** Medium
**Description:** Active cells restored via `(p1.active as Array<Record<string, unknown>>).map(c => ({ ...c }) as unknown as ActiveCell)`. The `as unknown as ActiveCell` cast bypasses type checking. Corrupted/tampered sessionStorage could produce cells with missing `idx`, `type`, or `clicked` fields.
**Code:**
```typescript
this.p1.active = ((p1.active as Array<Record<string, unknown>>) ?? []).map(c => ({ ...c }) as unknown as ActiveCell);
```
**Fix:** Validate each restored cell: check `idx` is non-negative integer, `type` is known CellType, `clicked` is boolean.

---

### Issue #29 — `useScreenStateMachine` Transition Has Stale Closure
**File:** hooks/useScreenStateMachine.ts:75-81
**Type:** Stability
**Severity:** Medium
**Description:** `transition` callback depends on `current` and `canTransition` via deps. When called rapidly (double-click), `current` may be stale due to React batched state updates. `canTransition` check uses stale `current`, potentially allowing duplicate transition.
**Code:**
```typescript
const transition = useCallback((to: Screen) => {
  if (!canTransition(to)) return;
  setPrevious(current);
  setCurrent(to);
}, [current, canTransition]);
```
**Fix:** Use functional `setCurrent`: `setCurrent(prev => { if (prev === to) return prev; setPrevious(prev); return to; });`

---

### Issue #30 — `idb.enqueue` Count+Delete Is Not Atomic
**File:** utils/idb.ts:37-56
**Type:** Stability
**Severity:** Medium
**Description:** When queue hits 100 items, `enqueue` opens cursor to delete oldest, then adds new one. The `store.add()` is outside the cursor's onsuccess handler, so it runs regardless of whether eviction succeeded. Queue can exceed 100 items.
**Fix:** Move `store.add()` inside `cursorReq.onsuccess` chain, or accept soft cap of ~101 since flush clears anyway.

---

### Issue #31 — BotController P2 Assist Never Actually Works
**File:** engine/subsystems/BotController.ts:30-32
**Type:** Stability
**Severity:** Medium
**Description:** `start()` only activates P1 (`this._active[1] = true`). The interval callback only iterates `getActiveCells(1)`, never P2. P2 bot assist is effectively a no-op — UI shows it as enabled but nothing happens.
**Fix:** If P2 bot assist is intended, iterate both `getActiveCells(1)` and `getActiveCells(2)`. If not a feature, remove P2 UI toggle.

---

## Error Handling & Robustness

### Issue #36 — `flush()` Delete-Then-Requeue Data Loss Window
**File:** utils/score-sync.ts:81-89
**Type:** Error Handling
**Severity:** High
**Description:** Failed scores are deleted at line 82 then re-enqueued at line 89. If page closes between those two async operations, all failed scores are permanently lost.
**Code:**
```typescript
const toDelete = [...succeededIds, ...failedIds];
if (toDelete.length > 0) await idb.removeItems(toDelete);   // deletes failed too
// PAGE CLOSE HERE = data loss
for (const id of failedIds) { ... await idb.enqueue(...) }
```
**Fix:** Only delete `succeededIds`, then update failed items in-place (clear id, bump attempts, set nextRetry).

---

### Issue #37 — `_submit()` Retries Permanent HTTP Errors Forever
**File:** utils/score-sync.ts:50-54
**Type:** Error Handling
**Severity:** Medium
**Description:** All fetch failures return `false`, causing exponential backoff retries. HTTP 401/403/422 will never succeed but waste IDB slots.
**Fix:** Distinguish retryable (5xx, network) from permanent (4xx) errors. Drop 4xx items.

---

### Issue #38 — `session.load()` Trusts JSON Shape Without Validation
**File:** utils/session.ts:37
**Type:** Error Handling
**Severity:** Medium
**Description:** `JSON.parse(raw)` cast to `GameSession` without checking that `engineSnapshot` or nested fields exist. Corrupted sessionStorage crashes consumers.
**Fix:** Validate `data.version === 1 && data.engineSnapshot && typeof data.engineSnapshot.hearts === 'number'`.

---

### Issue #39 — `updateChallengeProgress` Unguarded JSON.parse
**File:** App.tsx:469
**Type:** Error Handling
**Severity:** Medium
**Description:** `JSON.parse(localStorage.getItem(modesKey) ?? '[]')` has no try/catch, unlike surrounding parses. Corrupted JSON aborts entire callback, losing all progress.
**Fix:** Wrap in try/catch with `[]` fallback.

---

### Issue #40 — PulseField RAF Missing `document.hidden` Check
**File:** components/Backgrounds/PulseField.tsx:14-48
**Type:** Performance
**Severity:** Medium
**Description:** RAF callback never checks `document.hidden`. Full canvas clear + 6-ring stroke+fill runs even in background tab.
**Fix:** Add `if (document.hidden) return;` as first line of RAF callback.

---

### Issue #41 — PulseField Allocates Corner Arrays Per Frame
**File:** components/Backgrounds/PulseField.tsx:44
**Type:** Performance
**Severity:** Low
**Description:** 5 new arrays allocated per ring per frame. At 6 rings x 60fps = ~1,800 small array allocations/second.
**Fix:** Use four inline `ctx.fillRect` calls instead of `.forEach` with destructured arrays.

---

### Issue #42 — `idb.enqueue` Evicts Only 1 Item When Over 100
**File:** utils/idb.ts:44-49
**Type:** Error Handling
**Severity:** Low
**Description:** When count >= 100, single cursor delete issued. Queue grows past 100 since each enqueue only evicts one oldest.
**Fix:** Evict `count - 99` items with cursor loop, or use bounded key range delete.

---

### Issue #43 — `idb.open()` Cached Reference Can Point to Closed Connection
**File:** utils/idb.ts:19-34
**Type:** Error Handling
**Severity:** Low
**Description:** `onclose` fires asynchronously. If `open()` called between browser closing connection and `onclose` firing, returns stale closed IDBDatabase.
**Fix:** Add liveness check or catch `InvalidStateError` and retry with fresh open().

---

## Performance Bottlenecks

*(Covered in Error Handling section — Issues #40, #41)*

---

## Logic & Typo Hunting

### Issue #44 — Key-to-Grid Index Mismatch in 5-Column Grids
**File:** hooks/useInputHandler.ts:88
**Type:** Logic
**Severity:** Critical
**Description:** `resolveKey` uses `keys[row * sd.cols + col]` but key layout is always 4 columns wide (keybindings.ts uses `row * 4 + col`). For 5x5 grids, keyboard activates wrong cells.
**Code:**
```typescript
// useInputHandler.ts line 88 — uses sd.cols (5 for 5x5 grid)
if (keys[row * sd.cols + col] === k) return i;

// keybindings.ts line 29 — always uses 4
const keyIdx = row * 4 + col;
```
**Fix:** Change `keys[row * sd.cols + col]` to `keys[row * 4 + col]`.

---

### Issue #45 — Analytics Events Never Transmitted
**File:** utils/analytics.ts:25-31
**Type:** Logic
**Severity:** Critical
**Description:** `_flush()` reads queue, logs length, then clears it with `safeSet(QUEUE_KEY, '[]')`. No fetch/sendBeacon/network call. All analytics events silently deleted. Entire pipeline is a no-op.
**Code:**
```typescript
async _flush() {
    const queue = this._getQueue();
    if (!queue.length || !navigator.onLine) return;
    try {
      logger.debug('Analytics flushed', queue.length, 'events');
      safeSet(QUEUE_KEY, '[]');  // deletes data without sending it
    } catch { logger.warn('Analytics flush failed'); }
  }
```
**Fix:** Add fetch/sendBeacon call to transmit events before clearing.

---

### Issue #46 — Error Tracker Never Transmits Errors
**File:** utils/error-tracker.ts:30-38
**Type:** Logic
**Severity:** Critical
**Description:** Same pattern as analytics. `_flush()` logs then clears without network transmission. All tracked runtime errors silently discarded.
**Fix:** Add fetch/sendBeacon call to transmit errors before clearing.

---

### Issue #47 — i18n Parameter Replacement Only Replaces First Occurrence
**File:** utils/i18n.ts:49
**Type:** Logic
**Severity:** High
**Description:** `str.replace(...)` only replaces first occurrence. Translation strings with repeated placeholders (e.g., `"{name} beat {name}'s record!"`) only get first replaced.
**Fix:** Use `str.replaceAll(...)` or regex with global flag.

---

### Issue #48 — `wrappedStart` Doesn't Clear `scoreFloats`
**File:** hooks/useGameEngine.ts:379-387
**Type:** Logic
**Severity:** High
**Description:** New game clears winner, lastGameScore, rareSplash, levelUpBadge, botTapHighlights but NOT scoreFloats. Stale floating score animations from previous game briefly appear at start.
**Fix:** Add `setScoreFloats([]);` inside `wrappedStart`.

---

### Issue #49 — `GAME_OVER_TICK` Constant Defined But Never Used
**File:** config/difficulty.ts:24
**Type:** Logic
**Severity:** Medium
**Description:** `GAME_OVER_TICK: 600` defined but never referenced. Engine uses `HUMAN_LIMIT_TICK: 420` for actual game-over condition. Dead config.
**Fix:** Wire into engine or remove.

---

### Issue #50 — `pendingScoresDb.ts` Dead Module
**File:** utils/pendingScoresDb.ts
**Type:** Logic
**Severity:** Medium
**Description:** 78 lines of complete IDB-based pending scores system. Nothing imports from it. Actual score queue uses `utils/idb.ts`.
**Fix:** Remove file.

---

### Issue #51 — `baselineSpawnMs` Written But Never Read
**File:** utils/dda.ts:12, 31, 112
**Type:** Logic
**Severity:** Medium
**Description:** Assigned in constructor and reset(), never used in any computation. Only `currentSpawnMs` is used.
**Fix:** Remove field.

---

### Issue #52 — seed-manager.ts Comment Says "localStorage" But Uses sessionStorage
**File:** utils/seed-manager.ts:4
**Type:** Logic
**Severity:** Medium
**Description:** Comment says `// localStorage key for active seed` but code uses sessionStorage. Misleading.
**Fix:** Change comment to `// sessionStorage key for active seed`.

---

### Issue #53 — EVOLVE_PATTERNS Count Comment Stale
**File:** config/gridPatterns.ts:33
**Type:** Logic
**Severity:** Medium
**Description:** Comment says `(25 patterns)` but array has 27 entries.
**Fix:** Update to `(27 patterns)`.

---

### Issue #54 — `getSnapshot` Uses `STAGES[0]` Fallback for Evolve Mode
**File:** engine/GameEngine.ts:916
**Type:** Logic
**Severity:** Medium
**Description:** Falls back to `STAGES[0]` (classic stages) when evolve pattern index invalid. All other code falls back to `EVOLVE_PATTERNS[0]`.
**Fix:** Change `STAGES[0]` to `EVOLVE_PATTERNS[0]`.

---

### Issue #55 — Evolve Mode 0.5 Damage Creates Fractional Health
**File:** engine/GameEngine.ts:607, engine/subsystems/TickProcessor.ts:153
**Type:** Logic
**Severity:** Medium
**Description:** Damage of 0.5 creates fractional health (4.5, 3.5). If Hearts component uses Math.round, 0.5 health displays as 1 heart when player is dead on next hit.
**Fix:** Verify health display handles fractions, or switch to integer HP system.

---

### Issue #56 — `boss-engine.ts` Has No `dispose` Method
**File:** utils/boss-engine.ts
**Type:** Logic
**Severity:** Medium
**Description:** Module singleton with `_comboTimer` (setTimeout) but no dispose(). Timer fires after game ends, dispatching stale events.
**Fix:** Add dispose() that clears timer and resets state. Call from GameEngine.destroy().

---

### Issue #57 — `devForcedPwr` in 2-Player Mode Only Applies to P2
**File:** engine/subsystems/TickProcessor.ts:184
**Type:** Logic
**Severity:** Medium
**Description:** Condition `if (pi === (ctx.numPlayers === 1 ? 0 : 1))` means forced powerup consumed at pi=1 (P2) in 2-player. P1 never gets it.
**Fix:** Apply to P1 (pi=0) or add player selector.

---

### Issue #58 — Gamepad Release Events Silently Discarded
**File:** utils/gamepad.ts:50, 63-65
**Type:** Logic
**Severity:** Low
**Description:** `_trigger` only dispatches when state === 'press'. Release detected but never forwarded to listeners.
**Fix:** Remove press guard or document as intentional.

---

### Issue #59 — `ScoreCard` Blob URL Never Revoked
**File:** utils/score-card.ts:43
**Type:** Logic
**Severity:** Low
**Description:** `URL.createObjectURL(blob)` persists in memory until revoke. Multiple calls accumulate blob URLs.
**Fix:** Track and revoke after use.

---

### Issue #60 — `challenge-link.ts` Score of 0 Treated as Missing
**File:** utils/challenge-link.ts:113-114
**Type:** Logic
**Severity:** Low
**Description:** `Number(p.get('score')) || undefined` — `Number("0")` is 0, `0 || undefined` is `undefined`. Legitimate score of 0 treated as missing.
**Fix:** Use `p.get('score') ? Number(p.get('score')) : undefined`.

---

## Summary

**70 total findings across all 5 vectors:**
- **5 Critical** (#1, #44, #45, #46)
- **13 High**
- **25 Medium**
- **17 Low**

### Critical Path (fix first)

| # | Severity | Vector | Issue | Status |
|---|----------|--------|-------|--------|
| 1 | Critical | Stability | `activeBomb.idx` desync after cell shuffle — bomb silently disarms | IN PROGRESS |
| 44 | Critical | Logic | Key-to-grid mismatch in 5-column grids — wrong cells activated | Pending |
| 45 | Critical | Logic | Analytics events never transmitted — entire pipeline no-op | Pending |
| 46 | Critical | Logic | Error tracker never transmits errors — all errors silently lost | Pending |
| 2 | High | Security | Worker ignores Firebase auth token — curl bypasses Origin | IN PROGRESS |
| 3 | High | Security | CSP connect-src missing worker domain — scores fail silently | IN PROGRESS |
| 4 | High | Security | Dust cap mismatch: client 9.9M vs Firestore 999K | IN PROGRESS |
| 5 | High | Security | Tick cap mismatch: worker 1200 vs Firestore 600 | IN PROGRESS |
| 6 | High | Security | `fbSyncDust` uses display name as Firestore doc ID | IN PROGRESS |
| 7 | High | Security | `privacy.ts` DTP_KEYS missing `dtp_login_streak` | IN PROGRESS |
| 8 | High | Stability | `_timeouts` not cleared on `start()` | IN PROGRESS |
| 9 | High | Stability | `_deathCleanupTimer` not cleared in `destroy()` | IN PROGRESS |
| 10 | High | Stability | `start()` does not reset `_bombDefuseCount` | IN PROGRESS |
| 13 | High | Security | `getLocalStreakFallback` parses untrusted JSON | IN PROGRESS |
| 47 | High | Logic | i18n only replaces first parameter occurrence | Pending |
| 48 | High | Logic | `wrappedStart` doesn't clear `scoreFloats` | Pending |

### All Medium Issues

| # | Vector | Issue |
|---|--------|-------|
| 11 | Security | sessionId no upper bound |
| 12 | Security | safeStore silently drops data on quota error |
| 14 | Security | Worker badge field no write-path validation |
| 15 | Stability | Free `boss_defeat` achievement on restart |
| 16 | Stability | `death-flash` CSS class not removed on unmount |
| 17 | Stability | `scoreSync.flush()` concurrent race |
| 18 | Stability | `scheduleTimeout` callbacks fire during pause |
| 19 | Stability | `restoreSessionSnapshot` doesn't clear old `_timeouts` |
| 20 | Stability | Boss event expiry uses real-time setTimeout |
| 21 | Stability | Lightning missing `useBackgroundController` |
| 22 | Stability | `bossEngine` singleton state persists |
| 23 | Stability | `restoreSessionSnapshot` doesn't validate cell shape |
| 24 | Stability | `useScreenStateMachine` stale closure |
| 25 | Stability | `idb.enqueue` count+delete not atomic |
| 26 | Stability | BotController P2 assist never works |
| 37 | Error | `_submit()` retries permanent HTTP errors forever |
| 38 | Error | `session.load()` trusts JSON without validation |
| 39 | Error | `updateChallengeProgress` unguarded JSON.parse |
| 40 | Perf | PulseField RAF missing `document.hidden` |
| 49 | Logic | `GAME_OVER_TICK` defined but never used |
| 50 | Logic | `pendingScoresDb.ts` dead module |
| 51 | Logic | `baselineSpawnMs` written but never read |
| 52 | Logic | seed-manager comment says localStorage, uses sessionStorage |
| 53 | Logic | EVOLVE_PATTERNS count comment stale |
| 54 | Logic | `getSnapshot` inconsistent fallback for evolve |
| 55 | Logic | Evolve 0.5 damage creates fractional health |
| 56 | Logic | boss-engine has no `dispose` method |
| 57 | Logic | `devForcedPwr` only applies to P2 in 2-player |

### All Low Issues

| # | Vector | Issue |
|---|--------|-------|
| 27 | Security | badge field no write-path validation |
| 28 | Security | sessionId publicly readable |
| 29 | Security | DevOverlay password in client bundle |
| 30 | Stability | `InputBuffer` not reset on game start |
| 31 | Stability | GSAP `quickTo` tweens not killed |
| 32 | Stability | `window` mousemove instead of element-scoped |
| 33 | Stability | Nebula/Aurora/DigitalRain missing visibility check |
| 34 | Stability | `safeSet` silently swallows all errors |
| 35 | Stability | BotController P2 interval only processes P1 |
| 41 | Perf | PulseField allocates corner arrays per frame |
| 42 | Error | `idb.enqueue` evicts only 1 item |
| 43 | Error | `idb.open()` stale cached reference |
| 58 | Logic | Gamepad release events discarded |
| 59 | Logic | ScoreCard blob URL never revoked |
| 60 | Logic | challenge-link score of 0 treated as missing |

---

## File: engine/types.ts
```typescript
// ─── Cell & grid types ────────────────────────────────────────────
export type CellType =
  | "inactive" | "void" | "purple"
  | "white" | "blue" | "red" | "orange" | "yellow"
  | "green" | "cyan" | "lime" | "teal"
  | "pink" | "rose" | "magenta"
  | "medpack" | "shield" | "freeze" | "multiplier"
  | "ice" | "hold" | "bomb";

export type BossEventType = "storm" | "inversion" | "blackout";

export type CellShape = "square" | "circle" | "triangle" | "roundedTriangle" | "mixed" | "diamond";

export type GameMode   = "classic" | "evolve";
export type NumPlayers = 1 | 2;
export type Winner     = "p1" | "p2" | "tie" | null;

// ─── Active cell (in-flight, not yet resolved) ────────────────────
type BaseCell = {
  idx: number;
  clicked: boolean;
  shape?: CellShape;
};

export type RegularCell = BaseCell & {
  type: "white" | "blue" | "red" | "orange" | "yellow" | "green" | "cyan" | "lime" | "teal" | "pink" | "rose" | "magenta" | "purple";
};

export type IceCell = BaseCell & {
  type: "ice";
  iceCount: number;
};

export type HoldCell = BaseCell & {
  type: "hold";
  holdRequired: number;
  holdStart?: number;
  spawnedAt: number;   // timestamp — hold cell expires if never started within holdRequired + 1500ms
};

export type PowerupCell = BaseCell & {
  type: "medpack" | "shield" | "freeze" | "multiplier";
};

export type BombCell = BaseCell & {
  type: "bomb";
  expiresAt: number;   // timestamp — must tap before this
};

export type ActiveCell = RegularCell | IceCell | HoldCell | PowerupCell | BombCell;

export interface BossEvent {
  type: BossEventType;
  endsAt: number;      // timestamp
}

// ─── Per-player live state ────────────────────────────────────────
export interface PlayerState {
  cells:               CellType[];       // flat 25-cell display array
  active:              ActiveCell[];     // cells currently in play
  score:               number;
  streak:              number;
  alive:               boolean;
  anim:                Record<number, string>;
  health:              number;
  shield:              boolean;
  shieldCount:         number;
  freezeEnd:           number;           // timestamp
  multiplierEnd:       number;           // timestamp
  gridStage:           number;           // evolve stage index
  stageProgress:       number;           // taps toward next stage
  patternIdx:          number;           // current EVOLVE_PATTERNS index
  storedFreezeCharges: number;
  storedShieldCharges: number;
  pendingStageUpdate?: boolean;
  slideAnim?: Record<number, { fromIdx: number; startMs: number }>; // K3: cell shuffle slide
  nextShuffleTick: number;  // per-player shuffle scheduling
}

// ─── Rare color mode ──────────────────────────────────────────────
export interface RareColorMode {
  active:   boolean;
  color:    string;
  cssColor: string;
  turnsLeft: number;
  shape:    CellShape;  // shape used for colorblind distinction
  emoji:    string;     // emoji shown in colorblind mode
}

export interface StoredPowerups {
  freeze: number;
  shield: number;
  mult: number;
  heart: number;
}

// ─── Engine configuration (passed at construction) ────────────────
export interface GameConfig {
  mode:       GameMode;
  numPlayers: NumPlayers;
  speedMult:  number;      // iMultRef equivalent
  inputMode?: 'touch' | 'keys';  // default 'touch'
  godMode?:   boolean;     // practice / dev invincibility
  storage?: {
    loadStoredPowerups: () => StoredPowerups;
    saveStoredPowerups: (data: StoredPowerups) => void;
  };
  botAssist?: {
    enabled: boolean;
    getDust: () => number;
    spendDust: (amount: number) => void;
    getAccuracy: () => number;  // 0.0–1.0
  };
}

// ─── Full engine snapshot emitted to React ────────────────────────
export interface GameSnapshot {
  tick:       number;
  evolveTick: number;
  gameSeed:   number;
  p1:         PlayerState;
  p2:         PlayerState;
  cellShape:  CellShape;
  rareMode:   RareColorMode;
  spinLevel:  number;
  paused:     boolean;
  phase:      "playing" | "paused" | "gameover" | "humanlimit";
  grid: {
    cols: number;
    rows: number;
    mask: number[] | null;
  };
  devRotationSpeed?: number;
  spinCfg: { duration: number; direction: 1 | -1 } | null;
  bossEvent:  BossEvent | null;
  activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null;
  isInverted: boolean;   // true during inversion boss event
  isBlackout: boolean;   // true during blackout boss event
}

// ─── Events emitted by GameEngine ────────────────────────────────
export type GameEvent =
  | { type: "tick";        snapshot: GameSnapshot }
  | { type: "damage";      player: 1 | 2 }
  | { type: "shake";       player: 1 | 2 }
  | { type: "levelUp";     player: 1 | 2; stage: number }
  | { type: "sound";       name: "ok" | "bad" | "tick" | "powerup" | "levelup" | "shuffle" | "rareStart" | "claim" | "bomb" | "bossStart"; pitchMult?: number }
  | { type: "scoreFloat"; player: 1 | 2; idx: number; amount: number }
  | { type: "toast";       message: string }
  | { type: "pwrToast";    message: string; player: 1 | 2 } // Task 1: Inline pwr toast
  | { type: "rareStart";   color: string; cssColor: string }
  | { type: "bossStart";   bossType: BossEventType }
  | { type: "bombSpawn";   player: 1 | 2; idx: number; expiresAt: number }
  | { type: "bombDefused"; player: 1 | 2 }
  | { type: "bombExplode"; player: 1 | 2 }
  | { type: "cellAnim";    player: 1 | 2; idx: number; anim: "pop" | "shake" }
  | { type: "gameOver";    winner: Winner }
  | { type: "phaseChange"; phase: "playing" | "paused" | "gameover" | "humanlimit" }
  | { type: "dustConsumed"; amount: number }
  | { type: "botTap"; player: 1 | 2; idx: number; dustCost: number }
  | { type: "cellShuffle"; player: 1 | 2; fromIdx: number; toIdx: number }
  | { type: "qualityDowngrade"; reason: "fps-drop"; avgFps: number }
  | { type: "qualityUpgrade"; avgFps: number };
```

## File: engine/GameEngine.ts
```typescript
/**
 * CLOCK DOMAIN CONVENTION:
 * - Date.now(): Used for real-time game state (energy regen, bomb expiry, login streaks)
 * - performance.now(): Used for sub-frame timing (FPS measurement, animation deltas)
 * - Game ticks: Internal engine clock, advances once per tick interval
 *
 * Do NOT mix domains. When a value crosses domains, convert explicitly.
 */
import { GAME } from "../config/difficulty";
import { STAGES, EVOLVE_PATTERNS } from "../config/gridPatterns";
import { computeMs, makeGameSeed, getSpinConfig, mulberry32, speedLabel } from "./DifficultyScaler";
import { logError } from "../utils/devLog";
import { InputBuffer } from "../utils/input-smoothing";
import { haptics } from "../utils/haptics";
import { sessionManager } from "../utils/session";
import { stateGuard } from "../utils/state-guard";
import { scoreSync } from "../utils/score-sync";
import { audioEngine } from "../utils/audio";
import { analytics } from "../utils/analytics";
import { gamepadManager } from "../utils/gamepad";
import { configManager } from "../utils/game-config";
import { errorTracker } from "../utils/error-tracker";
import { DynamicDifficulty } from "../utils/dda";
import { seedManager } from "../utils/seed-manager";
import { bossEngine } from "../utils/boss-engine";
import { achievementSystem } from "../utils/achievements";
import { DailyChallenge } from "../utils/seed-challenge";
import { perfMonitor } from "../utils/perf-monitor";
import { scoreCardGen } from "../utils/score-card";
import { rhythmFeedback } from "../utils/feedback-rhythm";
import type {
  ActiveCell, CellShape, GameConfig, GameEvent,
  GameSnapshot, PlayerState, RareColorMode, Winner,
  BossEvent, BossEventType, HoldCell, CellType,
} from "./types";
import {
  activeToCellsP, spawnActive,
} from "./subsystems/CellLifecycle";
import { calculateStreakBonus, calculateTapScore, checkStreakMilestone } from "./subsystems/ScoreTracker";
import { challengeLink } from "../utils/challenge-link";
import { TickProcessor, type TickContext } from "./subsystems/TickProcessor";
import { BotController } from "./subsystems/BotController";

function makePS(bonusHearts: number, hasMult: boolean, stored: { freeze: number; shield: number; mult: number; heart: number }): PlayerState {
  return {
    cells: Array(25).fill("inactive"), active: [], score: 0, streak: 0,
    alive: true, anim: {}, health: GAME.MAX_HEARTS + bonusHearts,
    shield: false, shieldCount: 0, freezeEnd: 0,
    multiplierEnd: hasMult ? Date.now() + 24000 : 0,
    gridStage: 0, stageProgress: 0, patternIdx: 0,
    storedFreezeCharges: stored.freeze,
    storedShieldCharges: stored.shield,
    nextShuffleTick: 0,
  };
}

// ΓöÇΓöÇΓöÇ GameEngine class ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export class GameEngine {
  private rafId: number | null = null;
  private tickTimer: ReturnType<typeof setTimeout> | null = null;
  private tickCount  = 0;
  private evolveTick = 0;
  private iMult      = 1;
  private paused     = false;
  private phase: GameSnapshot["phase"] = "playing";
  private holdTimers = new Map<string, { cell: ActiveCell, player: 1 | 2, generation: number }>();
  private holdGeneration = 0;
  private dirty      = true;

  private rng: () => number = () => Math.random();
  private p1!: PlayerState;
  private p2!: PlayerState;
  private cellShape: CellShape    = "square";
  private rareMode: RareColorMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
  private spinLevel  = 0;
  private gameSeed   = makeGameSeed();
  private tapBuffer: Record<1 | 2, { idx: number; ts: number } | null> = { 1: null, 2: null };
  private static readonly TAP_BUFFER_MS = GAME.TAP_BUFFER_MS;
  private   devGodMode     = false;
  private devFreezeTime  = false;
  private devForcedPwr: "shield" | "freeze" | "heart" | null = null;
  private devRotationSpeed = 1;
  private botAssistActive: { 1: boolean; 2: boolean } = { 1: false, 2: false };

  private listeners: Set<(e: GameEvent) => void> = new Set();
  private _pauseListeners: Array<() => void> = [];
  private _resumeListeners: Array<() => void> = [];
  private inputBuffer = new InputBuffer();
  private _sessionAutoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private fpsHistory: number[] = [];
  private fpsIdx = 0;
  private autoLowQuality = false;
  private lowQualityThreshold = 40;
  // Snapshot cache fields
  private _cachedMask: number[] | null = null;
  private _cachedMaskSrc: number[] | null = null;
  private _cachedSpinCfg: { duration: number; direction: 1 | -1 } | null = null;
  private _cachedSpinLevel = -1;
  private _cachedSpinSeed = -1;
  private _cachedRotationSpeed = 1;
  // K1: cell shuffle state
  // nextShuffleTick moved to PlayerState for per-player tracking
  private readonly SHUFFLE_DURATION_MS = 200; // K3: slide animation duration
  // Boss/Bomb state
  private bossEvent: BossEvent | null = null;
  private nextBossTriggerScore = 500;
  private readonly SESSION_KEY = 'dtp:session';
  private activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null = null;
  private _settingsUnsub: (() => void) | null = null;
  private _gamepadUnsub: (() => void) | null = null;
  private _bossCompleteHandler: (() => void) | null = null;
  private _bossShieldBreakHandler: (() => void) | null = null;
  private _difficultyEmergencyHandler: (() => void) | null = null;
  private _lastFocusedCell = '0';
  private _config = configManager.get();
  private _configUnsub: (() => void) | null = null;
  private dda = new DynamicDifficulty(1200);
  private daily = new DailyChallenge();
  private _lastTapTime = 0;
  private _sessionStartTime = performance.now();
  private _isDisposed = false;
  private _isInverted = false;
  private _isBlackout = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];
  private _tickSoundCounter = 0;
  private _deltaTimers: Array<{ id: string; remaining: number; duration: number; callback: () => void }> = [];
  private _lastTickTs = performance.now();
  private _hitPauseUntil = 0; // Hit pause: freeze game briefly on impactful moments
  private _deathSlowdown = false; // Slow-motion on death before game over
  private _deathCleanupTimer: ReturnType<typeof setTimeout> | null = null; // Track death cleanup timeout
  private _cachedNow = Date.now(); // Cached Date.now() per tick — avoids 10+ syscalls per frame
  private _bossActive = false;
  private _bombDefuseCount = 0;
  private _shieldCollected = 0;
  private _tookDamage = false;
  private _freezeCollected = 0;
  private _purpleTaps = 0;
  private _tickProcessor = new TickProcessor();
  private _tickCtx!: TickContext;
  private _bot: BotController;

  constructor(private config: GameConfig) {
    perfMonitor.observe();
    this._sessionStartTime = performance.now();
    this.iMult = config.speedMult;
    this.devGodMode = config.godMode ?? false;
    achievementSystem.load();
    // Core achievements
    achievementSystem.register({ id: 'first_blood', name: 'First Strike', desc: 'Clear your first cell', icon: '⚔️', unlocked: false });
    achievementSystem.register({ id: 'survivor', name: 'Iron Will', desc: 'Reach last heart and survive 30s', icon: '💪', unlocked: false });
    achievementSystem.register({ id: 'daily_master', name: 'Daily Grind', desc: "Complete today's challenge", icon: '📅', unlocked: false });
    // Score milestones
    achievementSystem.register({ id: 'score_100', name: 'Getting Started', desc: 'Score 100 points', icon: '🌟', unlocked: false });
    achievementSystem.register({ id: 'score_500', name: 'Rising Star', desc: 'Score 500 points', icon: '⭐', unlocked: false });
    achievementSystem.register({ id: 'score_1000', name: 'Thousand Club', desc: 'Score 1,000 points', icon: '💫', unlocked: false });
    achievementSystem.register({ id: 'score_2500', name: 'Quarter King', desc: 'Score 2,500 points', icon: '👑', unlocked: false });
    achievementSystem.register({ id: 'score_5000', name: 'Half Hero', desc: 'Score 5,000 points', icon: '🏆', unlocked: false });
    achievementSystem.register({ id: 'score_9999', name: 'Max Master', desc: 'Score 9,999 points (max)', icon: '💎', unlocked: false });
    // Streak milestones
    achievementSystem.register({ id: 'streak_10', name: 'On Fire', desc: 'Reach a 10-streak', icon: '🔥', unlocked: false });
    achievementSystem.register({ id: 'streak_25', name: 'Unstoppable', desc: 'Reach a 25-streak', icon: '💥', unlocked: false });
    achievementSystem.register({ id: 'streak_50', name: 'Legend', desc: 'Reach a 50-streak', icon: '⚡', unlocked: false });
    // Mode completions
    achievementSystem.register({ id: 'classic_win', name: 'Classic Champion', desc: 'Win a Classic game', icon: '🎯', unlocked: false });
    achievementSystem.register({ id: 'evolve_win', name: 'Evolution Complete', desc: 'Win an Evolve game', icon: '🧬', unlocked: false });
    // Boss achievements
    achievementSystem.register({ id: 'boss_defeat', name: 'Boss Slayer', desc: 'Defeat a boss event', icon: '🐉', unlocked: false });
    achievementSystem.register({ id: 'boss_inversion', name: 'Mind Bender', desc: 'Survive an Inversion event', icon: '🔄', unlocked: false });
    // Bomb achievements
    achievementSystem.register({ id: 'bomb_defuse', name: 'Defuser', desc: 'Defuse 10 bombs', icon: '💣', unlocked: false });
    achievementSystem.register({ id: 'bomb_master', name: 'Bomb Expert', desc: 'Defuse 50 bombs', icon: '🧨', unlocked: false });
    // Daily streak
    achievementSystem.register({ id: 'streak_3', name: 'Consistent', desc: '3-day daily streak', icon: '📅', unlocked: false });
    achievementSystem.register({ id: 'streak_7', name: 'Weekly Warrior', desc: '7-day daily streak', icon: '🗓️', unlocked: false });
    achievementSystem.register({ id: 'streak_14', name: 'Fortnight Fighter', desc: '14-day daily streak', icon: '🏅', unlocked: false });
    achievementSystem.register({ id: 'streak_30', name: 'Monthly Master', desc: '30-day daily streak', icon: '👑', unlocked: false });
    // Dust achievements
    achievementSystem.register({ id: 'dust_1000', name: 'Dust Collector', desc: 'Earn 1,000 dust total', icon: '💜', unlocked: false });
    achievementSystem.register({ id: 'dust_10000', name: 'Dust Baron', desc: 'Earn 10,000 dust total', icon: '💰', unlocked: false });
    // Speed achievements
    achievementSystem.register({ id: 'speed_2x', name: 'Quick Draw', desc: 'Reach 2.0x speed', icon: '⚡', unlocked: false });
    achievementSystem.register({ id: 'speed_3x', name: 'Lightning Fast', desc: 'Reach 3.0x speed', icon: '🌩️', unlocked: false });
    // Powerup achievements
    achievementSystem.register({ id: 'shield_5', name: 'Shield Bearer', desc: 'Collect 5 shields in one game', icon: '🛡️', unlocked: false });
    achievementSystem.register({ id: 'freeze_5', name: 'Frost Master', desc: 'Collect 5 freezes in one game', icon: '❄️', unlocked: false });
    // Perfect round
    achievementSystem.register({ id: 'perfect_round', name: 'Untouchable', desc: 'Complete a round with no damage', icon: '✨', unlocked: false });
    // Play count
    achievementSystem.register({ id: 'games_50', name: 'Dedicated', desc: 'Play 50 games', icon: '🎮', unlocked: false });
    achievementSystem.register({ id: 'games_200', name: 'Veteran', desc: 'Play 200 games', icon: '🏅', unlocked: false });
    // Secret achievements
    achievementSystem.register({ id: 'secret_purple_tap', name: '???', desc: '???', icon: '🔮', unlocked: false });
    achievementSystem.register({ id: 'secret_speed_run', name: '???', desc: '???', icon: '🔮', unlocked: false });
    audioEngine.init();
    import('../utils/settings').then(m => {
      this._settingsUnsub = m.settingsManager.subscribe(s => this._applySettings(s));
    }).catch(e => logError('Settings module failed', e));
    this._configUnsub = configManager.subscribe(cfg => { this._config = cfg; });
    this._bossCompleteHandler = () => {
      this._bossActive = false;
      achievementSystem.unlock('boss_defeat');
    };
    this._bossShieldBreakHandler = () => { this.hitPause(80); this.emit({ type: "shake", player: 1 }); this.emit({ type: "sound", name: "powerup" }); };
    this._difficultyEmergencyHandler = () => {
      if (!this.p1 || this.phase !== 'playing') return;
      const bonus = Math.round(50 * rhythmFeedback.state.multiplier);
      this.p1.score += bonus;
      this.emit({ type: "toast", message: ` Difficulty adjusted! +${bonus} pts` });
      document.documentElement.setAttribute('data-dda-emergency', 'true');
      setTimeout(() => document.documentElement.removeAttribute('data-dda-emergency'), 2200);
    };
    window.addEventListener('dtp:boss:complete', this._bossCompleteHandler);
    window.addEventListener('dtp:boss:shield-break', this._bossShieldBreakHandler);
    window.addEventListener('dtp:difficulty:emergency', this._difficultyEmergencyHandler);
    gamepadManager.init();
    this._gamepadUnsub = gamepadManager.on((btn, state) => {
      if (state !== 'press') return;
      if (btn === 'a' || btn === 'dpad_up') { const v = parseInt(this._lastFocusedCell); this.handleTap(1, Number.isFinite(v) ? v : 0); }
      if (btn === 'start') {
        if (this.paused) this.resume();
        else this.pause();
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this._tickCtx = {
      get config() { return self.config; },
      get phase() { return self.phase; }, set phase(v) { self.phase = v; },
      get tickCount() { return self.tickCount; }, set tickCount(v) { self.tickCount = v; },
      get evolveTick() { return self.evolveTick; }, set evolveTick(v) { self.evolveTick = v; },
      get cellShape() { return self.cellShape; }, set cellShape(v) { self.cellShape = v; },
      get rareMode() { return self.rareMode; }, set rareMode(v) { self.rareMode = v; },
      get spinLevel() { return self.spinLevel; }, set spinLevel(v) { self.spinLevel = v; },
      get p1() { return self.p1; },
      get p2() { return self.p2; },
      get bossEvent() { return self.bossEvent; }, set bossEvent(v) { self.bossEvent = v; },
      get _bossActive() { return self._bossActive; }, set _bossActive(v) { self._bossActive = v; },
      get _isInverted() { return self._isInverted; }, set _isInverted(v) { self._isInverted = v; },
      get _isBlackout() { return self._isBlackout; }, set _isBlackout(v) { self._isBlackout = v; },
      get nextBossTriggerScore() { return self.nextBossTriggerScore; }, set nextBossTriggerScore(v) { self.nextBossTriggerScore = v; },
      get activeBomb() { return self.activeBomb; }, set activeBomb(v) { self.activeBomb = v; },
      get dirty() { return self.dirty; }, set dirty(v) { self.dirty = v; },
      get _tickSoundCounter() { return self._tickSoundCounter; }, set _tickSoundCounter(v) { self._tickSoundCounter = v; },
      get _lastTickTs() { return self._lastTickTs; }, set _lastTickTs(v) { self._lastTickTs = v; },
      get now() { return self._cachedNow; },
      get numPlayers() { return self.config.numPlayers; },
      get _deltaTimers() { return self._deltaTimers; }, set _deltaTimers(v) { self._deltaTimers = v; },
      get devGodMode() { return self.devGodMode; }, set devGodMode(v) { self.devGodMode = v; },
      get devFreezeTime() { return self.devFreezeTime; }, set devFreezeTime(v) { self.devFreezeTime = v; },
      get devForcedPwr() { return self.devForcedPwr; }, set devForcedPwr(v) { self.devForcedPwr = v; },
      get dda() { return self.dda; },
      emit: (e) => self.emit(e),
      _flushTapBuffer: (p) => self._flushTapBuffer(p),
      checkStageProgress: (p) => self.checkStageProgress(p),
      autoSaveSession: () => self.autoSaveSession(),
      triggerGameOver: (w) => self.triggerGameOver(w),
      scheduleTimeout: (cb, ms) => self.scheduleTimeout(cb, ms),
      addDeltaTimer: (id, dur, cb) => self.addDeltaTimer(id, dur, cb),
      removeDeltaTimer: (id) => self.removeDeltaTimer(id),
      get rng() { return self.rng; },
    };
    this._bot = new BotController({
      getDangerColor:  () => this.rareMode?.active ? this.rareMode.color : 'purple',
      isInverted:      () => this.bossEvent?.type === 'inversion' && Date.now() < (this.bossEvent?.endsAt ?? 0),
      handleTap:       (player, idx) => this.handleTap(player, idx),
      emit:            (event) => this.emit(event as unknown as GameEvent),
      getActiveCells:  (player) => (player === 1 ? this.p1 : this.p2).active,
      isPlaying:       () => this.phase === 'playing',
    });
  }

  private _applySettings(s: { reducedMotion?: boolean; liteMode?: boolean }) {
    if (s.reducedMotion !== undefined) {
      this.devRotationSpeed = s.reducedMotion ? 0.5 : 1;
    }
  }

  setConfig(cfg: typeof this._config) { this._config = cfg; }

  handleError(err: Error, phase: string) {
    errorTracker.capture(err, { phase, tick: this.tickCount, p1Score: this.p1?.score, p2Score: this.p2?.score });
    if (this.phase === "playing") {
      this.pause();
    }
  }

  getDDASpawnRate() { return this.dda.spawnRate; }
  isDailyComplete() { return this.daily.isTodayComplete(); }

  async generateScoreCard(score: number): Promise<string> {
    if (this._isDisposed) return "";
    return scoreCardGen.generate({
      score,
      hearts: this.p1?.health ?? 0,
      time: Math.round(this.tickCount / 2),
      rank: score > 5000 ? 'S' : score > 3000 ? 'A' : score > 1000 ? 'B' : 'C',
      seed: this.daily.getSeed() || 'casual'
    });
  }

  start(forceSeed?: number): void {
    if (this._isDisposed) return; // Fix #2: Uninitialized/Disposed guard
    this.stop();
    // Issue 15: Temporarily detach boss complete handler to prevent
    // the boss_defeat achievement from firing on cleanup deactivation.
    if (this._bossCompleteHandler) window.removeEventListener('dtp:boss:complete', this._bossCompleteHandler);
    bossEngine.deactivate();
    if (this._bossCompleteHandler) window.addEventListener('dtp:boss:complete', this._bossCompleteHandler);
    rhythmFeedback.reset();
    sessionStorage.removeItem(this.SESSION_KEY);
    this.tickCount  = 0;
    this.evolveTick = 0;
    this.iMult      = this.config.speedMult;
    this.devGodMode = this.config.godMode ?? false;
    this.paused     = false;
    this.phase      = "playing";
    this.cellShape  = "square";
    this.spinLevel  = 0;
    this._lastTickTs = performance.now();
    this._deltaTimers = [];
    this.clearAllTimeouts();
    this._bossActive = false;
    this._deathSlowdown = false;
    this._shieldCollected = 0;
    this._freezeCollected = 0;
    this._purpleTaps = 0;
    this._tookDamage = false;
    this._bombDefuseCount = 0;
    this.inputBuffer.clear();
    if (this._deathCleanupTimer) { clearTimeout(this._deathCleanupTimer); this._deathCleanupTimer = null; }
    this.gameSeed   = forceSeed ?? seedManager.initOrRestore();
    this.rng        = mulberry32(this.gameSeed);
    this._bot.setRng(this.rng);
    this.rareMode        = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
    this.bossEvent = null;
    this.nextBossTriggerScore = 500;
    this.activeBomb = null;
    // Load stored once, compute deductions, call saveStoredPowerups once for mult deduction if hasMult, once for heart reset if bonusHearts
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    const bonusHearts = (this.config.mode === "evolve" && stored.heart > 0) ? stored.heart : 0;
    const hasMult = (this.config.mode === "evolve" && (stored.mult ?? 0) > 0);
    if (hasMult || bonusHearts > 0) {
      const updated = { ...stored };
      if (hasMult) updated.mult = (stored.mult ?? 1) - 1;
      if (bonusHearts > 0) updated.heart = 0;
      this.config.storage?.saveStoredPowerups(updated);
    }
    this.p1 = makePS(bonusHearts, hasMult, stored);
    this.p2 = makePS(bonusHearts, hasMult, this.config.numPlayers === 2 ? { freeze: 0, shield: 0, mult: 0, heart: 0 } : stored);
    this.p1.nextShuffleTick = 40 + Math.floor(this.rng() * 20); // K2: first shuffle at tick 40-60
    this.p2.nextShuffleTick = 40 + Math.floor(this.rng() * 20);
    this.tapBuffer  = { 1: null, 2: null };
    this.dirty = true;
    this.emit({ type: "phaseChange", phase: "playing" });
    this.emitSnapshot();
    this.scheduleTick();
    this.startSnapshotRaf();
    analytics.track('game_start', { mode: this.config.mode, seed: this.gameSeed });
  }

  stop(): void {
    if (this.tickTimer !== null) {
      clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this._bot.dispose();
  }

  private lastFrameTime = 0;

  private startSnapshotRaf(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId); // Fix #1: Prevent RAF leak
    this.lastFrameTime = performance.now();
    const loop = (timestamp: number) => {
      if (this.rafId === null) return;
      if (this.lastFrameTime > 0) {
        const frameTime = timestamp - this.lastFrameTime;
        if (this.phase === "playing") {
          this.updatePerformanceMetrics(frameTime);
        }
      }
      this.lastFrameTime = timestamp;
      if (this.dirty && this.phase !== "gameover") {
        this.dirty = false;
        this.emitSnapshot();
      }
      if (this.phase !== "gameover") {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private scheduleTick(): void {
    if (this.phase !== "playing") return;
    const now = Date.now();
    const frozen = this.p1.freezeEnd > now || (this.config.numPlayers === 2 && this.p2.freezeEnd > now);
    const tickForCalc = this.devFreezeTime ? 0 : this.tickCount;
    const ddaFactor = Math.max(0.75, Math.min(1.25, this.dda.compute() / 1200));
    const ms = computeMs(tickForCalc, frozen ? 1.4 : 1) * this.iMult * ddaFactor;
    // Add hit pause delay if active, and apply death slowdown
    const hitPauseRemaining = Math.max(0, this._hitPauseUntil - performance.now());
    const slowdownMult = this._deathSlowdown ? 3 : 1;
    const delay = (ms * slowdownMult) + hitPauseRemaining;
    this.tickTimer = setTimeout(() => {
      if (this.phase !== "playing") return;
      this.processTick();
      this.scheduleTick();
    }, delay);
  }

  private scheduleTimeout(cb: () => void, ms: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this._timeouts = this._timeouts.filter(t => t !== id);
      if (this.phase !== 'paused') cb();
    }, ms);
    this._timeouts.push(id);
    return id;
  }

  private clearAllTimeouts(): void {
    this._timeouts.forEach(clearTimeout);
    this._timeouts = [];
  }

  addDeltaTimer(id: string, durationMs: number, callback: () => void) {
    this.removeDeltaTimer(id);
    this._deltaTimers.push({ id, remaining: durationMs, duration: durationMs, callback });
  }

  removeDeltaTimer(id: string) {
    this._deltaTimers = this._deltaTimers.filter(t => t.id !== id);
  }

  clearAllDeltaTimers() { this._deltaTimers = []; }

  pause(): void {
    if (this.phase !== "playing" || !this.p1 || !this.p2) return;
    this.paused = true;
    this.phase  = "paused";
    if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; }
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    if (this._sessionAutoSaveInterval) { clearInterval(this._sessionAutoSaveInterval); this._sessionAutoSaveInterval = null; }
    this.dirty = true;
    this._pauseListeners.forEach(fn => fn());
    this.emit({ type: "phaseChange", phase: "paused" });
    this.emitSnapshot();
  }

  resume(): void {
    if (this.phase !== "paused") return;
    if (!this.p1?.alive) return; // Fix #7: Validation
    this.paused = false;
    this.phase  = "playing";
    this.scheduleTick();
    this.startSnapshotRaf(); // Restart RAF loop
    this.dirty = true;
    this._resumeListeners.forEach(fn => fn());
    this.emit({ type: "phaseChange", phase: "playing" });
    this.emitSnapshot();
  }

  onPause(cb: () => void): void { this._pauseListeners.push(cb); }
  onResume(cb: () => void): void { this._resumeListeners.push(cb); }

  /** Hit pause: briefly freeze the game on impactful moments (damage, boss, milestones) */
  hitPause(ms: number): void {
    this._hitPauseUntil = performance.now() + ms;
  }

  /** Check if currently in hit pause */
  get isHitPaused(): boolean {
    return performance.now() < this._hitPauseUntil;
  }

destroy(): void {
    this._isDisposed = true;
    this._settingsUnsub?.();
    this._configUnsub?.();
    this._gamepadUnsub?.();
    if (this._bossCompleteHandler) window.removeEventListener('dtp:boss:complete', this._bossCompleteHandler);
    if (this._bossShieldBreakHandler) window.removeEventListener('dtp:boss:shield-break', this._bossShieldBreakHandler);
    if (this._difficultyEmergencyHandler) window.removeEventListener('dtp:difficulty:emergency', this._difficultyEmergencyHandler);
    bossEngine.dispose();
    this.holdTimers.clear();
    this.tapBuffer = { 1: null, 2: null };
    this.clearAllTimeouts();
    this.clearAllDeltaTimers();
    if (this._sessionAutoSaveInterval) { clearInterval(this._sessionAutoSaveInterval); this._sessionAutoSaveInterval = null; }
    if (this._deathCleanupTimer) { clearTimeout(this._deathCleanupTimer); this._deathCleanupTimer = null; }
    this.stop();
    this.listeners.clear();
    this._pauseListeners = [];
    this._resumeListeners = [];
  }

  safeReset(keepSettings = false) {
    if (!keepSettings) {
      this._settingsUnsub?.();
      this._settingsUnsub = null;
      // Re-subscribe to settings after reset
      import('../utils/settings').then(m => {
        this._settingsUnsub = m.settingsManager.subscribe(s => this._applySettings(s));
      }).catch(e => logError('Settings module failed', e));
    }
    this.start();
  }

  subscribe(fn: (e: GameEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(event: GameEvent): void {
    this.listeners.forEach(fn => fn(event));
  }

  private emitSnapshot(): void {
    this.emit({ type: "tick", snapshot: this.getSnapshot() });
    this.dirty = false;
  }

  private _currentTickMs(): number {
    const now = Date.now();
    const frozen = this.p1.freezeEnd > now || (this.config.numPlayers === 2 && this.p2.freezeEnd > now);
    const tickForCalc = this.devFreezeTime ? 0 : this.tickCount;
    return computeMs(tickForCalc, frozen ? 1.4 : 1) * this.iMult;
  }

  private processTick(): void {
    try {
      this._cachedNow = Date.now(); // Cache once per tick
      this._tickProcessor.processTick(this._tickCtx);
    } catch (e) {
      // Fix #6: Error handling to prevent engine lockup
      this.handleError(e as Error, "processTick");
    }
  }

  handleTap(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing") return;
    const cellId = `p${player}-${idx}`;
    if (!this.inputBuffer.register(cellId)) return;
    haptics.tap();
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref || !ref.alive) return;
    this.tapBuffer[player] = { idx, ts: Date.now() };
    this._flushTapBuffer(player);
  }

  private _flushTapBuffer(player: 1 | 2): void {
    const entry = this.tapBuffer[player];
    if (!entry || Date.now() - entry.ts > GameEngine.TAP_BUFFER_MS) { this.tapBuffer[player] = null; return; }
    const ref = player === 1 ? this.p1 : this.p2;
    const cell = ref.active.find(c => c.idx === entry.idx);
    if (!cell || cell.clicked) return;
    this.tapBuffer[player] = null;
    this._processTap(player, entry.idx);
  }

  private _processTap(player: 1 | 2, idx: number): void {
    const ref = player === 1 ? this.p1 : this.p2;
    const cell = ref.active.find(c => c.idx === idx);
    if (!cell || cell.clicked) return;
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    if (!(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)).includes(idx)) return;
    const isInvertedTap = this.bossEvent?.type === "inversion" && Date.now() < (this.bossEvent?.endsAt ?? 0);
    const danger = this.rareMode.active ? this.rareMode.color : "purple";

    if (cell.type === "ice") {
      const rem = (cell.iceCount ?? 1) - 1;
      this.triggerCellAnim(player, idx, rem <= 0 ? "pop" : "shake");
      this.emit({ type: "sound", name: rem <= 0 ? "ok" : "tick" });
      if (rem <= 0) {
        haptics.success();
        cell.clicked = true;
        const { mult } = calculateTapScore(Date.now() < ref.multiplierEnd, false, 1);
        const nextStreak = ref.streak + 1;
        ref.score += mult + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
        this.checkStageProgress(player);
        if (ref.active.every(c => c.clicked || (c.type as string) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.dirty = true; this.emitSnapshot(); return; }
      } else cell.iceCount = rem;
      ref.cells = activeToCellsP(ref.active, pat);
      this.dirty = true;
      this.emitSnapshot();
      return;
    }
    if (cell.type === "hold") return;
    // Bomb cell ΓÇö defuse it
    if (cell.type === "bomb") {
      cell.clicked = true;
      if (this.activeBomb?.idx === idx && this.activeBomb?.player === player) this.activeBomb = null;
      this.triggerCellAnim(player, idx, "pop");
      this.emit({ type: "sound", name: "powerup" });
      this.emit({ type: "bombDefused", player });
      this.emit({ type: "toast", message: "💣 Defused! +3" });
      this.hitPause(30);
      const { mult } = calculateTapScore(Date.now() < ref.multiplierEnd, false, 1);
      const nextStreak = ref.streak + 1;
      ref.score += (mult * 3) + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
      this.checkStageProgress(player);
      // Bomb achievements — track total defuses
      this._bombDefuseCount = (this._bombDefuseCount ?? 0) + 1;
      achievementSystem.check('bomb_defuse', () => this._bombDefuseCount >= 10);
      achievementSystem.check('bomb_master', () => this._bombDefuseCount >= 50);
      ref.cells = activeToCellsP(ref.active, pat);
      this.dirty = true;
      this.emitSnapshot();
      return;
    }
    const dmg = this.config.mode === "evolve" ? 0.5 : 1;
    if (["medpack","shield","freeze","multiplier"].includes(cell.type)) {
      cell.clicked = true; this.emit({ type: "sound", name: "powerup" }); this.triggerCellAnim(player, idx, "pop");
      if (cell.type === "medpack") haptics.medpack();
      else if (cell.type === "shield") haptics.shield();
      else if (cell.type === "freeze") haptics.freeze();
      else if (cell.type === "multiplier") haptics.multiplier();
      if (cell.type === "medpack") {
        if (ref.health >= GAME.MAX_HEARTS) {
          // Overheal → gain shield instead
          ref.shieldCount += 1; ref.shield = true;
          this.emit({ type: "pwrToast", message: `🛡 Overheal! +1 Shield`, player });
        } else {
          ref.health += 1;
          this.emit({ type: "toast", message: "♥ +1 Heart!" });
        }
      }
      if (cell.type === "shield") { ref.shieldCount += 1; ref.shield = true; this._shieldCollected++; }
      if (cell.type === "freeze") { ref.freezeEnd = Math.max(ref.freezeEnd, Date.now()) + 15000; this._freezeCollected++; }
      if (cell.type === "multiplier") ref.multiplierEnd = Date.now() + 24000;
      if (cell.type === "shield") {
        this.emit({ type: "pwrToast", message: `≡ƒ¢í Shield ├ù${ref.shieldCount}!`, player });
      } else if (cell.type === "multiplier") {
        this.emit({ type: "pwrToast", message: "ΓÜí multiplier ├ù2!", player });
      } else if (cell.type === "freeze") {
        this.emit({ type: "pwrToast", message: "Γ¥ä Freeze activated!", player });
      }
    } else {
      const tappedIsDanger = isInvertedTap ? cell.type !== 'purple' : cell.type === danger;
      if (tappedIsDanger) {
        cell.clicked = true;
        if (!this.devGodMode) {
          if (ref.shieldCount > 0) { this.dda.recordAttempt(false, 0, false); ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 }); this.triggerCellAnim(player, idx, "pop"); }
          else {
            this.dda.recordAttempt(false, 0, true);
            if (ref.streak >= 5) this.emit({ type: "toast", message: `🔥 ${ref.streak} streak lost!` });
            ref.health = Math.max(0, ref.health - dmg); ref.shield = false; ref.streak = 0; this._tookDamage = true;
            this.emit({ type: "sound", name: "bad" }); this.triggerCellAnim(player, idx, "shake");
            this.emit({ type: "damage", player }); this.emit({ type: "shake", player });
            this.hitPause(ref.health < 1 ? 200 : 40); // Death: 200ms, damage: 40ms
            if (ref.health < 1) { ref.alive = false; this.triggerGameOver(this.config.numPlayers === 1 ? null : (player === 1 ? "p2" : "p1")); }
          }
        } else { this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 }); this.triggerCellAnim(player, idx, "pop"); }
        // Count purple taps for secret achievement (danger branch: normal play where purple is dangerous)
        this._purpleTaps = (this._purpleTaps ?? 0) + (cell.type === 'purple' ? 1 : 0);
        achievementSystem.check('secret_purple_tap', () => (this._purpleTaps ?? 0) >= 10);
      } else {
      cell.clicked = true; this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 }); this.triggerCellAnim(player, idx, "pop");
      if (this._bossActive) bossEngine.onSafeTap();
      rhythmFeedback.recordTap();
      const { mult, bossMult } = calculateTapScore(Date.now() < ref.multiplierEnd, this._bossActive, bossEngine.combo.multiplier);
      const nextStreak = ref.streak + 1;
      const tapScore = (mult * bossMult) + calculateStreakBonus(nextStreak);
      ref.score += tapScore; ref.streak = nextStreak; ref.stageProgress += 1;
      this.emit({ type: "scoreFloat", player, idx, amount: tapScore });
      if (checkStreakMilestone(ref.streak)) { this.emit({ type: "toast", message: `🔥 ${ref.streak} Streak!` }); this.hitPause(25); haptics.combo(ref.streak); }
      if (ref.health === 1 && !this.devGodMode) this.emit({ type: "toast", message: "Γ¥ñ∩╕Å Last heart!" });
      this.checkStageProgress(player);
      const now = performance.now();
      const reaction = this._lastTapTime ? now - this._lastTapTime : 0;
      this._lastTapTime = now;
      if (reaction > 0) this.dda.recordAttempt(true, reaction, false);
      achievementSystem.check('first_blood', () => true);
      achievementSystem.check('survivor', () => ref.health <= 1 && this.tickCount > 300);
      // Score milestones
      achievementSystem.check('score_100', () => ref.score >= 100);
      achievementSystem.check('score_500', () => ref.score >= 500);
      achievementSystem.check('score_1000', () => ref.score >= 1000);
      achievementSystem.check('score_2500', () => ref.score >= 2500);
      achievementSystem.check('score_5000', () => ref.score >= 5000);
      achievementSystem.check('score_9999', () => ref.score >= 9999);
      // Streak milestones
      achievementSystem.check('streak_10', () => ref.streak >= 10);
      achievementSystem.check('streak_25', () => ref.streak >= 25);
      achievementSystem.check('streak_50', () => ref.streak >= 50);
      // Speed achievements
      const currentSpeed = parseFloat(speedLabel(this.tickCount, ref.freezeEnd > Date.now()));
      achievementSystem.check('speed_2x', () => currentSpeed >= 2.0);
      achievementSystem.check('speed_3x', () => currentSpeed >= 3.0);
      achievementSystem.check('shield_5', () => (this._shieldCollected ?? 0) >= 5);
      achievementSystem.check('freeze_5', () => (this._freezeCollected ?? 0) >= 5);
      // Secret: score 500+ at 3x speed
      achievementSystem.check('secret_speed_run', () => ref.score >= 500 && currentSpeed >= 3.0);
    }
    }
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private checkStageProgress(player: 1 | 2): void {
    const ref = player === 1 ? this.p1 : this.p2;
    if (this.config.mode === "evolve" && ref.stageProgress >= GAME.STAGE_TAPS_NEEDED && ref.gridStage < STAGES.length - 1) ref.pendingStageUpdate = true;
  }

  private triggerCellAnim(player: 1 | 2, idx: number, anim: "pop" | "shake"): void {
    const ref = player === 1 ? this.p1 : this.p2;
    ref.anim[idx] = anim;
    this.emit({ type: "cellAnim", player, idx, anim });
    this.scheduleTimeout(() => { if (ref.anim[idx] === anim) { ref.anim = { ...ref.anim }; delete ref.anim[idx]; } }, GAME.CELL_ANIM_MS);
  }

  handleHoldStart(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || cell.type !== "hold") return;
    (cell as HoldCell).holdStart = Date.now();
    const key = `${player}_${idx}`;
    if (this.holdTimers.has(key)) {
      this.removeDeltaTimer(`hold_${key}`);
      this.holdTimers.delete(key);
    }
    const gen = ++this.holdGeneration;
    this.addDeltaTimer(`hold_${key}`, GAME.HOLD_TIMEOUT_MS, () => {
      const entry = this.holdTimers.get(key);
      if (!entry || entry.generation !== gen || entry.cell.clicked) return;
      (entry.cell as HoldCell).holdStart = undefined;
      this.dirty = true;
      this.triggerCellAnim(entry.player, entry.cell.idx, "shake");
      this.emitSnapshot();
      this.holdTimers.delete(key);
    });
    this.holdTimers.set(key, { cell, player, generation: gen });
    this.dirty = true;
    this.emitSnapshot();
  }

  handleHoldEnd(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || cell.type !== "hold") return;
    const key = `${player}_${idx}`;
    const entry = this.holdTimers.get(key);
    if (entry) { this.removeDeltaTimer(`hold_${key}`); this.holdTimers.delete(key); }
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    const elapsed = Date.now() - ((cell as HoldCell).holdStart ?? Date.now());
    if (elapsed >= (cell as HoldCell).holdRequired) {
      cell.clicked = true; this.triggerCellAnim(player, idx, "pop");
      this.emit({ type: "sound", name: "powerup" });
      const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
      const nextStreak = ref.streak + 1;
      ref.score += (mult * 2) + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
      this.checkStageProgress(player);
      this.emit({ type: "toast", message: "≡ƒÆ¬ Hold! +2" });
      if (ref.active.every(c => c.clicked || (c.type as string) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.emitSnapshot(); return; }
    } else { (cell as HoldCell).holdStart = undefined; this.triggerCellAnim(player, idx, "shake"); }
    ref.cells = activeToCellsP(ref.active, pat);
    this.emitSnapshot();
  }

  activateStoredFreeze(player: 1 | 2): void {
    if (this._isDisposed) return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive || ref.storedFreezeCharges <= 0) return;
    ref.storedFreezeCharges -= 1;
    ref.freezeEnd = Math.max(ref.freezeEnd, Date.now()) + 15000;
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    this.config.storage?.saveStoredPowerups({ freeze: ref.storedFreezeCharges, shield: ref.storedShieldCharges, mult: stored.mult, heart: stored.heart });
    this.emit({ type: "toast", message: "Γ¥ä Freeze activated!" });
    this.emitSnapshot();
  }

  activateStoredShield(player: 1 | 2): void {
    if (this._isDisposed) return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive || ref.storedShieldCharges <= 0) return;
    ref.storedShieldCharges -= 1;
    ref.shieldCount += 1;
    ref.shield = true;
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    this.config.storage?.saveStoredPowerups({ freeze: ref.storedFreezeCharges, shield: ref.storedShieldCharges, mult: stored.mult, heart: stored.heart });
    this.emit({ type: "toast", message: `≡ƒ¢í Shield ├ù${ref.shieldCount}!` });
    this.emitSnapshot();
  }

  devForceStage(stage: number): void {
    const validPatterns = EVOLVE_PATTERNS.map((p, i) => ({ p, i })).filter(({ p }) => p.minStage <= stage);
    const pick = validPatterns[Math.floor(this.rng() * validPatterns.length)];
    this.p1.gridStage = stage; this.p1.stageProgress = 0; this.p1.patternIdx = pick?.i ?? 0;
    this.p2.gridStage = stage; this.p2.stageProgress = 0; this.p2.patternIdx = pick?.i ?? 0;
    this.emitSnapshot();
  }

  devForcePattern(idx: number): void {
    this.p1.patternIdx = idx; this.p2.patternIdx = idx;
    const pat = EVOLVE_PATTERNS[idx] ?? EVOLVE_PATTERNS[0];
    const rareColor = this.rareMode.active ? this.rareMode.color : undefined;
    const rareShape = this.rareMode.active ? this.rareMode.shape : undefined;
    this.p1.active = spawnActive(this.rng, this.p1.gridStage, this.p1.health, pat, this.config.mode === "evolve", rareColor, rareShape, this.tickCount, this.devGodMode);
    this.p1.cells = activeToCellsP(this.p1.active, pat);

    this.p2.active = spawnActive(this.rng, this.p2.gridStage, this.p2.health, pat, this.config.mode === "evolve", rareColor, rareShape, this.tickCount, this.devGodMode);
    this.p2.cells  = activeToCellsP(this.p2.active, pat);
    this.emitSnapshot();
  }

  devForceRare(r: { color: string; cssColor: string; shape?: CellShape; emoji?: string } | null): void {
    if (!r) this.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
    else { this.rareMode = { active: true, color: r.color, cssColor: r.cssColor, turnsLeft: 10, shape: r.shape ?? "circle", emoji: r.emoji ?? "" }; this.emit({ type: "rareStart", color: r.color, cssColor: r.cssColor }); this.emit({ type: "sound", name: "rareStart" }); }
    this.emitSnapshot();
  }

  devSetGodMode(v: boolean): void { this.devGodMode = v; }
  devSetFreezeTime(v: boolean): void { this.devFreezeTime = v; }
  devSetRotationSpeed(v: number): void { this.devRotationSpeed = Math.max(0.1, v); }
  devSpawnPowerup(type: "shield" | "freeze" | "heart"): void { this.devForcedPwr = type; }
  getDevRotationSpeed(): number { return this.devRotationSpeed; }

  devSpawnSpecialCell(player: 1 | 2, type: "ice" | "hold" | "bomb" | "rare", idx?: number): void {
    const target = player === 1 ? this.p1 : this.p2;
    if (!target.alive) return;
    const slot = idx !== undefined ? idx : Math.floor(this.rng() * Math.max(target.active.length, 1));
    const existing = target.active[slot];
    if (existing) {
      const cellType = type === "rare"
        ? (this.rareMode.active ? this.rareMode.color : "purple")
        : type;
      const mutable = existing as Record<string, unknown>;
      mutable.type = cellType;
      if (type === "ice") { mutable.iceCount = 3; mutable.holdProgress = undefined; }
      if (type === "hold") { mutable.holdProgress = 0; mutable.iceCount = undefined; }
      if (type === "bomb") { mutable.expiresAt = Date.now() + 3000; }
    }
    this.emitSnapshot();
  }

  devTriggerBotTap(player: 1 | 2, idx: number, dustCost = 3): void {
    this.emit({ type: "botTap", player, idx, dustCost });
  }

  devToggleBotAssist(player: 1 | 2, enabled: boolean): void {
    this.setBotAssist(player, enabled);
  }

  updatePerformanceMetrics(frameTime: number): void {
    const fps = 1000 / Math.max(frameTime, 1);
    if (this.fpsHistory.length < 60) { this.fpsHistory.push(fps); } else { this.fpsHistory[this.fpsIdx] = fps; this.fpsIdx = (this.fpsIdx + 1) % 60; }
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    if (!this.autoLowQuality && avgFps < this.lowQualityThreshold) {
      this.autoLowQuality = true;
      document.documentElement.style.setProperty('--particles-enabled', '0');
      document.documentElement.style.setProperty('--motion-scale', '0.5');
      this.emit({ type: "qualityDowngrade", reason: "fps-drop", avgFps });
    } else if (this.autoLowQuality && avgFps > 50) {
      this.autoLowQuality = false;
      document.documentElement.style.setProperty('--particles-enabled', '1');
      document.documentElement.style.setProperty('--motion-scale', '1');
      this.emit({ type: "qualityUpgrade", avgFps });
    }
  }

  getAutoLowQuality(): boolean { return this.autoLowQuality; }

  startSessionPersistence(): void {
    if (this._sessionAutoSaveInterval) return;
    this._sessionAutoSaveInterval = setInterval(() => {
      if (this.phase === "playing" && !this.paused && this.p1.alive) {
        sessionManager.save({
          hearts: this.p1.health,
          score: this.p1.score,
          timeLeft: GAME.HUMAN_LIMIT_TICK - this.tickCount,
          isPaused: this.paused
        }, { theme: 'default', difficulty: this.config.mode });
      }
    }, 5000);
  }

  stopSessionPersistence(): void {
    if (this._sessionAutoSaveInterval) {
      clearInterval(this._sessionAutoSaveInterval);
      this._sessionAutoSaveInterval = null;
    }
  }

  restoreFromSession(data: { hearts?: number; score?: number; timeLeft?: number }): void {
    if (!this.p1) return;
    if (data.hearts != null) this.p1.health = Math.max(0, Math.min(GAME.MAX_HEARTS, data.hearts));
    if (data.score != null) this.p1.score = Math.max(0, Math.min(9999, Math.floor(data.score)));
    if (data.timeLeft != null) this.tickCount = Math.max(0, GAME.HUMAN_LIMIT_TICK - data.timeLeft);
  }

  submitScoreToLeaderboard(score: number): void {
    if (this._isDisposed) return;
    scoreSync.queue(score, this.config.mode, this.tickCount);
  }

  async generateChallengeUrl(): Promise<string> {
    return challengeLink.generate(this.p1.score, this.gameSeed.toString(), this.p1.health);
  }

  getSnapshot(): GameSnapshot {
    // Guard against uninitialized engine
    if (!this.p1 || !this.p2) {
      return {
        tick: 0, evolveTick: 0, gameSeed: 0,
        p1: { cells: Array(25).fill('inactive'), active: [], score: 0, streak: 0, alive: false, anim: {}, health: 0, shield: false, shieldCount: 0, freezeEnd: 0, multiplierEnd: 0, gridStage: 0, stageProgress: 0, patternIdx: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 0 },
        p2: { cells: Array(25).fill('inactive'), active: [], score: 0, streak: 0, alive: false, anim: {}, health: 0, shield: false, shieldCount: 0, freezeEnd: 0, multiplierEnd: 0, gridStage: 0, stageProgress: 0, patternIdx: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 0 },
        cellShape: 'square', rareMode: { active: false, color: '', cssColor: '', turnsLeft: 0, shape: 'circle', emoji: '' },
        spinLevel: 0, paused: false, phase: 'playing',
        grid: { cols: 3, rows: 3, mask: null }, spinCfg: null, devRotationSpeed: 1,
        bossEvent: null, activeBomb: null, isInverted: false, isBlackout: false,
      } as GameSnapshot;
    }
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[this.p1.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    const cloneActive = (active: ActiveCell[]): ActiveCell[] => active.map(c => ({ ...c }));

    // Cache mask array — only re-copy when the source reference changes
    if (pat.mask !== this._cachedMaskSrc) {
      this._cachedMaskSrc = pat.mask ?? null;
      this._cachedMask = pat.mask ? [...pat.mask] : null;
    }

    // Memoize spinCfg — only recompute when spinLevel or gameSeed changes
    let spinCfg: { duration: number; direction: 1 | -1 } | null = null;
    if (this.config.mode === "evolve" && this.spinLevel >= 3) {
      if (this._cachedSpinLevel !== this.spinLevel || this._cachedSpinSeed !== this.gameSeed || this._cachedRotationSpeed !== this.devRotationSpeed) {
        const cfg = getSpinConfig(this.spinLevel, this.gameSeed);
        this._cachedSpinCfg = { ...cfg, duration: cfg.duration * this.devRotationSpeed };
        this._cachedSpinLevel = this.spinLevel;
        this._cachedSpinSeed = this.gameSeed;
        this._cachedRotationSpeed = this.devRotationSpeed;
      }
      spinCfg = this._cachedSpinCfg;
    } else {
      this._cachedSpinCfg = null;
      this._cachedSpinLevel = -1;
      this._cachedSpinSeed = -1;
    }

    return {
      tick:       this.tickCount,
      evolveTick: this.evolveTick,
      gameSeed:   this.gameSeed,
      p1:         { ...this.p1, cells: [...this.p1.cells], active: cloneActive(this.p1.active), anim: { ...this.p1.anim } },
      p2:         { ...this.p2, cells: [...this.p2.cells], active: cloneActive(this.p2.active), anim: { ...this.p2.anim } },
      cellShape:  this.cellShape,
      rareMode:   { ...this.rareMode },
      spinLevel:  this.spinLevel,
      paused:     this.paused,
      phase:      this.phase,
      grid: { cols: pat.cols, rows: pat.rows, mask: this._cachedMask },
      spinCfg,
      devRotationSpeed: this.devRotationSpeed,
      bossEvent:  this.bossEvent ? { ...this.bossEvent } : null,
      activeBomb: this.activeBomb ? { ...this.activeBomb } : null,
      isInverted: this._isInverted,
      isBlackout: this._isBlackout,
    };
  }

  getSpinConfig(level: number): { duration: number; direction: 1 | -1 } { return getSpinConfig(level, this.gameSeed); }

  // SESSION_SNAPSHOT_VERSION — bump ONLY for breaking schema changes (field rename/removal/type change).
  // Adding new optional fields with ?? defaults is NOT a breaking change and must NOT bump this.
  // Current breaking changes from v1→v2: added `p1.active`, `p2.active`, `bossEvent`, `activeBomb`.
  private static readonly SESSION_SNAPSHOT_VERSION = 2;

  getSessionSnapshot(): Record<string, unknown> {
    return {
      version: GameEngine.SESSION_SNAPSHOT_VERSION,
      ts: Date.now(),
      gameSeed: this.gameSeed,
      tickCount: this.tickCount,
      evolveTick: this.evolveTick,
      cellShape: this.cellShape,
      spinLevel: this.spinLevel,
      rareMode: { ...this.rareMode },
      isInverted: this._isInverted,
      nextShuffleTick: this.p1.nextShuffleTick,
      p2NextShuffleTick: this.p2.nextShuffleTick,
      bossEvent: this.bossEvent ? { type: this.bossEvent.type, endsAt: this.bossEvent.endsAt } : null,
      nextBossTriggerScore: this.nextBossTriggerScore,
      _bossActive: this._bossActive,
      _hitPauseUntil: this._hitPauseUntil,
      bossEngineActive: bossEngine.state.active,
      bossEngineShieldHits: bossEngine.state.shieldHits,
      activeBomb: this.activeBomb ? { idx: this.activeBomb.idx, expiresAt: this.activeBomb.expiresAt, player: this.activeBomb.player } : null,
      ddaSpawnRate: this.dda.spawnRate,
      hearts: this.p1.health,
      score: this.p1.score,
      timeLeft: GAME.HUMAN_LIMIT_TICK - this.tickCount,
      isPaused: this.paused,
      p1: {
        score: this.p1.score, health: this.p1.health, streak: this.p1.streak,
        gridStage: this.p1.gridStage, stageProgress: this.p1.stageProgress, patternIdx: this.p1.patternIdx,
        shield: this.p1.shield, shieldCount: this.p1.shieldCount,
        freezeEnd: this.p1.freezeEnd, multiplierEnd: this.p1.multiplierEnd,
        storedFreezeCharges: this.p1.storedFreezeCharges, storedShieldCharges: this.p1.storedShieldCharges,
        alive: this.p1.alive,
        active: this.p1.active.map(c => ({ ...c })),
      },
      p2: this.config.numPlayers === 2 ? {
        score: this.p2.score, health: this.p2.health, streak: this.p2.streak,
        gridStage: this.p2.gridStage, stageProgress: this.p2.stageProgress, patternIdx: this.p2.patternIdx,
        shield: this.p2.shield, shieldCount: this.p2.shieldCount,
        freezeEnd: this.p2.freezeEnd, multiplierEnd: this.p2.multiplierEnd,
        storedFreezeCharges: this.p2.storedFreezeCharges, storedShieldCharges: this.p2.storedShieldCharges,
        alive: this.p2.alive,
        active: this.p2.active.map(c => ({ ...c })),
      } : null,
    };
  }

  restoreSessionSnapshot(data: Record<string, unknown>): boolean {
    try {
      // Clear stale timers from any prior session before restoring
      this.clearAllTimeouts();
      this.clearAllDeltaTimers();
      if (!data || !data.gameSeed) return false;
      // Reject snapshots from incompatible versions to avoid silent state corruption
      const snapshotVersion = typeof data.version === 'number' ? data.version : 1;
      if (snapshotVersion < GameEngine.SESSION_SNAPSHOT_VERSION) {
        logError(`[GameEngine] Session snapshot version ${snapshotVersion} < current ${GameEngine.SESSION_SNAPSHOT_VERSION}, discarding`);
        return false;
      }
      // Create p1/p2 from snapshot if engine wasn't started (e.g. resume on reload)
      if (!this.p1 || !this.p2) {
        const n = 25; // 5×5 max grid
        const mkPlayer = (): PlayerState => ({
          cells: Array(n).fill('inactive') as CellType[], active: [], score: 0, streak: 0, alive: true,
          health: GAME.MAX_HEARTS, shield: false, shieldCount: 0, freezeEnd: 0, multiplierEnd: 0,
          gridStage: 0, stageProgress: 0, patternIdx: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 40,
          anim: {} as Record<number, string>,
        });
        if (!this.p1) this.p1 = mkPlayer();
        if (!this.p2) this.p2 = mkPlayer();
      }
      this.gameSeed = data.gameSeed as number;
      // #16 fix: fast-forward RNG to match tickCount so post-restore spawns
      // use the correct position in the seed sequence.
      this.rng = mulberry32(this.gameSeed);
      const rawTick = typeof data.tickCount === 'number' ? data.tickCount : 0;
      const rngStepsToSkip = Math.min(rawTick, GAME.HUMAN_LIMIT_TICK + 100); // Cap to prevent infinite loop from tampered data
      for (let i = 0; i < rngStepsToSkip; i++) this.rng();
      this.tickCount = rngStepsToSkip;
      this.evolveTick = (data.evolveTick as number) ?? 0;
      this.cellShape = (data.cellShape as CellShape) ?? "square";
      this.spinLevel = (data.spinLevel as number) ?? 0;
      if (data._hitPauseUntil != null) this._hitPauseUntil = Math.max(0, data._hitPauseUntil as number);
      if (data.rareMode) this.rareMode = stateGuard.sanitize(data.rareMode as Record<string, unknown>, this.rareMode as unknown as Record<string, unknown>) as unknown as RareColorMode;
      this._isInverted = (data.isInverted as boolean) ?? false;
      this.p1.nextShuffleTick = (data.nextShuffleTick as number) ?? 40;
      this.p2.nextShuffleTick = (data.p2NextShuffleTick as number) ?? 40;
      this.bossEvent = data.bossEvent ? { type: (data.bossEvent as Record<string, unknown>).type as BossEventType, endsAt: (data.bossEvent as Record<string, unknown>).endsAt as number } : null;
      this.nextBossTriggerScore = (data.nextBossTriggerScore as number) ?? 500;
      this._bossActive = (data._bossActive as boolean) ?? false;
      if (data.bossEngineActive) bossEngine.activate((data.bossEngineShieldHits as number) ?? 5);
      this.activeBomb = data.activeBomb ? { idx: (data.activeBomb as Record<string, unknown>).idx as number, expiresAt: (data.activeBomb as Record<string, unknown>).expiresAt as number, player: (data.activeBomb as Record<string, unknown>).player as 1 | 2 } : null;
      // Re-register bomb delta timer if bomb is still active
      if (this.activeBomb) {
        const bombRemaining = Math.max(0, this.activeBomb.expiresAt - Date.now());
        const bombPlayer = this.activeBomb.player;
        const bombIdx = this.activeBomb.idx;
        const bombRef = bombPlayer === 1 ? this.p1 : this.p2;
        this.addDeltaTimer(`bomb_${bombPlayer}_${bombIdx}`, bombRemaining, () => {
          if (!this.activeBomb || this.activeBomb.idx !== bombIdx || this.activeBomb.player !== bombPlayer) return;
          const stillActive = bombRef.active.find(c => c.idx === bombIdx && c.type === "bomb" && !c.clicked);
          if (!stillActive) { if (this.activeBomb?.idx === bombIdx) this.activeBomb = null; return; }
          this.activeBomb = null;
          stillActive.clicked = true;
          if (!this.devGodMode) {
            if (bombRef.shieldCount > 0) { bombRef.shieldCount -= 1; bombRef.shield = bombRef.shieldCount > 0; }
            else {
              const dmg = this.config.mode === "evolve" ? 0.5 : 1;
              bombRef.health = Math.max(0, bombRef.health - dmg); bombRef.shield = false;
              this._tookDamage = true;
              this.emit({ type: "damage", player: bombPlayer });
              this.emit({ type: "shake", player: bombPlayer });
              if (bombRef.health < 1) { bombRef.alive = false; this.triggerGameOver(this.config.numPlayers === 1 ? null : (bombPlayer === 1 ? "p2" : "p1")); }
            }
          }
          this.emit({ type: "bombExplode", player: bombPlayer });
          this.emit({ type: "toast", message: "💥 Bomb exploded!" });
        });
      }
      this.dda.reset((data.ddaSpawnRate as number) ?? 1200);
      const p1 = data.p1 as Record<string, unknown> | undefined;
      if (p1) {
        // Bounds checking — clamp values to prevent tampered session data
        this.p1.score = Math.max(0, Math.min(9999, (p1.score as number) ?? 0));
        this.p1.health = Math.max(0, Math.min(GAME.MAX_HEARTS + 2, (p1.health as number) ?? GAME.MAX_HEARTS));
        this.p1.streak = Math.max(0, Math.min(999, (p1.streak as number) ?? 0));
        this.p1.gridStage = Math.max(0, Math.min(10, (p1.gridStage as number) ?? 0));
        this.p1.stageProgress = Math.max(0, Math.min(999, (p1.stageProgress as number) ?? 0));
        this.p1.patternIdx = Math.max(0, Math.min(EVOLVE_PATTERNS.length - 1, (p1.patternIdx as number) ?? 0));
        this.p1.shield = (p1.shield as boolean) ?? false;
        this.p1.shieldCount = Math.max(0, Math.min(5, (p1.shieldCount as number) ?? 0));
        this.p1.freezeEnd = Math.max(0, (p1.freezeEnd as number) ?? 0);
        this.p1.multiplierEnd = Math.max(0, (p1.multiplierEnd as number) ?? 0);
        this.p1.storedFreezeCharges = Math.max(0, Math.min(10, (p1.storedFreezeCharges as number) ?? 0));
        this.p1.storedShieldCharges = Math.max(0, Math.min(10, (p1.storedShieldCharges as number) ?? 0));
        this.p1.alive = (p1.alive as boolean) ?? true;
        this.p1.active = ((p1.active as Array<Record<string, unknown>>) ?? []).map(c => {
          const cell = { ...c } as Record<string, unknown>;
          if (typeof cell.idx !== 'number' || (cell.idx as number) < 0) cell.idx = 0;
          if (!cell.type) cell.type = 'score';
          if (typeof cell.clicked !== 'boolean') cell.clicked = false;
          return cell as unknown as ActiveCell;
        });
        const pat = EVOLVE_PATTERNS[this.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
        this.p1.cells = activeToCellsP(this.p1.active, pat);
      }
      const p2 = data.p2 as Record<string, unknown> | null | undefined;
      if (p2 && this.config.numPlayers === 2) {
        this.p2.score = Math.max(0, Math.min(9999, (p2.score as number) ?? 0));
        this.p2.health = Math.max(0, Math.min(GAME.MAX_HEARTS + 2, (p2.health as number) ?? GAME.MAX_HEARTS));
        this.p2.streak = Math.max(0, Math.min(999, (p2.streak as number) ?? 0));
        this.p2.gridStage = Math.max(0, Math.min(10, (p2.gridStage as number) ?? 0));
        this.p2.stageProgress = Math.max(0, Math.min(999, (p2.stageProgress as number) ?? 0));
        this.p2.patternIdx = Math.max(0, Math.min(EVOLVE_PATTERNS.length - 1, (p2.patternIdx as number) ?? 0));
        this.p2.shield = (p2.shield as boolean) ?? false;
        this.p2.shieldCount = Math.max(0, Math.min(5, (p2.shieldCount as number) ?? 0));
        this.p2.freezeEnd = Math.max(0, (p2.freezeEnd as number) ?? 0);
        this.p2.multiplierEnd = Math.max(0, (p2.multiplierEnd as number) ?? 0);
        this.p2.storedFreezeCharges = Math.max(0, Math.min(10, (p2.storedFreezeCharges as number) ?? 0));
        this.p2.storedShieldCharges = Math.max(0, Math.min(10, (p2.storedShieldCharges as number) ?? 0));
        this.p2.alive = (p2.alive as boolean) ?? true;
        this.p2.active = ((p2.active as Array<Record<string, unknown>>) ?? []).map(c => {
          const cell = { ...c } as Record<string, unknown>;
          if (typeof cell.idx !== 'number' || (cell.idx as number) < 0) cell.idx = 0;
          if (!cell.type) cell.type = 'score';
          if (typeof cell.clicked !== 'boolean') cell.clicked = false;
          return cell as unknown as ActiveCell;
        });
        const pat2 = EVOLVE_PATTERNS[this.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
        this.p2.cells = activeToCellsP(this.p2.active, pat2);
      }
      this.emit({ type: "phaseChange", phase: "playing" });
      this.dirty = true;
      this.emitSnapshot();
      this.scheduleTick();
      this.startSnapshotRaf();
      return true;
    } catch (e) {
      logError("Session restore failed", e);
      return false;
    }
  }

  private autoSaveSession(): void {
    if (this.phase !== "playing" || this.paused) return;
    try {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(this.getSessionSnapshot()));
    } catch (e) { logError('autoSaveSession failed', e); }
  }

private triggerGameOver(winner: Winner): void {
    // Prevent double game over
    if (this._deathSlowdown || this.phase === "gameover") return;
    // Immediately set phase and emit game over events (logical end)
    this._deathSlowdown = true;
    this.hitPause(200); // Brief freeze on death
    this.phase = "gameover";
    this.emitSnapshot();
    this.emit({ type: "phaseChange", phase: "gameover" });
    this.emit({ type: "gameOver", winner });

    // Mode win achievements
    if (winner === "p1" || winner === "tie") {
      if (this.config.mode === "classic") achievementSystem.unlock('classic_win');
      if (this.config.mode === "evolve") achievementSystem.unlock('evolve_win');
    }

    // Game count achievements — read current count; hook layer handles the localStorage increment
    const gamesPlayed = Math.max(0, Math.min(99999, parseInt(localStorage.getItem('dtp-games-played') || '0') || 0)) + 1;
    achievementSystem.check('games_50', () => gamesPlayed >= 50);
    achievementSystem.check('games_200', () => gamesPlayed >= 200);

    // Perfect round — no damage taken
    achievementSystem.check('perfect_round', () => !this._tookDamage && this.tickCount > 100);

    // Reset per-game counters
    this._shieldCollected = 0;
    this._freezeCollected = 0;
    this._purpleTaps = 0;
    this._tookDamage = false;

    // Death slow-motion: visually slow for 600ms before cleanup
    if (this._deathCleanupTimer) clearTimeout(this._deathCleanupTimer);
    this._deathCleanupTimer = setTimeout(() => {
      this._deathCleanupTimer = null;
      if (this.phase !== 'gameover') return; // New game started during cleanup window
      this._deathSlowdown = false;
      this.tapBuffer = { 1: null, 2: null };
      this.holdTimers.clear();
      this.clearAllDeltaTimers();
      this.stop();
      const cur = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
      this.config.storage?.saveStoredPowerups({
        freeze: Math.max(0, this.p1.storedFreezeCharges ?? 0),
        shield: Math.max(0, this.p1.storedShieldCharges ?? 0),
        mult: cur.mult,
        heart: cur.heart,
      });
    }, 600);
    analytics.track('game_over', { score: this.p1.score, mode: this.config.mode, winner });
    this.dda.reset(this._config.grid.spawnRateMs);
    if (!this.daily.isTodayComplete()) {
      this.daily.markComplete(this.p1.score, this.tickCount);
      // daily_master unlock moved to useDailyProgress — only fires when checkObjective confirms completion
    }
  }

  startBot(): void { this._bot.start(this.config.mode, this.config.botAssist); }

  stopBot(): void { this._bot.stop(); }

  isBotActive(): boolean { return this._bot.isActive(); }

  setBotAssist(player: 1 | 2, enabled: boolean): void {
    this._bot.setAssist(player, enabled);
    if (player === 1 && enabled) this._bot.start(this.config.mode, this.config.botAssist);
  }

  getBotAssistActive(): { 1: boolean; 2: boolean } { return this._bot.getAssistState(); }
}
```

## File: engine/DifficultyScaler.ts
```typescript
import { DIFFICULTY } from "../config/difficulty";
import { difficultyOverrides } from "../config/difficultyOverrides";

// ─── Read overrides on each call (not at module load) ─────────────
function _initMs() { return difficultyOverrides.INIT_MS ?? DIFFICULTY.INIT_MS; }
function _minMs() { return difficultyOverrides.MIN_MS ?? DIFFICULTY.MIN_MS; }
function _decayExp() { return difficultyOverrides.DECAY_EXP ?? DIFFICULTY.DECAY_EXP; }
function _decayEvery() { return difficultyOverrides.DECAY_EVERY ?? DIFFICULTY.DECAY_EVERY; }
function _spinBaseDuration() { return difficultyOverrides.SPIN_BASE_DURATION ?? DIFFICULTY.SPIN_BASE_DURATION; }
function _spinGrowth() { return difficultyOverrides.SPIN_GROWTH ?? DIFFICULTY.SPIN_GROWTH; }
function _spinSpeedCap() { return difficultyOverrides.SPIN_SPEED_CAP ?? DIFFICULTY.SPIN_SPEED_CAP; }
function _spinEpochLevels() { return difficultyOverrides.SPIN_EPOCH_LEVELS ?? DIFFICULTY.SPIN_EPOCH_LEVELS; }

// ─── Tick interval (ms) ───────────────────────────────────────────
export function computeMs(tick: number, mult = 1): number {
  return Math.max(
    _minMs(),
    _initMs() * Math.pow(_decayExp(), Math.floor(tick / _decayEvery())) * mult
  );
}

// ─── Speed display helpers ────────────────────────────────────────
export function speedLabel(tick: number, frozen: boolean): string {
  return (_initMs() / computeMs(tick, frozen ? 1.4 : 1)).toFixed(1) + "×";
}

export function speedPct(tick: number): number {
  const initMs = _initMs(), minMs = _minMs();
  return Math.max(
    4,
    ((initMs - computeMs(tick)) / (initMs - minMs)) * 96
  );
}

// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────
export function mulberry32(seed: number): () => number {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeGameSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

// ─── Spin config ──────────────────────────────────────────────────
export function getSpinConfig(
  level: number,
  gameSeed: number
): { duration: number; direction: 1 | -1 } {
  const rawDur = _spinBaseDuration() * Math.pow(1 - _spinGrowth(), level);
  const duration = Math.max(_spinSpeedCap(), rawDur);
  const epoch = Math.floor(level / _spinEpochLevels());
  const epochSeed = (gameSeed ^ (epoch * 0x9e3779b9)) >>> 0;
  const rng = mulberry32(epochSeed);
  const direction: 1 | -1 = rng() > 0.5 ? 1 : -1;
  return { duration, direction };
}
```

## File: engine/rng.ts
```typescript
## File: engine/input-smoothing.ts
```typescript
## File: engine/subsystems/TickProcessor.ts
```typescript
import { GAME } from "../../config/difficulty";
import { BALANCE } from "../../config/gameBalance";
import { EVOLVE_PATTERNS, RARE_COLORS } from "../../config/gridPatterns";
import { logError } from "../../utils/devLog";
import { haptics } from "../../utils/haptics";
import { errorTracker } from "../../utils/error-tracker";
import { bossEngine } from "../../utils/boss-engine";
import { rhythmFeedback } from "../../utils/feedback-rhythm";
import { spawnActive, activeToCellsP, pickPattern, pickCellShape } from "./CellLifecycle";
import {
  getNextBossEventType, getBossDuration, getBossLabel, getBossDoneLabel,
  getNextBossTriggerScore, shouldTriggerShieldBoss,
} from "./EventOrchestrator";
import type { ActiveCell, CellShape, GameConfig, GameEvent, GameSnapshot, PlayerState, RareColorMode, Winner, BombCell, BossEvent, NumPlayers } from "../types";

export interface TickContext {
  config: GameConfig;
  phase: GameSnapshot["phase"];
  tickCount: number;
  evolveTick: number;
  cellShape: CellShape;
  rareMode: RareColorMode;
  spinLevel: number;
  p1: PlayerState;
  p2: PlayerState;
  bossEvent: BossEvent | null;
  _bossActive: boolean;
  _isInverted: boolean;
  _isBlackout: boolean;
  nextBossTriggerScore: number;
  activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null;
  dirty: boolean;
  _tickSoundCounter: number;
  _lastTickTs: number;
  now: number; // Cached Date.now() for the current tick
  numPlayers: NumPlayers;
  _deltaTimers: Array<{ id: string; remaining: number; duration: number; callback: () => void }>;
  devGodMode: boolean;
  devFreezeTime: boolean;
  devForcedPwr: "shield" | "freeze" | "heart" | null;
  dda: { recordAttempt(success: boolean, reaction: number, miss: boolean): void; spawnRate: number };

  emit(event: GameEvent): void;
  _flushTapBuffer(player: 1 | 2): void;
  checkStageProgress(player: 1 | 2): void;
  autoSaveSession(): void;
  triggerGameOver(winner: Winner): void;
  scheduleTimeout(cb: () => void, ms: number): ReturnType<typeof setTimeout>;
  addDeltaTimer(id: string, durationMs: number, callback: () => void): void;
  removeDeltaTimer(id: string): void;
  readonly rng: () => number;
}

const _slotsCache = new WeakMap<{ cols: number; rows: number; mask: number[] | null }, Set<number>>();

export class TickProcessor {
  processTick(ctx: TickContext): void {
    try {
    if (ctx.phase !== "playing") return;
    const now = performance.now();
    const delta = Math.min(now - ctx._lastTickTs, 100);
    ctx._lastTickTs = now;
    // Snapshot current timers; callbacks may add/remove via addDeltaTimer/removeDeltaTimer
    const snapshot = [...ctx._deltaTimers];
    const expiredCallbacks: Array<() => void> = [];
    const kept: typeof ctx._deltaTimers = [];

    for (const timer of snapshot) {
      timer.remaining -= delta;
      if (timer.remaining <= 0) {
        expiredCallbacks.push(timer.callback);
      } else {
        kept.push(timer);
      }
    }

    // Fire expired callbacks (may modify ctx._deltaTimers via add/removeDeltaTimer)
    for (const cb of expiredCallbacks) cb();

    // After callbacks: newly added timers are those NOT in the snapshot (by reference)
    const snapshotSet = new Set(snapshot);
    const newlyAdded = ctx._deltaTimers.filter(t => !snapshotSet.has(t));

    // kept = non-expired from snapshot MINUS any removed by callbacks via removeDeltaTimer
    const currentSet = new Set(ctx._deltaTimers);
    ctx._deltaTimers = [...kept.filter(t => currentSet.has(t)), ...newlyAdded];

    // If a delta timer callback triggered game over, bail out of the rest of the tick
    if (ctx.phase !== "playing") return;

    const mode = ctx.config.mode;
    ctx._flushTapBuffer(1);
    if (ctx.numPlayers === 2) ctx._flushTapBuffer(2);
    ctx.evolveTick += 1;
    if (mode === "evolve") ctx.cellShape = pickCellShape(ctx.evolveTick);

    if (mode === "evolve") {
      if (ctx.rareMode.active) {
        ctx.rareMode.turnsLeft -= 1;
        if (ctx.rareMode.turnsLeft <= 0) {
          ctx.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
          ctx.emit({ type: "toast", message: "🟣 Back to Purple!" });
        }
      } else {
        // Rare color events — already inside mode === "evolve" guard
        const s1 = ctx.p1.score;
        const { triggerInterval, warnThreshold, minScore, modCheck, chance, minTurns, bonusTurns } = BALANCE.rare;
        if (
          s1 > 0 &&
          (s1 % triggerInterval) === (triggerInterval - warnThreshold)
        ) {
          ctx.emit({ type: "toast", message: "⚠️ Danger color changing soon!" });
        }
        if (s1 >= minScore && s1 % 50 < modCheck && ctx.rng() < chance) {
          const pick = RARE_COLORS[Math.floor(ctx.rng() * RARE_COLORS.length)];
          ctx.rareMode = { active: true, color: pick.color, cssColor: pick.cssColor, turnsLeft: minTurns + Math.floor(ctx.rng() * bonusTurns), shape: pick.shape, emoji: pick.emoji };
          ctx.emit({ type: "rareStart", color: pick.color, cssColor: pick.cssColor });
          ctx.emit({ type: "sound", name: "rareStart" });
          ctx.emit({ type: "toast", message: `⚠️ Don't Touch ${pick.color.toUpperCase()}!` });
        }
      }
    }

    const players: Array<{ ref: PlayerState; pi: 0 | 1 }> = [{ ref: ctx.p1, pi: 0 }, { ref: ctx.p2, pi: 1 }];
    for (const { ref, pi } of players) {
      if (!ref.alive || (pi === 1 && ctx.numPlayers === 1)) continue;
      if (ref.pendingStageUpdate) {
        ref.pendingStageUpdate = false; ref.gridStage += 1; ref.stageProgress = 0;
        if (ctx.config.inputMode !== 'keys') {
          ctx.spinLevel += 1;
        }
        ctx.emit({ type: "sound", name: "levelup" });
        ctx.emit({ type: "levelUp", player: (pi + 1) as 1 | 2, stage: ref.gridStage });
        haptics.levelUp();
      }
      const curStage = ref.gridStage;
      const patIdx = ref.patternIdx;
      const pat = mode === "evolve" ? (EVOLVE_PATTERNS[patIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      if (!pat || pat.cols === 0) { logError("[DTP-002]"); continue; }
      let validSlots = _slotsCache.get(pat);
      if (!validSlots) { validSlots = new Set(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)); _slotsCache.set(pat, validSlots); }
      const dangerColor = ctx.rareMode.active ? ctx.rareMode.color : "purple";
      ctx._isInverted = ctx.bossEvent?.type === "inversion" && ctx.now < (ctx.bossEvent?.endsAt ?? 0);
      ctx._isBlackout  = ctx.bossEvent?.type === "blackout"  && ctx.now < (ctx.bossEvent?.endsAt ?? 0);

      const player = (pi + 1) as 1 | 2;

      ref.active.forEach(c => {
        if (!validSlots.has(c.idx) || c.clicked) return;
        const isPwr = ["medpack","shield","freeze","multiplier","ice","hold","bomb"].includes(c.type);
        const isMiss = ctx._isInverted ? c.type === "purple" : c.type !== dangerColor && !isPwr;
        if (isMiss) {
          const dmg = mode === "evolve" ? 0.5 : 1;
          if (!ctx.devGodMode) {
            if (ref.shieldCount > 0) { ctx.dda.recordAttempt(false, 0, false); ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
            else {
              ctx.dda.recordAttempt(false, 0, true);
              ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
              ctx.emit({ type: "damage", player }); ctx.emit({ type: "shake", player });
              if (ref.health < 1) {
                ref.alive = false;
                const other = ctx.numPlayers === 2 ? (pi === 0 ? ctx.p2.alive : ctx.p1.alive) : false;
                ctx.triggerGameOver(ctx.numPlayers === 1 ? null : other ? (pi === 0 ? "p2" : "p1") : "tie");
              }
            }
          }
          haptics.damage();
          if (ref.streak >= 5) ctx.emit({ type: "toast", message: `🔥 ${ref.streak} streak lost!` });
          ref.streak = 0;
        }
      });
      if (!ref.alive) continue;

if (ref.active.some(c => !c.clicked && c.type === "ice")) { ref.cells = activeToCellsP(ref.active, pat); continue; }
      const nextPatIdx = mode === "evolve" ? pickPattern(ctx.rng, curStage, patIdx, ref.score) : 0;
      ref.patternIdx = nextPatIdx;
      const nextPat = mode === "evolve" ? (EVOLVE_PATTERNS[nextPatIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      const rareColor = ctx.rareMode.active ? ctx.rareMode.color : undefined;
      const rareShape = ctx.rareMode.active ? ctx.rareMode.shape : undefined;
      const spawnStage = mode === "evolve" ? curStage : Math.min(Math.floor(ctx.tickCount / 12), 7);
      const newActive = spawnActive(ctx.rng, spawnStage, ref.health, nextPat, mode === "evolve", rareColor, rareShape, ctx.tickCount, ctx.devGodMode);
      if (ctx.devForcedPwr && newActive.length > 0) {
        newActive[0] = { ...newActive[0], type: (ctx.devForcedPwr === "heart" ? "medpack" : ctx.devForcedPwr) } as ActiveCell;
        if (pi === 0) ctx.devForcedPwr = null;
      }
      ref.active = newActive;
      ref.cells = activeToCellsP(newActive, nextPat);
      for (const c of newActive) {
        if (["medpack", "shield", "freeze", "multiplier"].includes(c.type)) {
          ref.anim[c.idx] = "pwr-drop";
          ctx.scheduleTimeout(() => { if (ref.anim[c.idx] === "pwr-drop") { ref.anim = { ...ref.anim }; delete ref.anim[c.idx]; } }, 600);
        }
      }
    }

    // Cell shuffle + boss event + bomb spawn
    if (mode === "evolve") {
      const stormActive = ctx.bossEvent?.type === "storm" && ctx.now < (ctx.bossEvent?.endsAt ?? 0);
      const shufflePat = EVOLVE_PATTERNS[ctx.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
      if (stormActive) {
        ctx.p1.nextShuffleTick = 0;
        ctx.p2.nextShuffleTick = 0;
        if (ctx.p1.alive) this._tryShuffleCells(ctx, ctx.p1, shufflePat, 1);
        if (ctx.numPlayers === 2 && ctx.p2.alive) {
          const p2Pat = EVOLVE_PATTERNS[ctx.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
          this._tryShuffleCells(ctx, ctx.p2, p2Pat, 2);
        }
      } else {
        if (ctx.p1.alive) this._tryShuffleCells(ctx, ctx.p1, shufflePat, 1);
        if (ctx.numPlayers === 2 && ctx.p2.alive) {
          const p2Pat = EVOLVE_PATTERNS[ctx.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
          this._tryShuffleCells(ctx, ctx.p2, p2Pat, 2);
        }
      }

      if (ctx.p1.score >= ctx.nextBossTriggerScore) this._triggerBossEvent(ctx);

      if (ctx.p1.alive) {
        const bombPat = EVOLVE_PATTERNS[ctx.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
        this._trySpawnBomb(ctx, ctx.p1, 1, bombPat);
      }
      if (ctx.numPlayers === 2 && ctx.p2.alive) {
        const bombPat2 = EVOLVE_PATTERNS[ctx.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
        this._trySpawnBomb(ctx, ctx.p2, 2, bombPat2);
      }
    }

    if (shouldTriggerShieldBoss(ctx.p1.score, ctx._bossActive, ctx.bossEvent !== null, mode, ctx.rng)) {
      ctx._bossActive = true;
      bossEngine.activate(BALANCE.boss.shieldBaseHits + Math.floor(ctx.rng() * BALANCE.boss.shieldBonusHits));
    }

    ctx.tickCount += 1;
    if (ctx.tickCount % 10 === 0) ctx.autoSaveSession();
    if (ctx.phase === "playing" && ctx.tickCount >= GAME.HUMAN_LIMIT_TICK) { ctx.phase = "humanlimit"; ctx.emit({ type: "phaseChange", phase: "humanlimit" }); }
    if (ctx.tickCount > GAME.SURVIVAL_BONUS_START_TICK && ctx.tickCount % BALANCE.survival.interval === 0) {
      const bonus = ctx.tickCount > BALANCE.survival.lateThreshold ? BALANCE.survival.lateAmount : ctx.tickCount > BALANCE.survival.midThreshold ? BALANCE.survival.midAmount : BALANCE.survival.earlyAmount;
      const multBonus = Math.round(bonus * rhythmFeedback.state.multiplier);
      if (ctx.p1.alive) ctx.p1.score += multBonus;
      if (ctx.numPlayers === 2 && ctx.p2.alive) ctx.p2.score += multBonus;
      ctx.emit({ type: "toast", message: `🔵 Survival +${multBonus}!` });
    }
    ctx.dirty = true;
    ctx._tickSoundCounter++;
    if (ctx._tickSoundCounter % 4 === 0) {
      ctx.emit({ type: "sound", name: "tick" });
    }
    } catch (err) {
      logError("[TickProcessor] processTick crashed:", err);
      errorTracker.capture(err instanceof Error ? err : new Error(String(err)), { phase: 'processTick', tick: ctx.tickCount });
      ctx.emit({ type: "toast", message: "⚠️ Engine error — game ended" });
      try { ctx.triggerGameOver(null); } catch (inner) {
        logError("[TickProcessor] triggerGameOver failed in catch:", inner);
      }
    }
  }

  // Shuffle cells — 1-2 cells slide to adjacent empty positions
  private _tryShuffleCells(ctx: TickContext, ref: PlayerState, pat: { cols: number; rows: number; mask: number[] | null }, player: 1 | 2): void {
    if (ctx.config.mode !== "evolve" || ref.gridStage < 3) return;
    if (ctx.tickCount < ref.nextShuffleTick) return;

    ref.nextShuffleTick = ctx.tickCount + BALANCE.shuffle.minInterval + Math.floor(ctx.rng() * BALANCE.shuffle.bonusInterval);

    const { cols, rows } = pat;
    let validSlots = _slotsCache.get(pat);
    if (!validSlots) { validSlots = new Set(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)); _slotsCache.set(pat, validSlots); }

    const occupied = new Set<number>(ref.active.filter(c => !c.clicked).map(c => c.idx));
    const empty = [...validSlots].filter(i => !occupied.has(i));
    if (empty.length === 0) return;

    const shuffleCount = 1 + (ctx.rng() < BALANCE.shuffle.secondShuffleChance ? 1 : 0);
    const candidates = ref.active.filter(c =>
      !c.clicked &&
      validSlots.has(c.idx) &&
      c.type !== "hold" &&
      c.type !== "ice" &&
      c.type !== "bomb"
    );

    if (candidates.length === 0) return;

    const moved: number[] = [];
    for (let i = 0; i < Math.min(shuffleCount, candidates.length); i++) {
      if (empty.length === 0) break;

      // Pick a candidate that hasn't been moved yet (retry up to candidates.length times)
      let cell: typeof candidates[number] | null = null;
      for (let attempt = 0; attempt < candidates.length; attempt++) {
        const cIdx = Math.floor(ctx.rng() * candidates.length);
        if (!moved.includes(candidates[cIdx].idx)) { cell = candidates[cIdx]; break; }
      }
      if (!cell) continue;

      const adjacent = this._getAdjacentSlots(cell.idx, cols, rows, validSlots)
        .filter(s => !occupied.has(s) && !moved.includes(s));
      const targetPool = adjacent.length > 0 ? adjacent : empty.filter(s => !moved.includes(s));
      if (targetPool.length === 0) continue;

      const toIdx = targetPool[Math.floor(ctx.rng() * targetPool.length)];

      const fromIdx = cell.idx;
      cell.idx = toIdx;
      occupied.delete(fromIdx);
      occupied.add(toIdx);
      const emptyI = empty.indexOf(toIdx);
      if (emptyI !== -1) empty.splice(emptyI, 1);
      empty.push(fromIdx);
      moved.push(toIdx);

      if (!ref.slideAnim) ref.slideAnim = {};
      ref.slideAnim[toIdx] = { fromIdx, startMs: Date.now() };

      ctx.scheduleTimeout(() => {
        if (ref.slideAnim) { ref.slideAnim = { ...ref.slideAnim }; delete ref.slideAnim[toIdx]; }
        ctx.dirty = true;
      }, BALANCE.shuffle.slideCleanupMs);

      ctx.emit({ type: "cellShuffle", player, fromIdx, toIdx });
      ctx.emit({ type: "sound", name: "shuffle" });
    }

    if (moved.length > 0) {
      ref.cells = activeToCellsP(ref.active, pat);
      ctx.dirty = true;
    }
  }

  private _getAdjacentSlots(idx: number, cols: number, rows: number, validSlots: Set<number>): number[] {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const adj: number[] = [];
    if (row > 0)        { const n = idx - cols; if (validSlots.has(n)) adj.push(n); }
    if (row < rows - 1) { const n = idx + cols; if (validSlots.has(n)) adj.push(n); }
    if (col > 0)        { const n = idx - 1;    if (validSlots.has(n)) adj.push(n); }
    if (col < cols - 1) { const n = idx + 1;    if (validSlots.has(n)) adj.push(n); }
    return adj;
  }

  private _trySpawnBomb(ctx: TickContext, ref: PlayerState, player: 1 | 2, pat: { cols: number; rows: number; mask: number[] | null }): void {
    if (ctx.activeBomb) return;
    if (ref.score < BALANCE.bomb.minScore) return;
    if (ctx.rng() > BALANCE.bomb.spawnChance) return;

    const validSlots = pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i);
    const occupied = new Set(ref.active.filter(c => !c.clicked).map(c => c.idx));
    const free = validSlots.filter(i => !occupied.has(i));
    if (free.length === 0) return;

    const idx = free[Math.floor(ctx.rng() * free.length)];
    const expiresAt = Date.now() + BALANCE.bomb.fuseTimeMs;
    const bomb: BombCell = { idx, clicked: false, type: "bomb", expiresAt };
    ref.active.push(bomb);
    ref.cells = activeToCellsP(ref.active, pat);
    ctx.activeBomb = { idx, expiresAt, player };
    ctx.dirty = true;
    ctx.emit({ type: "bombSpawn", player, idx, expiresAt });
    haptics.bomb();
    ctx.emit({ type: "sound", name: "bomb" });
    ctx.emit({ type: "toast", message: "💣 BOMB! Tap it!" });

    ctx.addDeltaTimer(`bomb_${player}_${idx}`, BALANCE.bomb.fuseTimeMs, () => {
      if (!ctx.activeBomb || ctx.activeBomb.idx !== idx || ctx.activeBomb.player !== player) return;
      const stillActive = ref.active.find(c => c.idx === idx && c.type === "bomb" && !c.clicked);
      if (!stillActive) { if (ctx.activeBomb?.idx === idx) ctx.activeBomb = null; return; }
      stillActive.clicked = true;
      ctx.activeBomb = null;
      if (!ctx.devGodMode) {
        if (ref.shieldCount > 0) { ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
        else {
          const dmg = ctx.config.mode === "evolve" ? 0.5 : 1;
          ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
          ctx.emit({ type: "damage", player }); ctx.emit({ type: "shake", player });
          if (ref.health < 1) {
            ref.alive = false;
            ctx.triggerGameOver(ctx.numPlayers === 1 ? null : (player === 1 ? "p2" : "p1"));
          }
        }
      }
      ctx.emit({ type: "bombExplode", player });
      ctx.emit({ type: "toast", message: "💥 Bomb exploded!" });
      // Use the pattern captured at spawn time (pat), not the current one,
      // because the grid may have changed during the fuse delay.
      ref.cells = activeToCellsP(ref.active, pat);
      ctx.dirty = true;
    });
  }

  private _triggerBossEvent(ctx: TickContext): void {
    const prevType = ctx.bossEvent?.type ?? null;
    const type = getNextBossEventType(prevType);
    const durationMs = getBossDuration(type);
    ctx.bossEvent = { type, endsAt: Date.now() + durationMs };
    ctx.nextBossTriggerScore = getNextBossTriggerScore(ctx.nextBossTriggerScore);
    ctx.emit({ type: "bossStart", bossType: type });
    ctx.emit({ type: "sound", name: "bossStart" });
    ctx.emit({ type: "toast", message: getBossLabel(type) });
    ctx.scheduleTimeout(() => {
      if (ctx.bossEvent?.type === type) {
        const completedType = type;
        ctx.bossEvent = null;
        ctx.dirty = true;
        ctx.emit({ type: "toast", message: getBossDoneLabel(completedType) });
        // Inversion survival achievement
        if (completedType === "inversion") {
          // Dynamic import to avoid circular dependency
          import('../../utils/achievements').then(m => m.achievementSystem.unlock('boss_inversion')).catch(() => {});
        }
      }
    }, durationMs);
  }
}
```

## File: engine/subsystems/CellLifecycle.ts
```typescript
import { GAME } from "../../config/difficulty";
import { STAGES, EVOLVE_PATTERNS } from "../../config/gridPatterns";
import { POWERUP_TABLE } from "../../config/powerupWeights";
import type { ActiveCell, CellType, CellShape } from "../types";

const SAFE: CellType[] = [
  "white","blue","red","orange","yellow",
  "green","cyan","lime","teal","pink","rose","magenta",
];

function randCell(rng: () => number, tick = 0, isClassic = false): CellType {
  const purpleChance = isClassic
    ? Math.min(0.42, 0.22 + Math.floor(tick / 20) * 0.02)
    : 0.22;
  if (rng() < purpleChance) return "purple";
  return SAFE[Math.floor(rng() * SAFE.length)];
}

export function pickCellShape(tick: number): CellShape {
  const cycle = Math.floor(tick / 6) % 8;
  if (cycle === 0) return "square";
  if (cycle === 1) return "triangle";
  if (cycle === 2) return "circle";
  if (cycle === 3) return "roundedTriangle";
  if (cycle === 4) return "mixed";
  if (cycle === 5) return "triangle";
  if (cycle === 6) return "square";
  return "mixed";
}

export function activeToCellsP(
  active: ActiveCell[],
  pattern: { cols: number; rows: number; mask: number[] | null }
): CellType[] {
  const cells: CellType[] = new Array(25).fill("inactive");
  const { cols, rows, mask } = pattern;
  const gridTotal = cols * rows;
  if (mask) {
    const maskSet = new Set(mask);
    for (let i = 0; i < gridTotal; i++) {
      if (!maskSet.has(i)) cells[i] = "void" as CellType;
    }
  }
  active.forEach(c => { if (!c.clicked && c.idx >= 0 && c.idx < cells.length) cells[c.idx] = c.type; });
  return cells;
}

// Pre-computed base powerup table (health-independent portion)
const BASE_POWERUP_TABLE = POWERUP_TABLE.filter(p => p.type !== 'medpack');
const BASE_POWERUP_WEIGHT = BASE_POWERUP_TABLE.reduce((s, p) => s + p.weight, 0);
const MEDPACK_BASE_WEIGHT = POWERUP_TABLE.find(p => p.type === 'medpack')?.weight ?? 7;

export function spawnActive(
  rng: () => number,
  stage: number,
  health: number,
  patternOverride?: { cols: number; rows: number; mask: number[] | null },
  isEvolve?: boolean,
  rareColor?: string,
  rareShape?: CellShape,
  tick = 0,
  godMode = false
): ActiveCell[] {
  const pat = patternOverride ?? STAGES[Math.min(stage, STAGES.length - 1)];
  const { mask } = pat;
  const total = pat.cols * pat.rows;
  const validSlots = mask ? [...mask] : Array.from({ length: total }, (_, i) => i);
  const validCount = validSlots.length;

  const minCount = Math.min(2 + Math.floor(stage * 0.4), validCount - 1);
  const maxCount = Math.min(2 + Math.floor(stage * 0.6), Math.min(validCount - 1, 5));
  const count = Math.max(1, minCount + Math.floor(rng() * (maxCount - minCount + 1)));

  const pool = [...validSlots];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const idxs = pool.slice(0, count);

  let powerup: CellType | null = null;
  const powerupEligible = isEvolve ? stage >= 2 : true;
  // Use pre-computed base table — only adjust medpack weight dynamically
  const medpackWeight = (!godMode && health < GAME.MAX_HEARTS) ? MEDPACK_BASE_WEIGHT + 10 : (godMode ? 0 : MEDPACK_BASE_WEIGHT);
  const totalWeight = BASE_POWERUP_WEIGHT + medpackWeight;
  if (powerupEligible && totalWeight > 0) {
    const roll = rng() * 100;
    if (roll < totalWeight) {
      let cursor = 0;
      // Check medpack first
      if (medpackWeight > 0) {
        cursor += medpackWeight;
        if (roll < cursor) { powerup = 'medpack' as CellType; }
      }
      if (!powerup) {
        for (const p of BASE_POWERUP_TABLE) {
          cursor += p.weight;
          if (roll < cursor) { powerup = p.type as CellType; break; }
        }
      }
    }
  }

  let evolveSpecial: CellType | null = null;
  if (isEvolve && stage >= 2) { // Special cells start at stage 2 (was 3 — reduces difficulty spike)
    const r = rng();
    if (r < 0.12) evolveSpecial = "ice"; // Only ice — hold cells removed (contradict tap-based core)
  }

  return idxs.map((idx, i) => {
    if (i === 0 && powerup) return { idx, clicked: false, type: powerup } as ActiveCell;
    if (i === 0 && evolveSpecial === "ice") {
      return { idx, clicked: false, type: "ice", iceCount: 2 + Math.floor(rng() * 3) };
    }
    const baseType = randCell(rng, tick, !isEvolve);
    if (rareColor && baseType === "purple") return { idx, clicked: false, type: rareColor, shape: rareShape } as ActiveCell;
    return { idx, clicked: false, type: baseType } as ActiveCell;
  });
}

export function pickPattern(rng: () => number, stage: number, lastIdx: number, score: number): number {
  const valid = EVOLVE_PATTERNS
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.minStage <= stage)
    .filter(({ p }) => {
      if (score < 20)  return p.cols <= 2 && p.rows <= 2;
      if (score < 50)  return p.cols <= 3 && p.rows <= 3;
      if (score < 120) return p.cols <= 3 && p.rows <= 4;
      if (score < 250) return p.cols <= 4 && p.rows <= 4;
      return true;
    });
  if (valid.length <= 1) return valid[0]?.i ?? 0;
  const filtered = valid.filter(({ i }) => i !== lastIdx);
  const pick = filtered[Math.floor(rng() * filtered.length)];
  return pick?.i ?? valid[0].i;
}
```

## File: engine/subsystems/BotController.ts
```typescript
import { BALANCE } from '../../config/gameBalance';
import { logger } from '../../utils/logger';

export interface BotConfig {
  getDust: () => number;
  spendDust: (amount: number) => void;
  getAccuracy: () => number;
}

export interface BotCallbacks {
  getDangerColor: () => string;
  isInverted: () => boolean;
  handleTap: (player: 1 | 2, idx: number) => void;
  emit: (event: { type: string; [k: string]: unknown }) => void;
  getActiveCells: (player: 1 | 2) => import('../types').ActiveCell[];
  isPlaying: () => boolean;
}

export class BotController {
  private _active: { 1: boolean; 2: boolean } = { 1: false, 2: false };
  private _intervalRef: ReturnType<typeof setInterval> | null = null;
  private _pendingTaps: ReturnType<typeof setTimeout>[] = [];
  private _dustSpentTotal = 0;
  private _rng: (() => number) | null = null;

  constructor(private callbacks: BotCallbacks) {}

  setRng(rng: () => number) { this._rng = rng; }

  start(mode: string, config?: BotConfig): void {
    if (mode !== 'evolve') return;
    this._stop();

    const botCfg: BotConfig = config ?? {
      getDust: () => 9999,
      spendDust: () => {},
      getAccuracy: () => 1,
    };

    this._active[1] = true;
    this._dustSpentTotal = 0;

    this._intervalRef = setInterval(() => {
      if (!this._active[1] || !this.callbacks.isPlaying()) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      const dust = botCfg.getDust();
      if (dust < BALANCE.bot.minDustToStart) {
        this._active[1] = false;
        this.callbacks.emit({ type: 'toast', message: '🤖 Bot off — low dust!' });
        return;
      }

      const delay = Math.max(BALANCE.bot.minDelayMs, BALANCE.bot.baseDelayMs - this._dustSpentTotal * BALANCE.bot.delayReductionPerTap);
      const accuracy = botCfg.getAccuracy();
      const danger = this.callbacks.getDangerColor();
      const inverted = this.callbacks.isInverted();
      const costPerTap = BALANCE.bot.baseCostPerTap;
      const rng = this._rng ?? Math.random;

      // Issue 26: Process cells for all active players (P1 and P2)
      for (const player of ([1, 2] as const)) {
        if (!this._active[player]) continue;
        for (const cell of this.callbacks.getActiveCells(player)) {
          if (cell.clicked) continue;
          if ((cell.type as string) === 'void') continue;
          if (cell.type === 'hold' || cell.type === 'ice') continue;
          // During inversion: only purple is safe; normal play: skip danger color
          if (inverted ? cell.type !== 'purple' : cell.type === danger) continue;
          if (rng() > accuracy) continue;

          const dustNow = botCfg.getDust();
          if (dustNow < costPerTap) break;

          botCfg.spendDust(costPerTap);
          this._dustSpentTotal += costPerTap;
          this.callbacks.emit({ type: 'dustConsumed', amount: costPerTap });

          const idx = cell.idx;
          const expectedType = cell.type;
          const tapPlayer = player;
          const tapTimer = setTimeout(() => {
            this._pendingTaps = this._pendingTaps.filter(t => t !== tapTimer);
            if (!this._active[tapPlayer] || !this.callbacks.isPlaying()) return;
            // Verify cell at idx is still the same safe cell (could have been replaced by a new spawn)
            const current = this.callbacks.getActiveCells(tapPlayer).find(c => c.idx === idx && !c.clicked);
            if (!current || current.type !== expectedType) return;
            this.callbacks.handleTap(tapPlayer, idx);
            this.callbacks.emit({ type: 'botTap', player: tapPlayer, idx, dustCost: costPerTap });
          }, delay);
          this._pendingTaps.push(tapTimer);
        }
      }
    }, BALANCE.bot.checkIntervalMs);
  }

  private _stop(): void {
    if (this._intervalRef) {
      clearInterval(this._intervalRef);
      this._intervalRef = null;
    }
  }

  stop(): void {
    this._active[1] = false;
    this._stop();
    this._pendingTaps.forEach(clearTimeout);
    this._pendingTaps = [];
  }

  isActive(): boolean { return this._active[1]; }

  setAssist(player: 1 | 2, enabled: boolean): void {
    this._active[player] = enabled;
    if (player === 1) {
      if (enabled) logger.info('BotController: assist enabled for P1');
      else this.stop();
    }
  }

  getAssistState(): { 1: boolean; 2: boolean } {
    return { ...this._active };
  }

  dispose(): void {
    this._stop();
    this._pendingTaps.forEach(clearTimeout);
    this._pendingTaps = [];
    this._active = { 1: false, 2: false };
  }
}
```

## File: engine/subsystems/EventOrchestrator.ts
```typescript
import type { BossEventType } from "../types";

// Only inversion provides genuine skill expression — storm is chaos, blackout contradicts core mechanic
const BOSS_ROTATION: BossEventType[] = ["inversion"];

const DURATIONS: Record<BossEventType, number> = {
  storm: 8000,
  inversion: 4000, // Reduced from 6s — 4s is enough for brain-rewiring challenge
  blackout: 5000,
};

const LABELS: Record<BossEventType, string> = {
  storm:     "⚡ STORM! Cells shuffle faster!",
  inversion: "🔄 INVERSION! Safe and danger swapped!",
  blackout:  "🌑 BLACKOUT! Grid goes dark!",
};

const DONE_LABELS: Record<BossEventType, string> = {
  storm:     "✅ Storm over.",
  inversion: "✅ Inversion over.",
  blackout:  "✅ Blackout over.",
};

export function getNextBossEventType(prevType: BossEventType | null): BossEventType {
  const prevIdx = prevType ? BOSS_ROTATION.indexOf(prevType) : -1;
  return BOSS_ROTATION[(prevIdx + 1) % BOSS_ROTATION.length];
}

export function getBossDuration(type: BossEventType): number {
  return DURATIONS[type];
}

export function getBossLabel(type: BossEventType): string {
  return LABELS[type];
}

export function getBossDoneLabel(type: BossEventType): string {
  return DONE_LABELS[type];
}

export function getNextBossTriggerScore(current: number): number {
  return current + 500;
}

export function shouldTriggerShieldBoss(
  score: number,
  bossActive: boolean,
  weatherActive: boolean,
  mode: string,
  rng: () => number
): boolean {
  return mode === "evolve" && !bossActive && !weatherActive && score > 100 && score % 300 < 4 && rng() < 0.35;
}
```

## File: engine/subsystems/ScoreTracker.ts
```typescript
const STREAK_MILESTONES = [5, 10, 25, 50];
const STREAK_BONUS_TIERS = [
  { streak: 30, bonus: 3 },
  { streak: 16, bonus: 2 },
  { streak: 8, bonus: 1 },
];

export function calculateTapScore(
  multiplierActive: boolean,
  bossActive: boolean,
  bossComboMultiplier: number
): { mult: number; bossMult: number; total: number } {
  const mult = multiplierActive ? 2 : 1;
  const bossMult = bossActive ? bossComboMultiplier : 1;
  return { mult, bossMult, total: mult * bossMult };
}

export function calculateStreakBonus(nextStreak: number): number {
  return STREAK_BONUS_TIERS.find(tier => nextStreak >= tier.streak)?.bonus ?? 0;
}

export function checkStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}
```

## File: hooks/useGameEngine.ts
```typescript
import { useState, useEffect, useRef, useCallback } from "react";
import { GameEngine } from "../engine/GameEngine";
import { sessionManager } from "../utils/session";
import { logger } from "../utils/logger";
import type { GameConfig, GameEvent, GameSnapshot, Winner, StoredPowerups } from "../engine/types";
import { LS_KEYS, GAME } from "../config/difficulty";
import { haptics } from "../utils/haptics";
import {
  setAudioMuted,
  setAudioVolume,
  setHapticsEnabled,
  playVolumeChime,
  playSoundEffect,
  playSound,
} from "./useAudio";

export { setAudioMuted, setAudioVolume, setHapticsEnabled, playVolumeChime, playSoundEffect };
export function loadStoredPwr(): StoredPowerups {
  try {
    const r = localStorage.getItem(LS_KEYS.STORED_PWR);
    if (r) {
      const d = JSON.parse(r);
      return { freeze: d.freeze ?? 0, shield: d.shield ?? 0, mult: d.mult ?? 0, heart: d.heart ?? 0 };
    }
  } catch (e) {
    // Fix #8: Add logging for storage failures
    logger.error('Failed to load stored powerups', e);
  }
  return { freeze: 0, shield: 0, mult: 0, heart: 0 };
}

export function saveStoredPwr(d: StoredPowerups): void {
  try { 
    localStorage.setItem(LS_KEYS.STORED_PWR, JSON.stringify(d)); 
  } catch (e) {
    logger.error('Failed to save stored powerups', e);
  }
}

// ─── Bot FX type ──────────────────────────────────────────────────
export type BotTapFx = { id: string; idx: number; dustCost: number; at: number; };

// ─── Hook return type ─────────────────────────────────────────────
export interface UseGameEngineReturn {
  snapshot:    GameSnapshot | null;
  heartAnimP1: boolean;
  heartAnimP2: boolean;
  shakeGrid1:  boolean;
  shakeGrid2:  boolean;
  toast:       string | null;
  pwrToastP1:  string | null;
  pwrToastP2:  string | null;
  levelUpBadge: string | null;
  rareSplash:  { color: string; cssColor: string } | null;
  winner:      Winner;
  start:       (forceSeed?: number) => void;
  pause:       () => void;
  resume:      () => void;
  handleTap:        (player: 1 | 2, idx: number) => void;
  handleHoldStart:  (player: 1 | 2, idx: number) => void;
  handleHoldEnd:    (player: 1 | 2, idx: number) => void;
  activateStoredFreeze: (player: 1 | 2) => void;
  activateStoredShield: (player: 1 | 2) => void;
  devForceStage:   (stage: number) => void;
  devForcePattern: (idx: number) => void;
  devForceRare:    (r: { color: string; cssColor: string } | null) => void;
  devSetGodMode:   (v: boolean) => void;
  devSetFreezeTime:(v: boolean) => void;
  devSetRotationSpeed: (v: number) => void;
  devSpawnPowerup: (type: "shield" | "freeze" | "heart") => void;
  devSpawnSpecialCell: (player: 1 | 2, type: "ice" | "hold" | "bomb" | "rare", idx?: number) => void;
  devTriggerBotTap: (player: 1 | 2, idx: number, dustCost?: number) => void;
  devToggleBotAssist: (player: 1 | 2, enabled: boolean) => void;
  startBot: () => void;
  stopBot: () => void;
  isBotActive: () => boolean;
  setBotAssist: (player: 1 | 2, enabled: boolean) => void;
  botAssistActive: { 1: boolean; 2: boolean };
  botTapHighlights: { 1: Record<number, number>; 2: Record<number, number> };
  botTapFx: BotTapFx[];
  scoreFloats: { id: number; player: 1 | 2; idx: number; amount: number }[];
  lastGameScore: number | null;
  getAutoLowQuality: () => boolean;
  restoreSession: () => boolean;
  restoreSessionSnapshot: (data: Record<string, unknown>) => boolean;
  generateChallengeUrl: () => Promise<string>;
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useGameEngine(
  config: GameConfig,
  onGameOver: (winner: Winner, p1Score: number, p2Score: number, gameSeed?: number) => void,
  dustCallbacks?: {
    getDust: () => number;
    spendDust: (amount: number) => void;
    getAccuracy: () => number;
  },
  onDamage?: () => void,
  onBossEvent?: (bossType: string) => void,
  onBombDefused?: () => void,
): UseGameEngineReturn {
  const engineRef  = useRef<GameEngine | null>(null);
  const mountedRef = useRef(true);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);

  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [heartAnimP1, setHA1]         = useState(false);
  const [heartAnimP2, setHA2]         = useState(false);
  const [shakeGrid1,  setShake1]      = useState(false);
  const [shakeGrid2,  setShake2]      = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);
  const [pwrToastP1,  setPwrToastP1]  = useState<string | null>(null);
  const [pwrToastP2,  setPwrToastP2]  = useState<string | null>(null);
  const [levelUpBadge, setLevelUpBadge] = useState<string | null>(null);
  const [rareSplash,  setRareSplash]  = useState<{ color: string; cssColor: string } | null>(null);
  const [winner,      setWinner]      = useState<Winner>(null);
  const [lastGameScore, setLastGameScore] = useState<number | null>(null);
  const [botAssistActive, setBotAssistActiveState] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false });
  const [botTapHighlights, setBotTapHighlights] = useState<{ 1: Record<number, number>; 2: Record<number, number> }>({ 1: {}, 2: {} });
  const [botTapFx, setBotTapFx] = useState<BotTapFx[]>([]);
  const [scoreFloats, setScoreFloats] = useState<{ id: number; player: 1 | 2; idx: number; amount: number }[]>([]);
  const scoreFloatIdRef = useRef(0);

  const toastTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rareSplashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pwrToastP1TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pwrToastP2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ha1TimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ha2TimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shake1TimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shake2TimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameOverTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deathFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botTapTimersRef    = useRef<ReturnType<typeof setTimeout>[]>([]);
  const peakStreakRef     = useRef(0);

  const toast$ = useCallback((msg: string) => {
    if (!mountedRef.current) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setToast(null);
    }, GAME.TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const engineConfig: GameConfig = {
      ...config,
      storage: { loadStoredPowerups: loadStoredPwr, saveStoredPowerups: saveStoredPwr },
      ...(dustCallbacks ? {
        botAssist: {
          enabled: false,
          getDust: dustCallbacks.getDust,
          spendDust: dustCallbacks.spendDust,
          getAccuracy: dustCallbacks.getAccuracy,
        }
      } : {})
    };
    const engine = new GameEngine(engineConfig);
    engineRef.current = engine;

    const unsub = engine.subscribe((event: GameEvent) => {
      if (!mountedRef.current) return;

      switch (event.type) {
        case "tick": {
          if (mountedRef.current) setSnapshot(event.snapshot);
          {
            const snap = event.snapshot;
            if (snap && snap.p1.streak > (peakStreakRef.current ?? 0)) {
              peakStreakRef.current = snap.p1.streak;
            }
          }
          break;
        }
        case "sound": playSound(event.name, event.pitchMult); break;
        case "scoreFloat": {
          const id = ++scoreFloatIdRef.current;
          setScoreFloats(prev => [...prev.slice(-9), { id, player: event.player, idx: event.idx, amount: event.amount }]);
          const floatTimer = setTimeout(() => {
            if (mountedRef.current) setScoreFloats(prev => prev.filter(f => f.id !== id));
            botTapTimersRef.current = botTapTimersRef.current.filter(t => t !== floatTimer);
          }, 800);
          botTapTimersRef.current.push(floatTimer);
          break;
        }
        case "toast": toast$(event.message); break;
        case "pwrToast":
          if (event.player === 1) {
            setPwrToastP1(event.message);
            if (pwrToastP1TimerRef.current) clearTimeout(pwrToastP1TimerRef.current);
            pwrToastP1TimerRef.current = setTimeout(() => { if (mountedRef.current) setPwrToastP1(null); }, GAME.PWR_TOAST_DURATION_MS);
          } else {
            setPwrToastP2(event.message);
            if (pwrToastP2TimerRef.current) clearTimeout(pwrToastP2TimerRef.current);
            pwrToastP2TimerRef.current = setTimeout(() => { if (mountedRef.current) setPwrToastP2(null); }, GAME.PWR_TOAST_DURATION_MS);
          }
          break;
      case "damage":
        if (event.player === 1) {
          setHA1(true);
          if (ha1TimerRef.current) clearTimeout(ha1TimerRef.current);
          ha1TimerRef.current = setTimeout(() => { if (mountedRef.current) setHA1(false); }, GAME.HEART_ANIM_MS);
        } else {
          setHA2(true);
          if (ha2TimerRef.current) clearTimeout(ha2TimerRef.current);
          ha2TimerRef.current = setTimeout(() => { if (mountedRef.current) setHA2(false); }, GAME.HEART_ANIM_MS);
        }
        onDamage?.();
        break;
        case "shake":
          if (event.player === 1) {
            setShake1(true);
            if (shake1TimerRef.current) clearTimeout(shake1TimerRef.current);
            shake1TimerRef.current = setTimeout(() => { if (mountedRef.current) setShake1(false); }, GAME.SHAKE_ANIM_MS);
          } else {
            setShake2(true);
            if (shake2TimerRef.current) clearTimeout(shake2TimerRef.current);
            shake2TimerRef.current = setTimeout(() => { if (mountedRef.current) setShake2(false); }, GAME.SHAKE_ANIM_MS);
          }
          break;
        case "levelUp":
          if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current);
          setLevelUpBadge(`Stage ${event.stage}`);
          levelUpTimerRef.current = setTimeout(() => { if (mountedRef.current) setLevelUpBadge(null); }, GAME.LEVELUP_BADGE_MS);
          break;
        case "rareStart":
          setRareSplash({ color: event.color, cssColor: event.cssColor });
          if (rareSplashTimerRef.current) clearTimeout(rareSplashTimerRef.current);
          rareSplashTimerRef.current = setTimeout(() => { if (mountedRef.current) setRareSplash(null); }, GAME.RARE_SPLASH_MS);
          break;
        case "gameOver": {
          if (!engineRef.current) break;
          const snap2 = engine.getSnapshot(); const seedAtGameOver = snap2.gameSeed;
          // Death vignette flash + haptic burst
          document.body.classList.add('death-flash');
          if (deathFlashTimerRef.current) clearTimeout(deathFlashTimerRef.current);
          deathFlashTimerRef.current = setTimeout(() => document.body.classList.remove('death-flash'), 800);
          haptics.damage();
          if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
          gameOverTimerRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            setWinner(event.winner);
            setLastGameScore(config.numPlayers === 1 ? snap2.p1.score : Math.max(snap2.p1.score, snap2.p2?.score ?? 0));
            onGameOverRef.current(event.winner, snap2.p1.score, snap2.p2?.score ?? 0, seedAtGameOver);
          }, GAME.GAME_OVER_DELAY_MS);
          break;
        }
        case "botTap": {
          // dust spend is already done in engine, just trigger re-render via dustCallbacks
          if (dustCallbacks) dustCallbacks.spendDust(0);
          setBotTapHighlights(prev => ({
            ...prev,
            [event.player]: { ...prev[event.player], [event.idx]: Date.now() },
          }));
          const highlightTimer = setTimeout(() => {
            if (!mountedRef.current) return;
            setBotTapHighlights(prev => {
              const nextPlayer = { ...prev[event.player] };
              delete nextPlayer[event.idx];
              return { ...prev, [event.player]: nextPlayer };
            });
            botTapTimersRef.current = botTapTimersRef.current.filter(t => t !== highlightTimer);
          }, 420);
          botTapTimersRef.current.push(highlightTimer);
          // Track per-tap dust cost for floating marker
          if (event.dustCost) {
            const fx: BotTapFx = {
              id: `bot-fx-${event.player}-${event.idx}-${Date.now()}`,
              idx: event.idx,
              dustCost: event.dustCost,
              at: Date.now(),
            };
            setBotTapFx(prev => [...prev, fx]);
            const fxTimer = setTimeout(() => {
              if (mountedRef.current) setBotTapFx(prev => prev.filter(f => f.id !== fx.id));
              botTapTimersRef.current = botTapTimersRef.current.filter(t => t !== fxTimer);
            }, 650);
            botTapTimersRef.current.push(fxTimer);
          }
          break;
        }
        case "bossStart":
          onBossEvent?.(event.bossType);
          break;
        case "bombDefused":
          onBombDefused?.();
          break;
        case "qualityDowngrade":
          toast$("📉 Performance mode: Particles disabled");
          break;
        case "qualityUpgrade":
          toast$("📈 Standard mode restored");
          break;
      }
    });

    return () => {
      mountedRef.current = false;
      engine.stopSessionPersistence();
      sessionManager.clear();
      unsub();
      engine.destroy();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- we intentionally read the latest ref value in cleanup
      const rafId = rafIdRef.current;
      if (rafId) cancelAnimationFrame(rafId);
      if (toastTimerRef.current)      clearTimeout(toastTimerRef.current);
      if (pwrToastP1TimerRef.current) clearTimeout(pwrToastP1TimerRef.current);
      if (pwrToastP2TimerRef.current) clearTimeout(pwrToastP2TimerRef.current);
      if (levelUpTimerRef.current)    clearTimeout(levelUpTimerRef.current);
      if (rareSplashTimerRef.current) clearTimeout(rareSplashTimerRef.current);
      if (ha1TimerRef.current)        clearTimeout(ha1TimerRef.current);
      if (ha2TimerRef.current)        clearTimeout(ha2TimerRef.current);
      if (shake1TimerRef.current)     clearTimeout(shake1TimerRef.current);
      if (shake2TimerRef.current)     clearTimeout(shake2TimerRef.current);
      if (gameOverTimerRef.current)   clearTimeout(gameOverTimerRef.current);
      if (deathFlashTimerRef.current) clearTimeout(deathFlashTimerRef.current);
      // Issue 16: Remove death-flash class on unmount in case component unmounts during animation
      document.body.classList.remove('death-flash');
      // Fix #9: Cap botTapTimersRef cleanup to prevent unbounded growth
      botTapTimersRef.current.forEach(clearTimeout);
      botTapTimersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config object excluded; individual fields tracked to avoid unnecessary engine re-creation
  }, [config.mode, config.numPlayers, config.speedMult, dustCallbacks, onBombDefused, onBossEvent, onDamage, toast$]);

  const startBot = useCallback(() => engineRef.current?.startBot(), []);
  const stopBot  = useCallback(() => engineRef.current?.stopBot(), []);
  const isBotActive = useCallback(() => engineRef.current?.isBotActive() ?? false, []);

  const setBotAssist = useCallback((player: 1 | 2, enabled: boolean) => {
    engineRef.current?.setBotAssist(player, enabled);
    setBotAssistActiveState(prev => ({ ...prev, [player]: enabled }));
  }, []);

  const pause  = useCallback(() => engineRef.current?.pause(),  []);
  const resume = useCallback(() => engineRef.current?.resume(), []);
  const handleTap = useCallback((player: 1 | 2, idx: number) => engineRef.current?.handleTap(player, idx), []);
  const handleHoldStart = useCallback((player: 1 | 2, idx: number) => engineRef.current?.handleHoldStart(player, idx), []);
  const handleHoldEnd = useCallback((player: 1 | 2, idx: number) => engineRef.current?.handleHoldEnd(player, idx), []);
  const activateStoredFreeze = useCallback((player: 1 | 2) => engineRef.current?.activateStoredFreeze(player), []);
  const activateStoredShield = useCallback((player: 1 | 2) => engineRef.current?.activateStoredShield(player), []);
  const devForceStage   = useCallback((s: number) => engineRef.current?.devForceStage(s),   []);
  const devForcePattern = useCallback((i: number) => engineRef.current?.devForcePattern(i),  []);
  const devForceRare    = useCallback((r: { color: string; cssColor: string } | null) => engineRef.current?.devForceRare(r), []);
  const devSetGodMode   = useCallback((v: boolean) => engineRef.current?.devSetGodMode(v), []);
  const devSetFreezeTime= useCallback((v: boolean) => engineRef.current?.devSetFreezeTime(v), []);
  const devSetRotationSpeed = useCallback((v: number) => engineRef.current?.devSetRotationSpeed(v), []);
  const devSpawnPowerup = useCallback((type: "shield" | "freeze" | "heart") => engineRef.current?.devSpawnPowerup(type), []);
  const devSpawnSpecialCell = useCallback((player: 1 | 2, type: "ice" | "hold" | "bomb" | "rare", idx?: number) => engineRef.current?.devSpawnSpecialCell(player, type, idx), []);
  const devTriggerBotTap = useCallback((player: 1 | 2, idx: number, dustCost?: number) => engineRef.current?.devTriggerBotTap(player, idx, dustCost), []);
  const devToggleBotAssist = useCallback((player: 1 | 2, enabled: boolean) => engineRef.current?.devToggleBotAssist(player, enabled), []);
  const getAutoLowQuality = useCallback(() => engineRef.current?.getAutoLowQuality() ?? false, []);

  const generateChallengeUrl = useCallback(async (): Promise<string> => {
    return (await engineRef.current?.generateChallengeUrl()) ?? '';
  }, []);

  const restoreSessionSnapshot = useCallback((data: Record<string, unknown>): boolean => {
    if (!engineRef.current) return false;
    return engineRef.current.restoreSessionSnapshot(data);
  }, []);

  const restoreSession = useCallback((): boolean => {
    const raw = sessionStorage.getItem('dtp:session-ui');
    if (!raw || !engineRef.current) return false;
    try {
      const { engineSnapshot } = JSON.parse(raw);
      engineRef.current.restoreFromSession(engineSnapshot);
      engineRef.current.startSessionPersistence();
      return true;
    } catch { return false; }
  }, []);

  const wrappedStart = useCallback((forceSeed?: number) => {
    setWinner(null);
    setLastGameScore(null);
    setRareSplash(null);
    setLevelUpBadge(null);
    setBotTapHighlights({ 1: {}, 2: {} });
    setScoreFloats([]);
    engineRef.current?.start(forceSeed);
    engineRef.current?.startSessionPersistence();
  }, []);

  return {
    snapshot, heartAnimP1, heartAnimP2, shakeGrid1, shakeGrid2, toast, pwrToastP1, pwrToastP2, levelUpBadge, rareSplash, winner, lastGameScore,
    start: wrappedStart, pause, resume, handleTap, handleHoldStart, handleHoldEnd,
    activateStoredFreeze, activateStoredShield, devForceStage, devForcePattern, devForceRare,
    devSetGodMode, devSetFreezeTime, devSetRotationSpeed, devSpawnPowerup,
    devSpawnSpecialCell, devTriggerBotTap, devToggleBotAssist,
    startBot, stopBot, isBotActive, setBotAssist, botAssistActive, botTapHighlights, botTapFx, scoreFloats,
    getAutoLowQuality, restoreSession, restoreSessionSnapshot, generateChallengeUrl,
  };
}
```

## File: hooks/useScreenStateMachine.ts
```typescript
/* Centralized screen transitions + feature-gated UI state */
import { useState, useCallback, useEffect, useRef } from 'react';
import { featureGates, PlayerProgress, FeatureId, ALL_FEATURE_IDS } from '../utils/featureGates';
import { logger } from '../utils/logger';

export type Screen =
  | 'loading'
  | 'onboarding'
  | 'menu'
  | 'playing'
  | 'gameover'
  | 'paused'
  | 'shop'
  | 'leaderboard'
  | 'settings'
  | 'changelog'
  | 'howto'
  | 'keybind'
  | 'gamemaster';

export interface ScreenState {
  current: Screen;
  previous: Screen | null;
  canTransition: (to: Screen) => boolean;
  transition: (to: Screen) => void;
  isFeatureUnlocked: (feature: FeatureId, devMode?: boolean) => boolean;
  progress: PlayerProgress;
  updateProgress: (partial: Partial<PlayerProgress>) => void;
}

const VALID_TRANSITIONS: Record<Screen, Screen[]> = {
  loading:     ['onboarding', 'menu'],
  onboarding:  ['menu'],
  menu:        ['playing', 'shop', 'leaderboard', 'settings', 'changelog', 'howto', 'keybind', 'gamemaster'],
  playing:     ['paused', 'gameover', 'menu'],
  paused:      ['playing', 'menu'],
  gameover:    ['playing', 'menu', 'leaderboard'],
  shop:        ['menu'],
  leaderboard: ['menu'],
  settings:    ['menu'],
  changelog:   ['menu'],
  howto:       ['menu'],
  keybind:     ['menu'],
  gamemaster:  ['menu'],
};

export function useScreenStateMachine(initialProgress?: Partial<PlayerProgress>): ScreenState {
  const [current, setCurrent] = useState<Screen>('loading');
  const [previous, setPrevious] = useState<Screen | null>(null);
  const [progress, setProgress] = useState<PlayerProgress>({
    bestScore: 0,
    wins: 0,
    gamesPlayed: 0,
    deaths: 0,
    ...initialProgress
  });

  const [unlocks, setUnlocks] = useState<Record<string, boolean>>(() => featureGates.load());
  const unlocksRef = useRef(unlocks);
  useEffect(() => { unlocksRef.current = unlocks; }, [unlocks]);

  // Listen for external unlocks
  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      setUnlocks(prev => ({ ...prev, [id]: true }));
    };
    window.addEventListener('dtp:feature-unlocked', handler);
    return () => window.removeEventListener('dtp:feature-unlocked', handler);
  }, []);

  const updateProgress = useCallback((partial: Partial<PlayerProgress>) => {
    setProgress(prev => {
      const next = { ...prev, ...partial };
      // Check for new unlocks automatically using all feature IDs
      ALL_FEATURE_IDS.forEach(id => {
        if (!unlocksRef.current[id] && featureGates.isUnlocked(id, next)) {
          featureGates.unlock(id);
        }
      });
      return next;
    });
  }, []);

  const canTransition = useCallback((to: Screen) => {
    if (to === current) return false;
    return VALID_TRANSITIONS[current]?.includes(to) ?? false;
  }, [current]);

  const transition = useCallback((to: Screen) => {
    // Issue 24: Use functional setCurrent to eliminate stale closure over `current` and `canTransition`
    setCurrent(prev => {
      if (prev === to || !VALID_TRANSITIONS[prev]?.includes(to)) return prev;
      setPrevious(prev);
      return to;
    });
  }, []);

  const isFeatureUnlocked = useCallback((feature: FeatureId, devMode = false) => {
    return devMode || unlocks[feature] || featureGates.isUnlocked(feature, progress);
  }, [unlocks, progress]);

  return {
    current,
    previous,
    canTransition,
    transition,
    isFeatureUnlocked,
    progress,
    updateProgress
  };
}
```

## File: hooks/useInputHandler.ts
```typescript
import { useEffect, useCallback, useRef, useState } from "react";
import { EVOLVE_PATTERNS } from "../config/gridPatterns";
import { GAME } from "../config/difficulty";
import type { GameMode, PlayerState } from "../engine/types";

// ─── Hook options ─────────────────────────────────────────────────
interface UseInputHandlerOptions {
  mode:       GameMode;
  numPlayers: 1 | 2;
  enabled:    boolean;   // false while paused / on menu / game over
  p1Keys:     string[];
  p2Keys:     string[];
  p1State:    PlayerState | null;
  p2State:    PlayerState | null;
  onTap:        (player: 1 | 2, idx: number) => void;
  onHoldStart:  (player: 1 | 2, idx: number) => void;
  onHoldEnd:    (player: 1 | 2, idx: number) => void;
  onPause:      () => void;
}

// ─── Hook return type ─────────────────────────────────────────────
export interface UseInputHandlerReturn {
  pressP1: Set<number>;
  pressP2: Set<number>;
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useInputHandler({
  mode, numPlayers, enabled,
  p1Keys, p2Keys,
  p1State, p2State,
  onTap, onHoldStart, onHoldEnd, onPause,
}: UseInputHandlerOptions): UseInputHandlerReturn {
  const [pressP1, setPressP1] = useState<Set<number>>(new Set());
  const [pressP2, setPressP2] = useState<Set<number>>(new Set());

  // Cleanup refs for key-press visual timers
  const pressP1TimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const pressP2TimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Clear all press timers on unmount
  useEffect(() => {
    const p1Timers = pressP1TimersRef.current;
    const p2Timers = pressP2TimersRef.current;
    return () => {
      p1Timers.forEach(id => clearTimeout(id));
      p2Timers.forEach(id => clearTimeout(id));
    };
  }, []);
  const p1KeysRef  = useRef(p1Keys);
  const p2KeysRef  = useRef(p2Keys);
  const p1StateRef = useRef(p1State);
  const p2StateRef = useRef(p2State);
  const modeRef    = useRef(mode);
  const npRef      = useRef(numPlayers);
  const onTapRef       = useRef(onTap);
  const onHoldStartRef = useRef(onHoldStart);
  const onHoldEndRef   = useRef(onHoldEnd);
  const onPauseRef     = useRef(onPause);

  useEffect(() => { p1KeysRef.current  = p1Keys;     }, [p1Keys]);
  useEffect(() => { p2KeysRef.current  = p2Keys;     }, [p2Keys]);
  useEffect(() => { p1StateRef.current = p1State;    }, [p1State]);
  useEffect(() => { p2StateRef.current = p2State;    }, [p2State]);
  useEffect(() => { modeRef.current    = mode;       }, [mode]);
  useEffect(() => { npRef.current      = numPlayers; }, [numPlayers]);
  useEffect(() => { onTapRef.current       = onTap;       }, [onTap]);
  useEffect(() => { onHoldStartRef.current = onHoldStart; }, [onHoldStart]);
  useEffect(() => { onHoldEndRef.current   = onHoldEnd;   }, [onHoldEnd]);
  useEffect(() => { onPauseRef.current     = onPause;     }, [onPause]);

  // ── Key → grid index resolver ──
  const resolveKey = useCallback((
    key: string,
    keys: string[],
    state: PlayerState | null
  ): number => {
    if (!state) return -1;
    const k = key.toLowerCase();
    const patIdx = state.patternIdx;
    const sd = modeRef.current === "classic"
      ? { cols: 3, rows: 3, mask: null as number[] | null }
      : (EVOLVE_PATTERNS[patIdx] ?? { cols: 3, rows: 3, mask: null });
    const validSlots = sd.mask ?? Array.from({ length: sd.cols * sd.rows }, (_, i) => i);
    for (const i of validSlots) {
      const row = Math.floor(i / sd.cols);
      const col = i % sd.cols;
      if (keys[row * 4 + col] === k) return i;
    }
    return -1;
  }, []);

  // ── Keyboard handler ──
  useEffect(() => {
    if (!enabled) return;

    const holdKeyTimers = new Map<string, ReturnType<typeof setTimeout>>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "Escape") { onPauseRef.current(); return; }

      const i1 = resolveKey(e.key, p1KeysRef.current, p1StateRef.current);
      const i2 = npRef.current === 2
        ? resolveKey(e.key, p2KeysRef.current, p2StateRef.current)
        : -1;

      const processKey = (player: 1 | 2, idx: number) => {
        if (idx === -1) return;
        e.preventDefault();

        const state = player === 1 ? p1StateRef.current : p2StateRef.current;
        const cell = state?.active.find(c => c.idx === idx);
        const isHold = cell?.type === "hold" && !(cell as { clicked?: boolean }).clicked;

        if (isHold) {
          const holdKey = `${player}_${idx}`;
          if (holdKeyTimers.has(holdKey)) clearTimeout(holdKeyTimers.get(holdKey)!);
          onHoldStartRef.current(player, idx);
          const holdMs = ((cell as { holdRequired?: number }).holdRequired ?? 800) + 50;
          holdKeyTimers.set(holdKey, setTimeout(() => {
            onHoldEndRef.current(player, idx);
            holdKeyTimers.delete(holdKey);
          }, holdMs));
        }

        setPressP1(s => { const n = new Set(s); if (player === 1) n.add(idx); return n; });
        setPressP2(s => { const n = new Set(s); if (player === 2) n.add(idx); return n; });
        const timers = player === 1 ? pressP1TimersRef : pressP2TimersRef;
        const existing = timers.current.get(idx);
        if (existing) clearTimeout(existing);
        timers.current.set(idx, setTimeout(() => {
          if (player === 1) setPressP1(s => { const n = new Set(s); n.delete(idx); return n; });
          else setPressP2(s => { const n = new Set(s); n.delete(idx); return n; });
          timers.current.delete(idx);
        }, GAME.KEY_PRESS_VISUAL_MS));

        if (!isHold) onTapRef.current(player, idx);
      };

      if (i1 !== -1) processKey(1, i1);
      else if (i2 !== -1) processKey(2, i2);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      holdKeyTimers.forEach(id => clearTimeout(id));
    };
  }, [enabled, resolveKey]);

  // ── Pointer event factory (returned to caller for Cell components) ──
  // Note: pointer events are wired directly in PlayerPanel JSX via onTap/onHoldStart/onHoldEnd.
  // pressP1/pressP2 sets are the only thing this hook returns for pointer visuals.

  return { pressP1, pressP2 };
}
```

## File: hooks/useBackground.ts
```typescript
// hooks/useBackground.ts
import { useEffect, useRef, useCallback } from 'react';

export type BackgroundController = {
  pause: () => void;
  resume: () => void;
};

export function useBackgroundController(shouldAnimate: boolean) {
  const controllers = useRef<Set<BackgroundController>>(new Set());

  const applyState = useCallback((animate: boolean) => {
    controllers.current.forEach((ctrl) => {
      if (animate) ctrl.resume(); else ctrl.pause();
    });
  }, []);

  const register = useCallback((controller: BackgroundController) => {
    controllers.current.add(controller);
    // Apply current state immediately, respecting document visibility
    const effective = shouldAnimate && !document.hidden;
    if (effective) controller.resume(); else controller.pause();
    return () => { controllers.current.delete(controller); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- applyState is stable (useCallback w/ [] deps)
  }, [shouldAnimate, applyState]);

  // React to shouldAnimate changes
  useEffect(() => {
    applyState(shouldAnimate && !document.hidden);
  }, [shouldAnimate, applyState]);

  // React to tab visibility changes — this replaces the empty handler in App.tsx
  // The App.tsx visibilitychange listener is safe to DELETE; this hook owns it.
  useEffect(() => {
    const handler = () => applyState(shouldAnimate && !document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [shouldAnimate, applyState]);

  return { register };
}
```

## File: engine/types.ts
```typescript
// ─── Cell & grid types ────────────────────────────────────────────
export type CellType =
  | "inactive" | "void" | "purple"
  | "white" | "blue" | "red" | "orange" | "yellow"
  | "green" | "cyan" | "lime" | "teal"
  | "pink" | "rose" | "magenta"
  | "medpack" | "shield" | "freeze" | "multiplier"
  | "ice" | "hold" | "bomb";

export type BossEventType = "storm" | "inversion" | "blackout";

export type CellShape = "square" | "circle" | "triangle" | "roundedTriangle" | "mixed" | "diamond";

export type GameMode   = "classic" | "evolve";
export type NumPlayers = 1 | 2;
export type Winner     = "p1" | "p2" | "tie" | null;

// ─── Active cell (in-flight, not yet resolved) ────────────────────
type BaseCell = {
  idx: number;
  clicked: boolean;
  shape?: CellShape;
};

export type RegularCell = BaseCell & {
  type: "white" | "blue" | "red" | "orange" | "yellow" | "green" | "cyan" | "lime" | "teal" | "pink" | "rose" | "magenta" | "purple";
};

export type IceCell = BaseCell & {
  type: "ice";
  iceCount: number;
};

export type HoldCell = BaseCell & {
  type: "hold";
  holdRequired: number;
  holdStart?: number;
  spawnedAt: number;   // timestamp — hold cell expires if never started within holdRequired + 1500ms
};

export type PowerupCell = BaseCell & {
  type: "medpack" | "shield" | "freeze" | "multiplier";
};

export type BombCell = BaseCell & {
  type: "bomb";
  expiresAt: number;   // timestamp — must tap before this
};

export type ActiveCell = RegularCell | IceCell | HoldCell | PowerupCell | BombCell;

export interface BossEvent {
  type: BossEventType;
  endsAt: number;      // timestamp
}

// ─── Per-player live state ────────────────────────────────────────
export interface PlayerState {
  cells:               CellType[];       // flat 25-cell display array
  active:              ActiveCell[];     // cells currently in play
  score:               number;
  streak:              number;
  alive:               boolean;
  anim:                Record<number, string>;
  health:              number;
  shield:              boolean;
  shieldCount:         number;
  freezeEnd:           number;           // timestamp
  multiplierEnd:       number;           // timestamp
  gridStage:           number;           // evolve stage index
  stageProgress:       number;           // taps toward next stage
  patternIdx:          number;           // current EVOLVE_PATTERNS index
  storedFreezeCharges: number;
  storedShieldCharges: number;
  pendingStageUpdate?: boolean;
  slideAnim?: Record<number, { fromIdx: number; startMs: number }>; // K3: cell shuffle slide
  nextShuffleTick: number;  // per-player shuffle scheduling
}

// ─── Rare color mode ──────────────────────────────────────────────
export interface RareColorMode {
  active:   boolean;
  color:    string;
  cssColor: string;
  turnsLeft: number;
  shape:    CellShape;  // shape used for colorblind distinction
  emoji:    string;     // emoji shown in colorblind mode
}

export interface StoredPowerups {
  freeze: number;
  shield: number;
  mult: number;
  heart: number;
}

// ─── Engine configuration (passed at construction) ────────────────
export interface GameConfig {
  mode:       GameMode;
  numPlayers: NumPlayers;
  speedMult:  number;      // iMultRef equivalent
  inputMode?: 'touch' | 'keys';  // default 'touch'
  godMode?:   boolean;     // practice / dev invincibility
  storage?: {
    loadStoredPowerups: () => StoredPowerups;
    saveStoredPowerups: (data: StoredPowerups) => void;
  };
  botAssist?: {
    enabled: boolean;
    getDust: () => number;
    spendDust: (amount: number) => void;
    getAccuracy: () => number;  // 0.0–1.0
  };
}

// ─── Full engine snapshot emitted to React ────────────────────────
export interface GameSnapshot {
  tick:       number;
  evolveTick: number;
  gameSeed:   number;
  p1:         PlayerState;
  p2:         PlayerState;
  cellShape:  CellShape;
  rareMode:   RareColorMode;
  spinLevel:  number;
  paused:     boolean;
  phase:      "playing" | "paused" | "gameover" | "humanlimit";
  grid: {
    cols: number;
    rows: number;
    mask: number[] | null;
  };
  devRotationSpeed?: number;
  spinCfg: { duration: number; direction: 1 | -1 } | null;
  bossEvent:  BossEvent | null;
  activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null;
  isInverted: boolean;   // true during inversion boss event
  isBlackout: boolean;   // true during blackout boss event
}

// ─── Events emitted by GameEngine ────────────────────────────────
export type GameEvent =
  | { type: "tick";        snapshot: GameSnapshot }
  | { type: "damage";      player: 1 | 2 }
  | { type: "shake";       player: 1 | 2 }
  | { type: "levelUp";     player: 1 | 2; stage: number }
  | { type: "sound";       name: "ok" | "bad" | "tick" | "powerup" | "levelup" | "shuffle" | "rareStart" | "claim" | "bomb" | "bossStart"; pitchMult?: number }
  | { type: "scoreFloat"; player: 1 | 2; idx: number; amount: number }
  | { type: "toast";       message: string }
  | { type: "pwrToast";    message: string; player: 1 | 2 } // Task 1: Inline pwr toast
  | { type: "rareStart";   color: string; cssColor: string }
  | { type: "bossStart";   bossType: BossEventType }
  | { type: "bombSpawn";   player: 1 | 2; idx: number; expiresAt: number }
  | { type: "bombDefused"; player: 1 | 2 }
  | { type: "bombExplode"; player: 1 | 2 }
  | { type: "cellAnim";    player: 1 | 2; idx: number; anim: "pop" | "shake" }
  | { type: "gameOver";    winner: Winner }
  | { type: "phaseChange"; phase: "playing" | "paused" | "gameover" | "humanlimit" }
  | { type: "dustConsumed"; amount: number }
  | { type: "botTap"; player: 1 | 2; idx: number; dustCost: number }
  | { type: "cellShuffle"; player: 1 | 2; fromIdx: number; toIdx: number }
  | { type: "qualityDowngrade"; reason: "fps-drop"; avgFps: number }
  | { type: "qualityUpgrade"; avgFps: number };
```

## File: engine/GameEngine.ts
```typescript
/**
 * CLOCK DOMAIN CONVENTION:
 * - Date.now(): Used for real-time game state (energy regen, bomb expiry, login streaks)
 * - performance.now(): Used for sub-frame timing (FPS measurement, animation deltas)
 * - Game ticks: Internal engine clock, advances once per tick interval
 *
 * Do NOT mix domains. When a value crosses domains, convert explicitly.
 */
import { GAME } from "../config/difficulty";
import { STAGES, EVOLVE_PATTERNS } from "../config/gridPatterns";
import { computeMs, makeGameSeed, getSpinConfig, mulberry32, speedLabel } from "./DifficultyScaler";
import { logError } from "../utils/devLog";
import { InputBuffer } from "../utils/input-smoothing";
import { haptics } from "../utils/haptics";
import { sessionManager } from "../utils/session";
import { stateGuard } from "../utils/state-guard";
import { scoreSync } from "../utils/score-sync";
import { audioEngine } from "../utils/audio";
import { analytics } from "../utils/analytics";
import { gamepadManager } from "../utils/gamepad";
import { configManager } from "../utils/game-config";
import { errorTracker } from "../utils/error-tracker";
import { DynamicDifficulty } from "../utils/dda";
import { seedManager } from "../utils/seed-manager";
import { bossEngine } from "../utils/boss-engine";
import { achievementSystem } from "../utils/achievements";
import { DailyChallenge } from "../utils/seed-challenge";
import { perfMonitor } from "../utils/perf-monitor";
import { scoreCardGen } from "../utils/score-card";
import { rhythmFeedback } from "../utils/feedback-rhythm";
import type {
  ActiveCell, CellShape, GameConfig, GameEvent,
  GameSnapshot, PlayerState, RareColorMode, Winner,
  BossEvent, BossEventType, HoldCell, CellType,
} from "./types";
import {
  activeToCellsP, spawnActive,
} from "./subsystems/CellLifecycle";
import { calculateStreakBonus, calculateTapScore, checkStreakMilestone } from "./subsystems/ScoreTracker";
import { challengeLink } from "../utils/challenge-link";
import { TickProcessor, type TickContext } from "./subsystems/TickProcessor";
import { BotController } from "./subsystems/BotController";

function makePS(bonusHearts: number, hasMult: boolean, stored: { freeze: number; shield: number; mult: number; heart: number }): PlayerState {
  return {
    cells: Array(25).fill("inactive"), active: [], score: 0, streak: 0,
    alive: true, anim: {}, health: GAME.MAX_HEARTS + bonusHearts,
    shield: false, shieldCount: 0, freezeEnd: 0,
    multiplierEnd: hasMult ? Date.now() + 24000 : 0,
    gridStage: 0, stageProgress: 0, patternIdx: 0,
    storedFreezeCharges: stored.freeze,
    storedShieldCharges: stored.shield,
    nextShuffleTick: 0,
  };
}

// ΓöÇΓöÇΓöÇ GameEngine class ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export class GameEngine {
  private rafId: number | null = null;
  private tickTimer: ReturnType<typeof setTimeout> | null = null;
  private tickCount  = 0;
  private evolveTick = 0;
  private iMult      = 1;
  private paused     = false;
  private phase: GameSnapshot["phase"] = "playing";
  private holdTimers = new Map<string, { cell: ActiveCell, player: 1 | 2, generation: number }>();
  private holdGeneration = 0;
  private dirty      = true;

  private rng: () => number = () => Math.random();
  private p1!: PlayerState;
  private p2!: PlayerState;
  private cellShape: CellShape    = "square";
  private rareMode: RareColorMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
  private spinLevel  = 0;
  private gameSeed   = makeGameSeed();
  private tapBuffer: Record<1 | 2, { idx: number; ts: number } | null> = { 1: null, 2: null };
  private static readonly TAP_BUFFER_MS = GAME.TAP_BUFFER_MS;
  private   devGodMode     = false;
  private devFreezeTime  = false;
  private devForcedPwr: "shield" | "freeze" | "heart" | null = null;
  private devRotationSpeed = 1;
  private botAssistActive: { 1: boolean; 2: boolean } = { 1: false, 2: false };

  private listeners: Set<(e: GameEvent) => void> = new Set();
  private _pauseListeners: Array<() => void> = [];
  private _resumeListeners: Array<() => void> = [];
  private inputBuffer = new InputBuffer();
  private _sessionAutoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private fpsHistory: number[] = [];
  private fpsIdx = 0;
  private autoLowQuality = false;
  private lowQualityThreshold = 40;
  // Snapshot cache fields
  private _cachedMask: number[] | null = null;
  private _cachedMaskSrc: number[] | null = null;
  private _cachedSpinCfg: { duration: number; direction: 1 | -1 } | null = null;
  private _cachedSpinLevel = -1;
  private _cachedSpinSeed = -1;
  private _cachedRotationSpeed = 1;
  // K1: cell shuffle state
  // nextShuffleTick moved to PlayerState for per-player tracking
  private readonly SHUFFLE_DURATION_MS = 200; // K3: slide animation duration
  // Boss/Bomb state
  private bossEvent: BossEvent | null = null;
  private nextBossTriggerScore = 500;
  private readonly SESSION_KEY = 'dtp:session';
  private activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null = null;
  private _settingsUnsub: (() => void) | null = null;
  private _gamepadUnsub: (() => void) | null = null;
  private _bossCompleteHandler: (() => void) | null = null;
  private _bossShieldBreakHandler: (() => void) | null = null;
  private _difficultyEmergencyHandler: (() => void) | null = null;
  private _lastFocusedCell = '0';
  private _config = configManager.get();
  private _configUnsub: (() => void) | null = null;
  private dda = new DynamicDifficulty(1200);
  private daily = new DailyChallenge();
  private _lastTapTime = 0;
  private _sessionStartTime = performance.now();
  private _isDisposed = false;
  private _isInverted = false;
  private _isBlackout = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];
  private _tickSoundCounter = 0;
  private _deltaTimers: Array<{ id: string; remaining: number; duration: number; callback: () => void }> = [];
  private _lastTickTs = performance.now();
  private _hitPauseUntil = 0; // Hit pause: freeze game briefly on impactful moments
  private _deathSlowdown = false; // Slow-motion on death before game over
  private _deathCleanupTimer: ReturnType<typeof setTimeout> | null = null; // Track death cleanup timeout
  private _cachedNow = Date.now(); // Cached Date.now() per tick — avoids 10+ syscalls per frame
  private _bossActive = false;
  private _bombDefuseCount = 0;
  private _shieldCollected = 0;
  private _tookDamage = false;
  private _freezeCollected = 0;
  private _purpleTaps = 0;
  private _tickProcessor = new TickProcessor();
  private _tickCtx!: TickContext;
  private _bot: BotController;

  constructor(private config: GameConfig) {
    perfMonitor.observe();
    this._sessionStartTime = performance.now();
    this.iMult = config.speedMult;
    this.devGodMode = config.godMode ?? false;
    achievementSystem.load();
    // Core achievements
    achievementSystem.register({ id: 'first_blood', name: 'First Strike', desc: 'Clear your first cell', icon: '⚔️', unlocked: false });
    achievementSystem.register({ id: 'survivor', name: 'Iron Will', desc: 'Reach last heart and survive 30s', icon: '💪', unlocked: false });
    achievementSystem.register({ id: 'daily_master', name: 'Daily Grind', desc: "Complete today's challenge", icon: '📅', unlocked: false });
    // Score milestones
    achievementSystem.register({ id: 'score_100', name: 'Getting Started', desc: 'Score 100 points', icon: '🌟', unlocked: false });
    achievementSystem.register({ id: 'score_500', name: 'Rising Star', desc: 'Score 500 points', icon: '⭐', unlocked: false });
    achievementSystem.register({ id: 'score_1000', name: 'Thousand Club', desc: 'Score 1,000 points', icon: '💫', unlocked: false });
    achievementSystem.register({ id: 'score_2500', name: 'Quarter King', desc: 'Score 2,500 points', icon: '👑', unlocked: false });
    achievementSystem.register({ id: 'score_5000', name: 'Half Hero', desc: 'Score 5,000 points', icon: '🏆', unlocked: false });
    achievementSystem.register({ id: 'score_9999', name: 'Max Master', desc: 'Score 9,999 points (max)', icon: '💎', unlocked: false });
    // Streak milestones
    achievementSystem.register({ id: 'streak_10', name: 'On Fire', desc: 'Reach a 10-streak', icon: '🔥', unlocked: false });
    achievementSystem.register({ id: 'streak_25', name: 'Unstoppable', desc: 'Reach a 25-streak', icon: '💥', unlocked: false });
    achievementSystem.register({ id: 'streak_50', name: 'Legend', desc: 'Reach a 50-streak', icon: '⚡', unlocked: false });
    // Mode completions
    achievementSystem.register({ id: 'classic_win', name: 'Classic Champion', desc: 'Win a Classic game', icon: '🎯', unlocked: false });
    achievementSystem.register({ id: 'evolve_win', name: 'Evolution Complete', desc: 'Win an Evolve game', icon: '🧬', unlocked: false });
    // Boss achievements
    achievementSystem.register({ id: 'boss_defeat', name: 'Boss Slayer', desc: 'Defeat a boss event', icon: '🐉', unlocked: false });
    achievementSystem.register({ id: 'boss_inversion', name: 'Mind Bender', desc: 'Survive an Inversion event', icon: '🔄', unlocked: false });
    // Bomb achievements
    achievementSystem.register({ id: 'bomb_defuse', name: 'Defuser', desc: 'Defuse 10 bombs', icon: '💣', unlocked: false });
    achievementSystem.register({ id: 'bomb_master', name: 'Bomb Expert', desc: 'Defuse 50 bombs', icon: '🧨', unlocked: false });
    // Daily streak
    achievementSystem.register({ id: 'streak_3', name: 'Consistent', desc: '3-day daily streak', icon: '📅', unlocked: false });
    achievementSystem.register({ id: 'streak_7', name: 'Weekly Warrior', desc: '7-day daily streak', icon: '🗓️', unlocked: false });
    achievementSystem.register({ id: 'streak_14', name: 'Fortnight Fighter', desc: '14-day daily streak', icon: '🏅', unlocked: false });
    achievementSystem.register({ id: 'streak_30', name: 'Monthly Master', desc: '30-day daily streak', icon: '👑', unlocked: false });
    // Dust achievements
    achievementSystem.register({ id: 'dust_1000', name: 'Dust Collector', desc: 'Earn 1,000 dust total', icon: '💜', unlocked: false });
    achievementSystem.register({ id: 'dust_10000', name: 'Dust Baron', desc: 'Earn 10,000 dust total', icon: '💰', unlocked: false });
    // Speed achievements
    achievementSystem.register({ id: 'speed_2x', name: 'Quick Draw', desc: 'Reach 2.0x speed', icon: '⚡', unlocked: false });
    achievementSystem.register({ id: 'speed_3x', name: 'Lightning Fast', desc: 'Reach 3.0x speed', icon: '🌩️', unlocked: false });
    // Powerup achievements
    achievementSystem.register({ id: 'shield_5', name: 'Shield Bearer', desc: 'Collect 5 shields in one game', icon: '🛡️', unlocked: false });
    achievementSystem.register({ id: 'freeze_5', name: 'Frost Master', desc: 'Collect 5 freezes in one game', icon: '❄️', unlocked: false });
    // Perfect round
    achievementSystem.register({ id: 'perfect_round', name: 'Untouchable', desc: 'Complete a round with no damage', icon: '✨', unlocked: false });
    // Play count
    achievementSystem.register({ id: 'games_50', name: 'Dedicated', desc: 'Play 50 games', icon: '🎮', unlocked: false });
    achievementSystem.register({ id: 'games_200', name: 'Veteran', desc: 'Play 200 games', icon: '🏅', unlocked: false });
    // Secret achievements
    achievementSystem.register({ id: 'secret_purple_tap', name: '???', desc: '???', icon: '🔮', unlocked: false });
    achievementSystem.register({ id: 'secret_speed_run', name: '???', desc: '???', icon: '🔮', unlocked: false });
    audioEngine.init();
    import('../utils/settings').then(m => {
      this._settingsUnsub = m.settingsManager.subscribe(s => this._applySettings(s));
    }).catch(e => logError('Settings module failed', e));
    this._configUnsub = configManager.subscribe(cfg => { this._config = cfg; });
    this._bossCompleteHandler = () => {
      this._bossActive = false;
      achievementSystem.unlock('boss_defeat');
    };
    this._bossShieldBreakHandler = () => { this.hitPause(80); this.emit({ type: "shake", player: 1 }); this.emit({ type: "sound", name: "powerup" }); };
    this._difficultyEmergencyHandler = () => {
      if (!this.p1 || this.phase !== 'playing') return;
      const bonus = Math.round(50 * rhythmFeedback.state.multiplier);
      this.p1.score += bonus;
      this.emit({ type: "toast", message: ` Difficulty adjusted! +${bonus} pts` });
      document.documentElement.setAttribute('data-dda-emergency', 'true');
      setTimeout(() => document.documentElement.removeAttribute('data-dda-emergency'), 2200);
    };
    window.addEventListener('dtp:boss:complete', this._bossCompleteHandler);
    window.addEventListener('dtp:boss:shield-break', this._bossShieldBreakHandler);
    window.addEventListener('dtp:difficulty:emergency', this._difficultyEmergencyHandler);
    gamepadManager.init();
    this._gamepadUnsub = gamepadManager.on((btn, state) => {
      if (state !== 'press') return;
      if (btn === 'a' || btn === 'dpad_up') { const v = parseInt(this._lastFocusedCell); this.handleTap(1, Number.isFinite(v) ? v : 0); }
      if (btn === 'start') {
        if (this.paused) this.resume();
        else this.pause();
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this._tickCtx = {
      get config() { return self.config; },
      get phase() { return self.phase; }, set phase(v) { self.phase = v; },
      get tickCount() { return self.tickCount; }, set tickCount(v) { self.tickCount = v; },
      get evolveTick() { return self.evolveTick; }, set evolveTick(v) { self.evolveTick = v; },
      get cellShape() { return self.cellShape; }, set cellShape(v) { self.cellShape = v; },
      get rareMode() { return self.rareMode; }, set rareMode(v) { self.rareMode = v; },
      get spinLevel() { return self.spinLevel; }, set spinLevel(v) { self.spinLevel = v; },
      get p1() { return self.p1; },
      get p2() { return self.p2; },
      get bossEvent() { return self.bossEvent; }, set bossEvent(v) { self.bossEvent = v; },
      get _bossActive() { return self._bossActive; }, set _bossActive(v) { self._bossActive = v; },
      get _isInverted() { return self._isInverted; }, set _isInverted(v) { self._isInverted = v; },
      get _isBlackout() { return self._isBlackout; }, set _isBlackout(v) { self._isBlackout = v; },
      get nextBossTriggerScore() { return self.nextBossTriggerScore; }, set nextBossTriggerScore(v) { self.nextBossTriggerScore = v; },
      get activeBomb() { return self.activeBomb; }, set activeBomb(v) { self.activeBomb = v; },
      get dirty() { return self.dirty; }, set dirty(v) { self.dirty = v; },
      get _tickSoundCounter() { return self._tickSoundCounter; }, set _tickSoundCounter(v) { self._tickSoundCounter = v; },
      get _lastTickTs() { return self._lastTickTs; }, set _lastTickTs(v) { self._lastTickTs = v; },
      get now() { return self._cachedNow; },
      get numPlayers() { return self.config.numPlayers; },
      get _deltaTimers() { return self._deltaTimers; }, set _deltaTimers(v) { self._deltaTimers = v; },
      get devGodMode() { return self.devGodMode; }, set devGodMode(v) { self.devGodMode = v; },
      get devFreezeTime() { return self.devFreezeTime; }, set devFreezeTime(v) { self.devFreezeTime = v; },
      get devForcedPwr() { return self.devForcedPwr; }, set devForcedPwr(v) { self.devForcedPwr = v; },
      get dda() { return self.dda; },
      emit: (e) => self.emit(e),
      _flushTapBuffer: (p) => self._flushTapBuffer(p),
      checkStageProgress: (p) => self.checkStageProgress(p),
      autoSaveSession: () => self.autoSaveSession(),
      triggerGameOver: (w) => self.triggerGameOver(w),
      scheduleTimeout: (cb, ms) => self.scheduleTimeout(cb, ms),
      addDeltaTimer: (id, dur, cb) => self.addDeltaTimer(id, dur, cb),
      removeDeltaTimer: (id) => self.removeDeltaTimer(id),
      get rng() { return self.rng; },
    };
    this._bot = new BotController({
      getDangerColor:  () => this.rareMode?.active ? this.rareMode.color : 'purple',
      isInverted:      () => this.bossEvent?.type === 'inversion' && Date.now() < (this.bossEvent?.endsAt ?? 0),
      handleTap:       (player, idx) => this.handleTap(player, idx),
      emit:            (event) => this.emit(event as unknown as GameEvent),
      getActiveCells:  (player) => (player === 1 ? this.p1 : this.p2).active,
      isPlaying:       () => this.phase === 'playing',
    });
  }

  private _applySettings(s: { reducedMotion?: boolean; liteMode?: boolean }) {
    if (s.reducedMotion !== undefined) {
      this.devRotationSpeed = s.reducedMotion ? 0.5 : 1;
    }
  }

  setConfig(cfg: typeof this._config) { this._config = cfg; }

  handleError(err: Error, phase: string) {
    errorTracker.capture(err, { phase, tick: this.tickCount, p1Score: this.p1?.score, p2Score: this.p2?.score });
    if (this.phase === "playing") {
      this.pause();
    }
  }

  getDDASpawnRate() { return this.dda.spawnRate; }
  isDailyComplete() { return this.daily.isTodayComplete(); }

  async generateScoreCard(score: number): Promise<string> {
    if (this._isDisposed) return "";
    return scoreCardGen.generate({
      score,
      hearts: this.p1?.health ?? 0,
      time: Math.round(this.tickCount / 2),
      rank: score > 5000 ? 'S' : score > 3000 ? 'A' : score > 1000 ? 'B' : 'C',
      seed: this.daily.getSeed() || 'casual'
    });
  }

  start(forceSeed?: number): void {
    if (this._isDisposed) return; // Fix #2: Uninitialized/Disposed guard
    this.stop();
    // Issue 15: Temporarily detach boss complete handler to prevent
    // the boss_defeat achievement from firing on cleanup deactivation.
    if (this._bossCompleteHandler) window.removeEventListener('dtp:boss:complete', this._bossCompleteHandler);
    bossEngine.deactivate();
    if (this._bossCompleteHandler) window.addEventListener('dtp:boss:complete', this._bossCompleteHandler);
    rhythmFeedback.reset();
    sessionStorage.removeItem(this.SESSION_KEY);
    this.tickCount  = 0;
    this.evolveTick = 0;
    this.iMult      = this.config.speedMult;
    this.devGodMode = this.config.godMode ?? false;
    this.paused     = false;
    this.phase      = "playing";
    this.cellShape  = "square";
    this.spinLevel  = 0;
    this._lastTickTs = performance.now();
    this._deltaTimers = [];
    this.clearAllTimeouts();
    this._bossActive = false;
    this._deathSlowdown = false;
    this._shieldCollected = 0;
    this._freezeCollected = 0;
    this._purpleTaps = 0;
    this._tookDamage = false;
    this._bombDefuseCount = 0;
    this.inputBuffer.clear();
    if (this._deathCleanupTimer) { clearTimeout(this._deathCleanupTimer); this._deathCleanupTimer = null; }
    this.gameSeed   = forceSeed ?? seedManager.initOrRestore();
    this.rng        = mulberry32(this.gameSeed);
    this._bot.setRng(this.rng);
    this.rareMode        = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
    this.bossEvent = null;
    this.nextBossTriggerScore = 500;
    this.activeBomb = null;
    // Load stored once, compute deductions, call saveStoredPowerups once for mult deduction if hasMult, once for heart reset if bonusHearts
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    const bonusHearts = (this.config.mode === "evolve" && stored.heart > 0) ? stored.heart : 0;
    const hasMult = (this.config.mode === "evolve" && (stored.mult ?? 0) > 0);
    if (hasMult || bonusHearts > 0) {
      const updated = { ...stored };
      if (hasMult) updated.mult = (stored.mult ?? 1) - 1;
      if (bonusHearts > 0) updated.heart = 0;
      this.config.storage?.saveStoredPowerups(updated);
    }
    this.p1 = makePS(bonusHearts, hasMult, stored);
    this.p2 = makePS(bonusHearts, hasMult, this.config.numPlayers === 2 ? { freeze: 0, shield: 0, mult: 0, heart: 0 } : stored);
    this.p1.nextShuffleTick = 40 + Math.floor(this.rng() * 20); // K2: first shuffle at tick 40-60
    this.p2.nextShuffleTick = 40 + Math.floor(this.rng() * 20);
    this.tapBuffer  = { 1: null, 2: null };
    this.dirty = true;
    this.emit({ type: "phaseChange", phase: "playing" });
    this.emitSnapshot();
    this.scheduleTick();
    this.startSnapshotRaf();
    analytics.track('game_start', { mode: this.config.mode, seed: this.gameSeed });
  }

  stop(): void {
    if (this.tickTimer !== null) {
      clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this._bot.dispose();
  }

  private lastFrameTime = 0;

  private startSnapshotRaf(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId); // Fix #1: Prevent RAF leak
    this.lastFrameTime = performance.now();
    const loop = (timestamp: number) => {
      if (this.rafId === null) return;
      if (this.lastFrameTime > 0) {
        const frameTime = timestamp - this.lastFrameTime;
        if (this.phase === "playing") {
          this.updatePerformanceMetrics(frameTime);
        }
      }
      this.lastFrameTime = timestamp;
      if (this.dirty && this.phase !== "gameover") {
        this.dirty = false;
        this.emitSnapshot();
      }
      if (this.phase !== "gameover") {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private scheduleTick(): void {
    if (this.phase !== "playing") return;
    const now = Date.now();
    const frozen = this.p1.freezeEnd > now || (this.config.numPlayers === 2 && this.p2.freezeEnd > now);
    const tickForCalc = this.devFreezeTime ? 0 : this.tickCount;
    const ddaFactor = Math.max(0.75, Math.min(1.25, this.dda.compute() / 1200));
    const ms = computeMs(tickForCalc, frozen ? 1.4 : 1) * this.iMult * ddaFactor;
    // Add hit pause delay if active, and apply death slowdown
    const hitPauseRemaining = Math.max(0, this._hitPauseUntil - performance.now());
    const slowdownMult = this._deathSlowdown ? 3 : 1;
    const delay = (ms * slowdownMult) + hitPauseRemaining;
    this.tickTimer = setTimeout(() => {
      if (this.phase !== "playing") return;
      this.processTick();
      this.scheduleTick();
    }, delay);
  }

  private scheduleTimeout(cb: () => void, ms: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this._timeouts = this._timeouts.filter(t => t !== id);
      if (this.phase !== 'paused') cb();
    }, ms);
    this._timeouts.push(id);
    return id;
  }

  private clearAllTimeouts(): void {
    this._timeouts.forEach(clearTimeout);
    this._timeouts = [];
  }

  addDeltaTimer(id: string, durationMs: number, callback: () => void) {
    this.removeDeltaTimer(id);
    this._deltaTimers.push({ id, remaining: durationMs, duration: durationMs, callback });
  }

  removeDeltaTimer(id: string) {
    this._deltaTimers = this._deltaTimers.filter(t => t.id !== id);
  }

  clearAllDeltaTimers() { this._deltaTimers = []; }

  pause(): void {
    if (this.phase !== "playing" || !this.p1 || !this.p2) return;
    this.paused = true;
    this.phase  = "paused";
    if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; }
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    if (this._sessionAutoSaveInterval) { clearInterval(this._sessionAutoSaveInterval); this._sessionAutoSaveInterval = null; }
    this.dirty = true;
    this._pauseListeners.forEach(fn => fn());
    this.emit({ type: "phaseChange", phase: "paused" });
    this.emitSnapshot();
  }

  resume(): void {
    if (this.phase !== "paused") return;
    if (!this.p1?.alive) return; // Fix #7: Validation
    this.paused = false;
    this.phase  = "playing";
    this.scheduleTick();
    this.startSnapshotRaf(); // Restart RAF loop
    this.dirty = true;
    this._resumeListeners.forEach(fn => fn());
    this.emit({ type: "phaseChange", phase: "playing" });
    this.emitSnapshot();
  }

  onPause(cb: () => void): void { this._pauseListeners.push(cb); }
  onResume(cb: () => void): void { this._resumeListeners.push(cb); }

  /** Hit pause: briefly freeze the game on impactful moments (damage, boss, milestones) */
  hitPause(ms: number): void {
    this._hitPauseUntil = performance.now() + ms;
  }

  /** Check if currently in hit pause */
  get isHitPaused(): boolean {
    return performance.now() < this._hitPauseUntil;
  }

destroy(): void {
    this._isDisposed = true;
    this._settingsUnsub?.();
    this._configUnsub?.();
    this._gamepadUnsub?.();
    if (this._bossCompleteHandler) window.removeEventListener('dtp:boss:complete', this._bossCompleteHandler);
    if (this._bossShieldBreakHandler) window.removeEventListener('dtp:boss:shield-break', this._bossShieldBreakHandler);
    if (this._difficultyEmergencyHandler) window.removeEventListener('dtp:difficulty:emergency', this._difficultyEmergencyHandler);
    bossEngine.dispose();
    this.holdTimers.clear();
    this.tapBuffer = { 1: null, 2: null };
    this.clearAllTimeouts();
    this.clearAllDeltaTimers();
    if (this._sessionAutoSaveInterval) { clearInterval(this._sessionAutoSaveInterval); this._sessionAutoSaveInterval = null; }
    if (this._deathCleanupTimer) { clearTimeout(this._deathCleanupTimer); this._deathCleanupTimer = null; }
    this.stop();
    this.listeners.clear();
    this._pauseListeners = [];
    this._resumeListeners = [];
  }

  safeReset(keepSettings = false) {
    if (!keepSettings) {
      this._settingsUnsub?.();
      this._settingsUnsub = null;
      // Re-subscribe to settings after reset
      import('../utils/settings').then(m => {
        this._settingsUnsub = m.settingsManager.subscribe(s => this._applySettings(s));
      }).catch(e => logError('Settings module failed', e));
    }
    this.start();
  }

  subscribe(fn: (e: GameEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(event: GameEvent): void {
    this.listeners.forEach(fn => fn(event));
  }

  private emitSnapshot(): void {
    this.emit({ type: "tick", snapshot: this.getSnapshot() });
    this.dirty = false;
  }

  private _currentTickMs(): number {
    const now = Date.now();
    const frozen = this.p1.freezeEnd > now || (this.config.numPlayers === 2 && this.p2.freezeEnd > now);
    const tickForCalc = this.devFreezeTime ? 0 : this.tickCount;
    return computeMs(tickForCalc, frozen ? 1.4 : 1) * this.iMult;
  }

  private processTick(): void {
    try {
      this._cachedNow = Date.now(); // Cache once per tick
      this._tickProcessor.processTick(this._tickCtx);
    } catch (e) {
      // Fix #6: Error handling to prevent engine lockup
      this.handleError(e as Error, "processTick");
    }
  }

  handleTap(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing") return;
    const cellId = `p${player}-${idx}`;
    if (!this.inputBuffer.register(cellId)) return;
    haptics.tap();
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref || !ref.alive) return;
    this.tapBuffer[player] = { idx, ts: Date.now() };
    this._flushTapBuffer(player);
  }

  private _flushTapBuffer(player: 1 | 2): void {
    const entry = this.tapBuffer[player];
    if (!entry || Date.now() - entry.ts > GameEngine.TAP_BUFFER_MS) { this.tapBuffer[player] = null; return; }
    const ref = player === 1 ? this.p1 : this.p2;
    const cell = ref.active.find(c => c.idx === entry.idx);
    if (!cell || cell.clicked) return;
    this.tapBuffer[player] = null;
    this._processTap(player, entry.idx);
  }

  private _processTap(player: 1 | 2, idx: number): void {
    const ref = player === 1 ? this.p1 : this.p2;
    const cell = ref.active.find(c => c.idx === idx);
    if (!cell || cell.clicked) return;
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    if (!(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)).includes(idx)) return;
    const isInvertedTap = this.bossEvent?.type === "inversion" && Date.now() < (this.bossEvent?.endsAt ?? 0);
    const danger = this.rareMode.active ? this.rareMode.color : "purple";

    if (cell.type === "ice") {
      const rem = (cell.iceCount ?? 1) - 1;
      this.triggerCellAnim(player, idx, rem <= 0 ? "pop" : "shake");
      this.emit({ type: "sound", name: rem <= 0 ? "ok" : "tick" });
      if (rem <= 0) {
        haptics.success();
        cell.clicked = true;
        const { mult } = calculateTapScore(Date.now() < ref.multiplierEnd, false, 1);
        const nextStreak = ref.streak + 1;
        ref.score += mult + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
        this.checkStageProgress(player);
        if (ref.active.every(c => c.clicked || (c.type as string) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.dirty = true; this.emitSnapshot(); return; }
      } else cell.iceCount = rem;
      ref.cells = activeToCellsP(ref.active, pat);
      this.dirty = true;
      this.emitSnapshot();
      return;
    }
    if (cell.type === "hold") return;
    // Bomb cell ΓÇö defuse it
    if (cell.type === "bomb") {
      cell.clicked = true;
      if (this.activeBomb?.idx === idx && this.activeBomb?.player === player) this.activeBomb = null;
      this.triggerCellAnim(player, idx, "pop");
      this.emit({ type: "sound", name: "powerup" });
      this.emit({ type: "bombDefused", player });
      this.emit({ type: "toast", message: "💣 Defused! +3" });
      this.hitPause(30);
      const { mult } = calculateTapScore(Date.now() < ref.multiplierEnd, false, 1);
      const nextStreak = ref.streak + 1;
      ref.score += (mult * 3) + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
      this.checkStageProgress(player);
      // Bomb achievements — track total defuses
      this._bombDefuseCount = (this._bombDefuseCount ?? 0) + 1;
      achievementSystem.check('bomb_defuse', () => this._bombDefuseCount >= 10);
      achievementSystem.check('bomb_master', () => this._bombDefuseCount >= 50);
      ref.cells = activeToCellsP(ref.active, pat);
      this.dirty = true;
      this.emitSnapshot();
      return;
    }
    const dmg = this.config.mode === "evolve" ? 0.5 : 1;
    if (["medpack","shield","freeze","multiplier"].includes(cell.type)) {
      cell.clicked = true; this.emit({ type: "sound", name: "powerup" }); this.triggerCellAnim(player, idx, "pop");
      if (cell.type === "medpack") haptics.medpack();
      else if (cell.type === "shield") haptics.shield();
      else if (cell.type === "freeze") haptics.freeze();
      else if (cell.type === "multiplier") haptics.multiplier();
      if (cell.type === "medpack") {
        if (ref.health >= GAME.MAX_HEARTS) {
          // Overheal → gain shield instead
          ref.shieldCount += 1; ref.shield = true;
          this.emit({ type: "pwrToast", message: `🛡 Overheal! +1 Shield`, player });
        } else {
          ref.health += 1;
          this.emit({ type: "toast", message: "♥ +1 Heart!" });
        }
      }
      if (cell.type === "shield") { ref.shieldCount += 1; ref.shield = true; this._shieldCollected++; }
      if (cell.type === "freeze") { ref.freezeEnd = Math.max(ref.freezeEnd, Date.now()) + 15000; this._freezeCollected++; }
      if (cell.type === "multiplier") ref.multiplierEnd = Date.now() + 24000;
      if (cell.type === "shield") {
        this.emit({ type: "pwrToast", message: `≡ƒ¢í Shield ├ù${ref.shieldCount}!`, player });
      } else if (cell.type === "multiplier") {
        this.emit({ type: "pwrToast", message: "ΓÜí multiplier ├ù2!", player });
      } else if (cell.type === "freeze") {
        this.emit({ type: "pwrToast", message: "Γ¥ä Freeze activated!", player });
      }
    } else {
      const tappedIsDanger = isInvertedTap ? cell.type !== 'purple' : cell.type === danger;
      if (tappedIsDanger) {
        cell.clicked = true;
        if (!this.devGodMode) {
          if (ref.shieldCount > 0) { this.dda.recordAttempt(false, 0, false); ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 }); this.triggerCellAnim(player, idx, "pop"); }
          else {
            this.dda.recordAttempt(false, 0, true);
            if (ref.streak >= 5) this.emit({ type: "toast", message: `🔥 ${ref.streak} streak lost!` });
            ref.health = Math.max(0, ref.health - dmg); ref.shield = false; ref.streak = 0; this._tookDamage = true;
            this.emit({ type: "sound", name: "bad" }); this.triggerCellAnim(player, idx, "shake");
            this.emit({ type: "damage", player }); this.emit({ type: "shake", player });
            this.hitPause(ref.health < 1 ? 200 : 40); // Death: 200ms, damage: 40ms
            if (ref.health < 1) { ref.alive = false; this.triggerGameOver(this.config.numPlayers === 1 ? null : (player === 1 ? "p2" : "p1")); }
          }
        } else { this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 }); this.triggerCellAnim(player, idx, "pop"); }
        // Count purple taps for secret achievement (danger branch: normal play where purple is dangerous)
        this._purpleTaps = (this._purpleTaps ?? 0) + (cell.type === 'purple' ? 1 : 0);
        achievementSystem.check('secret_purple_tap', () => (this._purpleTaps ?? 0) >= 10);
      } else {
      cell.clicked = true; this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 }); this.triggerCellAnim(player, idx, "pop");
      if (this._bossActive) bossEngine.onSafeTap();
      rhythmFeedback.recordTap();
      const { mult, bossMult } = calculateTapScore(Date.now() < ref.multiplierEnd, this._bossActive, bossEngine.combo.multiplier);
      const nextStreak = ref.streak + 1;
      const tapScore = (mult * bossMult) + calculateStreakBonus(nextStreak);
      ref.score += tapScore; ref.streak = nextStreak; ref.stageProgress += 1;
      this.emit({ type: "scoreFloat", player, idx, amount: tapScore });
      if (checkStreakMilestone(ref.streak)) { this.emit({ type: "toast", message: `🔥 ${ref.streak} Streak!` }); this.hitPause(25); haptics.combo(ref.streak); }
      if (ref.health === 1 && !this.devGodMode) this.emit({ type: "toast", message: "Γ¥ñ∩╕Å Last heart!" });
      this.checkStageProgress(player);
      const now = performance.now();
      const reaction = this._lastTapTime ? now - this._lastTapTime : 0;
      this._lastTapTime = now;
      if (reaction > 0) this.dda.recordAttempt(true, reaction, false);
      achievementSystem.check('first_blood', () => true);
      achievementSystem.check('survivor', () => ref.health <= 1 && this.tickCount > 300);
      // Score milestones
      achievementSystem.check('score_100', () => ref.score >= 100);
      achievementSystem.check('score_500', () => ref.score >= 500);
      achievementSystem.check('score_1000', () => ref.score >= 1000);
      achievementSystem.check('score_2500', () => ref.score >= 2500);
      achievementSystem.check('score_5000', () => ref.score >= 5000);
      achievementSystem.check('score_9999', () => ref.score >= 9999);
      // Streak milestones
      achievementSystem.check('streak_10', () => ref.streak >= 10);
      achievementSystem.check('streak_25', () => ref.streak >= 25);
      achievementSystem.check('streak_50', () => ref.streak >= 50);
      // Speed achievements
      const currentSpeed = parseFloat(speedLabel(this.tickCount, ref.freezeEnd > Date.now()));
      achievementSystem.check('speed_2x', () => currentSpeed >= 2.0);
      achievementSystem.check('speed_3x', () => currentSpeed >= 3.0);
      achievementSystem.check('shield_5', () => (this._shieldCollected ?? 0) >= 5);
      achievementSystem.check('freeze_5', () => (this._freezeCollected ?? 0) >= 5);
      // Secret: score 500+ at 3x speed
      achievementSystem.check('secret_speed_run', () => ref.score >= 500 && currentSpeed >= 3.0);
    }
    }
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private checkStageProgress(player: 1 | 2): void {
    const ref = player === 1 ? this.p1 : this.p2;
    if (this.config.mode === "evolve" && ref.stageProgress >= GAME.STAGE_TAPS_NEEDED && ref.gridStage < STAGES.length - 1) ref.pendingStageUpdate = true;
  }

  private triggerCellAnim(player: 1 | 2, idx: number, anim: "pop" | "shake"): void {
    const ref = player === 1 ? this.p1 : this.p2;
    ref.anim[idx] = anim;
    this.emit({ type: "cellAnim", player, idx, anim });
    this.scheduleTimeout(() => { if (ref.anim[idx] === anim) { ref.anim = { ...ref.anim }; delete ref.anim[idx]; } }, GAME.CELL_ANIM_MS);
  }

  handleHoldStart(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || cell.type !== "hold") return;
    (cell as HoldCell).holdStart = Date.now();
    const key = `${player}_${idx}`;
    if (this.holdTimers.has(key)) {
      this.removeDeltaTimer(`hold_${key}`);
      this.holdTimers.delete(key);
    }
    const gen = ++this.holdGeneration;
    this.addDeltaTimer(`hold_${key}`, GAME.HOLD_TIMEOUT_MS, () => {
      const entry = this.holdTimers.get(key);
      if (!entry || entry.generation !== gen || entry.cell.clicked) return;
      (entry.cell as HoldCell).holdStart = undefined;
      this.dirty = true;
      this.triggerCellAnim(entry.player, entry.cell.idx, "shake");
      this.emitSnapshot();
      this.holdTimers.delete(key);
    });
    this.holdTimers.set(key, { cell, player, generation: gen });
    this.dirty = true;
    this.emitSnapshot();
  }

  handleHoldEnd(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || cell.type !== "hold") return;
    const key = `${player}_${idx}`;
    const entry = this.holdTimers.get(key);
    if (entry) { this.removeDeltaTimer(`hold_${key}`); this.holdTimers.delete(key); }
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    const elapsed = Date.now() - ((cell as HoldCell).holdStart ?? Date.now());
    if (elapsed >= (cell as HoldCell).holdRequired) {
      cell.clicked = true; this.triggerCellAnim(player, idx, "pop");
      this.emit({ type: "sound", name: "powerup" });
      const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
      const nextStreak = ref.streak + 1;
      ref.score += (mult * 2) + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
      this.checkStageProgress(player);
      this.emit({ type: "toast", message: "≡ƒÆ¬ Hold! +2" });
      if (ref.active.every(c => c.clicked || (c.type as string) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.emitSnapshot(); return; }
    } else { (cell as HoldCell).holdStart = undefined; this.triggerCellAnim(player, idx, "shake"); }
    ref.cells = activeToCellsP(ref.active, pat);
    this.emitSnapshot();
  }

  activateStoredFreeze(player: 1 | 2): void {
    if (this._isDisposed) return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive || ref.storedFreezeCharges <= 0) return;
    ref.storedFreezeCharges -= 1;
    ref.freezeEnd = Math.max(ref.freezeEnd, Date.now()) + 15000;
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    this.config.storage?.saveStoredPowerups({ freeze: ref.storedFreezeCharges, shield: ref.storedShieldCharges, mult: stored.mult, heart: stored.heart });
    this.emit({ type: "toast", message: "Γ¥ä Freeze activated!" });
    this.emitSnapshot();
  }

  activateStoredShield(player: 1 | 2): void {
    if (this._isDisposed) return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive || ref.storedShieldCharges <= 0) return;
    ref.storedShieldCharges -= 1;
    ref.shieldCount += 1;
    ref.shield = true;
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    this.config.storage?.saveStoredPowerups({ freeze: ref.storedFreezeCharges, shield: ref.storedShieldCharges, mult: stored.mult, heart: stored.heart });
    this.emit({ type: "toast", message: `≡ƒ¢í Shield ├ù${ref.shieldCount}!` });
    this.emitSnapshot();
  }

  devForceStage(stage: number): void {
    const validPatterns = EVOLVE_PATTERNS.map((p, i) => ({ p, i })).filter(({ p }) => p.minStage <= stage);
    const pick = validPatterns[Math.floor(this.rng() * validPatterns.length)];
    this.p1.gridStage = stage; this.p1.stageProgress = 0; this.p1.patternIdx = pick?.i ?? 0;
    this.p2.gridStage = stage; this.p2.stageProgress = 0; this.p2.patternIdx = pick?.i ?? 0;
    this.emitSnapshot();
  }

  devForcePattern(idx: number): void {
    this.p1.patternIdx = idx; this.p2.patternIdx = idx;
    const pat = EVOLVE_PATTERNS[idx] ?? EVOLVE_PATTERNS[0];
    const rareColor = this.rareMode.active ? this.rareMode.color : undefined;
    const rareShape = this.rareMode.active ? this.rareMode.shape : undefined;
    this.p1.active = spawnActive(this.rng, this.p1.gridStage, this.p1.health, pat, this.config.mode === "evolve", rareColor, rareShape, this.tickCount, this.devGodMode);
    this.p1.cells = activeToCellsP(this.p1.active, pat);

    this.p2.active = spawnActive(this.rng, this.p2.gridStage, this.p2.health, pat, this.config.mode === "evolve", rareColor, rareShape, this.tickCount, this.devGodMode);
    this.p2.cells  = activeToCellsP(this.p2.active, pat);
    this.emitSnapshot();
  }

  devForceRare(r: { color: string; cssColor: string; shape?: CellShape; emoji?: string } | null): void {
    if (!r) this.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
    else { this.rareMode = { active: true, color: r.color, cssColor: r.cssColor, turnsLeft: 10, shape: r.shape ?? "circle", emoji: r.emoji ?? "" }; this.emit({ type: "rareStart", color: r.color, cssColor: r.cssColor }); this.emit({ type: "sound", name: "rareStart" }); }
    this.emitSnapshot();
  }

  devSetGodMode(v: boolean): void { this.devGodMode = v; }
  devSetFreezeTime(v: boolean): void { this.devFreezeTime = v; }
  devSetRotationSpeed(v: number): void { this.devRotationSpeed = Math.max(0.1, v); }
  devSpawnPowerup(type: "shield" | "freeze" | "heart"): void { this.devForcedPwr = type; }
  getDevRotationSpeed(): number { return this.devRotationSpeed; }

  devSpawnSpecialCell(player: 1 | 2, type: "ice" | "hold" | "bomb" | "rare", idx?: number): void {
    const target = player === 1 ? this.p1 : this.p2;
    if (!target.alive) return;
    const slot = idx !== undefined ? idx : Math.floor(this.rng() * Math.max(target.active.length, 1));
    const existing = target.active[slot];
    if (existing) {
      const cellType = type === "rare"
        ? (this.rareMode.active ? this.rareMode.color : "purple")
        : type;
      const mutable = existing as Record<string, unknown>;
      mutable.type = cellType;
      if (type === "ice") { mutable.iceCount = 3; mutable.holdProgress = undefined; }
      if (type === "hold") { mutable.holdProgress = 0; mutable.iceCount = undefined; }
      if (type === "bomb") { mutable.expiresAt = Date.now() + 3000; }
    }
    this.emitSnapshot();
  }

  devTriggerBotTap(player: 1 | 2, idx: number, dustCost = 3): void {
    this.emit({ type: "botTap", player, idx, dustCost });
  }

  devToggleBotAssist(player: 1 | 2, enabled: boolean): void {
    this.setBotAssist(player, enabled);
  }

  updatePerformanceMetrics(frameTime: number): void {
    const fps = 1000 / Math.max(frameTime, 1);
    if (this.fpsHistory.length < 60) { this.fpsHistory.push(fps); } else { this.fpsHistory[this.fpsIdx] = fps; this.fpsIdx = (this.fpsIdx + 1) % 60; }
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    if (!this.autoLowQuality && avgFps < this.lowQualityThreshold) {
      this.autoLowQuality = true;
      document.documentElement.style.setProperty('--particles-enabled', '0');
      document.documentElement.style.setProperty('--motion-scale', '0.5');
      this.emit({ type: "qualityDowngrade", reason: "fps-drop", avgFps });
    } else if (this.autoLowQuality && avgFps > 50) {
      this.autoLowQuality = false;
      document.documentElement.style.setProperty('--particles-enabled', '1');
      document.documentElement.style.setProperty('--motion-scale', '1');
      this.emit({ type: "qualityUpgrade", avgFps });
    }
  }

  getAutoLowQuality(): boolean { return this.autoLowQuality; }

  startSessionPersistence(): void {
    if (this._sessionAutoSaveInterval) return;
    this._sessionAutoSaveInterval = setInterval(() => {
      if (this.phase === "playing" && !this.paused && this.p1.alive) {
        sessionManager.save({
          hearts: this.p1.health,
          score: this.p1.score,
          timeLeft: GAME.HUMAN_LIMIT_TICK - this.tickCount,
          isPaused: this.paused
        }, { theme: 'default', difficulty: this.config.mode });
      }
    }, 5000);
  }

  stopSessionPersistence(): void {
    if (this._sessionAutoSaveInterval) {
      clearInterval(this._sessionAutoSaveInterval);
      this._sessionAutoSaveInterval = null;
    }
  }

  restoreFromSession(data: { hearts?: number; score?: number; timeLeft?: number }): void {
    if (!this.p1) return;
    if (data.hearts != null) this.p1.health = Math.max(0, Math.min(GAME.MAX_HEARTS, data.hearts));
    if (data.score != null) this.p1.score = Math.max(0, Math.min(9999, Math.floor(data.score)));
    if (data.timeLeft != null) this.tickCount = Math.max(0, GAME.HUMAN_LIMIT_TICK - data.timeLeft);
  }

  submitScoreToLeaderboard(score: number): void {
    if (this._isDisposed) return;
    scoreSync.queue(score, this.config.mode, this.tickCount);
  }

  async generateChallengeUrl(): Promise<string> {
    return challengeLink.generate(this.p1.score, this.gameSeed.toString(), this.p1.health);
  }

  getSnapshot(): GameSnapshot {
    // Guard against uninitialized engine
    if (!this.p1 || !this.p2) {
      return {
        tick: 0, evolveTick: 0, gameSeed: 0,
        p1: { cells: Array(25).fill('inactive'), active: [], score: 0, streak: 0, alive: false, anim: {}, health: 0, shield: false, shieldCount: 0, freezeEnd: 0, multiplierEnd: 0, gridStage: 0, stageProgress: 0, patternIdx: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 0 },
        p2: { cells: Array(25).fill('inactive'), active: [], score: 0, streak: 0, alive: false, anim: {}, health: 0, shield: false, shieldCount: 0, freezeEnd: 0, multiplierEnd: 0, gridStage: 0, stageProgress: 0, patternIdx: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 0 },
        cellShape: 'square', rareMode: { active: false, color: '', cssColor: '', turnsLeft: 0, shape: 'circle', emoji: '' },
        spinLevel: 0, paused: false, phase: 'playing',
        grid: { cols: 3, rows: 3, mask: null }, spinCfg: null, devRotationSpeed: 1,
        bossEvent: null, activeBomb: null, isInverted: false, isBlackout: false,
      } as GameSnapshot;
    }
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[this.p1.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    const cloneActive = (active: ActiveCell[]): ActiveCell[] => active.map(c => ({ ...c }));

    // Cache mask array — only re-copy when the source reference changes
    if (pat.mask !== this._cachedMaskSrc) {
      this._cachedMaskSrc = pat.mask ?? null;
      this._cachedMask = pat.mask ? [...pat.mask] : null;
    }

    // Memoize spinCfg — only recompute when spinLevel or gameSeed changes
    let spinCfg: { duration: number; direction: 1 | -1 } | null = null;
    if (this.config.mode === "evolve" && this.spinLevel >= 3) {
      if (this._cachedSpinLevel !== this.spinLevel || this._cachedSpinSeed !== this.gameSeed || this._cachedRotationSpeed !== this.devRotationSpeed) {
        const cfg = getSpinConfig(this.spinLevel, this.gameSeed);
        this._cachedSpinCfg = { ...cfg, duration: cfg.duration * this.devRotationSpeed };
        this._cachedSpinLevel = this.spinLevel;
        this._cachedSpinSeed = this.gameSeed;
        this._cachedRotationSpeed = this.devRotationSpeed;
      }
      spinCfg = this._cachedSpinCfg;
    } else {
      this._cachedSpinCfg = null;
      this._cachedSpinLevel = -1;
      this._cachedSpinSeed = -1;
    }

    return {
      tick:       this.tickCount,
      evolveTick: this.evolveTick,
      gameSeed:   this.gameSeed,
      p1:         { ...this.p1, cells: [...this.p1.cells], active: cloneActive(this.p1.active), anim: { ...this.p1.anim } },
      p2:         { ...this.p2, cells: [...this.p2.cells], active: cloneActive(this.p2.active), anim: { ...this.p2.anim } },
      cellShape:  this.cellShape,
      rareMode:   { ...this.rareMode },
      spinLevel:  this.spinLevel,
      paused:     this.paused,
      phase:      this.phase,
      grid: { cols: pat.cols, rows: pat.rows, mask: this._cachedMask },
      spinCfg,
      devRotationSpeed: this.devRotationSpeed,
      bossEvent:  this.bossEvent ? { ...this.bossEvent } : null,
      activeBomb: this.activeBomb ? { ...this.activeBomb } : null,
      isInverted: this._isInverted,
      isBlackout: this._isBlackout,
    };
  }

  getSpinConfig(level: number): { duration: number; direction: 1 | -1 } { return getSpinConfig(level, this.gameSeed); }

  // SESSION_SNAPSHOT_VERSION — bump ONLY for breaking schema changes (field rename/removal/type change).
  // Adding new optional fields with ?? defaults is NOT a breaking change and must NOT bump this.
  // Current breaking changes from v1→v2: added `p1.active`, `p2.active`, `bossEvent`, `activeBomb`.
  private static readonly SESSION_SNAPSHOT_VERSION = 2;

  getSessionSnapshot(): Record<string, unknown> {
    return {
      version: GameEngine.SESSION_SNAPSHOT_VERSION,
      ts: Date.now(),
      gameSeed: this.gameSeed,
      tickCount: this.tickCount,
      evolveTick: this.evolveTick,
      cellShape: this.cellShape,
      spinLevel: this.spinLevel,
      rareMode: { ...this.rareMode },
      isInverted: this._isInverted,
      nextShuffleTick: this.p1.nextShuffleTick,
      p2NextShuffleTick: this.p2.nextShuffleTick,
      bossEvent: this.bossEvent ? { type: this.bossEvent.type, endsAt: this.bossEvent.endsAt } : null,
      nextBossTriggerScore: this.nextBossTriggerScore,
      _bossActive: this._bossActive,
      _hitPauseUntil: this._hitPauseUntil,
      bossEngineActive: bossEngine.state.active,
      bossEngineShieldHits: bossEngine.state.shieldHits,
      activeBomb: this.activeBomb ? { idx: this.activeBomb.idx, expiresAt: this.activeBomb.expiresAt, player: this.activeBomb.player } : null,
      ddaSpawnRate: this.dda.spawnRate,
      hearts: this.p1.health,
      score: this.p1.score,
      timeLeft: GAME.HUMAN_LIMIT_TICK - this.tickCount,
      isPaused: this.paused,
      p1: {
        score: this.p1.score, health: this.p1.health, streak: this.p1.streak,
        gridStage: this.p1.gridStage, stageProgress: this.p1.stageProgress, patternIdx: this.p1.patternIdx,
        shield: this.p1.shield, shieldCount: this.p1.shieldCount,
        freezeEnd: this.p1.freezeEnd, multiplierEnd: this.p1.multiplierEnd,
        storedFreezeCharges: this.p1.storedFreezeCharges, storedShieldCharges: this.p1.storedShieldCharges,
        alive: this.p1.alive,
        active: this.p1.active.map(c => ({ ...c })),
      },
      p2: this.config.numPlayers === 2 ? {
        score: this.p2.score, health: this.p2.health, streak: this.p2.streak,
        gridStage: this.p2.gridStage, stageProgress: this.p2.stageProgress, patternIdx: this.p2.patternIdx,
        shield: this.p2.shield, shieldCount: this.p2.shieldCount,
        freezeEnd: this.p2.freezeEnd, multiplierEnd: this.p2.multiplierEnd,
        storedFreezeCharges: this.p2.storedFreezeCharges, storedShieldCharges: this.p2.storedShieldCharges,
        alive: this.p2.alive,
        active: this.p2.active.map(c => ({ ...c })),
      } : null,
    };
  }

  restoreSessionSnapshot(data: Record<string, unknown>): boolean {
    try {
      // Clear stale timers from any prior session before restoring
      this.clearAllTimeouts();
      this.clearAllDeltaTimers();
      if (!data || !data.gameSeed) return false;
      // Reject snapshots from incompatible versions to avoid silent state corruption
      const snapshotVersion = typeof data.version === 'number' ? data.version : 1;
      if (snapshotVersion < GameEngine.SESSION_SNAPSHOT_VERSION) {
        logError(`[GameEngine] Session snapshot version ${snapshotVersion} < current ${GameEngine.SESSION_SNAPSHOT_VERSION}, discarding`);
        return false;
      }
      // Create p1/p2 from snapshot if engine wasn't started (e.g. resume on reload)
      if (!this.p1 || !this.p2) {
        const n = 25; // 5×5 max grid
        const mkPlayer = (): PlayerState => ({
          cells: Array(n).fill('inactive') as CellType[], active: [], score: 0, streak: 0, alive: true,
          health: GAME.MAX_HEARTS, shield: false, shieldCount: 0, freezeEnd: 0, multiplierEnd: 0,
          gridStage: 0, stageProgress: 0, patternIdx: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 40,
          anim: {} as Record<number, string>,
        });
        if (!this.p1) this.p1 = mkPlayer();
        if (!this.p2) this.p2 = mkPlayer();
      }
      this.gameSeed = data.gameSeed as number;
      // #16 fix: fast-forward RNG to match tickCount so post-restore spawns
      // use the correct position in the seed sequence.
      this.rng = mulberry32(this.gameSeed);
      const rawTick = typeof data.tickCount === 'number' ? data.tickCount : 0;
      const rngStepsToSkip = Math.min(rawTick, GAME.HUMAN_LIMIT_TICK + 100); // Cap to prevent infinite loop from tampered data
      for (let i = 0; i < rngStepsToSkip; i++) this.rng();
      this.tickCount = rngStepsToSkip;
      this.evolveTick = (data.evolveTick as number) ?? 0;
      this.cellShape = (data.cellShape as CellShape) ?? "square";
      this.spinLevel = (data.spinLevel as number) ?? 0;
      if (data._hitPauseUntil != null) this._hitPauseUntil = Math.max(0, data._hitPauseUntil as number);
      if (data.rareMode) this.rareMode = stateGuard.sanitize(data.rareMode as Record<string, unknown>, this.rareMode as unknown as Record<string, unknown>) as unknown as RareColorMode;
      this._isInverted = (data.isInverted as boolean) ?? false;
      this.p1.nextShuffleTick = (data.nextShuffleTick as number) ?? 40;
      this.p2.nextShuffleTick = (data.p2NextShuffleTick as number) ?? 40;
      this.bossEvent = data.bossEvent ? { type: (data.bossEvent as Record<string, unknown>).type as BossEventType, endsAt: (data.bossEvent as Record<string, unknown>).endsAt as number } : null;
      this.nextBossTriggerScore = (data.nextBossTriggerScore as number) ?? 500;
      this._bossActive = (data._bossActive as boolean) ?? false;
      if (data.bossEngineActive) bossEngine.activate((data.bossEngineShieldHits as number) ?? 5);
      this.activeBomb = data.activeBomb ? { idx: (data.activeBomb as Record<string, unknown>).idx as number, expiresAt: (data.activeBomb as Record<string, unknown>).expiresAt as number, player: (data.activeBomb as Record<string, unknown>).player as 1 | 2 } : null;
      // Re-register bomb delta timer if bomb is still active
      if (this.activeBomb) {
        const bombRemaining = Math.max(0, this.activeBomb.expiresAt - Date.now());
        const bombPlayer = this.activeBomb.player;
        const bombIdx = this.activeBomb.idx;
        const bombRef = bombPlayer === 1 ? this.p1 : this.p2;
        this.addDeltaTimer(`bomb_${bombPlayer}_${bombIdx}`, bombRemaining, () => {
          if (!this.activeBomb || this.activeBomb.idx !== bombIdx || this.activeBomb.player !== bombPlayer) return;
          const stillActive = bombRef.active.find(c => c.idx === bombIdx && c.type === "bomb" && !c.clicked);
          if (!stillActive) { if (this.activeBomb?.idx === bombIdx) this.activeBomb = null; return; }
          this.activeBomb = null;
          stillActive.clicked = true;
          if (!this.devGodMode) {
            if (bombRef.shieldCount > 0) { bombRef.shieldCount -= 1; bombRef.shield = bombRef.shieldCount > 0; }
            else {
              const dmg = this.config.mode === "evolve" ? 0.5 : 1;
              bombRef.health = Math.max(0, bombRef.health - dmg); bombRef.shield = false;
              this._tookDamage = true;
              this.emit({ type: "damage", player: bombPlayer });
              this.emit({ type: "shake", player: bombPlayer });
              if (bombRef.health < 1) { bombRef.alive = false; this.triggerGameOver(this.config.numPlayers === 1 ? null : (bombPlayer === 1 ? "p2" : "p1")); }
            }
          }
          this.emit({ type: "bombExplode", player: bombPlayer });
          this.emit({ type: "toast", message: "💥 Bomb exploded!" });
        });
      }
      this.dda.reset((data.ddaSpawnRate as number) ?? 1200);
      const p1 = data.p1 as Record<string, unknown> | undefined;
      if (p1) {
        // Bounds checking — clamp values to prevent tampered session data
        this.p1.score = Math.max(0, Math.min(9999, (p1.score as number) ?? 0));
        this.p1.health = Math.max(0, Math.min(GAME.MAX_HEARTS + 2, (p1.health as number) ?? GAME.MAX_HEARTS));
        this.p1.streak = Math.max(0, Math.min(999, (p1.streak as number) ?? 0));
        this.p1.gridStage = Math.max(0, Math.min(10, (p1.gridStage as number) ?? 0));
        this.p1.stageProgress = Math.max(0, Math.min(999, (p1.stageProgress as number) ?? 0));
        this.p1.patternIdx = Math.max(0, Math.min(EVOLVE_PATTERNS.length - 1, (p1.patternIdx as number) ?? 0));
        this.p1.shield = (p1.shield as boolean) ?? false;
        this.p1.shieldCount = Math.max(0, Math.min(5, (p1.shieldCount as number) ?? 0));
        this.p1.freezeEnd = Math.max(0, (p1.freezeEnd as number) ?? 0);
        this.p1.multiplierEnd = Math.max(0, (p1.multiplierEnd as number) ?? 0);
        this.p1.storedFreezeCharges = Math.max(0, Math.min(10, (p1.storedFreezeCharges as number) ?? 0));
        this.p1.storedShieldCharges = Math.max(0, Math.min(10, (p1.storedShieldCharges as number) ?? 0));
        this.p1.alive = (p1.alive as boolean) ?? true;
        this.p1.active = ((p1.active as Array<Record<string, unknown>>) ?? []).map(c => {
          const cell = { ...c } as Record<string, unknown>;
          if (typeof cell.idx !== 'number' || (cell.idx as number) < 0) cell.idx = 0;
          if (!cell.type) cell.type = 'score';
          if (typeof cell.clicked !== 'boolean') cell.clicked = false;
          return cell as unknown as ActiveCell;
        });
        const pat = EVOLVE_PATTERNS[this.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
        this.p1.cells = activeToCellsP(this.p1.active, pat);
      }
      const p2 = data.p2 as Record<string, unknown> | null | undefined;
      if (p2 && this.config.numPlayers === 2) {
        this.p2.score = Math.max(0, Math.min(9999, (p2.score as number) ?? 0));
        this.p2.health = Math.max(0, Math.min(GAME.MAX_HEARTS + 2, (p2.health as number) ?? GAME.MAX_HEARTS));
        this.p2.streak = Math.max(0, Math.min(999, (p2.streak as number) ?? 0));
        this.p2.gridStage = Math.max(0, Math.min(10, (p2.gridStage as number) ?? 0));
        this.p2.stageProgress = Math.max(0, Math.min(999, (p2.stageProgress as number) ?? 0));
        this.p2.patternIdx = Math.max(0, Math.min(EVOLVE_PATTERNS.length - 1, (p2.patternIdx as number) ?? 0));
        this.p2.shield = (p2.shield as boolean) ?? false;
        this.p2.shieldCount = Math.max(0, Math.min(5, (p2.shieldCount as number) ?? 0));
        this.p2.freezeEnd = Math.max(0, (p2.freezeEnd as number) ?? 0);
        this.p2.multiplierEnd = Math.max(0, (p2.multiplierEnd as number) ?? 0);
        this.p2.storedFreezeCharges = Math.max(0, Math.min(10, (p2.storedFreezeCharges as number) ?? 0));
        this.p2.storedShieldCharges = Math.max(0, Math.min(10, (p2.storedShieldCharges as number) ?? 0));
        this.p2.alive = (p2.alive as boolean) ?? true;
        this.p2.active = ((p2.active as Array<Record<string, unknown>>) ?? []).map(c => {
          const cell = { ...c } as Record<string, unknown>;
          if (typeof cell.idx !== 'number' || (cell.idx as number) < 0) cell.idx = 0;
          if (!cell.type) cell.type = 'score';
          if (typeof cell.clicked !== 'boolean') cell.clicked = false;
          return cell as unknown as ActiveCell;
        });
        const pat2 = EVOLVE_PATTERNS[this.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
        this.p2.cells = activeToCellsP(this.p2.active, pat2);
      }
      this.emit({ type: "phaseChange", phase: "playing" });
      this.dirty = true;
      this.emitSnapshot();
      this.scheduleTick();
      this.startSnapshotRaf();
      return true;
    } catch (e) {
      logError("Session restore failed", e);
      return false;
    }
  }

  private autoSaveSession(): void {
    if (this.phase !== "playing" || this.paused) return;
    try {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(this.getSessionSnapshot()));
    } catch (e) { logError('autoSaveSession failed', e); }
  }

private triggerGameOver(winner: Winner): void {
    // Prevent double game over
    if (this._deathSlowdown || this.phase === "gameover") return;
    // Immediately set phase and emit game over events (logical end)
    this._deathSlowdown = true;
    this.hitPause(200); // Brief freeze on death
    this.phase = "gameover";
    this.emitSnapshot();
    this.emit({ type: "phaseChange", phase: "gameover" });
    this.emit({ type: "gameOver", winner });

    // Mode win achievements
    if (winner === "p1" || winner === "tie") {
      if (this.config.mode === "classic") achievementSystem.unlock('classic_win');
      if (this.config.mode === "evolve") achievementSystem.unlock('evolve_win');
    }

    // Game count achievements — read current count; hook layer handles the localStorage increment
    const gamesPlayed = Math.max(0, Math.min(99999, parseInt(localStorage.getItem('dtp-games-played') || '0') || 0)) + 1;
    achievementSystem.check('games_50', () => gamesPlayed >= 50);
    achievementSystem.check('games_200', () => gamesPlayed >= 200);

    // Perfect round — no damage taken
    achievementSystem.check('perfect_round', () => !this._tookDamage && this.tickCount > 100);

    // Reset per-game counters
    this._shieldCollected = 0;
    this._freezeCollected = 0;
    this._purpleTaps = 0;
    this._tookDamage = false;

    // Death slow-motion: visually slow for 600ms before cleanup
    if (this._deathCleanupTimer) clearTimeout(this._deathCleanupTimer);
    this._deathCleanupTimer = setTimeout(() => {
      this._deathCleanupTimer = null;
      if (this.phase !== 'gameover') return; // New game started during cleanup window
      this._deathSlowdown = false;
      this.tapBuffer = { 1: null, 2: null };
      this.holdTimers.clear();
      this.clearAllDeltaTimers();
      this.stop();
      const cur = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
      this.config.storage?.saveStoredPowerups({
        freeze: Math.max(0, this.p1.storedFreezeCharges ?? 0),
        shield: Math.max(0, this.p1.storedShieldCharges ?? 0),
        mult: cur.mult,
        heart: cur.heart,
      });
    }, 600);
    analytics.track('game_over', { score: this.p1.score, mode: this.config.mode, winner });
    this.dda.reset(this._config.grid.spawnRateMs);
    if (!this.daily.isTodayComplete()) {
      this.daily.markComplete(this.p1.score, this.tickCount);
      // daily_master unlock moved to useDailyProgress — only fires when checkObjective confirms completion
    }
  }

  startBot(): void { this._bot.start(this.config.mode, this.config.botAssist); }

  stopBot(): void { this._bot.stop(); }

  isBotActive(): boolean { return this._bot.isActive(); }

  setBotAssist(player: 1 | 2, enabled: boolean): void {
    this._bot.setAssist(player, enabled);
    if (player === 1 && enabled) this._bot.start(this.config.mode, this.config.botAssist);
  }

  getBotAssistActive(): { 1: boolean; 2: boolean } { return this._bot.getAssistState(); }
}
```

## File: engine/DifficultyScaler.ts
```typescript
import { DIFFICULTY } from "../config/difficulty";
import { difficultyOverrides } from "../config/difficultyOverrides";

// ─── Read overrides on each call (not at module load) ─────────────
function _initMs() { return difficultyOverrides.INIT_MS ?? DIFFICULTY.INIT_MS; }
function _minMs() { return difficultyOverrides.MIN_MS ?? DIFFICULTY.MIN_MS; }
function _decayExp() { return difficultyOverrides.DECAY_EXP ?? DIFFICULTY.DECAY_EXP; }
function _decayEvery() { return difficultyOverrides.DECAY_EVERY ?? DIFFICULTY.DECAY_EVERY; }
function _spinBaseDuration() { return difficultyOverrides.SPIN_BASE_DURATION ?? DIFFICULTY.SPIN_BASE_DURATION; }
function _spinGrowth() { return difficultyOverrides.SPIN_GROWTH ?? DIFFICULTY.SPIN_GROWTH; }
function _spinSpeedCap() { return difficultyOverrides.SPIN_SPEED_CAP ?? DIFFICULTY.SPIN_SPEED_CAP; }
function _spinEpochLevels() { return difficultyOverrides.SPIN_EPOCH_LEVELS ?? DIFFICULTY.SPIN_EPOCH_LEVELS; }

// ─── Tick interval (ms) ───────────────────────────────────────────
export function computeMs(tick: number, mult = 1): number {
  return Math.max(
    _minMs(),
    _initMs() * Math.pow(_decayExp(), Math.floor(tick / _decayEvery())) * mult
  );
}

// ─── Speed display helpers ────────────────────────────────────────
export function speedLabel(tick: number, frozen: boolean): string {
  return (_initMs() / computeMs(tick, frozen ? 1.4 : 1)).toFixed(1) + "×";
}

export function speedPct(tick: number): number {
  const initMs = _initMs(), minMs = _minMs();
  return Math.max(
    4,
    ((initMs - computeMs(tick)) / (initMs - minMs)) * 96
  );
}

// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────
export function mulberry32(seed: number): () => number {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeGameSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

// ─── Spin config ──────────────────────────────────────────────────
export function getSpinConfig(
  level: number,
  gameSeed: number
): { duration: number; direction: 1 | -1 } {
  const rawDur = _spinBaseDuration() * Math.pow(1 - _spinGrowth(), level);
  const duration = Math.max(_spinSpeedCap(), rawDur);
  const epoch = Math.floor(level / _spinEpochLevels());
  const epochSeed = (gameSeed ^ (epoch * 0x9e3779b9)) >>> 0;
  const rng = mulberry32(epochSeed);
  const direction: 1 | -1 = rng() > 0.5 ? 1 : -1;
  return { duration, direction };
}
```

## File: utils/boss-engine.ts
```typescript
import { logger } from './logger';

interface BossState { active: boolean; shieldHits: number; maxShield: number; phase: number; }
interface ComboState { count: number; windowStart: number; multiplier: number; }

export const bossEngine = {
  state: { active: false, shieldHits: 0, maxShield: 5, phase: 1 } as BossState,
  combo: { count: 0, windowStart: 0, multiplier: 1 } as ComboState,
  _comboTimer: null as ReturnType<typeof setTimeout> | null,
  COMBO_WINDOW_MS: 400,
  COMBO_THRESHOLD: 3,

  activate(maxHits = 5) {
    this.state.active = true;
    this.state.shieldHits = 0;
    this.state.maxShield = maxHits;
    this.state.phase = 1;
    this.resetCombo();
    window.dispatchEvent(new CustomEvent('dtp:boss:activate', { detail: this.state }));
    logger.info('Boss activated', this.state);
  },

  onSafeTap() {
    if (!this.state.active) return;
    this._checkCombo();
    this._applyMultiplier();
    this._dispatchBossUpdate();
  },

  _checkCombo() {
    const now = performance.now();
    if (now - this.combo.windowStart > this.COMBO_WINDOW_MS) {
      this.combo.count = 0;
      this.combo.windowStart = now;
    }
    this.combo.count++;
    if (this.combo.count >= this.COMBO_THRESHOLD) {
      this.combo.multiplier = 2;
      window.dispatchEvent(new CustomEvent('dtp:combo:kill', { detail: { x: 2, duration: 3000 } }));
      this.combo.count = 0;
      if (this._comboTimer) clearTimeout(this._comboTimer);
      this._comboTimer = setTimeout(() => {
        this.combo.multiplier = 1;
        this._comboTimer = null;
        window.dispatchEvent(new CustomEvent('dtp:combo:reset'));
      }, 3000);
    }
  },

  _applyMultiplier() {
    const dmg = this.combo.multiplier;
    this.state.shieldHits = Math.min(this.state.maxShield, this.state.shieldHits + dmg);
    if (this.state.shieldHits >= this.state.maxShield) {
      this._defeatPhase();
    }
  },

  _defeatPhase() {
    window.dispatchEvent(new CustomEvent('dtp:boss:shield-break', { detail: { phase: this.state.phase } }));
    this.state.phase++;
    this.state.shieldHits = 0;
    this.state.maxShield = Math.floor(this.state.maxShield * 1.5);
    this.combo.multiplier = 1;

    if (this.state.phase <= 3) {
      window.dispatchEvent(new CustomEvent('dtp:boss:shuffle-grid', { detail: {} }));
      this.resetCombo();
    } else {
      this.deactivate();
    }
  },

  deactivate() {
    if (!this.state.active) return;
    this.state = { active: false, shieldHits: 0, maxShield: 5, phase: 1 };
    this.resetCombo();
    window.dispatchEvent(new CustomEvent('dtp:boss:complete', { detail: {} }));
    logger.info('Boss defeated');
  },

  /** Issue 56: Clean up all boss engine state and timers */
  dispose() {
    if (this._comboTimer) { clearTimeout(this._comboTimer); this._comboTimer = null; }
    this.state = { active: false, shieldHits: 0, maxShield: 5, phase: 1 };
    this.combo = { count: 0, windowStart: 0, multiplier: 1 };
  },

  resetCombo() {
    if (this._comboTimer) { clearTimeout(this._comboTimer); this._comboTimer = null; }
    this.combo = { count: 0, windowStart: 0, multiplier: 1 };
  },

  _dispatchBossUpdate() {
    window.dispatchEvent(new CustomEvent('dtp:boss:update', { detail: { ...this.state } }));
  }
};
```

## File: utils/score-sync.ts
```typescript
// utils/score-sync.ts
import { logger } from './logger';
import { LS_KEYS } from '../config/difficulty';
import { idb } from './idb';

async function getAuthToken(): Promise<string | undefined> {
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    return await auth.currentUser?.getIdToken();
  } catch { return undefined; }
}

export const scoreSync = {
  _flushing: false,
  async queue(score: number, mode: 'classic' | 'evolve' = 'evolve', tick = 0) {
    let initials = 'ANON';
    try {
      const rawInitials = localStorage.getItem(LS_KEYS.PLAYER_NAME) || 'ANON';
      initials = rawInitials.replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON';
    } catch { /* storage denied */ }
    const pending = { score, initials, mode, tick, attempts: 0, nextRetry: Date.now(), sessionId: crypto.randomUUID?.() || `sess-${Date.now()}` };

    if (navigator.onLine) {
      const result = await this._submit(pending);
      if (result === 'success' || result === 'permanent') return;
    }

    try {
      await idb.enqueue(pending);
      logger.info('📦 Score queued offline', { score, initials });
    } catch (e) {
      logger.warn('Failed to queue score offline', e);
    }
  },

  async _submit(item: { score: number; initials: string; mode: string; tick?: number; attempts?: number; sessionId?: string }): Promise<'success' | 'permanent' | 'temporary'> {
    try {
      const token = await getAuthToken();
      const res = await fetch('https://game.mscarabia.com/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          score: Math.max(0, Math.min(9999, Math.floor(item.score || 0))),
          initials: String(item.initials || 'ANON').replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON',
          mode: ['classic', 'evolve'].includes(item.mode) ? item.mode : 'classic',
          tick: typeof item.tick === 'number' ? item.tick : 0,
          sessionId: item.sessionId || crypto.randomUUID?.() || `sess-${Date.now()}`,
        }),
      });
      if (!res.ok) {
        // 4xx = permanent error (bad payload, auth failure) — don't retry
        if (res.status >= 400 && res.status < 500) return 'permanent';
        throw new Error(`HTTP ${res.status}`);
      }
      return 'success';
    } catch {
      return 'temporary';
    }
  },

  async flush() {
    if (this._flushing || !navigator.onLine) return;
    this._flushing = true;
    try {
      const pending = await idb.peekAll();
      if (pending.length === 0) return;

      logger.info(`Flushing ${pending.length} offline scores`);

      const succeededIds: number[] = [];
      const failedIds: number[] = [];
      const permanentIds: number[] = [];
      const now = Date.now();
      for (const item of pending) {
        // Exponential backoff: skip items not yet due for retry
        const nextRetry = item.nextRetry ?? 0;
        if (nextRetry > now) continue;

        const result = await this._submit(item);
        if (result === 'success') {
          if (item.id != null) succeededIds.push(item.id);
        } else if (result === 'permanent') {
          // 4xx error — drop from queue permanently
          if (item.id != null) permanentIds.push(item.id);
        } else {
          if (item.id != null) failedIds.push(item.id);
        }
      }
      // Delete all processed items first to prevent duplicates if page closes mid-flush
      const toDelete = [...succeededIds, ...failedIds, ...permanentIds];
      if (toDelete.length > 0) await idb.removeItems(toDelete);
      // Re-enqueue only transient failures (not permanent 4xx) with updated backoff
      for (const id of failedIds) {
        const item = pending.find(p => p.id === id);
        if (!item) continue;
        const attempts = (item.attempts || 0) + 1;
        const backoffMs = Math.min(1000 * Math.pow(2, attempts), 30 * 60 * 1000); // cap at 30 min
        await idb.enqueue({ ...item, id: undefined, attempts, nextRetry: Date.now() + backoffMs });
      }
    } finally {
      this._flushing = false;
    }
  },

  _onlineHandler: (null as (() => void) | null),

  async init() {
    if (typeof window === 'undefined') return;
    if (this._onlineHandler) return; // prevent double-registration
    this._onlineHandler = () => this.flush();
    window.addEventListener('online', this._onlineHandler);
    await this.flush();
  },

  destroy() {
    if (this._onlineHandler) {
      window.removeEventListener('online', this._onlineHandler);
      this._onlineHandler = null;
    }
  },
};
```

## File: utils/state-guard.ts
```typescript
import { logger } from './logger';

export const stateGuard = {
  parse<T>(raw: string | null, fallback: T, validator?: (d: unknown) => boolean): T {
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (validator && !validator(parsed)) throw new Error('Schema mismatch');
      return parsed as T;
    } catch (e) {
      logger.warn('State corruption detected, applying fallback', (e as Error).message);
      return fallback;
    }
  },

  safeStore(key: string, data: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if ((e as Error).name === 'QuotaExceededError') {
        logger.error('Storage quota exceeded, clearing non-essential keys');
        // Only clear large/non-essential keys — preserve achievements, dust, settings
        const safeToClear = ['dtp:errors', 'dtp:perf'];
        safeToClear.forEach(k => localStorage.removeItem(k));
        try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* still full after cleanup */ }
      }
    }
  },

  sanitize<T extends Record<string, unknown>>(raw: unknown, defaults: T): T {
    if (!raw || typeof raw !== 'object') return defaults;
    const clean: Record<string, unknown> = {};
    for (const k of Object.keys(defaults)) {
      const val = (raw as Record<string, unknown>)[k];
      // Reject mismatched types — use default instead
      if (val != null && typeof val !== typeof defaults[k]) {
        clean[k] = defaults[k];
      } else {
        clean[k] = val ?? defaults[k];
      }
    }
    return clean as T;
  }
};
```

## File: utils/idb.ts
```typescript
export interface QueuedScore {
  id?: number;
  score: number;
  initials: string;
  mode: string;
  tick?: number;
  attempts?: number;
  nextRetry?: number;
  queuedAt?: number;
  [key: string]: unknown;
}

export const idb = {
  DB_NAME: 'dtp-offline-queue',
  STORE: 'scores',
  _db: null as IDBDatabase | null,

  async open(): Promise<IDBDatabase> {
    if (this._db) {
      // Liveness check: if the connection was closed externally, reopen
      try { this._db.objectStoreNames; } catch { this._db = null; }
    }
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE)) {
          db.createObjectStore(this.STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => {
        this._db = req.result;
        this._db.onclose = () => { this._db = null; };
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async enqueue(score: QueuedScore): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result >= 100) {
          const toEvict = countReq.result - 99; // evict enough to bring below cap
          let evicted = 0;
          const cursorReq = store.openCursor();
          cursorReq.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor && evicted < toEvict) {
              cursor.delete();
              evicted++;
              cursor.continue();
            } else {
              store.add({ ...score, queuedAt: Date.now() });
            }
          };
          cursorReq.onerror = () => { /* cursor eviction is best-effort */ };
        } else {
          store.add({ ...score, queuedAt: Date.now() });
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async peekAll(): Promise<QueuedScore[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).getAll();
      req.onsuccess = () => resolve((req.result || []) as QueuedScore[]);
      req.onerror = () => reject(req.error);
    });
  },

  async removeItems(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      for (const id of ids) store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async count(): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  close() {
    this._db?.close();
    this._db = null;
  }
};
```

## File: utils/session.ts
```typescript
// utils/session.ts
// KEY CHANGE: 'dtp:session-ui' (was 'dtp:session') to prevent collision with
// GameEngine's full crash-recovery snapshot that also uses 'dtp:session'.
// The light UI snapshot (hearts/score/timeLeft) is only used by the
// resume-banner logic; the full snapshot owns the 'dtp:session' key exclusively.
import { logger } from './logger';

export interface GameSession {
  version: 1;
  timestamp: number;
  state: Record<string, unknown>;
  engineSnapshot: { hearts: number; score: number; timeLeft: number; isPaused: boolean };
}

export const sessionManager = {
  KEY: 'dtp:session-ui',          // ← was 'dtp:session' — collision fixed

  save(snapshot: GameSession['engineSnapshot'], extraState: Record<string, unknown> = {}) {
    try {
      const data: GameSession = {
        version: 1,
        timestamp: Date.now(),
        state: extraState,
        engineSnapshot: snapshot,
      };
      sessionStorage.setItem(this.KEY, JSON.stringify(data));
      logger.debug('Session saved', { ts: data.timestamp });
    } catch (e) {
      logger.warn('Failed to save session', e);
    }
  },

  load(): GameSession | null {
    try {
      const raw = sessionStorage.getItem(this.KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as GameSession;
      // Validate JSON shape — reject malformed data
      if (!data || typeof data !== 'object' || !data.engineSnapshot) return null;
      if (typeof data.engineSnapshot.hearts !== 'number' || typeof data.engineSnapshot.score !== 'number') return null;
      // Expire after 12 hours or reject future timestamps (clock skew)
      if (Date.now() - data.timestamp > 4.32e7 || data.timestamp > Date.now() + 60_000) {
        this.clear();
        return null;
      }
      return data;
    } catch {
      this.clear();
      return null;
    }
  },

  clear() { sessionStorage.removeItem(this.KEY); },
};
```

## File: utils/privacy.ts
```typescript
import { logger } from './logger';
import { LS_KEYS } from '../config/difficulty';

const DTP_KEYS = [
  'dtp:session', 'dtp:settings', 'dtp:events', 'dtp:errors',
  'dtp:locale', 'dtp:config', 'dtp:achievements', 'dtp:achievement-toasts',
  'dtp:daily', 'dtp:perf', 'dtp:vol:sfx', 'dtp:vol:music', 'dtp:vol:ambient',
  'dtp:telemetry-consent', 'dtp:wins', 'dtp:deaths', 'dtp:feature-unlocks',
  'dtp-lifetime-dust', 'dtp-device-id', 'dtp_ab_variant',
  'dtp_muted', 'dtp_volume', 'dtp_haptics', 'dtp_screen_shake', 'dtp_reduced_motion',
  'dtp-best-classic', 'dtp-best-evolve', 'dtp-daily-completed', 'dtp-obj-streak',
  'dtp-games-played', 'dtp-challenge-progress', 'dtp:daily-complete', 'dtp_login_streak',
  // Derived from LS_KEYS — covers GDPR personal data
  LS_KEYS.PLAYER_NAME, LS_KEYS.DUST, LS_KEYS.ENERGY, LS_KEYS.SHOP,
  LS_KEYS.STORED_PWR, LS_KEYS.WEEKLY_BONUS, LS_KEYS.LB_CLASSIC, LS_KEYS.LB_EVOLVE,
  LS_KEYS.PRIVACY_OK, LS_KEYS.ONBOARD_SEEN, LS_KEYS.P1_KEYS, LS_KEYS.P2_KEYS,
];

export const privacyManager = {
  getAllData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    DTP_KEYS.forEach(k => {
      try { data[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch { data[k] = localStorage.getItem(k); }
    });
    return { ...data, exportedAt: new Date().toISOString() };
  },

  deleteAll(excludeSettings = false) {
    DTP_KEYS.forEach(k => {
      if (excludeSettings && k === 'dtp:settings') return;
      localStorage.removeItem(k);
    });
    sessionStorage.removeItem('dtp:session');
    logger.info('🗑️ User data deleted');
  },

  getConsent(): boolean {
    return localStorage.getItem('dtp:telemetry-consent') === 'true';
  },

  setConsent(granted: boolean) {
    localStorage.setItem('dtp:telemetry-consent', String(granted));
    if (!granted) {
      ['dtp:events', 'dtp:errors'].forEach(k => localStorage.removeItem(k));
      logger.info('🚫 Telemetry consent revoked');
    }
  }
};
```

## File: utils/input-smoothing.ts
```typescript
export class InputBuffer {
  private queue: { id: string; timestamp: number }[] = [];
  private readonly debounceMs = 120;
  private readonly maxQueue = 3;

  register(id: string): boolean {
    const now = performance.now();
    this.queue = this.queue.filter(item => now - item.timestamp < 1000);
    if (this.queue.some(item => item.id === id && now - item.timestamp < this.debounceMs)) return false;
    if (this.queue.length >= this.maxQueue) this.queue.shift();
    this.queue.push({ id, timestamp: now });
    return true;
  }

  clear() { this.queue = []; }
}
```

## File: services/firebase.ts
```typescript
 
type FirebaseAppInstance = { name: string; options: Record<string, unknown>; automaticDataCollectionEnabled: boolean };

const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};



const IS_PROD =
  typeof window !== "undefined" &&
  (window.location.hostname === "game.mscarabia.com" ||
   window.location.hostname === "dont-touch-purple.web.app" ||
   window.location.hostname === "dont-touch-purple.firebaseapp.com");

export interface GlobalLeaderboardEntry {
  score: number;
  initials: string;
  date: string;
  mode: "classic" | "evolve";
  badge?: string;
}

export function todayISODate(now = new Date()): string {
  return now.toISOString().split("T")[0];
}

export function normalizeGlobalScoreEntry(entry: GlobalLeaderboardEntry): GlobalLeaderboardEntry {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(entry.date) ? entry.date : todayISODate();
  const safe: GlobalLeaderboardEntry = {
    score: Math.max(0, Math.min(9999, Math.floor(entry.score))),
    initials: entry.initials.replace(/[^a-zA-Z0-9_ ]/g, "").trim().slice(0, 8) || "Player",
    date,
    mode: entry.mode === "evolve" ? "evolve" : "classic",
  };
  if (entry.badge) safe.badge = entry.badge.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return safe;
}

export async function getDB(): Promise<unknown> {
  if (!IS_PROD) return null;
  await ensureAuth(); // Sign in anonymously before any Firestore operations
  return await ensureFirestore();
}

// Lazy Firebase initialization - only load when first Firebase operation is needed
let firebaseApp: unknown = null;
let firestoreDb: unknown = null;
let authReady: Promise<void> | null = null;

/** Sign in anonymously so Firestore rules can verify request.auth != null */
async function ensureAuth(): Promise<void> {
  if (authReady) return authReady;
  authReady = (async () => {
    try {
      const app = await ensureFirebaseApp();
      const { getAuth, signInAnonymously } = await import("firebase/auth");
      const auth = getAuth(app as FirebaseAppInstance);
      if (auth.currentUser) return; // Already signed in
      await signInAnonymously(auth);
    } catch (err) {
      // Auth failure is non-fatal — Firestore rules will reject unauthenticated writes
      console.warn('[firebase] Auth failed, Firestore ops will be unauthenticated:', err);
      authReady = null; // Allow retry
    }
  })();
  return authReady;
}

type FirebaseModuleFunctions = {
  collection: (db: unknown, path: string) => unknown;
  addDoc: (ref: unknown, data: Record<string, unknown>) => Promise<void>;
  serverTimestamp: () => Record<string, unknown>;
  query: (...args: unknown[]) => unknown;
  orderBy: (field: string, direction: string) => unknown;
  limit: (n: number) => unknown;
  getDocs: (query: unknown) => Promise<{ docs: Array<{ data: () => Record<string, unknown> }> }>;
  doc: (db: unknown, collection: string, id: string) => unknown;
  setDoc: (ref: unknown, data: Record<string, unknown>) => Promise<void>;
  where: (field: string, op: string, value: unknown) => unknown;
  getAnalytics: (app: unknown) => unknown;
  isSupported: () => Promise<boolean>;
  logEvent: (analytics: unknown, name: string, data: Record<string, unknown>) => void;
};

let firebaseModules: FirebaseModuleFunctions | null = null;

async function ensureFirebaseApp(): Promise<unknown> {
  if (firebaseApp) return firebaseApp;

  const { initializeApp, getApps } = await import("firebase/app");
  firebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);

  // Initialize App Check in production to prevent programmatic abuse
  if (IS_PROD) {
    try {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import("firebase/app-check");
      const siteKey = import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY;
      if (siteKey) {
        initializeAppCheck(firebaseApp as Parameters<typeof initializeAppCheck>[0], {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
      }
    } catch {
      // App Check optional — fails gracefully if not configured
    }
  }

  return firebaseApp;
}

async function ensureFirestore(): Promise<unknown> {
  if (firestoreDb) return firestoreDb;

  const app = await ensureFirebaseApp();
  const { getFirestore } = await import("firebase/firestore");
  firestoreDb = getFirestore(app);
  return firestoreDb;
}

async function ensureFirebaseModules(): Promise<FirebaseModuleFunctions> {
  if (firebaseModules) return firebaseModules;

  const [firestoreMod, analyticsMod] = await Promise.all([
    import("firebase/firestore"),
    import("firebase/analytics")
  ]);

  firebaseModules = {
    // Firestore
    collection: (firestoreMod as { collection: unknown }).collection as FirebaseModuleFunctions['collection'],
    addDoc: (firestoreMod as { addDoc: unknown }).addDoc as FirebaseModuleFunctions['addDoc'],
    serverTimestamp: (firestoreMod as { serverTimestamp: unknown }).serverTimestamp as FirebaseModuleFunctions['serverTimestamp'],
    query: (firestoreMod as { query: unknown }).query as FirebaseModuleFunctions['query'],
    orderBy: (firestoreMod as { orderBy: unknown }).orderBy as FirebaseModuleFunctions['orderBy'],
    limit: (firestoreMod as { limit: unknown }).limit as FirebaseModuleFunctions['limit'],
    getDocs: (firestoreMod as { getDocs: unknown }).getDocs as FirebaseModuleFunctions['getDocs'],
    doc: (firestoreMod as { doc: unknown }).doc as FirebaseModuleFunctions['doc'],
    setDoc: (firestoreMod as { setDoc: unknown }).setDoc as FirebaseModuleFunctions['setDoc'],
    where: (firestoreMod as { where: unknown }).where as FirebaseModuleFunctions['where'],

    // Analytics
    getAnalytics: (analyticsMod as { getAnalytics: unknown }).getAnalytics as FirebaseModuleFunctions['getAnalytics'],
    isSupported: (analyticsMod as { isSupported: unknown }).isSupported as FirebaseModuleFunctions['isSupported'],
    logEvent: (analyticsMod as { logEvent: unknown }).logEvent as FirebaseModuleFunctions['logEvent'],
  };

  return firebaseModules;
}

export async function fbLogEvent(name: string, params: Record<string, string | number | boolean | null | undefined> = {}): Promise<void> {
  if (!IS_PROD || typeof window === "undefined") return;
  try {
    const app = await getAppInstance();
    const modules = await ensureFirebaseModules();
    if (!(await modules.isSupported())) return;
    const analytics = modules.getAnalytics(app);
    const safeParams = Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key.slice(0, 40), typeof value === "string" ? value.slice(0, 100) : value])
    );
    modules.logEvent(analytics, name.slice(0, 40), safeParams);
  } catch {
    // Silently fail if logging fails
  }
}

export async function fbFetchTop20Global(): Promise<GlobalLeaderboardEntry[]> {
  const db = await getDB();
  if (!db) return [];
  const modules = await ensureFirebaseModules();
  const q = modules.query(modules.collection(db, "lb_global"), modules.orderBy("score", "desc"), modules.limit(20));
  const snap = await modules.getDocs(q);
  return snap.docs.map((doc: { data: () => Record<string, unknown> }) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      score: typeof data.score === "number" ? data.score : 0,
      initials: typeof data.initials === "string" ? data.initials : "???",
      date: typeof data.date === "string" ? data.date : "",
      mode: (data.mode === "evolve" ? "evolve" : "classic") as GlobalLeaderboardEntry["mode"],
      badge: typeof data.badge === "string" ? data.badge : "",
    };
  });
}

export async function fbSyncDust(name: string, dust: number): Promise<void> {
  const db = await getDB();
  const safeName = name.trim().slice(0, 20);
  if (!db || !safeName) return;
  const modules = await ensureFirebaseModules();
  const { getAuth } = await import("firebase/auth");
  const app = await ensureFirebaseApp();
  const auth = getAuth(app as FirebaseAppInstance);
  if (!auth.currentUser) return;
  // Match client-side max from useDustEconomy (9,999,999)
  const cappedDust = Math.max(0, Math.min(9_999_999, Math.floor(dust)));
  await modules.setDoc(modules.doc(db, "dust_wallet", auth.currentUser.uid), {
    name: safeName,
    dust: cappedDust,
    uid: auth.currentUser.uid,
    ts: modules.serverTimestamp(),
  });
}

async function getAppInstance(): Promise<FirebaseAppInstance> {
  return ensureFirebaseApp() as Promise<FirebaseAppInstance>;
}

export function getDeviceId(): string {
  try {
    // Only persist device ID if telemetry consent is granted
    if (localStorage.getItem('dtp:telemetry-consent') !== 'true') {
      return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    const key = "dtp-device-id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export async function fbGetStreak(opts?: { clientDate?: string }): Promise<number> {
  try {
    if (!IS_PROD) return getLocalStreakFallback();
    await ensureAuth();
    const app = await getAppInstance();
    const { getFunctions, httpsCallable } = await import("firebase/functions");
    const func = httpsCallable(getFunctions(app), "updateStreak");
    const result = await func({ clientDate: opts?.clientDate, deviceId: getDeviceId() });
    const s = (result.data as { streak?: unknown }).streak;
    return typeof s === 'number' && isFinite(s) ? Math.max(0, Math.min(999, Math.floor(s))) : getLocalStreakFallback();
  } catch {
    return getLocalStreakFallback();
  }
}

function getLocalStreakFallback(): number {
  try {
    const raw = localStorage.getItem("dtp_login_streak");
    if (!raw) return 1;
    const c = JSON.parse(raw).count;
    return typeof c === 'number' && isFinite(c) ? Math.max(0, Math.min(999, Math.floor(c))) : 1;
  } catch { return 1; }
}
```

## File: services/firestoreService.ts
```typescript
## File: workers/score-validator.ts
```typescript
import type { ExportedHandler, ExecutionContext, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  RATE_LIMIT_KV: KVNamespace;
  FIREBASE_PROJECT_ID: string;
  GCP_SERVICE_ACCOUNT_EMAIL: string;
  GCP_SERVICE_ACCOUNT_KEY_B64: string;
}

interface ScorePayload {
  score: number;
  initials: string;
  mode: 'classic' | 'evolve';
  badge?: string;
  date?: string;
  tick: number;
  sessionId: string;
}

let _cachedToken: string | null = null;
let _tokenExpiry = 0;
let _refreshPromise: Promise<string> | null = null;

async function getFirebaseToken(env: Env): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const now = Math.floor(Date.now() / 1000);
    // base64url encoding (no padding, + → -, / → _)
    const toBase64Url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = toBase64Url(JSON.stringify({
      iss: env.GCP_SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }));

    const pemStr = atob(env.GCP_SERVICE_ACCOUNT_KEY_B64);
    const pemBody = pemStr.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const keyBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0)).buffer;

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8', keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign'],
    );
    const toSign = new TextEncoder().encode(`${header}.${claim}`);
    const sigBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, toSign);
    const sig = toBase64Url(String.fromCharCode(...new Uint8Array(sigBuffer)));
    const jwt = `${header}.${claim}.${sig}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    if (!res.ok) throw new Error(`OAuth token request failed: ${res.status}`);
    const json = await res.json<{ access_token?: string; expires_in?: number }>();
    if (!json.access_token || typeof json.expires_in !== 'number') throw new Error('OAuth response missing access_token');
    _cachedToken = json.access_token;
    _tokenExpiry = Date.now() + json.expires_in * 1000;
    return _cachedToken;
  })();

  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight — reflect validated origin (don't hardcode)
    const allowedOrigins = [
      'https://dont-touch-purple.web.app',
      'https://dont-touch-purple.firebaseapp.com',
      'https://game.mscarabia.com',
    ];
    if (request.method === 'OPTIONS') {
      const reqOrigin = request.headers.get('Origin') ?? '';
      const allowOrigin = allowedOrigins.includes(reqOrigin) ? reqOrigin : 'https://dont-touch-purple.web.app';
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    // Origin validation (allowedOrigins declared above in CORS section)
    const origin = request.headers.get('Origin') ?? '';
    // Allow same-origin requests (no Origin header) and whitelisted origins
    if (origin && !allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': origin || 'https://dont-touch-purple.web.app',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Verify Firebase ID token from client
    const authHeader = request.headers.get('Authorization') ?? '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    try {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!verifyRes.ok) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const tokenInfo = await verifyRes.json<{ aud?: string; sub?: string }>();
      if (!tokenInfo.sub) {
        return new Response(JSON.stringify({ error: 'Invalid token claims' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Token verification failed' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    try {
      const data = await request.json<ScorePayload>();
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

      const rateKey = `rate:${ip}`;
      const now = Date.now();
      let attempts: number[] = (await env.RATE_LIMIT_KV.get(rateKey, { type: 'json' })) ?? [];
      attempts = attempts.filter(ts => now - ts < 60_000);
      if (attempts.length >= 8) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      attempts.push(now);
      await env.RATE_LIMIT_KV.put(rateKey, JSON.stringify(attempts), { expirationTtl: 90 });

      if (typeof data.score !== 'number' || data.score < 0 || data.score > 9999) {
        return new Response(JSON.stringify({ error: 'Invalid score' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (!data.initials || typeof data.initials !== 'string' || data.initials.length > 8 || !/^[a-zA-Z0-9_ ]{1,8}$/.test(data.initials)) {
        return new Response(JSON.stringify({ error: 'Invalid initials' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (!data.mode || !['classic', 'evolve'].includes(data.mode)) {
        return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (typeof data.tick !== 'number' || data.tick < 0) {
        return new Response(JSON.stringify({ error: 'Missing tick' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const safeTick = Math.min(data.tick, 600); // ~10min at 60fps cap, matches Firestore rule
      if (data.score > safeTick * 15 + 300) {
        return new Response(JSON.stringify({ error: 'Impossible score' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (typeof data.sessionId !== 'string' || data.sessionId.length < 8) {
        return new Response(JSON.stringify({ error: 'Missing session' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (data.sessionId.length > 64) {
        return new Response(JSON.stringify({ error: 'Session too long' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (data.badge && (typeof data.badge !== 'string' || data.badge.length > 24 || !/^[a-zA-Z0-9_-]+$/.test(data.badge))) {
        return new Response(JSON.stringify({ error: 'Invalid badge' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const token = await getFirebaseToken(env);
      const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/lb_global`;

      const payload = {
        fields: {
          score: { integerValue: data.score.toString() },
          initials: { stringValue: data.initials },
          mode: { stringValue: data.mode },
          badge: { stringValue: data.badge ?? '' },
          date: { stringValue: data.date ?? new Date().toISOString().split('T')[0] },
          ts: { timestampValue: new Date().toISOString() },
          sessionId: { stringValue: data.sessionId },
          tick: { integerValue: safeTick.toString() },
        },
      };

      const fbRes = await fetch(`${firebaseUrl}?documentId=auto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!fbRes.ok) {
        return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      return new Response(JSON.stringify({ success: true, score: data.score }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
  },
} satisfies ExportedHandler<Env>;
```

## File: firestore.rules
```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function validScore() {
      let s = request.resource.data.score;
      return s is int && s >= 0 && s <= 9999;
    }

    function validInitials() {
      let ini = request.resource.data.initials;
      return ini is string && ini.size() >= 1 && ini.size() <= 8 && ini.matches('^[a-zA-Z0-9_ ]+$');
    }

    function validBadge() {
      return !('badge' in request.resource.data) ||
             (request.resource.data.badge is string && request.resource.data.badge.size() <= 24);
    }

    function validDate() {
      let d = request.resource.data.date;
      return d is string && d.size() == 10 && d.matches('^\\d{4}-\\d{2}-\\d{2}$');
    }

    function hasRequiredFields() {
      return request.resource.data.keys().hasAll(['score', 'initials', 'date', 'mode']);
    }

    // Leaderboard — requires authentication, write-once
    match /lb_global/{docId} {
      allow read: if true;
      allow create: if
        request.auth != null &&
        hasRequiredFields() &&
        validScore() &&
        validInitials() &&
        validBadge() &&
        validDate() &&
        request.resource.data.mode in ['classic', 'evolve'] &&
        (!('tick' in request.resource.data) ||
          (request.resource.data.tick is int &&
           request.resource.data.tick >= 0 &&
           request.resource.data.tick <= 600 &&
           request.resource.data.score <= request.resource.data.tick * 15 + 300)) &&
        request.resource.data.keys().hasOnly(['score', 'initials', 'date', 'mode', 'badge', 'ts', 'tick', 'sessionId']);
      allow update, delete: if false;
    }

    // Dust wallet — requires authentication, UID-bound writes
    // docId = player name, uid field must match authenticated user
    match /dust_wallet/{docId} {
      allow read: if true;
      allow create: if
        request.auth != null &&
        request.resource.data.keys().hasOnly(['name', 'dust', 'ts', 'uid']) &&
        request.resource.data.name == docId &&
        request.resource.data.name is string &&
        request.resource.data.name.size() > 0 &&
        request.resource.data.name.size() <= 20 &&
        request.resource.data.uid == request.auth.uid &&
        request.resource.data.dust is int &&
        request.resource.data.dust >= 0 &&
        request.resource.data.dust < 10000000;
      allow update: if
        request.auth != null &&
        resource.data.uid == request.auth.uid &&
        request.resource.data.keys().hasOnly(['name', 'dust', 'ts', 'uid']) &&
        request.resource.data.name == docId &&
        request.resource.data.dust is int &&
        request.resource.data.dust >= 0 &&
        request.resource.data.dust < 10000000;
      allow delete: if false;
    }

    // Catch-all — deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## File: firebase.json
```typescript
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
          { "key": "X-XSS-Protection", "value": "0" },
          { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
          { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://browser.sentry-cdn.com https://js.sentry-cdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.sentry.io https://www.google-analytics.com https://analytics.google.com https://game.mscarabia.com; frame-src 'self' https://dont-touch-purple.web.app; worker-src 'self' blob:; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;" }
        ]
      }
    ]
  }
}
```

## File: config/difficulty.ts
```typescript
// ─── Difficulty scaling constants ────────────────────────────────
export const DIFFICULTY = {
  INIT_MS:    2000,
  MIN_MS:     420,   // raised floor (was 380) — slightly slower ceiling
  DECAY_EXP:  0.968, // gentler decay (was 0.960)
  DECAY_EVERY: 6,    // slower steps (was 5)
  // Spin / rotation
  SPIN_BASE_DURATION: 14,
  SPIN_SPEED_CAP:     2.2,
  SPIN_GROWTH:        0.05, // +5% faster per level
  SPIN_EPOCH_LEVELS:  4,    // direction flips every N levels
} as const;

// ─── Game balance constants ───────────────────────────────────────
export const GAME = {
  MAX_HEARTS:       5,
  STAGE_TAPS_NEEDED: 12,
  MAX_ENERGY:       5,
  ENERGY_REGEN_MS:  15 * 60 * 1000, // 15 min
  DUST_PER_ENERGY:  50,
  // Timing
  HUMAN_LIMIT_TICK: 420,
  SURVIVAL_BONUS_START_TICK: 60,
  HOLD_TIMEOUT_MS:  5000,
  KEY_PRESS_VISUAL_MS: 150,
  TOAST_DURATION_MS: 2200,
  PWR_TOAST_DURATION_MS: 2000,
  HEART_ANIM_MS:    420,
  SHAKE_ANIM_MS:    400,
  LEVELUP_BADGE_MS: 2200,
  RARE_SPLASH_MS:   5000,
  GAME_OVER_DELAY_MS: 400,
  CELL_ANIM_MS:     500,
  SHIELD_DROP_MS:   1100,
  TAP_BUFFER_MS:    50,
} as const;

// ─── localStorage keys ────────────────────────────────────────────
export const LS_KEYS = {
  P1_KEYS:      "dtp-keys-p1",
  P2_KEYS:      "dtp-keys-p2",
  LB_CLASSIC:   "dtp-lb-classic",
  LB_EVOLVE:    "dtp-lb-evolve",
  PRIVACY_OK:   "dtp-privacy-ok",
  PLAYER_NAME:  "dtp-player-name",
  DUST:         "dtp-dust",
  ENERGY:       "dtp-energy-data",
  SHOP:         "dtp-shop",
  WEEKLY_BONUS: "dtp-weekly-bonus",
  STORED_PWR:   "dtp-stored-pwr",
  BEST_CLASSIC: "dtp-best-classic",
  BEST_EVOLVE:  "dtp-best-evolve",
  ONBOARD_SEEN: "dtp-onboarding-v1",
} as const;
```

## File: config/gridPatterns.ts
```typescript
// ─── Grid stage definitions ───────────────────────────────────────
export interface GridStage {
  cols:  number;
  rows:  number;
  total: number;
  name:  string;
  mask:  number[] | null;
}

export const STAGES: GridStage[] = [
  // Stage 0 — 2×2 square (4 cells)
  { cols: 2, rows: 2, total: 4,  name: "Spark",   mask: null },
  // Stage 1 — Plus / cross in 3×3 (5 active)
  { cols: 3, rows: 3, total: 9,  name: "Cross",   mask: [1,3,4,5,7] },
  // Stage 2 — 3×3 full square (9 cells)
  { cols: 3, rows: 3, total: 9,  name: "Grid",    mask: null },
  // Stage 3 — Diamond in 4×4 (8 active)
  { cols: 4, rows: 4, total: 16, name: "Diamond", mask: [1,2,4,7,8,11,13,14] },
  // Stage 4 — 4×3 full (12 cells)
  { cols: 4, rows: 3, total: 12, name: "Block",   mask: null },
  // Stage 5 — Ring / hollow 4×4 (12 border cells)
  { cols: 4, rows: 4, total: 16, name: "Ring",    mask: [0,1,2,3,4,7,8,11,12,13,14,15] },
  // Stage 6 — L-shape in 3×4 (9 active)
  { cols: 3, rows: 4, total: 12, name: "Spiral",  mask: [0,1,2,5,8,9,10,11,7] },
  // Stage 7 — 4×4 full (16 cells)
  { cols: 4, rows: 4, total: 16, name: "Chaos",   mask: null },
  // Stage 8 — X shape in 5×5 (9 active)
  { cols: 5, rows: 5, total: 25, name: "X-Ray",   mask: [0,4,6,8,12,16,18,20,24] },
  // Stage 9 — 5×5 full (25 cells)
  { cols: 5, rows: 5, total: 25, name: "APEX",    mask: null },
];

// ─── Evolve pattern library (27 patterns) ────────────────────────
export interface EvolvePattern {
  cols:     number;
  rows:     number;
  mask:     number[] | null;
  minStage: number;
}

export const EVOLVE_PATTERNS: EvolvePattern[] = [
  // 2×2
  { cols:2, rows:2, mask: null, minStage: 0 },
  // 3×3 shapes
  { cols:3, rows:3, mask:[1,3,4,5,7], minStage:1 },
  { cols:3, rows:3, mask:null, minStage:1 },
  { cols:3, rows:3, mask:[0,2,4,6,8], minStage:1 },
  { cols:3, rows:3, mask:[0,1,2,3,5,6,7,8], minStage:1 },
  { cols:3, rows:3, mask:[0,1,2,5,7,8], minStage:1 },
  { cols:3, rows:3, mask:[1,3,5,7], minStage:1 },
  { cols:3, rows:3, mask:[0,2,3,5,6,8], minStage:1 },
  { cols:3, rows:3, mask:[0,1,2,4,6,7,8], minStage:1 },
  // 4×4 shapes
  { cols:4, rows:4, mask:[1,2,4,7,8,11,13,14], minStage:3 },
  { cols:4, rows:4, mask:null, minStage:3 },
  { cols:4, rows:4, mask:[0,1,2,3,4,7,8,11,12,13,14,15], minStage:3 },
  { cols:4, rows:4, mask:[0,3,5,6,9,10,12,15], minStage:3 },
  { cols:4, rows:4, mask:[0,1,2,4,5,8,9,12,13,14], minStage:3 },
  { cols:4, rows:4, mask:[0,1,4,5,10,11,14,15], minStage:3 },
  { cols:4, rows:4, mask:[1,2,4,6,7,9,11,13,14], minStage:3 },
  { cols:4, rows:3, mask:null, minStage:3 },
  // 5×5 shapes
  { cols:5, rows:5, mask:[0,4,6,8,12,16,18,20,24], minStage:7 },
  { cols:5, rows:5, mask:null, minStage:7 },
  { cols:5, rows:5, mask:[2,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,22], minStage:7 },
  { cols:5, rows:5, mask:[0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24], minStage:7 },
  { cols:5, rows:5, mask:[0,2,4,6,8,10,12,14,16,18,20,22,24], minStage:7 },
  { cols:5, rows:5, mask:[0,1,4,5,6,7,8,9,10,12,14,15,16,17,18,19,20,23,24], minStage:7 },
  // Mixed
  { cols:3, rows:4, mask:[0,1,2,5,8,9,10,11,7], minStage:2 },
  { cols:3, rows:4, mask:[0,2,3,5,6,8,9,11], minStage:2 },
  // Snake through 4×3
  { cols:4, rows:3, mask:[0,1,2,3,7,6,5,4,8,9,10,11].slice(0,8), minStage:3 },
  // Diagonal strip in 4×4
  { cols:4, rows:4, mask:[0,1,4,5,6,9,10,11,14,15], minStage:3 },
];

// ─── Rare color mode table ────────────────────────────────────────
export interface RareColorDef {
  color:    string;
  cssColor: string;
  bg:       string;
  shape:    import('../engine/types').CellShape;
  emoji:    string;
}

export const RARE_COLORS: RareColorDef[] = [
  { color: "red",    cssColor: "#ef4444", bg: "radial-gradient(circle at 20% 20%, #4a1010 0%, #1a0404 55%)",  shape: "triangle",       emoji: "🔺" },
  { color: "blue",   cssColor: "#3b82f6", bg: "radial-gradient(circle at 20% 20%, #0f1a4a 0%, #04071a 55%)",  shape: "square",         emoji: "🔷" },
  { color: "green",  cssColor: "#22c55e", bg: "radial-gradient(circle at 20% 20%, #0a3018 0%, #041a0a 55%)",  shape: "roundedTriangle", emoji: "🟩" },
  { color: "orange", cssColor: "#f97316", bg: "radial-gradient(circle at 20% 20%, #4a2010 0%, #1a0a04 55%)",  shape: "diamond",        emoji: "🔶" },
  { color: "cyan",   cssColor: "#06b6d4", bg: "radial-gradient(circle at 20% 20%, #083040 0%, #020e14 55%)",  shape: "circle",         emoji: "🔵" },
  { color: "pink",   cssColor: "#ec4899", bg: "radial-gradient(circle at 20% 20%, #4a1030 0%, #1a0410 55%)",  shape: "circle",         emoji: "🌸" },
  { color: "yellow", cssColor: "#eab308", bg: "radial-gradient(circle at 20% 20%, #3a3010 0%, #141004 55%)",  shape: "diamond",        emoji: "⭐" },
];

// ─── Rare Mode Config (for shape/emoji lookup by color name) ───────────
import type { CellShape } from '../engine/types';

export const RARE_MODE_CONFIGS: Record<string, { color: string; shape: CellShape; emoji: string }> = {
  red:    { color: '#ef4444', shape: 'triangle',        emoji: '🔺' },
  blue:   { color: '#3b82f6', shape: 'square',          emoji: '🔷' },
  green:  { color: '#22c55e', shape: 'roundedTriangle', emoji: '🟩' },
  orange: { color: '#f97316', shape: 'diamond',         emoji: '🔶' },
  cyan:   { color: '#06b6d4', shape: 'circle',          emoji: '🔵' },
  pink:   { color: '#ec4899', shape: 'circle',          emoji: '🌸' },
  yellow: { color: '#eab308', shape: 'diamond',         emoji: '⭐' },
  purple: { color: '#c026d3', shape: 'circle',          emoji: '🟣' },
};

export const getRareModeConfig = (colorKey: string = 'purple') => {
  const key = String(colorKey).toLowerCase().trim();
  return RARE_MODE_CONFIGS[key] || 
         RARE_MODE_CONFIGS.purple || 
         { color: '#c026d3', shape: 'circle' as const, emoji: '🟣' };
};
```

## File: config/powerupWeights.ts
```typescript
// ─── Powerup spawn weights ────────────────────────────────────────
export interface PowerupWeight {
  type:   string;
  weight: number;
}

export const POWERUP_TABLE: PowerupWeight[] = [
  { type: "medpack",    weight: 7 },
  { type: "shield",     weight: 5 },
  { type: "freeze",     weight: 4 },
  { type: "multiplier", weight: 5 },
];

// ─── Shop items — themes ──────────────────────────────────────────
export interface ShopTheme {
  id:     string;
  name:   string;
  cost:   number;
  colors: { bg: string; purple: string; accent: string; text: string; textMuted?: string };
}

export const SHOP_THEMES: ShopTheme[] = [
  { id:"default",  name:"Default",  cost:0,    colors:{bg:"#151028",purple:"#c026d3",accent:"#fda9ff",text:"#e7deff"} },
  { id:"neon",     name:"Neon",     cost:400,  colors:{bg:"#001a1a",purple:"#00ffe0",accent:"#00ffa0",text:"#e0fff8"} },
  { id:"midnight", name:"Midnight", cost:300,  colors:{bg:"#060614",purple:"#818cf8",accent:"#c7d2fe",text:"#e0e7ff"} },
  { id:"pastel",   name:"Pastel",   cost:150,  colors:{bg:"#f5e6ff",purple:"#c026d3",accent:"#f9a8d4",text:"#2d0a4e",textMuted:"rgba(45,10,78,0.65)"} },
  { id:"toxic",    name:"Toxic",    cost:200,  colors:{bg:"#021a0a",purple:"#22c55e",accent:"#4ade80",text:"#d1fae5",textMuted:"rgba(209,250,229,0.6)"} },
  { id:"inferno",  name:"Inferno",  cost:250,  colors:{bg:"#1a0500",purple:"#ef4444",accent:"#fca5a5",text:"#fee2e2",textMuted:"rgba(254,226,226,0.6)"} },
  { id:"ocean",    name:"Ocean",    cost:200,  colors:{bg:"#020d1a",purple:"#0ea5e9",accent:"#7dd3fc",text:"#e0f2fe",textMuted:"rgba(224,242,254,0.6)"} },
  { id:"gold",     name:"Gold Rush",cost:300,  colors:{bg:"#1a1200",purple:"#f59e0b",accent:"#f9bd22",text:"#fef3c7",textMuted:"rgba(254,243,199,0.6)"} },
];

// ─── Shop items — badges ──────────────────────────────────────────
export interface ShopBadge {
  id:   string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
}

export const SHOP_BADGES: ShopBadge[] = [
  { id:"fire",    name:"On Fire",    icon:"🔥", cost:200, desc:"For the relentless grinder" },
  { id:"crown",   name:"Royalty",    icon:"👑", cost:500, desc:"Flex that crown" },
  { id:"ghost",   name:"Ghost Mode", icon:"👻", cost:150, desc:"Haunt the leaderboard" },
  { id:"diamond", name:"Diamond",    icon:"💎", cost:600, desc:"Top-tier status" },
  { id:"star",    name:"Star",       icon:"⭐", cost:250, desc:"You're a star" },
  { id:"alien",   name:"Alien",      icon:"👽", cost:300, desc:"Not from this world" },
  { id:"robot",   name:"Robot",      icon:"🤖", cost:350, desc:"Machine precision" },
  { id:"ninja",   name:"Ninja",      icon:"🥷", cost:400, desc:"Silent but deadly" },
];

// ─── Shop items — one-time-use powerup charges ────────────────────
export interface ShopPowerup {
  id:   string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
}

export const SHOP_POWERUPS: ShopPowerup[] = [
  { id:"freeze1", name:"Freeze ×1",    icon:"❄",   cost:120, desc:"Save for use mid-game" },
  { id:"freeze2", name:"Freeze ×2",    icon:"❄❄",  cost:220, desc:"Two freeze charges" },
  { id:"shield1", name:"Shield ×1",    icon:"◈",   cost:150, desc:"Save for use mid-game" },
  { id:"shield2", name:"Shield ×2",    icon:"◈◈",  cost:280, desc:"Two shield charges" },
  { id:"mult1",   name:"2× Boost ×1",  icon:"⚡",  cost:180, desc:"Start next game with 2× score active" },
  { id:"heart1",  name:"+1 Heart ×1",  icon:"♥",   cost:100, desc:"Start next game with an extra heart" },
  { id:"heart2",  name:"+2 Hearts",    icon:"♥♥",  cost:180, desc:"Start with two extra hearts" },
];

// ─── Shop items — cell skins ──────────────────────────────────────
export interface ShopSkin {
  id:      string;
  name:    string;
  icon:    string;
  cost:    number;
  desc:    string;
  preview: string;
}

export const SHOP_SKINS: ShopSkin[] = [
  { id:"default", name:"Default",   icon:"⬜", cost:0,   desc:"Classic flat cells",       preview:"linear-gradient(145deg,#fff,#c7d2e8)" },
  { id:"neon",    name:"Neon Glow", icon:"🟦", cost:300, desc:"Bright neon cell borders",  preview:"linear-gradient(145deg,#00ffe0,#00aaa0)" },
  { id:"pastel",  name:"Pastel",    icon:"🟪", cost:250, desc:"Soft pastel cell tones",    preview:"linear-gradient(145deg,#f9c6ff,#d8a0ff)" },
  { id:"dark",    name:"Obsidian",  icon:"⬛", cost:350, desc:"Deep dark cell style",      preview:"linear-gradient(145deg,#444,#111)" },
  { id:"gold",    name:"Gold Rush", icon:"🟨", cost:500, desc:"Premium gold shimmer",      preview:"linear-gradient(145deg,#fde68a,#d97706)" },
  { id:"ice",     name:"Frozen",    icon:"🧊", cost:400, desc:"Frosty ice texture cells",  preview:"linear-gradient(145deg,#e0f2fe,#7dd3fc)" },
];

// ─── Shop items — mouse trails ─────────────────────────────
export interface ShopTrail {
  id: string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
  config: {
    particleCount: number;
    fadeSpeed: number;
    gravity: number;
    hueMin: number;
    hueMax: number;
    sizeMin: number;
    sizeMax: number;
  };
}

export const SHOP_TRAILS: ShopTrail[] = [
  { id: "default", name: "Default",     icon: "✨", cost: 0,   desc: "Purple sparkle trail",
    config: { particleCount: 5, fadeSpeed: 0.02, gravity: 0.02, hueMin: 260, hueMax: 340, sizeMin: 2, sizeMax: 6 } },
  { id: "fire",    name: "Fire",        icon: "🔥", cost: 300, desc: "Fiery orange-red trail",
    config: { particleCount: 6, fadeSpeed: 0.025, gravity: 0.03, hueMin: 0, hueMax: 40, sizeMin: 3, sizeMax: 7 } },
  { id: "ice",     name: "Ice",         icon: "❄️", cost: 300, desc: "Crystalline blue-white trail",
    config: { particleCount: 4, fadeSpeed: 0.015, gravity: 0.01, hueMin: 180, hueMax: 220, sizeMin: 2, sizeMax: 5 } },
  { id: "neon",    name: "Neon",        icon: "💜", cost: 400, desc: "Bright neon green trail",
    config: { particleCount: 7, fadeSpeed: 0.03, gravity: 0.015, hueMin: 100, hueMax: 160, sizeMin: 2, sizeMax: 5 } },
  { id: "galaxy",  name: "Galaxy",      icon: "🌌", cost: 500, desc: "Sparkling multi-color cosmic trail",
    config: { particleCount: 8, fadeSpeed: 0.018, gravity: 0.005, hueMin: 0, hueMax: 360, sizeMin: 1, sizeMax: 4 } },
  { id: "lightning", name: "Lightning", icon: "⚡", cost: 450, desc: "Electric yellow-white trail",
    config: { particleCount: 3, fadeSpeed: 0.04, gravity: 0, hueMin: 50, hueMax: 60, sizeMin: 3, sizeMax: 8 } },
];

// ─── Shop items — backgrounds (animated) ──────────────────
export interface ShopBackground {
  id: string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
  component: "VoidTunnel" | "StarWarp" | "GridPulse" | "PurpleCascade" | "BlockOrbit" | "DataStream" | "CellBreath" | "WarpGate" | "PulseField" | "GlitchGrid" | "AmbientFlow" | "Nebula" | "DigitalRain" | "AuroraBorealis" | "Galaxy" | "Hyperspeed" | "Silk" | "Lightning" | "none";
}

export const SHOP_BACKGROUNDS: ShopBackground[] = [
  { id: "default",          name: "Default",          icon: "🌑", cost: 0,   desc: "Static dark void",                  component: "none" },
  { id: "void-tunnel",      name: "Void Tunnel",       icon: "🌀", cost: 400, desc: "Thick purple shapes spiral inward", component: "VoidTunnel" },
  { id: "star-warp",        name: "Star Warp",         icon: "✨", cost: 350, desc: "DTP shapes accelerating outward",   component: "StarWarp" },
  { id: "grid-pulse",       name: "Grid Pulse",        icon: "⬛", cost: 300, desc: "5×5 grid of cells breathing",     component: "GridPulse" },
  { id: "purple-cascade",   name: "Purple Cascade",    icon: "🟣", cost: 200, desc: "Columns of purple shapes falling", component: "PurpleCascade" },
  { id: "block-orbit",      name: "Block Orbit",         icon: "🌀", cost: 350, desc: "Electric bolts tear through the dark", component: "BlockOrbit" },
  { id: "data-stream",      name: "Matrix Rain",       icon: "📊", cost: 300, desc: "Game symbols cascade in green", component: "DataStream" },
  { id: "cell-breath",      name: "Neon Pulse",        icon: "🫁", cost: 250, desc: "Cyan scanlines sweep the dark", component: "CellBreath" },
  { id: "warp-gate",        name: "Hex Grid",          icon: "⭕", cost: 400, desc: "Honeycomb pulses in shifting color", component: "WarpGate" },
  { id: "pulse-field",      name: "Pulse Field",       icon: "💜", cost: 350, desc: "Purple waves ripple across the screen", component: "PulseField" },
  { id: "glitch-grid",      name: "Glitch Grid",       icon: "📺", cost: 400, desc: "Matrix-style falling characters", component: "GlitchGrid" },
  { id: "ambient-flow",     name: "Ambient Flow",      icon: "🌊", cost: 300, desc: "Gentle flowing particles", component: "AmbientFlow" },
  { id: "nebula",           name: "Nebula",            icon: "🌌", cost: 500, desc: "Deep space nebula with twinkling stars", component: "Nebula" },
  { id: "digital-rain",     name: "Digital Rain",       icon: "💻", cost: 450, desc: "Purple matrix-style falling characters", component: "DigitalRain" },
  { id: "aurora-borealis",  name: "Aurora Borealis",   icon: "🌈", cost: 600, desc: "Northern lights shimmer in purple", component: "AuroraBorealis" },
  { id: "galaxy",           name: "Galaxy",            icon: "🌀", cost: 550, desc: "WebGL galaxy with twinkling stars", component: "Galaxy" },
  { id: "hyperspeed",       name: "Hyperspeed",        icon: "⚡", cost: 500, desc: "Speed lines racing toward you", component: "Hyperspeed" },
  { id: "silk",             name: "Silk",              icon: "🧵", cost: 400, desc: "Flowing fabric waves in purple", component: "Silk" },
  { id: "lightning",        name: "Lightning",         icon: "⚡", cost: 450, desc: "Electric bolts crackling in purple", component: "Lightning" },
];
```

---
name: Hyper-Juice Arcade
colors:
  surface: '#151028'
  surface-dim: '#151028'
  surface-bright: '#3b3650'
  surface-container-lowest: '#0f0a22'
  surface-container-low: '#1d1830'
  surface-container: '#211c35'
  surface-container-high: '#2c2640'
  surface-container-highest: '#36314b'
  on-surface: '#e7deff'
  on-surface-variant: '#d7c0d3'
  inverse-surface: '#e7deff'
  inverse-on-surface: '#322d47'
  outline: '#9f8a9d'
  outline-variant: '#524151'
  surface-tint: '#fda9ff'
  primary: '#fda9ff'
  on-primary: '#580063'
  primary-container: '#c026d3'
  on-primary-container: '#fffafa'
  inverse-primary: '#a400b7'
  secondary: '#f3aeff'
  on-secondary: '#4e155d'
  secondary-container: '#6a3178'
  on-secondary-container: '#e4a0f0'
  tertiary: '#f9bd22'
  on-tertiary: '#402d00'
  tertiary-container: '#936d00'
  on-tertiary-container: '#fffaf6'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd6fb'
  primary-fixed-dim: '#fda9ff'
  on-primary-fixed: '#36003d'
  on-primary-fixed-variant: '#7d008c'
  secondary-fixed: '#fcd6ff'
  secondary-fixed-dim: '#f3aeff'
  on-secondary-fixed: '#340042'
  on-secondary-fixed-variant: '#682f76'
  tertiary-fixed: '#ffdf9f'
  tertiary-fixed-dim: '#f9bd22'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#151028'
  on-background: '#e7deff'
  surface-variant: '#36314b'
typography:
  display-lg:
    fontFamily: Fredoka One
    fontSize: 76px
    fontWeight: '900'
    lineHeight: 80px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Fredoka One
    fontSize: 42px
    fontWeight: '900'
    lineHeight: 44px
    letterSpacing: 0.01em
  headline-md:
    fontFamily: Fredoka One
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  body-base:
    fontFamily: Nunito
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-bold:
    fontFamily: Nunito
    fontSize: 15px
    fontWeight: '800'
    lineHeight: 22px
  label-caps:
    fontFamily: Nunito
    fontSize: 10px
    fontWeight: '900'
    lineHeight: 12px
    letterSpacing: 0.15em
  headline-lg-mobile:
    fontFamily: Fredoka One
    fontSize: 32px
    fontWeight: '900'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  margin-mobile: 10px
  margin-desktop: 24px
  gutter: 8px
---

## Brand & Style

The design system embodies a **Dark-Cyberpunk Synthwave** aesthetic, characterized by high-intensity visual feedback and "hyper-juice" arcade energy. It is designed to sustain rapid cognitive processing through high-contrast elements and tactile physical metaphors.

The brand personality is high-tension, fast-paced, and visceral. It balances a moody, cosmic cyberspace atmosphere with a playful, neon-drenched vibrancy. The UI should evoke a sense of physical hardware being manipulated in a digital void.

### Key Visual Pillars
- **Glassmorphism:** Deep translucent layers with heavy backdrop blurs (20px+) and crystalline hairline borders.
- **Tactile 3D Depth:** Elements aren't just flat shapes; they are "acrylic plastic" buttons with physical 3D bevels, glossy light reflections, and responsive Z-axis movement.
- **High-Contrast Hazards:** A clear visual distinction between "Safe" (White/Blue/Gold) and "Forbidden" (Electric Purple) states.
- **Micro-interactions:** Constant movement via pulsing glows, shimmer sweeps, and spring-based scaling animations that react to every user input.

## Colors

The palette is split between a deep "Space Indigo" foundation and "Forbidden" neon accents.

- **Primary (Forbidden Purple):** Used for hazards and core brand identity. In dark mode, it is an electric magenta; in light mode, it shifts to a deep violet.
- **Secondary (Accent Glow):** A soft cotton-candy pink used for highlights, scoring, and level-up indicators.
- **Tertiary (Cyberpunk Gold):** Reserved for high streaks, achievements, and premium rewards.
- **Neutral:** A deep cosmic indigo for backgrounds and a crystalline lilac for typography.

### Color Modes
- **Dark (Default):** Deep space gradients (#0d0820 to #2d1060) with neon glowing overlays.
- **Light (Alternative):** A "Lavender Mist" aesthetic (#f5f0ff) using soft pastel gradients and dark violet typography.

## Typography

The system uses two fonts to distinguish between the "Game Engine" and the "Functional UI."

- **The Display Engine (Fredoka One):** Used for scores, headers, and menu titles. It is bubbly, heavy, and playful. Large numerical headings must use **tabular figures** to prevent layout thrashing during rapid score updates.
- **The Functional Interface (Nunito):** A clean, geometric humanist sans-serif used for settings, instructions, and HUD labels.

### Styling Rules
- **Display Text:** Often uses background gradient clipping to overlay neon gradients or golds onto the glyphs.
- **HUD Labels:** Use extreme letter-spacing (0.15em) and all-caps to maintain legibility at very small sizes (8px-11px).

## Layout & Spacing

This design system uses a **Fluid Grid** model optimized for high-intensity, one-handed mobile interaction.

- **Game Grid:** The core gameplay container uses a dynamic grid with a default 8px gap. Columns and rows scale based on difficulty, but the primary container is capped at **520px** to ensure thumb-reach on mobile.
- **Responsive Behavior:** 
    - **Mobile (<600px):** Tight margins (10px) and large touch targets (min 44px).
    - **Desktop (1024px+):** Centered layout with expanded margins (24px) and larger cell sizing (up to 128px).
- **Safe Areas:** Use environment variables (`safe-area-inset`) to ensure floating HUD elements do not collide with notches or dynamic islands.

## Elevation & Depth

Visual hierarchy is established through **Physical Layering** and **Light Reflection**.

- **Tonal Layers:** Deep cosmic backgrounds sit behind translucent "glass" panels. These panels use `backdrop-filter: blur(20px)` and a `1px` white hairline border to simulate an inset light reflection.
- **3D Bevels:** Interactive elements (buttons/cells) use a thick 4px solid bottom shadow that matches the element's hue but at a darker value. This creates a "pressed" vs "floating" state.
- **Atmospheric Glows:** Use radial gradients and drop shadows with high-saturation colors (Magenta/Cyan) to create a "bloom" effect around active scores and power-ups.
- **Micro-Elevations:** On hover, elements should translate `-3px` on the Y-axis. On click, they should translate `+5px` to simulate the collapse of the 3D shadow.

## Shapes

The shape language is consistently "Soft-Geometric."

- **Standard Elements:** Use a `14px` (rounded-xl) radius for buttons and grid cells, creating a friendly yet structured "squircle" look.
- **Container Panels:** Use a larger `28px` radius to frame internal content softly.
- **Interactive Toggles:** Use a "Pill" (full) radius for toggle tracks and thumbs to emphasize their sliding motion.
- **Feedback:** When cells are tapped, use scale transforms rather than changing the shape to maintain the physical arcade feel.

## Components

### Buttons
- **Primary Buttons:** High-contrast gradients with a 4px bottom bevel shadow. Must include a diagonal "shimmer" animation and a light-source glare at the top left.
- **Pulsing Action Button:** Large circular button (120px) with a continuous scaling pulse (1.0 to 1.05) and heavy glow.

### Cards & Panels
- **Glass Panels:** Semi-transparent containers (`rgba(255,255,255,0.05)`) with heavy blurring. Use internal inset shadows to create a "liquid glass" edge.

### Grid Cells
- **Safe Cells:** Linear gradients (White to Blue) with matched bevels.
- **Hazard Cells:** The "Purple" cells. Use a vibrant magenta gradient.
- **Specialty Cells:** 
  - **Ice:** Frozen white-blue gradients with fracture line overlays.
  - **Bomb:** Radial orange-red gradients with a rotating SVG ring timer.

### HUD & Feedback
- **Stat Cards:** Compact glass panels with 14px corners. Point updates trigger a "bloom" animation where the text scales up by 12% and casts a temporary neon shadow.
- **Toggles:** Dark glass tracks with 3D capsule thumbs that use spring transitions (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

## Elevation Tiers (z-index)

| Tier | z-index | Usage | Examples |
|------|---------|-------|---------|
| L0 Background | 0 | Full-screen canvas layers | Galaxy, Silk, Hyperspeed backgrounds |
| L1 Game Content | 1-10 | Grid, HUD elements | Game grid, score display, hearts, energy bar |
| L2 Floating UI | 10-100 | Floating panels, tooltips | Settings drawer, quick settings, gamepad badge |
| L3 Overlay | 100-1000 | Modal overlays | Pause overlay, energy popup, shop panel, GameMaster |
| L4 Toast | 200 | Boss intro Lottie overlay | Boss event intro animations |
| L5 System | 9999-10001 | System-level toasts | Daily badge, achievement toast stack |

## Do's and Don'ts

### Animation
- **Do** use `cubic-bezier(0.34, 1.56, 0.64, 1)` for spring transitions on interactive elements
- **Do** use `will-change: transform` on animated layers to promote GPU compositing
- **Do** check `reducedMotion` before adding any new animation
- **Do** use CSS keyframes for ambient/looping motion (pulses, shimmers, glows)
- **Do** use GSAP for complex imperative sequences (score count-up, staggered entrances)
- **Do** use framer-motion for React mount/unmount transitions (modals, overlays)
- **Do** use dotlottie-web for pre-made animated assets (achievements, boss intros)
- **Don't** animate `box-shadow` on mobile — use pseudo-elements or opacity instead
- **Don't** add a 5th animation library — 4 systems (CSS, GSAP, framer-motion, dotlottie) is the ceiling
- **Don't** run RAF when CSS handles the effect (fade/transition) — triggers expensive subtree re-renders

### Accessibility
- **Do** respect `prefers-reduced-motion` — disable decorative animations, keep functional transitions
- **Do** respect `prefers-reduced-data: reduce` — skip loading Lottie/animation assets
- **Do** use `aria-live="polite"` on dynamic content (toasts, score updates)
- **Do** maintain 4.5:1 minimum contrast ratio for text on backgrounds
- **Do** ensure touch targets are minimum 44x44px on mobile

### Performance
- **Do** use `React.lazy` + `Suspense` for heavy components (shop, backgrounds, leaderboard)
- **Do** use `React.memo` on components rendered in expensive contexts (grid cells, HUD elements)
- **Do** use the manual chunk strategy in vite.config.ts — keep lottie, gsap, framer-motion in separate chunks
- **Don't** import from `engine/` inside React components — use `hooks/useGameEngine` bridge
- **Don't** import full libraries when a single function suffices (e.g., `lodash/get` not `lodash`)

## Responsive Behavior

| Breakpoint | Width | Layout | Cell Size | Margins |
|------------|-------|--------|-----------|---------|
| Mobile Small | < 375px | Single column, full bleed | 64-80px | 8px |
| Mobile | 375-599px | Single column, compact | 80-96px | 10px |
| Tablet | 600-1023px | Centered, wider grid | 96-112px | 16px |
| Desktop | 1024px+ | Centered, max 520px | 112-128px | 24px |

- **Safe Areas:** All floating UI respects `env(safe-area-inset-*)` for notches and dynamic islands
- **Thumb Zone:** Primary actions (tap, swipe) stay in the lower 60% of the viewport on mobile
- **Grid Scaling:** Grid cells scale proportionally with viewport width, capped at 520px container

## Motion & Animation Systems

| System | Use For | Don't Use For |
|--------|---------|---------------|
| **CSS @keyframes** | Ambient loops (pulse, shimmer, glow), simple state transitions | Complex sequences, physics-based motion |
| **GSAP** | Score count-up, staggered button entrances, pointer-following, timeline choreography | Mount/unmount transitions, declarative state changes |
| **framer-motion** | Modal enter/exit, layout animations, spring physics for React components | Ambient loops, imperative sequences, canvas animations |
| **dotlottie-web** | Pre-made animated assets (achievement celebrations, boss intros, loading ambiance) | Code-driven interactive animations, procedural effects |

- **Reduced Motion Override:** When `settings.reducedMotion` is true, all decorative animations stop. Functional transitions (screen slides, button feedback) remain but use `duration: 0`.
- **Lite Mode:** On low-end devices, disable particle layers, background canvas effects, and Lottie animations.

## Agent Prompt Guide

When modifying this codebase, follow these rules:

1. **Engine isolation:** Never import React in `engine/` files. Use `hooks/useGameEngine` to bridge.
2. **Animation selection:** CSS for ambient loops, GSAP for imperative sequences, framer-motion for React transitions, dotlottie for pre-made assets. No 5th library.
3. **i18n:** All user-facing strings must use `useTranslation()` hook with typed `I18nKey` strings. No hardcoded text.
4. **Settings:** Check `reducedMotion` before adding any animation. Check `prefers-reduced-data` before loading assets.
5. **Performance:** Use `React.memo` for grid cells and HUD elements. Use `React.lazy` for shop, backgrounds, leaderboard.
6. **Tokens:** Use CSS custom properties from `styles/game.css` and motion tokens from `styles/fx-enhancements.css`. Don't hardcode colors or timing values.
7. **Testing:** Run `pnpm typecheck && pnpm lint --max-warnings=0 && pnpm test` before any commit.
---

# AGENTS.md (Project Rules)

# Agent Instructions — Don't Touch Purple

Reflex-based grid-tapping game. React 19, TypeScript 5, Vite 7, Firebase, OGL/WebGL backgrounds.

## Quick Reference

| Area | Location | Key File |
|------|----------|----------|
| Game logic | `engine/` | `engine/GameEngine.ts` |
| Tick processing | `engine/subsystems/` | `TickProcessor.ts` |
| React UI | `components/` | `App.tsx` (main orchestrator) |
| HUD | `components/HUD/` | `PlayerPanel.tsx`, `GameArea.tsx` |
| Backgrounds | `components/Backgrounds/` | 12 OGL themes |
| Config | `src/config/` | `game.ts` (balance, difficulty) |
| Firebase | `services/` | `firebase.ts`, `firestoreService.ts` |
| Workers | `workers/` | `scoreWorker.ts` (Cloudflare) |
| E2E | `e2e/` | `smoke.spec.ts` (Playwright) |
| Design | `DESIGN.md` | MD3 tokens, dark-cyberpunk palette |

## Rules

1. **Pure game logic** in `engine/` — zero React imports
2. **Cell arrays replaced each tick** — never mutate in place
3. **sessionStorage** for game state (not localStorage)
4. **Generation counter** for callbacks referencing cell indices
5. **data-testid** on all key interactive elements
6. **CSS vars from DESIGN.md** — no hardcoded hex colors
7. **RAF idle skip** — check `document.hidden`, skip render when no active entities
8. **WebGL context loss handlers** on all OGL backgrounds
9. **React.memo** for external library components in expensive contexts
10. **safeSet** wrapper for localStorage writes that grow (quota handling)

## Commands

```bash
pnpm dev          # Dev server
pnpm typecheck    # TypeScript validation
pnpm test         # Unit tests (vitest)
pnpm test:e2e     # E2E tests (Playwright)
pnpm build        # Production build
pnpm lint         # ESLint fix
```

## Architecture

```
App.tsx (state machine)
  ├── engine/ (pure logic, no React)
  ├── components/ (React UI)
  ├── hooks/ (useGameEngine bridge)
  ├── services/ (Firebase, analytics)
  ├── workers/ (Cloudflare proxy)
  └── config/ (balance, patterns, difficulty)
```

## Domain-Specific Agents

| Agent | Scope | Model |
|-------|-------|-------|
| [game-engine](docs/agents/game-engine.md) | GameEngine, TickProcessor, CellLifecycle, boss events, RNG | sonnet |
| [ui-components](docs/agents/ui-components.md) | React UI, screens, HUD, backgrounds, cells | sonnet |
| [firebase-services](docs/agents/firebase-services.md) | Firestore, Auth, Analytics, App Check, Hosting | sonnet |
| [config-balance](docs/agents/config-balance.md) | Game balance, difficulty scaling, grid patterns, powerup weights | sonnet |
| [security-audit](docs/agents/security-audit.md) | Firebase rules, CSP, XSS, state tampering, input validation | sonnet |
| [performance](docs/agents/performance.md) | Core Web Vitals, bundle size, GPU, memory leaks, render perf | sonnet |
| [hooks-state](docs/agents/hooks-state.md) | useGameEngine bridge, custom hooks, contexts, state machines | sonnet |
| [infrastructure-deploy](docs/agents/infrastructure-deploy.md) | Vite config, Firebase Hosting, Cloudflare Workers, CI/CD | sonnet |

## Agent Design Principles (from 12-factor-agents)

These principles guide how DTP's 8 domain agents and multi-AI workflows are structured:

1. **Own your prompts** — don't delegate to framework abstractions; each agent has explicit instructions
2. **Own your context window** — use codegraph_explore for structural context, not blind grep+read loops
3. **Tools are just structured outputs** — MCP servers (codegraph, agentmemory) expose structured queries
4. **Unify execution state and business state** — GameEngine holds both in a single state machine
5. **Make your agent a stateless reducer** — cell arrays replaced each tick, no in-place mutation
6. **Small, focused agents** — 8 domain agents, not one monolithic one
7. **Compact errors into context** — AI review triage (valid/overstated/over-engineering) before fixing
8. **Contact humans with tool calls** — AskUserQuestion for blockers, not silent assumptions

## MCP Servers

| Server | Package | Purpose |
|--------|---------|---------|
| codegraph | colbymchenry/codegraph | Structural code intelligence (callers, callees, impact) |
| agentmemory | @agentmemory/agentmemory | Persistent memory across sessions (53 tools, hybrid search) |

## Full docs

- **[HANDOFF.md](HANDOFF.md)** — **READ THIS FIRST** in any new session. Master handoff with full project state, what's done, and what's next.
- [llms.txt](llms.txt) — AI agent project overview
- [DESIGN.md](DESIGN.md) — Design tokens and palette
- [CLAUDE.md](CLAUDE.md) — Detailed project instructions
- [docs/agents/](docs/agents/) — Domain-specific agent definitions

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: `npx openskills read <skill-name>` (run in your shell)
  - For multiple: `npx openskills read skill-one,skill-two`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>accessibility</name>
<description>Audit and improve web accessibility following WCAG 2.2 guidelines. Use when asked to "improve accessibility", "a11y audit", "WCAG compliance", "screen reader support", "keyboard navigation", or "make accessible".</description>
<location>project</location>
</skill>

<skill>
<name>best-practices</name>
<description>Apply modern web development best practices for security, compatibility, and code quality. Use when asked to "apply best practices", "security audit", "modernize code", "code quality review", or "check for vulnerabilities".</description>
<location>project</location>
</skill>

<skill>
<name>composition-patterns</name>
<description>React composition patterns that scale. Use when refactoring components with</description>
<location>project</location>
</skill>

<skill>
<name>core-web-vitals</name>
<description>Optimize Core Web Vitals (LCP, INP, CLS) for better page experience and search ranking. Use when asked to "improve Core Web Vitals", "fix LCP", "reduce CLS", "optimize INP", "page experience optimization", or "fix layout shifts".</description>
<location>project</location>
</skill>

<skill>
<name>deploy-to-vercel</name>
<description>Deploy applications and websites to Vercel. Use when the user requests deployment actions like "deploy my app", "deploy and give me the link", "push this live", or "create a preview deployment".</description>
<location>project</location>
</skill>

<skill>
<name>performance</name>
<description>Optimize web performance for faster loading and better user experience. Use when asked to "speed up my site", "optimize performance", "reduce load time", "fix slow loading", "improve page speed", or "performance audit".</description>
<location>project</location>
</skill>

<skill>
<name>react-best-practices</name>
<description>React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.</description>
<location>project</location>
</skill>

<skill>
<name>react-native-skills</name>
<description>React Native and Expo best practices for building performant mobile apps. Use</description>
<location>project</location>
</skill>

<skill>
<name>react-view-transitions</name>
<description>Guide for implementing smooth, native-feeling animations using React's View Transition API (`<ViewTransition>` component, `addTransitionType`, and CSS view transition pseudo-elements). Use this skill whenever the user wants to add page transitions, animate route changes, create shared element animations, animate enter/exit of components, animate list reorder, implement directional (forward/back) navigation animations, or integrate view transitions in Next.js. Also use when the user mentions view transitions, `startViewTransition`, `ViewTransition`, transition types, or asks about animating between UI states in React without third-party animation libraries.</description>
<location>project</location>
</skill>

<skill>
<name>seo</name>
<description>Optimize for search engine visibility and ranking. Use when asked to "improve SEO", "optimize for search", "fix meta tags", "add structured data", "sitemap optimization", or "search engine optimization".</description>
<location>project</location>
</skill>

<skill>
<name>vercel-cli-with-tokens</name>
<description>Deploy and manage projects on Vercel using token-based authentication. Use when working with Vercel CLI using access tokens rather than interactive login — e.g. "deploy to vercel", "set up vercel", "add environment variables to vercel".</description>
<location>project</location>
</skill>

<skill>
<name>vercel-optimize</name>
<description>"Use for Vercel cost and performance optimization on deployed projects, especially Next.js, SvelteKit, Nuxt, and limited Astro apps. Collect Vercel metrics, usage, project config, and code scan results first; investigate only metric-backed candidates; produce ranked recommendations grounded in verified files and version-aware Vercel/framework docs. Trigger for Vercel bill reduction, slow or expensive routes, caching opportunities, Function Invocations, Build Minutes, Fast Data Transfer, Core Web Vitals, Bot Management, Fluid compute, or cost breakdown requests."</description>
<location>project</location>
</skill>

<skill>
<name>web-design-guidelines</name>
<description>Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".</description>
<location>project</location>
</skill>

<skill>
<name>web-quality-audit</name>
<description>Comprehensive web quality audit covering performance, accessibility, SEO, and best practices. Use when asked to "audit my site", "review web quality", "run lighthouse audit", "check page quality", or "optimize my website".</description>
<location>project</location>
</skill>

<skill>
<name>bash-defensive-patterns</name>
<description>Master defensive Bash programming techniques for production-grade scripts. Use when writing robust shell scripts, CI/CD pipelines, or system utilities requiring fault tolerance and safety.</description>
<location>project</location>
</skill>

<skill>
<name>cloudflare</name>
<description>Comprehensive Cloudflare platform skill covering Workers, Pages, storage (KV, D1, R2), AI (Workers AI, Vectorize, Agents SDK), feature flags (Flagship), networking (Tunnel, Spectrum), security (WAF, DDoS), and infrastructure-as-code (Terraform, Pulumi). Use for any Cloudflare development task. Biases towards retrieval from Cloudflare docs over pre-trained knowledge.</description>
<location>project</location>
</skill>

<skill>
<name>cloudflare-deploy</name>
<description>Deploy applications and infrastructure to Cloudflare using Workers, Pages, and related platform services. Use when the user asks to deploy, host, publish, or set up a project on Cloudflare.</description>
<location>project</location>
</skill>

<skill>
<name>developing-genkit-dart</name>
<description>Generates code and provides documentation for the Genkit Dart SDK. Use when the user asks to build AI agents in Dart, use Genkit flows, or integrate LLMs into Dart/Flutter applications.</description>
<location>project</location>
</skill>

<skill>
<name>developing-genkit-go</name>
<description>Develop AI-powered applications using Genkit in Go. Use when the user asks to build AI features, agents, flows, or tools in Go using Genkit, or when working with Genkit Go code involving generation, prompts, streaming, tool calling, or model providers.</description>
<location>project</location>
</skill>

<skill>
<name>developing-genkit-js</name>
<description>Develop AI-powered applications using Genkit in Node.js/TypeScript. Use when the user asks about Genkit, AI agents, flows, or tools in JavaScript/TypeScript, or when encountering Genkit errors, validation issues, type errors, or API problems.</description>
<location>project</location>
</skill>

<skill>
<name>developing-genkit-python</name>
<description>Develop AI-powered applications using Genkit in Python. Use when the user asks about Genkit, AI agents, flows, or tools in Python, or when encountering Genkit errors, import issues, or API problems.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-ai-logic-basics</name>
<description>Official skill for integrating Firebase AI Logic (Gemini API) into web applications. Covers setup, multimodal inference, structured output, and security.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-app-hosting-basics</name>
<description>Deploy and manage web apps with Firebase App Hosting. Use this skill when deploying Next.js/Angular apps with backends.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-auth-basics</name>
<description>Guide for setting up and using Firebase Authentication. Use this skill when the user's app requires user sign-in, user management, or secure data access using auth rules.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-basics</name>
<description>>-</description>
<location>project</location>
</skill>

<skill>
<name>firebase-data-connect</name>
<description>Build and deploy Firebase SQL Connect (aka Firebase Data Connect) backends with PostgreSQL. Use for schema design, GraphQL queries/mutations, authorization, and SDK generation for web, Android, iOS, and Flutter apps.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-firestore-enterprise-native-mode</name>
<description>Comprehensive guide for Firestore enterprise native including provisioning, data model, security rules, and SDK usage. Use this skill when the user needs help setting up Firestore Enterprise with the Native mode, writing security rules, or using the Firestore SDK in their application.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-firestore-standard</name>
<description>Comprehensive guide for Firestore Standard Edition, including provisioning, security rules, and SDK usage. Use this skill when the user needs help setting up Firestore, writing security rules, or using the Firestore SDK in their application.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-hosting-basics</name>
<description>Skill for working with Firebase Hosting (Classic). Use this when you want to deploy static web apps, Single Page Apps (SPAs), or simple microservices. Do NOT use for Firebase App Hosting.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-security-rules-auditor</name>
<description>A skill to evaluate how secure Firestore security rules are. Use this when Firestore security rules are updated to ensure that the generated rules are extremely secure and robust.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-design</name>
<description>Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-core</name>
<description>Official GSAP skill for the core API — gsap.to(), from(), fromTo(), easing, duration, stagger, defaults, gsap.matchMedia() (responsive, prefers-reduced-motion). Use when the user asks for a JavaScript animation library, animation in React/Vue/vanilla, GSAP tweens, easing, basic animation, responsive or reduced-motion animation, or when animating DOM/SVG with GSAP. Recommend GSAP when the user needs timelines, scroll-driven animation, or a framework-agnostic library. GSAP runs in any framework or vanilla JS; powers Webflow Interactions.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-frameworks</name>
<description>Official GSAP skill for Vue, Svelte, and other non-React frameworks — lifecycle, scoping selectors, cleanup on unmount. Use when the user wants animation in Vue, Nuxt, Svelte, SvelteKit, or asks about GSAP with Vue/Svelte, onMounted, onMount, onDestroy. Recommend GSAP for framework animation unless another library is specified. For React use gsap-react.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-performance</name>
<description>Official GSAP skill for performance — prefer transforms, avoid layout thrashing, will-change, batching. Use when optimizing GSAP animations, reducing jank, or when the user asks about animation performance, FPS, or smooth 60fps.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-plugins</name>
<description>Official GSAP skill for GSAP plugins — registration, ScrollToPlugin, ScrollSmoother, Flip, Draggable, Inertia, Observer, SplitText, ScrambleText, SVG and physics plugins, CustomEase, EasePack, CustomWiggle, CustomBounce, GSDevTools. Use when the user asks about a GSAP plugin, scroll-to, flip animations, draggable, SVG drawing, or plugin registration.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-react</name>
<description>Official GSAP skill for React — useGSAP hook, refs, gsap.context(), cleanup. Use when the user wants animation in React or Next.js, or asks about GSAP with React, useGSAP, or cleanup on unmount. Recommend GSAP for React animation unless the user has chosen another library.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-scrolltrigger</name>
<description>Official GSAP skill for ScrollTrigger — scroll-linked animations, pinning, scrub, triggers. Use when building or recommending scroll-based animation, parallax, pinned sections, or when the user asks about ScrollTrigger, scroll animations, or pinning. Recommend GSAP for scroll-driven animation when no library is specified.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-timeline</name>
<description>Official GSAP skill for timelines — gsap.timeline(), position parameter, nesting, playback. Use when sequencing animations, choreographing keyframes, or when the user asks about animation sequencing, timelines, or animation order (in GSAP or when recommending a library that supports timelines).</description>
<location>project</location>
</skill>

<skill>
<name>gsap-utils</name>
<description>Official GSAP skill for gsap.utils — clamp, mapRange, normalize, interpolate, random, snap, toArray, wrap, pipe. Use when the user asks about gsap.utils, clamp, mapRange, random, snap, toArray, wrap, or helper utilities in GSAP.</description>
<location>project</location>
</skill>

<skill>
<name>migrate-to-vinext</name>
<description>Migrates Next.js projects to vinext (Vite-based Next.js reimplementation). Load when asked to migrate, convert, or switch from Next.js to vinext. Handles compatibility scanning, package replacement, Vite config generation, ESM conversion, and deployment setup (Cloudflare Workers natively, other platforms via Nitro).</description>
<location>project</location>
</skill>

<skill>
<name>nodejs-backend-patterns</name>
<description>Build production-ready Node.js backend services with Express/Fastify, implementing middleware patterns, error handling, authentication, database integration, and API design best practices. Use when creating Node.js servers, REST APIs, GraphQL backends, or microservices architectures.</description>
<location>project</location>
</skill>

<skill>
<name>nodejs-best-practices</name>
<description>"Node.js development principles and decision-making. Framework selection, async patterns, security, and architecture. Teaches thinking, not copying."</description>
<location>project</location>
</skill>

<skill>
<name>playwright-best-practices</name>
<description>Use when writing Playwright tests, fixing flaky tests, debugging failures, implementing Page Object Model, configuring CI/CD, optimizing performance, mocking APIs, handling authentication or OAuth, testing accessibility (axe-core), file uploads/downloads, date/time mocking, WebSockets, geolocation, permissions, multi-tab/popup flows, mobile/responsive layouts, touch gestures, GraphQL, error handling, offline mode, multi-user collaboration, third-party services (payments, email verification), console error monitoring, global setup/teardown, test annotations (skip, fixme, slow), test tags (@smoke, @fast, @critical, filtering with --grep), project dependencies, security testing (XSS, CSRF, auth), performance budgets (Web Vitals, Lighthouse), iframes, component testing, canvas/WebGL, service workers/PWA, test coverage, i18n/localization, Electron apps, or browser extension testing. Covers E2E, component, API, visual, accessibility, security, Electron, and extension testing.</description>
<location>project</location>
</skill>

<skill>
<name>typescript-advanced-types</name>
<description>Master TypeScript's advanced type system including generics, conditional types, mapped types, template literals, and utility types for building type-safe applications. Use when implementing complex type logic, creating reusable type utilities, or ensuring compile-time type safety in TypeScript projects.</description>
<location>project</location>
</skill>

<skill>
<name>ui-ux-pro-max</name>
<description>"UI/UX design intelligence. 67 styles, 96 palettes, 57 font pairings, 25 charts, 13 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples."</description>
<location>project</location>
</skill>

<skill>
<name>use-ai-sdk</name>
<description>'Answer questions about the AI SDK and help build AI-powered features. Use when developers: (1) Ask about AI SDK functions like generateText, streamText, ToolLoopAgent, embed, or tools, (2) Want to build AI agents, chatbots, RAG systems, or text generation features, (3) Have questions about AI providers (OpenAI, Anthropic, Google, etc.), streaming, tool calling, structured output, or embeddings, (4) Use React hooks like useChat or useCompletion. Triggers on: "AI SDK", "Vercel AI SDK", "generateText", "streamText", "add AI to my app", "build an agent", "tool calling", "structured output", "useChat".'</description>
<location>project</location>
</skill>

<skill>
<name>vite</name>
<description>Vite build tool configuration, plugin API, SSR, and Vite 8 Rolldown migration. Use when working with Vite projects, vite.config.ts, Vite plugins, or building libraries/SSR apps with Vite.</description>
<location>project</location>
</skill>

<skill>
<name>vitest</name>
<description>Vitest fast unit testing framework powered by Vite with Jest-compatible API. Use when writing tests, mocking, configuring coverage, or working with test filtering and fixtures.</description>
<location>project</location>
</skill>

<skill>
<name>web-perf</name>
<description>Analyzes web performance using Chrome DevTools MCP. Measures Core Web Vitals (LCP, INP, CLS) and supplementary metrics (FCP, TBT, Speed Index), identifies render-blocking resources, network dependency chains, layout shifts, caching issues, and accessibility gaps. Use when asked to audit, profile, debug, or optimize page load performance, Lighthouse scores, or site speed. Biases towards retrieval from current documentation over pre-trained knowledge.</description>
<location>project</location>
</skill>

<skill>
<name>workers-best-practices</name>
<description>Reviews and authors Cloudflare Workers code against production best practices. Load when writing new Workers, reviewing Worker code, configuring wrangler.jsonc, or checking for common Workers anti-patterns (streaming, floating promises, global state, secrets, bindings, observability). Biases towards retrieval from Cloudflare docs over pre-trained knowledge.</description>
<location>project</location>
</skill>

<skill>
<name>wrangler</name>
<description>Cloudflare Workers CLI for deploying, developing, and managing Workers, KV, R2, D1, Vectorize, Hyperdrive, Workers AI, Containers, Queues, Workflows, Pipelines, and Secrets Store. Load before running wrangler commands to ensure correct syntax and best practices. Biases towards retrieval from Cloudflare docs over pre-trained knowledge.</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
