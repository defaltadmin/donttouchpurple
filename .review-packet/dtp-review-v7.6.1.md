# DTP Code Review — v7.6.1
**Date**: 2026-06-01 | **Reviewer**: Claude Sonnet 4.6 | **Prev review**: v7.5.4 (Big Pickle v2 Round 2)

---

## Build Status Note

The merge conflict in `score-sync.ts` lines 96-101 mentioned in the prompt **does not appear in the zipped source** — the file is clean. Either resolved before packaging or the zip is the target state. Tests (205/205) and lint are clean. Treating as pre-resolved; no finding raised.

---

## Findings

### 🔴 CRITICAL

---

**[CRIT-001] Firestore write uses literal `documentId=auto` — only 1 leaderboard entry ever succeeds**
- **File**: `workers/score-validator.ts`
- **Location**: Line with `await fetch(\`${firebaseUrl}?documentId=auto\`, { method: 'POST' ... })`
- **Description**: Firestore REST API interprets `?documentId=auto` as a request to create a document with the literal ID `"auto"`. The first submission creates it; every subsequent submission receives a 409 ALREADY_EXISTS, which makes `fbRes.ok` false, returns `"Database error"` to the client, and the leaderboard silently stays at one entry.
- **Fix**: Remove `?documentId=auto`. POST to the bare collection URL to let Firestore auto-generate IDs:
  ```typescript
  const fbRes = await fetch(firebaseUrl, {   // ← no query param
    method: 'POST',
    ...
  });
  ```

---

### 🟠 HIGH

---

**[HIGH-001] ElasticWarp: O(n²) connection-line loop — 7,140 ops/frame**
- **File**: `components/Backgrounds/ElasticWarp.tsx`
- **Location**: Inner `for j` loop in `draw()`
- **Description**: 120 particles → 7,140 sqrt + `ctx.stroke()` calls per frame. At 60fps that's ~428k canvas draw calls/second. Mid-range mobile will drop below 30fps under game load.
- **Fix**: Spatial grid or hard cap. Simplest: only run the connection pass when `proximity > 0.3` for at least one particle (cursor nearby). When cursor is far, skip the entire inner loop:
  ```typescript
  const anyCursorNear = particles.some(p =>
    (p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2 < MOUSE_RADIUS * MOUSE_RADIUS
  );
  if (anyCursorNear) {
    // existing inner loop
  }
  ```
  Reduces the loop to 0 calls when the cursor is idle.

---

**[HIGH-002] ElasticWarp: 120 `createRadialGradient` calls per frame**
- **File**: `components/Backgrounds/ElasticWarp.tsx`
- **Location**: Inside `draw()` particle loop
- **Description**: `ctx.createRadialGradient()` is expensive — each creates a new gradient object. 120/frame × 60fps = 7,200 object allocations/second, all GC pressure.
- **Fix**: Pre-compute per-particle gradient lazily; only recreate when `glowRadius` changes by more than a threshold:
  ```typescript
  // Add to Particle interface:
  cachedGradient?: CanvasGradient;
  cachedGlowRadius?: number;
  
  // In draw():
  if (!p.cachedGradient || Math.abs(glowRadius - (p.cachedGlowRadius ?? 0)) > 0.5) {
    p.cachedGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
    // ... add color stops
    p.cachedGlowRadius = glowRadius;
  }
  // Note: position changes mean gradient origin drifts slightly — acceptable visual approximation
  ```

---

**[HIGH-003] ElasticWarp: tab-hidden check re-schedules rAF instead of pausing**
- **File**: `components/Backgrounds/ElasticWarp.tsx`
- **Location**: `draw()` function, `if (document.hidden)` block
- **Description**: When the tab is hidden, `draw()` still fires every rAF cycle (60fps), does the hidden check, and immediately reschedules. This burns CPU in a background tab.
- **Fix**: Use `visibilitychange` to cancel/restart:
  ```typescript
  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animationId = requestAnimationFrame(draw);
    }
  }
  document.addEventListener('visibilitychange', onVisibility);
  // cleanup: document.removeEventListener('visibilitychange', onVisibility)
  ```

---

**[HIGH-004] Firebase App Check (SEC-009) not enforced — any auth'd user can write lb_global**
- **File**: `firestore.rules`
- **Location**: `lb_global` create rule, `hasValidAppCheck()` comment block
- **Description**: `hasValidAppCheck()` is defined but commented out of the actual rule. This means any valid Firebase anonymous auth token (obtainable by calling `signInAnonymously()` from the browser) can submit leaderboard entries, bypassing App Check attestation entirely. The CF Worker provides one layer of defense, but Firestore rules should enforce App Check too.
- **Fix**: Enable App Check enforcement in Firebase Console and uncomment `&& hasValidAppCheck()` in the `lb_global` create rule.

---

**[HIGH-005] score-validator: tokeninfo endpoint doesn't check token revocation**
- **File**: `workers/score-validator.ts`
- **Location**: `await fetch(\`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}\`)`
- **Description**: The `tokeninfo` endpoint validates the JWT signature and expiry but does NOT check Firebase token revocation. A revoked token (user disabled, explicit revoke) will still pass. Also, the `tokeninfo` endpoint has a rate limit (~100 req/s globally) — under high load, validation could start failing.
- **Recommended fix**: Validate directly against Firebase's public key set (`https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`) with cached key rotation. For a hobby game, current approach is acceptable with awareness of these limitations. At minimum, add a fallback 429 handler:
  ```typescript
  if (verifyRes.status === 429) {
    return new Response(JSON.stringify({ error: 'Service busy, retry' }), { status: 503, ... });
  }
  ```

---

### 🟡 MEDIUM

---

**[MED-001] KV rate limiter has TOCTOU — two concurrent requests can both pass the check**
- **File**: `workers/score-validator.ts`
- **Location**: All three rate-check blocks (`rate:${ip}`, `sign-rate:${ip}`, `verify-rate:${ip}`)
- **Description**: Two simultaneous requests read the same KV entry, both see `attempts.length < limit`, both write back with their timestamp added. Both proceed. Burst of 2× the rate limit is possible.
- **Fix**: For a game leaderboard the practical impact is low. Ideal fix: Cloudflare Durable Objects atomic counter. Pragmatic fix: document the gap; current approach is acceptable for this use case.

---

**[MED-002] `useGameEngine`: every tick event calls `setSnapshot` — 60 React re-renders/sec**
- **File**: `hooks/useGameEngine.ts`
- **Location**: `case "tick"` in engine subscriber
- **Description**: `setSnapshot(event.snapshot)` triggers a full React re-render on every game tick. Components consuming `snapshot` (PlayerPanel, GameArea, HUD elements) all re-render 60×/sec. The `snapshotRef` is available for non-render consumers but tick → state is unconditional.
- **Note**: This is a known architectural constraint (PERF-004 comment acknowledges it). The immediate fix is to debounce snapshot state updates to ~30fps while keeping `snapshotRef` at 60fps:
  ```typescript
  // In tick case:
  snapshotRef.current = event.snapshot;
  if (!rafIdRef.current) {
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (mountedRef.current) setSnapshot(snapshotRef.current);
    });
  }
  ```

---

**[MED-003] `score-sync._submit`: double-sanitizes initials unnecessarily**
- **File**: `utils/score-sync.ts`
- **Location**: `_submit()` method, initials sanitization
- **Description**: `queue()` already sanitizes initials before calling `_submit()`. `_submit()` re-sanitizes them again. Harmless but confusing — implies `_submit` is callable with unsanitized input, which it isn't in practice.
- **Fix**: Remove the duplicate sanitization from `_submit()` and add a JSDoc comment: `@param item - must be pre-sanitized by queue()`.

---

**[MED-004] `useGameEngine`: 10+ timer refs with manual cleanup — leak risk**
- **File**: `hooks/useGameEngine.ts`
- **Location**: `toastTimerRef`, `levelUpTimerRef`, `rareSplashTimerRef`, etc.
- **Description**: Each timer ref requires a manual `clearTimeout` in the appropriate cleanup path. If a new event fires after `mountedRef.current = false` but before component fully tears down, timers may fire and call `setState` on an unmounted component (suppressed in React 18 but still wasteful).
- **Fix**: Consolidate timer management into a single cleanup helper called from the main `useEffect` cleanup:
  ```typescript
  const allTimerRefs = [toastTimerRef, levelUpTimerRef, rareSplashTimerRef, ...];
  // In cleanup:
  allTimerRefs.forEach(r => { if (r.current) clearTimeout(r.current); });
  ```

---

**[MED-005] `firestore.rules`: `date` field has no upper-bound check — future dates accepted**
- **File**: `firestore.rules`
- **Location**: `validDate()` function
- **Description**: The regex `^\d{4}-\d{2}-\d{2}$` validates format but not value. A submission with `date: "2099-12-31"` passes. This allows leaderboard spam that always appears at the top of date-sorted queries.
- **Fix**: Add a server-side date check in the Worker — set `date` from `new Date().toISOString().split('T')[0]` server-side and ignore any client-provided date:
  ```typescript
  // In Worker payload construction:
  date: { stringValue: new Date().toISOString().split('T')[0] },  // ← always server date
  ```
  Then remove `date` from the client payload schema.

---

### 🔵 LOW / INFO

---

**[LOW-001] `firestore.rules`: `badge` written as `""` when absent — should be omitted**
- **File**: `workers/score-validator.ts`
- **Location**: Firestore payload construction
- **Description**: `badge: { stringValue: data.badge ?? '' }` writes an empty string when badge is absent. The Firestore rule allows it (`!('badge' in request.resource.data) || ...`), so this technically violates the intent of making badge optional — every document now has a `badge` field.
- **Fix**: Omit badge from payload when absent:
  ```typescript
  ...(data.badge ? { badge: { stringValue: data.badge } } : {}),
  ```

---

**[LOW-002] `ElasticWarp`: particles not re-spawned on resize — may cluster off-screen**
- **File**: `components/Backgrounds/ElasticWarp.tsx`
- **Location**: `resize()` function
- **Description**: `resize()` updates canvas dimensions but doesn't reposition particles. On a large viewport-to-small resize, all particles may be off the visible area temporarily (they wrap back via the edge-check, so this self-corrects over time).
- **Fix**: After resize, clamp particle positions to new dimensions:
  ```typescript
  particles.forEach(p => {
    if (p.x > w) p.x = Math.random() * w;
    if (p.y > h) p.y = Math.random() * h;
  });
  ```

---

**[LOW-003] `score-sync`: `_flushing` flag but no timeout guard**
- **File**: `utils/score-sync.ts`
- **Location**: `flush()` method
- **Description**: If `_submit()` hangs indefinitely (network stall), `_flushing` stays `true` forever, permanently blocking all future flushes until page reload.
- **Fix**: Add a timeout:
  ```typescript
  const timeout = setTimeout(() => { this._flushing = false; }, 30_000);
  try { ... } finally { clearTimeout(timeout); this._flushing = false; }
  ```

---

**[LOW-004] Build status inconsistency: merge conflict in prompt but not in zip**
- **Description**: The prompt's Build Status table says "Merge conflict in `utils/score-sync.ts` (lines 96-101) — blocks build." The zipped source has no conflict markers and the file is clean. Recommend updating the prompt/CLAUDE.md to reflect resolved status and confirming with `git status` before next review packaging.

---

## Summary

| ID | Severity | Area | One-liner |
|----|----------|------|-----------|
| CRIT-001 | 🔴 Critical | Worker/Firestore | `?documentId=auto` — leaderboard never stores more than 1 entry |
| HIGH-001 | 🟠 High | Performance | O(n²) connection lines in ElasticWarp |
| HIGH-002 | 🟠 High | Performance | 120 gradient allocations per frame |
| HIGH-003 | 🟠 High | Performance | rAF still fires when tab hidden |
| HIGH-004 | 🟠 High | Security | App Check not enforced on lb_global writes |
| HIGH-005 | 🟠 High | Security | tokeninfo endpoint limitations |
| MED-001 | 🟡 Medium | Security | KV rate limiter TOCTOU |
| MED-002 | 🟡 Medium | Performance | 60 React re-renders/sec from tick events |
| MED-003 | 🟡 Medium | Quality | Double initials sanitization |
| MED-004 | 🟡 Medium | Stability | 10+ timer refs — leak risk |
| MED-005 | 🟡 Medium | Security | Future dates accepted on leaderboard |
| LOW-001 | 🔵 Low | Quality | badge written as `""` not omitted |
| LOW-002 | 🔵 Low | UX | Particles off-screen after resize |
| LOW-003 | 🔵 Low | Stability | `_flushing` can lock permanently on network hang |
| LOW-004 | 🔵 Info | Process | Build status inconsistency between prompt and zip |

**Blocker to fix before next deploy**: CRIT-001 — without this fix, the leaderboard records zero new entries.
