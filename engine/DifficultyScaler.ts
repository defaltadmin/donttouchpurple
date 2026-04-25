import { DIFFICULTY } from "../config/difficulty";

// ─── Tick interval (ms) ───────────────────────────────────────────
export function computeMs(tick: number, mult = 1): number {
  return Math.max(
    DIFFICULTY.MIN_MS,
    DIFFICULTY.INIT_MS *
      Math.pow(DIFFICULTY.DECAY_EXP, Math.floor(tick / DIFFICULTY.DECAY_EVERY)) *
      mult
  );
}

// ─── Speed display helpers ────────────────────────────────────────
export function speedLabel(tick: number, frozen: boolean): string {
  return (DIFFICULTY.INIT_MS / computeMs(tick, frozen ? 1.4 : 1)).toFixed(1) + "×";
}

export function speedPct(tick: number): number {
  return Math.max(
    4,
    ((DIFFICULTY.INIT_MS - computeMs(tick)) / (DIFFICULTY.INIT_MS - DIFFICULTY.MIN_MS)) * 96
  );
}

// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────
export function mulberry32(seed: number): () => number {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeGameSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

// ─── Spin config ──────────────────────────────────────────────────
export function getSpinConfig(
  level: number,
  gameSeed: number
): { duration: number; direction: 1 | -1 } {
  const rawDur = DIFFICULTY.SPIN_BASE_DURATION * Math.pow(1 - DIFFICULTY.SPIN_GROWTH, level);
  const duration = Math.max(DIFFICULTY.SPIN_SPEED_CAP, rawDur);
  const epoch = Math.floor(level / DIFFICULTY.SPIN_EPOCH_LEVELS);
  const epochSeed = (gameSeed ^ (epoch * 0x9e3779b9)) >>> 0;
  const rng = mulberry32(epochSeed);
  const direction: 1 | -1 = rng() > 0.5 ? 1 : -1;
  return { duration, direction };
}
