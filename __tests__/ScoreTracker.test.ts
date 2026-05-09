import { describe, expect, it } from "vitest";

import { calculateStreakBonus } from "../engine/subsystems/ScoreTracker";

describe("ScoreTracker", () => {
  it("awards capped mastery bonuses for longer streaks", () => {
    expect(calculateStreakBonus(7)).toBe(0);
    expect(calculateStreakBonus(8)).toBe(1);
    expect(calculateStreakBonus(16)).toBe(2);
    expect(calculateStreakBonus(30)).toBe(3);
    expect(calculateStreakBonus(100)).toBe(3);
  });
});
