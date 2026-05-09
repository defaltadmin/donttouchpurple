import { logger } from './logger';

export const seedManager = {
  STORAGE_KEY: 'dtp:game-seed',  // localStorage key for active seed (not a secret)
  currentSeed: 0,

  initOrRestore(): number {
    const saved = sessionStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.currentSeed = parseInt(saved, 10) || Date.now();
      logger.info('Seed restored after crash', this.currentSeed);
    } else {
      this.currentSeed = Date.now();
      logger.info('New seed generated', this.currentSeed);
    }
    this.save();
    return this.currentSeed;
  },

  save() { sessionStorage.setItem(this.STORAGE_KEY, String(this.currentSeed)); },
  clear() { sessionStorage.removeItem(this.STORAGE_KEY); },

  mulberry32(a: number) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
};
