import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock logger to silence warnings
vi.mock("../utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { challengeLink } from "../utils/challenge-link";

// challenge-link uses `window.location` and `fetch` — both need mocking

describe("challengeLink", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore location
    Object.defineProperty(window, "location", { value: originalLocation, writable: true });
    // Unstub env vars to prevent IS_PROD from bleeding into adjacent tests
    vi.unstubAllEnvs();
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
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("error", { status: 500 })
      );
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
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("error", { status: 500 })
      );
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

    it("rejects unsigned challenge URLs in production", async () => {
      vi.resetModules();
      vi.stubEnv("PROD", true);
      const { challengeLink: prodLink } = await import("../utils/challenge-link");
      mockLocation("?challenge=1&seed=s1&score=500&hearts=3");
      const result = await prodLink.parseAndVerify();
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
