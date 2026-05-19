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

export function calculateHoldScore(
  multiplierActive: boolean
): number {
  return multiplierActive ? 4 : 2;
}

export function calculateBombDefuseScore(
  multiplierActive: boolean
): number {
  return multiplierActive ? 6 : 3;
}

export function calculateStreakBonus(nextStreak: number): number {
  return STREAK_BONUS_TIERS.find(tier => nextStreak >= tier.streak)?.bonus ?? 0;
}

export function checkStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}

export function shouldShowStreakToast(streak: number): string | null {
  if (STREAK_MILESTONES.includes(streak)) return `🔥 ${streak} Streak!`;
  if (streak >= 5) return null;
  return null;
}

export function calculateSurvivalBonus(
  tickCount: number,
  rhythmMultiplier: number,
  p1Alive: boolean,
  p2Alive: boolean,
  numPlayers: number
): number {
  const bonus = tickCount > 200 ? 5 : tickCount > 120 ? 3 : 2;
  const multBonus = Math.round(bonus * rhythmMultiplier);
  let total = 0;
  if (p1Alive) total += multBonus;
  if (numPlayers === 2 && p2Alive) total += multBonus;
  return total;
}

export function recordAttempt(
  dda: { recordAttempt: (success: boolean, reaction: number, miss: boolean) => void },
  success: boolean,
  reaction: number,
  missed: boolean
): void {
  dda.recordAttempt(success, reaction, missed);
}

export function recordTapScore(
  ref: { score: number; streak: number; stageProgress: number },
  mult: number,
  bossMult: number
): void {
  ref.score += mult * bossMult;
  ref.streak += 1;
  ref.stageProgress += 1;
}

export function recordDeath(
  dda: { recordAttempt: (success: boolean, reaction: number, miss: boolean) => void },
  rhythm: { reset: () => void }
): void {
  dda.recordAttempt(false, 0, true);
  rhythm.reset();
}
