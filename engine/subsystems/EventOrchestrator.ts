import type { BossEventType } from "../types";

// Only inversion provides genuine skill expression — storm is chaos, blackout contradicts core mechanic
const BOSS_ROTATION: BossEventType[] = ["inversion"];

const DURATIONS: Record<BossEventType, number> = {
  storm: 8000,       // dead — BOSS_ROTATION only contains "inversion"
  inversion: 4000,
  blackout: 5000,    // dead — BOSS_ROTATION only contains "inversion"
};

const LABELS: Record<BossEventType, string> = {
  storm:     "⚡ STORM! Cells shuffle faster!",    // dead
  inversion: "🔄 INVERSION! Safe and danger swapped!",
  blackout:  "🌑 BLACKOUT! Grid goes dark!",       // dead
};

const DONE_LABELS: Record<BossEventType, string> = {
  storm:     "✅ Storm over.",     // dead
  inversion: "✅ Inversion over.",
  blackout:  "✅ Blackout over.", // dead
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

export function shouldTriggerShieldBoss(
  score: number,
  bossActive: boolean,
  weatherActive: boolean,
  mode: string,
  rng: () => number
): boolean {
  return mode === "evolve" && !bossActive && !weatherActive && score > 100 && score % 300 < 4 && rng() < 0.35;
}
