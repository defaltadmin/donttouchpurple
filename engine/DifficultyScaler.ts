import { DIFFICULTY } from "../config/difficulty";
import { difficultyOverrides } from "../config/difficultyOverrides";

// ─── Resolved overrides (computed once at module load) ────────────
const _INIT_MS = difficultyOverrides.INIT_MS ?? DIFFICULTY.INIT_MS;
const _MIN_MS = difficultyOverrides.MIN_MS ?? DIFFICULTY.MIN_MS;
const _DECAY_EXP = difficultyOverrides.DECAY_EXP ?? DIFFICULTY.DECAY_EXP;
const _DECAY_EVERY = difficultyOverrides.DECAY_EVERY ?? DIFFICULTY.DECAY_EVERY;
const _SPIN_BASE_DURATION = difficultyOverrides.SPIN_BASE_DURATION ?? DIFFICULTY.SPIN_BASE_DURATION;
const _SPIN_GROWTH = difficultyOverrides.SPIN_GROWTH ?? DIFFICULTY.SPIN_GROWTH;
const _SPIN_SPEED_CAP = difficultyOverrides.SPIN_SPEED_CAP ?? DIFFICULTY.SPIN_SPEED_CAP;
const _SPIN_EPOCH_LEVELS = difficultyOverrides.SPIN_EPOCH_LEVELS ?? DIFFICULTY.SPIN_EPOCH_LEVELS;

// ─── Tick interval (ms) ───────────────────────────────────────────
export function computeMs(tick: number, mult = 1): number {
  return Math.max(
    _MIN_MS,
    _INIT_MS * Math.pow(_DECAY_EXP, Math.floor(tick / _DECAY_EVERY)) * mult
  );
}

// ─── Speed display helpers ────────────────────────────────────────
export function speedLabel(tick: number, frozen: boolean): string {
  return (_INIT_MS / computeMs(tick, frozen ? 1.4 : 1)).toFixed(1) + "×";
}

export function speedPct(tick: number): number {
  return Math.max(
    4,
    ((_INIT_MS - computeMs(tick)) / (_INIT_MS - _MIN_MS)) * 96
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
  const rawDur = _SPIN_BASE_DURATION * Math.pow(1 - _SPIN_GROWTH, level);
  const duration = Math.max(_SPIN_SPEED_CAP, rawDur);
  const epoch = Math.floor(level / _SPIN_EPOCH_LEVELS);
  const epochSeed = (gameSeed ^ (epoch * 0x9e3779b9)) >>> 0;
  const rng = mulberry32(epochSeed);
  const direction: 1 | -1 = rng() > 0.5 ? 1 : -1;
  return { duration, direction };
}
