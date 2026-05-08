import type { BossEventType } from "../types";

const BOSS_ROTATION: BossEventType[] = ["storm", "inversion", "blackout"];

const DURATIONS: Record<BossEventType, number> = {
  storm: 8000,
  inversion: 6000,
  blackout: 5000,
};

const LABELS: Record<BossEventType, string> = {
  storm:     "⚡ STORM! Cells shuffle faster!",
  inversion: "🔄 INVERSION! Safe and danger swapped!",
  blackout:  "🌑 BLACKOUT! Grid goes dark!",
};

const DONE_LABELS: Record<BossEventType, string> = {
  storm:     "✅ Storm over.",
  inversion: "✅ Inversion over.",
  blackout:  "✅ Blackout over.",
};

export function getNextBossEventType(prevType: BossEventType | null): BossEventType {
  const prevIdx = prevType ? BOSS_ROTATION.indexOf(prevType) : -1;
  return BOSS_ROTATION[(prevIdx + 1) % BOSS_ROTATION.length];
}

export function getBossDuration(type: BossEventType): number {
  return DURATIONS[type];
}

export function getBossLabel(type: BossEventType): string {
  return LABELS[type];
}

export function getBossDoneLabel(type: BossEventType): string {
  return DONE_LABELS[type];
}

export function getNextBossTriggerScore(current: number): number {
  return current + 500;
}

export function shouldTriggerBossEvent(
  score: number,
  nextTriggerScore: number,
  activeBoss: boolean
): boolean {
  return score >= nextTriggerScore && !activeBoss;
}

export function shouldTriggerShieldBoss(
  score: number,
  bossActive: boolean,
  weatherActive: boolean,
  mode: string,
  rng: () => number
): boolean {
  return mode === "evolve" && !bossActive && !weatherActive && score > 100 && score % 300 < 4 && rng() < 0.35;
}
