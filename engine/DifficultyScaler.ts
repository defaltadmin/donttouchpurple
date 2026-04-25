import { DIFFICULTY } from "../config/difficulty";
import { difficultyOverrides } from "../config/difficultyOverrides";

// ─── Tick interval (ms) ───────────────────────────────────────────
export function computeMs(tick: number, mult = 1): number {
  const INIT_MS = difficultyOverrides.INIT_MS ?? DIFFICULTY.INIT_MS;
  const MIN_MS = difficultyOverrides.MIN_MS ?? DIFFICULTY.MIN_MS;
  const DECAY_EXP = difficultyOverrides.DECAY_EXP ?? DIFFICULTY.DECAY_EXP;
  const DECAY_EVERY = difficultyOverrides.DECAY_EVERY ?? DIFFICULTY.DECAY_EVERY;

  return Math.max(
    MIN_MS,
    INIT_MS * Math.pow(DECAY_EXP, Math.floor(tick / DECAY_EVERY)) * mult
  );
}

// ─── Speed display helpers ────────────────────────────────────────
export function speedLabel(tick: number, frozen: boolean): string {
  const INIT_MS = difficultyOverrides.INIT_MS ?? DIFFICULTY.INIT_MS;
  return (INIT_MS / computeMs(tick, frozen ? 1.4 : 1)).toFixed(1) + "×";
}

export function speedPct(tick: number): number {
  const INIT_MS = difficultyOverrides.INIT_MS ?? DIFFICULTY.INIT_MS;
  const MIN_MS = difficultyOverrides.MIN_MS ?? DIFFICULTY.MIN_MS;
  return Math.max(
    4,
    ((INIT_MS - computeMs(tick)) / (INIT_MS - MIN_MS)) * 96
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
  const SPIN_BASE_DURATION = difficultyOverrides.SPIN_BASE_DURATION ?? DIFFICULTY.SPIN_BASE_DURATION;
  const SPIN_GROWTH = difficultyOverrides.SPIN_GROWTH ?? DIFFICULTY.SPIN_GROWTH;
  const SPIN_SPEED_CAP = difficultyOverrides.SPIN_SPEED_CAP ?? DIFFICULTY.SPIN_SPEED_CAP;
  const SPIN_EPOCH_LEVELS = difficultyOverrides.SPIN_EPOCH_LEVELS ?? DIFFICULTY.SPIN_EPOCH_LEVELS;

  const rawDur = SPIN_BASE_DURATION * Math.pow(1 - SPIN_GROWTH, level);
  const duration = Math.max(SPIN_SPEED_CAP, rawDur);
  const epoch = Math.floor(level / SPIN_EPOCH_LEVELS);
  const epochSeed = (gameSeed ^ (epoch * 0x9e3779b9)) >>> 0;
  const rng = mulberry32(epochSeed);
  const direction: 1 | -1 = rng() > 0.5 ? 1 : -1;
  return { duration, direction };
}
