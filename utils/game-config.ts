import { logger } from './logger';

function clamp(val: unknown, min: number, max: number, fallback: number): number {
  const n = typeof val === 'number' ? val : fallback;
  return Math.max(min, Math.min(max, n));
}

export interface GameConfigData {
  version: number;
  difficulty: { initialHearts: number; baseTime: number; difficultyRamp: number; };
  scoring: { basePoints: number; multiplier: number; comboWindowMs: number; };
  grid: { cols: number; rows: number; spawnRateMs: number; maxActiveCells: number; };
  audio: { defaultVolumes: Record<string, number>; };
}

export const DEFAULT_CONFIG: GameConfigData = {
  version: 1,
  difficulty: { initialHearts: 3, baseTime: 60, difficultyRamp: 1.15 },
  scoring: { basePoints: 100, multiplier: 1.5, comboWindowMs: 2000 },
  grid: { cols: 3, rows: 3, spawnRateMs: 1200, maxActiveCells: 9 },
  audio: { defaultVolumes: { sfx: 0.7, music: 0.4, ambient: 0.3 } }
};

const STORAGE_KEY = 'dtp:config';

export const configManager = {
  current: { ...DEFAULT_CONFIG },

  load(custom?: Partial<GameConfigData>) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge with bounds validation — clamp to prevent localStorage manipulation
        this.current = {
          ...DEFAULT_CONFIG,
          version: DEFAULT_CONFIG.version,
          difficulty: {
            initialHearts: clamp(parsed.difficulty?.initialHearts, 1, 5, DEFAULT_CONFIG.difficulty.initialHearts),
            baseTime: clamp(parsed.difficulty?.baseTime, 30, 300, DEFAULT_CONFIG.difficulty.baseTime),
            difficultyRamp: clamp(parsed.difficulty?.difficultyRamp, 1.0, 2.0, DEFAULT_CONFIG.difficulty.difficultyRamp),
          },
          scoring: {
            basePoints: clamp(parsed.scoring?.basePoints, 1, 100, DEFAULT_CONFIG.scoring.basePoints),
            multiplier: clamp(parsed.scoring?.multiplier, 0.5, 5.0, DEFAULT_CONFIG.scoring.multiplier),
            comboWindowMs: clamp(parsed.scoring?.comboWindowMs, 500, 5000, DEFAULT_CONFIG.scoring.comboWindowMs),
          },
          grid: {
            cols: clamp(parsed.grid?.cols, 2, 8, DEFAULT_CONFIG.grid.cols),
            rows: clamp(parsed.grid?.rows, 2, 8, DEFAULT_CONFIG.grid.rows),
            spawnRateMs: clamp(parsed.grid?.spawnRateMs, 400, 3000, DEFAULT_CONFIG.grid.spawnRateMs),
            maxActiveCells: clamp(parsed.grid?.maxActiveCells, 1, 25, DEFAULT_CONFIG.grid.maxActiveCells),
          },
          audio: { defaultVolumes: DEFAULT_CONFIG.audio.defaultVolumes },
        };
      }
      if (custom) {
        this.current = {
          ...this.current,
          ...custom,
          difficulty: { ...this.current.difficulty, ...custom.difficulty },
          scoring: { ...this.current.scoring, ...custom.scoring },
          grid: { ...this.current.grid, ...custom.grid },
          audio: { ...this.current.audio, ...custom.audio },
        };
      }
      logger.info('Config loaded', this.current);
    } catch (e) { logger.warn('Config load failed, using defaults', e); }
    return this.current;
  },

  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.current)); },

  get() { return this.current; },

  update(partial: Partial<GameConfigData>) {
    this.current = {
      ...this.current,
      ...partial,
      difficulty: { ...this.current.difficulty, ...partial.difficulty },
      scoring: { ...this.current.scoring, ...partial.scoring },
      grid: { ...this.current.grid, ...partial.grid },
      audio: { ...this.current.audio, ...partial.audio },
    };
    this.save();
    this._listeners.forEach(cb => cb(this.current));
  },

  _listeners: new Set<(config: GameConfigData) => void>(),

  subscribe(cb: (config: GameConfigData) => void) {
    this._listeners.add(cb);
    return () => { this._listeners.delete(cb); };
  }
};
