import { DIFFICULTY } from "../config/difficulty";
import { difficultyOverrides } from "../config/difficultyOverrides";

// ─── Read overrides on each call (not at module load) ─────────────
function _initMs() { return difficultyOverrides.INIT_MS ?? DIFFICULTY.INIT_MS; }
function _minMs() { return difficultyOverrides.MIN_MS ?? DIFFICULTY.MIN_MS; }
function _decayExp() { return difficultyOverrides.DECAY_EXP ?? DIFFICULTY.DECAY_EXP; }
function _decayEvery() { return difficultyOverrides.DECAY_EVERY ?? DIFFICULTY.DECAY_EVERY; }
function _spinBaseDuration() { return difficultyOverrides.SPIN_BASE_DURATION ?? DIFFICULTY.SPIN_BASE_DURATION; }
function _spinGrowth() { return difficultyOverrides.SPIN_GROWTH ?? DIFFICULTY.SPIN_GROWTH; }
function _spinSpeedCap() { return difficultyOverrides.SPIN_SPEED_CAP ?? DIFFICULTY.SPIN_SPEED_CAP; }
function _spinEpochLevels() { return difficultyOverrides.SPIN_EPOCH_LEVELS ?? DIFFICULTY.SPIN_EPOCH_LEVELS; }

// ─── Tick interval (ms) ───────────────────────────────────────────
export function computeMs(tick: number, mult = 1): number {
  return Math.max(
    _minMs(),
    _initMs() * Math.pow(_decayExp(), Math.floor(tick / _decayEvery())) * mult
  );
}

// ─── Speed display helpers ────────────────────────────────────────
export function speedLabel(tick: number, frozen: boolean): string {
  return (_initMs() / computeMs(tick, frozen ? 1.4 : 1)).toFixed(1) + "×";
}

export function speedPct(tick: number): number {
  const initMs = _initMs(), minMs = _minMs();
  return Math.max(
    4,
    ((initMs - computeMs(tick)) / (initMs - minMs)) * 96
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
  const rawDur = _spinBaseDuration() * Math.pow(1 - _spinGrowth(), level);
  const duration = Math.max(_spinSpeedCap(), rawDur);
  const epoch = Math.floor(level / _spinEpochLevels());
  const epochSeed = (gameSeed ^ (epoch * 0x9e3779b9)) >>> 0;
  const rng = mulberry32(epochSeed);
  const direction: 1 | -1 = rng() > 0.5 ? 1 : -1;
  return { duration, direction };
}
