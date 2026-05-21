const STREAK_MILESTONES = [5, 10, 25, 50];
const STREAK_BONUS_TIERS = [
  { streak: 30, bonus: 3 },
  { streak: 16, bonus: 2 },
  { streak: 8, bonus: 1 },
];

export function calculateTapScore(
  multiplierActive: boolean,
  bossActive: boolean,
  bossComboMultiplier: number
): { mult: number; bossMult: number; total: number } {
  const mult = multiplierActive ? 2 : 1;
  const bossMult = bossActive ? bossComboMultiplier : 1;
  return { mult, bossMult, total: mult * bossMult };
}

export function calculateStreakBonus(nextStreak: number): number {
  return STREAK_BONUS_TIERS.find(tier => nextStreak >= tier.streak)?.bonus ?? 0;
}

export function checkStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}
