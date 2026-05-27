# DTP Code Review — v7.5.4 (Big Pickle v2 Round 2)

**Project**: Don't Touch Purple — reflex-based grid-tapping game
**Stack**: React 18, TypeScript 5, Vite 7, Firebase, OGL/WebGL, Cloudflare Workers
**Date**: 2026-05-27
**Previous reviews**: Big Pickle v1 (14 findings fixed), Big Pickle v2 (6 findings — 5 fixed this round)

## Build Status
- Typecheck: 0 errors
- Tests: 211/211 pass (20 files)
- Lint: 0 errors, 0 warnings
- Build: Clean

## What Changed This Round

### 1. SEC-013: Rate limiting added to `/api/sign-challenge` (Medium)

The sign-challenge endpoint previously had no rate limiting while the score submission endpoint did. An attacker could flood HMAC signing requests. Fix: KV-backed sliding window (30 req/min per IP).

**File: `workers/score-validator.ts` (lines 138-164)**

```typescript
// SEC-010: Server-side HMAC signing for challenge links
if (url.pathname === '/api/sign-challenge') {
  // SEC-013: Rate limit sign-challenge to prevent HMAC CPU abuse
  const signIp = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const signRateKey = `sign-rate:${signIp}`;
  const signNow = Date.now();
  let signAttempts: number[] = (await env.RATE_LIMIT_KV.get(signRateKey, { type: 'json' })) ?? [];
  signAttempts = signAttempts.filter(ts => signNow - ts < 60_000);
  if (signAttempts.length >= 30) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
  signAttempts.push(signNow);
  await env.RATE_LIMIT_KV.put(signRateKey, JSON.stringify(signAttempts), { expirationTtl: 90 });

  if (!env.CHALLENGE_HMAC_SECRET) {
    return new Response(JSON.stringify({ error: 'Challenge signing not configured' }), { status: 501, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
  try {
    const body = await request.json<ChallengePayload>();
    if (typeof body.score !== 'number' || typeof body.seed !== 'string' || typeof body.hearts !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid challenge params' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    const sig = await signChallenge(body.score, body.seed, body.hearts, env.CHALLENGE_HMAC_SECRET);
    return new Response(JSON.stringify({ sig }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}
```

**Existing rate limiting on score submission for comparison (lines 190-202):**
```typescript
const rateKey = `rate:${ip}`;
const now = Date.now();
let attempts: number[] = (await env.RATE_LIMIT_KV.get(rateKey, { type: 'json' })) ?? [];
attempts = attempts.filter(ts => now - ts < 60_000);
if (attempts.length >= 8) {
  return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, ... });
}
attempts.push(now);
await env.RATE_LIMIT_KV.put(rateKey, JSON.stringify(attempts), { expirationTtl: 90 });
```

---

### 2. STB-014: Dead `enableDevMode` removed from `useDevToolsState` (Low)

The hook had a `useCallback`-based `enableDevMode` that duplicated App.tsx's keyboard listener. It was never called — App.tsx owns the d→d→p key listener directly.

**BEFORE — `hooks/useDevToolsState.ts`:**
```typescript
import { useState, useRef, useCallback } from "react";
import type { Screen } from "./useScreenStateMachine";

export function useDevToolsState(screen: Screen) {
  const [devMode, setDevMode] = useState(false);
  // ... other state ...
  const [devHeatmap, setDevHeatmap] = useState<Record<number, number>>({});

  // Dev Toggle — type d→d→p on menu screen (dev builds only)
  const devKeyBuffer = useRef<string[]>([]);
  const enableDevMode = useCallback((toast$: (msg: string) => void) => {
    if (!import.meta.env.DEV) return;
    const onKey = (e: KeyboardEvent) => {
      if (screen !== "menu" || devMode) return;
      devKeyBuffer.current = [...devKeyBuffer.current.slice(-2), e.key.toLowerCase()];
      if (devKeyBuffer.current.join("") === "ddp") {
        setDevMode(true);
        devKeyBuffer.current = [];
        toast$("🔧 Dev mode");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, devMode]);

  return {
    devMode, setDevMode,
    // ... other state ...
    enableDevMode,
  };
}
```

**AFTER — `hooks/useDevToolsState.ts`:**
```typescript
import { useState } from "react";

export function useDevToolsState() {
  const [devMode, setDevMode] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [devFreezeTime, setDevFreezeTime] = useState(false);
  const [devRotationSpeed, setDevRotationSpeed] = useState(1);
  const [devAutoPlay, setDevAutoPlay] = useState(false);
  const [devHeatmap, setDevHeatmap] = useState<Record<number, number>>({});

  return {
    devMode, setDevMode,
    godMode, setGodMode,
    devFreezeTime, setDevFreezeTime,
    devRotationSpeed, setDevRotationSpeed,
    devAutoPlay, setDevAutoPlay,
    devHeatmap, setDevHeatmap,
  };
}
```

**App.tsx caller updated (line 206):**
```typescript
// Before: useDevToolsState(screen)
// After:
const { devMode, setDevMode, godMode, setGodMode, devFreezeTime, setDevFreezeTime, devRotationSpeed, setDevRotationSpeed, devAutoPlay, setDevAutoPlay, devHeatmap, setDevHeatmap } = useDevToolsState();
```

App.tsx's own keyboard listener (lines 395-410) is unchanged — it still handles d→d→p:
```typescript
// Dev Toggle — type d→d→p on menu screen (dev builds only)
const devKeyBuffer = useRef<string[]>([]);
useEffect(() => {
  if (!import.meta.env.DEV || devMode) return;
  const onKey = (e: KeyboardEvent) => {
    if (screen !== "menu") return;
    devKeyBuffer.current = [...devKeyBuffer.current.slice(-2), e.key.toLowerCase()];
    if (devKeyBuffer.current.join("") === "ddp") {
      setDevMode(true);
      devKeyBuffer.current = [];
      toast$("🔧 Dev mode");
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [screen, devMode, toast$, setDevMode]);
```

---

### 3. CQ-003: Duplicate `settingsManager` subscription removed from App.tsx (Info)

Both App.tsx and `useThemeSettings` subscribed to `settingsManager`. The App.tsx subscription was unused (only `useThemeSettings` consumes the settings). Removed the duplicate.

**Removed from App.tsx (was at line 735-739):**
```typescript
// REMOVED — duplicate, useThemeSettings already subscribes
const [, setSettings] = useState(settingsManager.get());
useEffect(() => {
  const unsub = settingsManager.subscribe(s => { setSettings(s); });
  return () => { unsub(); };
}, []);
```

**`useThemeSettings` retains the subscription (lines 17-22):**
```typescript
// Settings manager subscription
const [, setSettings] = useState(settingsManager.get());
useEffect(() => {
  const unsub = settingsManager.subscribe(s => { setSettings(s); });
  return () => { unsub(); };
}, []);
```

`settingsManager` is still used in App.tsx at line 1650 (dev panel button), so the import stays.

---

### 4. ARC-005: Test coverage for security-critical modules (Medium)

Four new test files covering state-guard, challenge-link, useThemeSettings, and useDevToolsState.

**File: `__tests__/state-guard.test.ts`**
```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { stateGuard } from "../utils/state-guard";

describe("stateGuard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    stateGuard.clearSessionNonce();
  });

  describe("signSession / verifySession", () => {
    it("round-trips signed data correctly", async () => {
      const data = JSON.stringify({ score: 500, tick: 120 });
      const signed = await stateGuard.signSession(data);
      const result = await stateGuard.verifySession(signed, { score: 0, tick: 0 });
      expect(result).toEqual({ score: 500, tick: 120 });
    });

    it("rejects tampered signature", async () => {
      const data = JSON.stringify({ score: 500 });
      const signed = await stateGuard.signSession(data);
      const envelope = JSON.parse(signed);
      envelope.sig = "tampered12345678";
      const result = await stateGuard.verifySession(JSON.stringify(envelope), { score: 0 });
      expect(result).toEqual({ score: 0 });
    });

    it("rejects tampered data payload", async () => {
      const data = JSON.stringify({ score: 500 });
      const signed = await stateGuard.signSession(data);
      const envelope = JSON.parse(signed);
      envelope.data = JSON.stringify({ score: 9999 });
      const result = await stateGuard.verifySession(JSON.stringify(envelope), { score: 0 });
      expect(result).toEqual({ score: 0 });
    });

    it("returns fallback for malformed JSON", async () => {
      const result = await stateGuard.verifySession("not json", { score: 0 });
      expect(result).toEqual({ score: 0 });
    });

    it("returns fallback for envelope missing data or sig", async () => {
      const result1 = await stateGuard.verifySession(JSON.stringify({ sig: "abc" }), { score: 0 });
      expect(result1).toEqual({ score: 0 });
      const result2 = await stateGuard.verifySession(JSON.stringify({ data: "abc" }), { score: 0 });
      expect(result2).toEqual({ score: 0 });
    });

    it("nonce persists across calls within same session", async () => {
      const data = JSON.stringify({ score: 100 });
      const signed1 = await stateGuard.signSession(data);
      const signed2 = await stateGuard.signSession(data);
      const result = await stateGuard.verifySession(signed1, { score: 0 });
      expect(result).toEqual({ score: 100 });
      const result2 = await stateGuard.verifySession(signed2, { score: 0 });
      expect(result2).toEqual({ score: 100 });
    });

    it("clearSessionNonce invalidates old signatures", async () => {
      const data = JSON.stringify({ score: 100 });
      const signed = await stateGuard.signSession(data);
      stateGuard.clearSessionNonce();
      const result = await stateGuard.verifySession(signed, { score: 0 });
      expect(result).toEqual({ score: 0 });
    });

    it("applies validator on signed data", async () => {
      const data = JSON.stringify({ score: 500 });
      const signed = await stateGuard.signSession(data);
      const validator = (d: unknown) => typeof (d as { score: number }).score === "number";
      const result = await stateGuard.verifySession(signed, { score: 0 }, validator);
      expect(result).toEqual({ score: 500 });
    });

    it("rejects signed data that fails validator", async () => {
      const data = JSON.stringify({ score: "not-a-number" });
      const signed = await stateGuard.signSession(data);
      const validator = (d: unknown) => typeof (d as { score: number }).score === "number";
      const result = await stateGuard.verifySession(signed, { score: 0 }, validator);
      expect(result).toEqual({ score: 0 });
    });
  });

  describe("parse", () => {
    it("parses valid JSON", () => {
      expect(stateGuard.parse('{"score":100}', { score: 0 })).toEqual({ score: 100 });
    });

    it("returns fallback for null input", () => {
      expect(stateGuard.parse(null, { score: 0 })).toEqual({ score: 0 });
    });

    it("returns fallback for invalid JSON", () => {
      expect(stateGuard.parse("{bad", { score: 0 })).toEqual({ score: 0 });
    });

    it("returns fallback when validator rejects", () => {
      const validator = (d: unknown) => (d as { score: number }).score > 0;
      expect(stateGuard.parse('{"score":-1}', { score: 0 }, validator)).toEqual({ score: 0 });
    });
  });

  describe("sanitize", () => {
    it("returns defaults for null/undefined input", () => {
      const defaults = { score: 0, name: "Player" };
      expect(stateGuard.sanitize(null, defaults)).toEqual(defaults);
      expect(stateGuard.sanitize(undefined, defaults)).toEqual(defaults);
    });

    it("passes through matching types", () => {
      const defaults = { score: 0, name: "Player" };
      expect(stateGuard.sanitize({ score: 500, name: "Bob" }, defaults)).toEqual({ score: 500, name: "Bob" });
    });

    it("rejects mismatched types and uses default", () => {
      const defaults = { score: 0, name: "Player" };
      expect(stateGuard.sanitize({ score: "bad", name: "Bob" }, defaults)).toEqual({ score: 0, name: "Bob" });
    });

    it("uses default for missing keys", () => {
      const defaults = { score: 0, name: "Player", level: 1 };
      expect(stateGuard.sanitize({ score: 100 }, defaults)).toEqual({ score: 100, name: "Player", level: 1 });
    });
  });

  describe("safeStore", () => {
    it("stores data in localStorage", () => {
      stateGuard.safeStore("test-key", { score: 100 });
      expect(JSON.parse(localStorage.getItem("test-key")!)).toEqual({ score: 100 });
    });

    it("handles quota exceeded by clearing non-essential keys", () => {
      localStorage.setItem("dtp:errors", "x".repeat(1000));
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
      setItemSpy.mockImplementationOnce(() => { throw new DOMException("quota", "QuotaExceededError"); });
      setItemSpy.mockImplementationOnce(() => {});
      stateGuard.safeStore("test-key", { data: 1 });
      expect(localStorage.getItem("dtp:errors")).toBeNull();
    });
  });
});
```

**File: `__tests__/challenge-link.test.ts`**
```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { challengeLink } from "../utils/challenge-link";

describe("challengeLink", () => {
  const originalLocation = window.location;

  beforeEach(() => { vi.restoreAllMocks(); });

  afterEach(() => {
    Object.defineProperty(window, "location", { value: originalLocation, writable: true });
  });

  function mockLocation(search: string) {
    const url = new URL(`https://game.mscarabia.com/${search}`);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: url.search, href: url.href, origin: url.origin, pathname: "/" },
      writable: true,
    });
  }

  describe("generate", () => {
    it("returns URL with challenge params and sig on success", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ sig: "abc123" }), { status: 200 })
      );
      const url = await challengeLink.generate(500, "seed123", 3);
      expect(url).toContain("challenge=1");
      expect(url).toContain("seed=seed123");
      expect(url).toContain("score=500");
      expect(url).toContain("hearts=3");
      expect(url).toContain("sig=abc123");
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://game.mscarabia.com/api/sign-challenge",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ score: 500, seed: "seed123", hearts: 3 }),
        })
      );
    });

    it("returns URL without sig when server fails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("error", { status: 500 }));
      const url = await challengeLink.generate(500, "seed123", 3);
      expect(url).toContain("challenge=1");
      expect(url).not.toContain("sig=");
    });

    it("returns URL without sig when fetch throws", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));
      const url = await challengeLink.generate(500, "seed123", 3);
      expect(url).toContain("challenge=1");
      expect(url).not.toContain("sig=");
    });
  });

  describe("parseAndVerify", () => {
    it("returns isChallenge=false for non-challenge URL", async () => {
      mockLocation("");
      const result = await challengeLink.parseAndVerify();
      expect(result).toEqual({ isChallenge: false, valid: false });
    });

    it("returns valid=true for matching sig", async () => {
      mockLocation("?challenge=1&seed=s1&score=500&hearts=3&sig=abc123");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ sig: "abc123" }), { status: 200 })
      );
      const result = await challengeLink.parseAndVerify();
      expect(result.isChallenge).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.seed).toBe("s1");
      expect(result.score).toBe(500);
      expect(result.hearts).toBe(3);
    });

    it("returns valid=false for mismatched sig", async () => {
      mockLocation("?challenge=1&seed=s1&score=500&hearts=3&sig=wrong");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ sig: "abc123" }), { status: 200 })
      );
      const result = await challengeLink.parseAndVerify();
      expect(result.isChallenge).toBe(true);
      expect(result.valid).toBe(false);
    });

    it("returns valid=false when server returns error", async () => {
      mockLocation("?challenge=1&seed=s1&score=500&hearts=3&sig=abc123");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("error", { status: 500 }));
      const result = await challengeLink.parseAndVerify();
      expect(result.isChallenge).toBe(true);
      expect(result.valid).toBe(false);
    });

    it("returns valid=false when fetch throws", async () => {
      mockLocation("?challenge=1&seed=s1&score=500&hearts=3&sig=abc123");
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));
      const result = await challengeLink.parseAndVerify();
      expect(result.isChallenge).toBe(true);
      expect(result.valid).toBe(false);
    });
  });

  describe("parseUnsafe", () => {
    it("parses challenge params from URL", () => {
      mockLocation("?challenge=1&seed=s1&score=500&hearts=3&ref=en-US");
      const result = challengeLink.parseUnsafe();
      expect(result.isChallenge).toBe(true);
      expect(result.seed).toBe("s1");
      expect(result.score).toBe(500);
      expect(result.hearts).toBe(3);
      expect(result.ref).toBe("en-US");
    });

    it("returns isChallenge=false for non-challenge URL", () => {
      mockLocation("");
      const result = challengeLink.parseUnsafe();
      expect(result.isChallenge).toBe(false);
    });
  });
});
```

**File: `__tests__/useThemeSettings.test.ts`**
```typescript
import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useThemeSettings } from "../hooks/useThemeSettings";
import type { ShopData } from "../utils/shop-storage";

const defaultShopData: ShopData = {
  equippedTheme: "default",
  equippedBackground: "default",
  unlockedThemes: [],
  unlockedBadges: [],
  unlockedSkins: [],
  unlockedBackgrounds: [],
  unlockedTrails: [],
  equippedBadge: "",
  equippedSkin: "",
  equippedTrail: "",
};

describe("useThemeSettings", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light-theme");
  });

  it("defaults to dark theme", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.theme).toBe("dark");
  });

  it("toggles to light theme and adds CSS class", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    act(() => { result.current.setTheme("light"); });
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("light-theme")).toBe(true);
  });

  it("removes light-theme class when switching back to dark", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    act(() => { result.current.setTheme("light"); });
    act(() => { result.current.setTheme("dark"); });
    expect(document.documentElement.classList.contains("light-theme")).toBe(false);
  });

  it("defaults colorblind mode to none", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.colorblindMode).toBe("none");
  });

  it("changes colorblind mode", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    act(() => { result.current.setColorblindMode("deuteranopia"); });
    expect(result.current.colorblindMode).toBe("deuteranopia");
  });

  it("toggles FPS overlay with F key", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.showFps).toBe(false);
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "f" })); });
    expect(result.current.showFps).toBe(true);
    expect(localStorage.getItem("showFps")).toBe("true");
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "f" })); });
    expect(result.current.showFps).toBe(false);
    expect(localStorage.getItem("showFps")).toBe("false");
  });

  it("reads showFps from localStorage", () => {
    localStorage.setItem("showFps", "true");
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.showFps).toBe(true);
  });

  it("defaults to settingsOpen false", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.settingsOpen).toBe(false);
    act(() => { result.current.setSettingsOpen(true); });
    expect(result.current.settingsOpen).toBe(true);
  });
});
```

**File: `__tests__/useDevToolsState.test.ts`**
```typescript
import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDevToolsState } from "../hooks/useDevToolsState";

describe("useDevToolsState", () => {
  it("initializes with correct defaults", () => {
    const { result } = renderHook(() => useDevToolsState());
    expect(result.current.devMode).toBe(false);
    expect(result.current.godMode).toBe(false);
    expect(result.current.devFreezeTime).toBe(false);
    expect(result.current.devRotationSpeed).toBe(1);
    expect(result.current.devAutoPlay).toBe(false);
    expect(result.current.devHeatmap).toEqual({});
  });

  it("toggles devMode", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevMode(true); });
    expect(result.current.devMode).toBe(true);
    act(() => { result.current.setDevMode(false); });
    expect(result.current.devMode).toBe(false);
  });

  it("toggles godMode", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setGodMode(true); });
    expect(result.current.godMode).toBe(true);
  });

  it("toggles devFreezeTime", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevFreezeTime(true); });
    expect(result.current.devFreezeTime).toBe(true);
  });

  it("sets devRotationSpeed", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevRotationSpeed(2.5); });
    expect(result.current.devRotationSpeed).toBe(2.5);
  });

  it("toggles devAutoPlay", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevAutoPlay(true); });
    expect(result.current.devAutoPlay).toBe(true);
  });

  it("sets devHeatmap", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevHeatmap({ 0: 5, 1: 3 }); });
    expect(result.current.devHeatmap).toEqual({ 0: 5, 1: 3 });
  });
});
```

---

## Review Scope

Focus on:
1. **Security** — Is the rate limiting pattern correct? Any bypass vectors? KV TTL edge cases?
2. **Dead code** — Is the enableDevMode removal complete? Any remaining references?
3. **Duplicate subscription** — Does removing the App.tsx settingsManager subscription break anything?
4. **Test quality** — Are the tests covering the right edge cases? Missing scenarios?
5. **General** — Any bugs, security holes, performance issues, or code quality problems in the changed files?

Do NOT report on files not shown — they are unchanged from the previous review round.

## Files NOT to review (unchanged)
All engine/, components/, config/, services/ files are unchanged. Only workers/, hooks/, utils/ (state-guard.ts, challenge-link.ts), and App.tsx had changes.
