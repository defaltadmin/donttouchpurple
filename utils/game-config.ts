import { logger } from './logger';

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
  grid: { cols: 6, rows: 8, spawnRateMs: 1200, maxActiveCells: 15 },
  audio: { defaultVolumes: { sfx: 0.7, music: 0.4, ambient: 0.3 } }
};

const STORAGE_KEY = 'dtp:config';

export const configManager = {
  current: { ...DEFAULT_CONFIG },

  load(custom?: Partial<GameConfigData>) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) this.current = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      if (custom) this.current = { ...this.current, ...custom };
      logger.info('Config loaded', this.current);
    } catch (e) { logger.warn('Config load failed, using defaults', e); }
    return this.current;
  },

  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.current)); },

  get() { return this.current; },

  update(partial: Partial<GameConfigData>) { this.current = { ...this.current, ...partial }; this.save(); }
};
