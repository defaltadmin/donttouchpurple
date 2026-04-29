import { describe, expect, it } from "vitest";

import { DIFFICULTY, GAME, LS_KEYS } from "../config/difficulty";
import { DEFAULT_P1_KEYS, DEFAULT_P2_KEYS } from "../config/keybindings";
import { EVOLVE_PATTERNS, RARE_COLORS, STAGES } from "../config/gridPatterns";
import { POWERUP_TABLE, SHOP_THEMES } from "../config/powerupWeights";

describe("config integrity", () => {
  it("keeps the expected stage and pattern counts", () => {
    expect(STAGES).toHaveLength(10);
    expect(EVOLVE_PATTERNS).toHaveLength(28);
    expect(RARE_COLORS).toHaveLength(7);
  });

  it("defines sane difficulty and game values", () => {
    expect(DIFFICULTY.INIT_MS).toBeGreaterThan(DIFFICULTY.MIN_MS);
    expect(DIFFICULTY.DECAY_EXP).toBeGreaterThan(0);
    expect(DIFFICULTY.DECAY_EXP).toBeLessThan(1);
    expect(GAME.MAX_HEARTS).toBe(5);
    expect(GAME.STAGE_TAPS_NEEDED).toBe(12);
  });

  it("keeps key layouts complete and unique per player", () => {
    expect(DEFAULT_P1_KEYS).toHaveLength(16);
    expect(DEFAULT_P2_KEYS).toHaveLength(16);
    expect(new Set(DEFAULT_P1_KEYS)).toHaveProperty("size", DEFAULT_P1_KEYS.length);
    expect(new Set(DEFAULT_P2_KEYS)).toHaveProperty("size", DEFAULT_P2_KEYS.length);
  });

  it("keeps stage dimensions in the expected gameplay bounds", () => {
    STAGES.forEach((stage) => {
      expect(stage.cols).toBeGreaterThanOrEqual(2);
      expect(stage.cols).toBeLessThanOrEqual(5);
      expect(stage.rows).toBeGreaterThanOrEqual(2);
      expect(stage.rows).toBeLessThanOrEqual(5);
      expect(stage.total).toBe(stage.cols * stage.rows);
    });
  });

  it("keeps powerup and theme definitions populated", () => {
    expect(POWERUP_TABLE.every((entry) => entry.weight > 0)).toBe(true);
    expect(SHOP_THEMES[0]?.id).toBe("default");
    expect(Object.values(LS_KEYS)).toContain("dtp-stored-pwr");
    expect(Object.values(LS_KEYS)).toContain("dtp-keys-p1");
    expect(Object.values(LS_KEYS)).toContain("dtp-best-classic");
    expect(Object.values(LS_KEYS)).toContain("dtp-best-evolve");
  });
});
