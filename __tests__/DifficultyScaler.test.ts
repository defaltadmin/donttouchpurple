import { describe, expect, it, vi } from "vitest";

import { DIFFICULTY } from "../config/difficulty";
import { computeMs, getSpinConfig, makeGameSeed, mulberry32, speedLabel, speedPct } from "../engine/DifficultyScaler";

describe("DifficultyScaler", () => {
  it("returns INIT_MS at tick 0", () => {
    expect(computeMs(0)).toBe(DIFFICULTY.INIT_MS);
  });

  it("decreases over time but never below MIN_MS", () => {
    expect(computeMs(60)).toBeLessThan(computeMs(0));
    expect(computeMs(10_000)).toBe(DIFFICULTY.MIN_MS);
  });

  it("respects the speed multiplier", () => {
    expect(computeMs(60, 0.5)).toBeLessThan(computeMs(60, 1));
  });

  it("matches the expected decay step at tick 60", () => {
    const expected = Math.max(
      DIFFICULTY.MIN_MS,
      DIFFICULTY.INIT_MS *
        Math.pow(DIFFICULTY.DECAY_EXP, Math.floor(60 / DIFFICULTY.DECAY_EVERY))
    );

    expect(computeMs(60)).toBe(expected);
  });

  it("formats speed helpers consistently", () => {
    expect(speedLabel(0, false)).toBe("1.0×");
    expect(speedPct(0)).toBe(4);
    expect(speedPct(600)).toBeLessThanOrEqual(100);
  });

  it("produces deterministic mulberry32 sequences per seed", () => {
    const rngA = mulberry32(42);
    const rngB = mulberry32(42);
    const rngC = mulberry32(43);

    const seqA = [rngA(), rngA(), rngA()];
    const seqB = [rngB(), rngB(), rngB()];
    const seqC = [rngC(), rngC(), rngC()];

    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
    seqA.concat(seqC).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  it("creates a 32-bit unsigned game seed", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(makeGameSeed()).toBe(0x7fffffff);
  });

  it("keeps spin duration deterministic and non-increasing with level", () => {
    const low = getSpinConfig(1, 99999);
    const high = getSpinConfig(20, 99999);
    const repeat = getSpinConfig(20, 99999);

    expect(high.duration).toBeLessThanOrEqual(low.duration);
    expect(repeat).toEqual(high);
    expect([1, -1]).toContain(high.direction);
  });
});
