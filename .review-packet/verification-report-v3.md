# DeepSeek + Sonnet — Round 2 Verification Report

**Date:** 2026-05-27
**Commits:** `a793ef4` (DeepSeek), `6a4e2d5` (Sonnet), `c6f49a0` (this fix)
**Final state:** 214/214 tests, 0 type/lint errors, clean build

---

## All 15 findings — final disposition

### DeepSeek (8 findings)

| ID | Verdict | Detail |
|---|---|---|
| SEC-014 | FIXED | `firestore.rules:62` — dust_wallet read restricted to `resource.data.uid == request.auth.uid` |
| SEC-015 | FIXED | `workers/score-validator.ts:184` — iss claim validated against `https://securetoken.google.com/${project}` |
| STB-015 | ACCEPTED | KV race is millisecond-scale; low impact for game-grade rate limits |
| CQ-004 | FIXED | `hooks/useThemeSettings.ts` — dead `settingsManager` subscription removed |
| CQ-005 | FIXED | `firestore.rules:53` — aligned to `tick * 12` (removed +300 buffer) |
| SEC-016 | FIXED | `workers/score-validator.ts:162` — seed length capped at 256 chars |
| INFO-001 | ACCEPTED | 96-bit HMAC truncation is fine for game context |
| INFO-002 | KNOWN | `colorblindMode` is a placeholder; feature not implemented |

### Sonnet (7 findings)

| ID | Verdict | Detail |
|---|---|---|
| SEC-013-R1 | FIXED | `workers/score-validator.ts:152,225` — expirationTtl 90→61 (closes burst window) |
| SEC-013-R2 | FIXED | `workers/score-validator.ts:140-143,202-205` — missing cf-connecting-ip → 403 |
| SEC-CL-01 | DEFERRED | Architectural — needs `/api/verify-challenge` endpoint. Will use `crypto.subtle.timingSafeEqual` for constant-time compare. |
| FST-01 | ALREADY FIXED | In DeepSeek pass (CQ-005) |
| CQ-003-R1 | ALREADY FIXED | In DeepSeek pass (CQ-004) |
| STB-014-R1 | FIXED | `__tests__/useDevToolsState.test.ts:54-57` — negative test for enableDevMode absence |
| TST-01 | FIXED | `__tests__/challenge-link.test.ts:117-125` — IS_PROD rejection test; `vi.unstubAllEnvs()` added to `afterEach` to prevent bleed |
| TST-02 | FIXED | `__tests__/state-guard.test.ts:147-152` — safeStore double-quota-fail silent drop test |

---

## Verified changes — file-by-file

### `firestore.rules` (lines 53, 62)

**line 53** — score validation aligned with Worker:
```
BEFORE: request.resource.data.score <= request.resource.data.tick * 12 + 300
AFTER:  request.resource.data.score <= request.resource.data.tick * 12
```

**line 62** — dust_wallet read restricted:
```
BEFORE: resource.data.uid == request.auth.uid || request.auth.token.firebase.sign_in_provider == 'anonymous'
AFTER:  resource.data.uid == request.auth.uid
```

### `workers/score-validator.ts`

**lines 140-143** — sign-challenge IP check:
```typescript
const signIp = request.headers.get('cf-connecting-ip');
if (!signIp) {
  return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}
```

**line 152** — sign-challenge TTL:
```typescript
await env.RATE_LIMIT_KV.put(signRateKey, JSON.stringify(signAttempts), { expirationTtl: 61 });
```

**lines 162-165** — seed length cap:
```typescript
if (body.seed.length > 256) {
  return new Response(JSON.stringify({ error: 'Seed too long' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}
```

**lines 184-189** — iss validation:
```typescript
const expectedIss = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`;
if (!tokenInfo.iss || tokenInfo.iss !== expectedIss) {
  return new Response(JSON.stringify({ error: 'Invalid issuer' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}
```

**lines 202-205** — submit-score IP check:
```typescript
const ip = request.headers.get('cf-connecting-ip');
if (!ip) {
  return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}
```

**line 225** — submit-score TTL:
```typescript
await env.RATE_LIMIT_KV.put(rateKey, JSON.stringify(attempts), { expirationTtl: 61 });
```

### `hooks/useThemeSettings.ts`

Dead subscription removed (lines 17-22 in previous version). `settingsManager` import kept — still used for `showOffset` init and persistence.

### `__tests__/useDevToolsState.test.ts` (lines 54-57)

```typescript
it("does not expose enableDevMode (dead code removed)", () => {
  const { result } = renderHook(() => useDevToolsState());
  expect((result.current as Record<string, unknown>).enableDevMode).toBeUndefined();
});
```

### `__tests__/challenge-link.test.ts`

**lines 19-22** — afterEach hardened:
```typescript
afterEach(() => {
  Object.defineProperty(window, "location", { value: originalLocation, writable: true });
  vi.unstubAllEnvs();
});
```

**lines 117-125** — IS_PROD rejection test:
```typescript
it("rejects unsigned challenge URLs in production", async () => {
  vi.resetModules();
  vi.stubEnv("PROD", true);
  const { challengeLink: prodLink } = await import("../utils/challenge-link");
  mockLocation("?challenge=1&seed=s1&score=500&hearts=3");
  const result = await prodLink.parseAndVerify();
  expect(result.isChallenge).toBe(true);
  expect(result.valid).toBe(false);
});
```

### `__tests__/state-guard.test.ts` (lines 147-152)

```typescript
it("silently drops data when quota still exceeded after cleanup", () => {
  const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
  setItemSpy.mockImplementation(() => { throw new DOMException("quota", "QuotaExceededError"); });
  expect(() => stateGuard.safeStore("test-key", { data: 1 })).not.toThrow();
});
```

---

## Acceptance notes (addressing reviewer comments)

**SEC-CL-01 (deferred):** Will use `crypto.subtle.timingSafeEqual` (or byte-by-byte fallback) when implementing `/api/verify-challenge`. The current `===` on base64url strings is acceptable for the 16-char truncated sig but won't be carried into the new endpoint.

**SEC-016 (seed cap):** 256 chars noted as potentially tight if seed format evolves to structured/base64. Current seeds are short alphanumeric strings. Will revisit if format changes.

**STB-015 (KV race):** Accepted. The `expirationTtl: 61` fix from SEC-013-R1 already closed the exploitable gap (TTL-boundary burst).

**TST-01 (module leakage):** Fixed. `vi.unstubAllEnvs()` added to `afterEach` to ensure `IS_PROD` stub doesn't bleed into adjacent tests. `vi.resetModules()` + dynamic import stays scoped within the test.

---

## Test results

```
Test Files  20 passed (20)
     Tests  214 passed (214)
  Duration  5.30s
```

No regressions across both review rounds.
