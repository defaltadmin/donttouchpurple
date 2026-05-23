import { describe, expect, it } from "vitest";

import { calculateStreakBonus, calculateTapScore, checkStreakMilestone } from "../engine/subsystems/ScoreTracker";

describe("ScoreTracker", () => {
  it("awards capped mastery bonuses for longer streaks", () => {
    expect(calculateStreakBonus(7)).toBe(0);
    expect(calculateStreakBonus(8)).toBe(1);
    expect(calculateStreakBonus(16)).toBe(2);
    expect(calculateStreakBonus(30)).toBe(3);
    expect(calculateStreakBonus(100)).toBe(3);
  });

  it("calculateTapScore returns correct multipliers", () => {
    expect(calculateTapScore(false, false, 1)).toEqual({ mult: 1, bossMult: 1, total: 1 });
    expect(calculateTapScore(true, false, 1)).toEqual({ mult: 2, bossMult: 1, total: 2 });
    expect(calculateTapScore(false, true, 3)).toEqual({ mult: 1, bossMult: 3, total: 3 });
    expect(calculateTapScore(true, true, 3)).toEqual({ mult: 2, bossMult: 3, total: 6 });
  });

  it("checkStreakMilestone fires at 5, 10, 25, 50 only", () => {
    expect(checkStreakMilestone(4)).toBe(false);
    expect(checkStreakMilestone(5)).toBe(true);
    expect(checkStreakMilestone(10)).toBe(true);
    expect(checkStreakMilestone(25)).toBe(true);
    expect(checkStreakMilestone(50)).toBe(true);
    expect(checkStreakMilestone(51)).toBe(false);
    expect(checkStreakMilestone(100)).toBe(false);
  });
});
