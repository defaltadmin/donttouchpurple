import { describe, expect, it } from "vitest";
import { BALANCE } from "../config/gameBalance";
import { GAME } from "../config/difficulty";

describe("BALANCE.rare", () => {
  it("has sane trigger interval for rare mode", () => {
    expect(BALANCE.rare.triggerInterval).toBeGreaterThan(0);
    expect(BALANCE.rare.triggerInterval).toBeLessThanOrEqual(100);
    expect(BALANCE.rare.warnThreshold).toBeLessThan(BALANCE.rare.triggerInterval);
  });

  it("has valid probability values", () => {
    expect(BALANCE.rare.chance).toBeGreaterThan(0);
    expect(BALANCE.rare.chance).toBeLessThanOrEqual(1);
  });

  it("has positive turn counts", () => {
    expect(BALANCE.rare.minTurns).toBeGreaterThan(0);
    expect(BALANCE.rare.bonusTurns).toBeGreaterThan(0);
  });
});

describe("BALANCE.bot", () => {
  it("has positive dust threshold", () => {
    expect(BALANCE.bot.minDustToStart).toBeGreaterThan(0);
  });

  it("has positive cost per tap below dust threshold", () => {
    expect(BALANCE.bot.baseCostPerTap).toBeGreaterThan(0);
    expect(BALANCE.bot.baseCostPerTap).toBeLessThan(BALANCE.bot.minDustToStart);
  });

  it("has valid delay configuration", () => {
    expect(BALANCE.bot.minDelayMs).toBeGreaterThan(0);
    expect(BALANCE.bot.baseDelayMs).toBeGreaterThan(BALANCE.bot.minDelayMs);
    expect(BALANCE.bot.delayReductionPerTap).toBeGreaterThan(0);
  });

  it("has plausible accuracy", () => {
    expect(BALANCE.bot.defaultAccuracy).toBeGreaterThan(0);
    expect(BALANCE.bot.defaultAccuracy).toBeLessThanOrEqual(1);
  });

  it("has positive check interval", () => {
    expect(BALANCE.bot.checkIntervalMs).toBeGreaterThan(0);
  });
});

describe("BALANCE.survival", () => {
  it("has strictly increasing tick thresholds", () => {
    expect(GAME.SURVIVAL_BONUS_START_TICK).toBeLessThan(BALANCE.survival.midThreshold);
    expect(BALANCE.survival.midThreshold).toBeLessThan(BALANCE.survival.lateThreshold);
  });

  it("has increasing bonus amounts matching thresholds", () => {
    expect(BALANCE.survival.earlyAmount).toBeLessThan(BALANCE.survival.midAmount);
    expect(BALANCE.survival.midAmount).toBeLessThan(BALANCE.survival.lateAmount);
  });

  it("has positive interval", () => {
    expect(BALANCE.survival.interval).toBeGreaterThan(0);
  });
});

describe("BALANCE.boss", () => {
  it("has positive shield hit counts", () => {
    expect(BALANCE.boss.shieldBaseHits).toBeGreaterThan(0);
    expect(BALANCE.boss.shieldBonusHits).toBeGreaterThan(0);
  });
});

describe("BALANCE.bomb", () => {
  it("has positive fuse time", () => {
    expect(BALANCE.bomb.fuseTimeMs).toBeGreaterThan(0);
    expect(BALANCE.bomb.fuseTimeMs).toBeLessThanOrEqual(5000);
  });

  it("valid spawn chance", () => {
    expect(BALANCE.bomb.spawnChance).toBeGreaterThan(0);
    expect(BALANCE.bomb.spawnChance).toBeLessThanOrEqual(1);
  });

  it("has reasonable min score requirement", () => {
    expect(BALANCE.bomb.minScore).toBeGreaterThan(0);
  });
});

describe("BALANCE.shuffle", () => {
  it("has positive intervals", () => {
    expect(BALANCE.shuffle.minInterval).toBeGreaterThan(0);
    expect(BALANCE.shuffle.bonusInterval).toBeGreaterThan(0);
  });

  it("has valid second shuffle chance", () => {
    expect(BALANCE.shuffle.secondShuffleChance).toBeGreaterThan(0);
    expect(BALANCE.shuffle.secondShuffleChance).toBeLessThanOrEqual(1);
  });

  it("has positive slide cleanup duration", () => {
    expect(BALANCE.shuffle.slideCleanupMs).toBeGreaterThan(0);
  });
});

describe("BALANCE config integrity", () => {
  it("all bot tap costs accumulate to exceed threshold over multiple taps", () => {
    const tapsToExhaust = Math.ceil(BALANCE.bot.minDustToStart / BALANCE.bot.baseCostPerTap);
    expect(tapsToExhaust).toBeGreaterThan(0);
  });

  it("delay never drops below min after extreme dust spending", () => {
    const afterManyTaps = Math.max(
      BALANCE.bot.minDelayMs,
      BALANCE.bot.baseDelayMs - 1000 * BALANCE.bot.delayReductionPerTap,
    );
    expect(afterManyTaps).toBe(BALANCE.bot.minDelayMs);
  });

  it("bomb warning time does not exceed fuse time", () => {
    expect(BALANCE.bomb.warningTimeMs).toBeLessThan(BALANCE.bomb.fuseTimeMs);
  });
});
