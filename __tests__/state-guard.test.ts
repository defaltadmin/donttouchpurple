import { describe, expect, it, vi, beforeEach } from "vitest";
import { stateGuard } from "../utils/state-guard";

// jsdom provides crypto.subtle via Node's globalThis.crypto
// sessionStorage is available in jsdom

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
      expect(result).toEqual({ score: 0 }); // fallback
    });

    it("rejects tampered data payload", async () => {
      const data = JSON.stringify({ score: 500 });
      const signed = await stateGuard.signSession(data);
      const envelope = JSON.parse(signed);
      envelope.data = JSON.stringify({ score: 9999 });
      const result = await stateGuard.verifySession(JSON.stringify(envelope), { score: 0 });
      expect(result).toEqual({ score: 0 }); // fallback
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
      // Second sign with same nonce should verify correctly
      const signed2 = await stateGuard.signSession(data);
      const result = await stateGuard.verifySession(signed1, { score: 0 });
      expect(result).toEqual({ score: 100 });
      // Both should be valid (same key)
      const result2 = await stateGuard.verifySession(signed2, { score: 0 });
      expect(result2).toEqual({ score: 100 });
    });

    it("clearSessionNonce invalidates old signatures", async () => {
      const data = JSON.stringify({ score: 100 });
      const signed = await stateGuard.signSession(data);
      stateGuard.clearSessionNonce();
      // New nonce means new key — old signature won't verify
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
      // First call throws QuotaExceededError, second succeeds
      setItemSpy.mockImplementationOnce(() => { throw new DOMException("quota", "QuotaExceededError"); });
      setItemSpy.mockImplementationOnce(() => {});
      stateGuard.safeStore("test-key", { data: 1 });
      expect(localStorage.getItem("dtp:errors")).toBeNull();
    });

    it("silently drops data when quota still exceeded after cleanup", () => {
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
      // Both calls throw — cleanup didn't free enough space
      setItemSpy.mockImplementation(() => { throw new DOMException("quota", "QuotaExceededError"); });
      // Should not throw
      expect(() => stateGuard.safeStore("test-key", { data: 1 })).not.toThrow();
    });
  });
});
