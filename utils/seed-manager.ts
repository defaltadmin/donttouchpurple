import { logger } from './logger';

export const seedManager = {
  STORAGE_KEY: 'dtp:game-seed',  // localStorage key for active seed (not a secret)
  currentSeed: 0,

  initOrRestore(): number {
    const saved = sessionStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.currentSeed = parseInt(saved, 10) || ((Math.random() * 0xffffffff) >>> 0);
      logger.info('Seed restored after crash', this.currentSeed);
    } else {
      this.currentSeed = ((Math.random() * 0xffffffff) >>> 0);
      logger.info('New seed generated', this.currentSeed);
    }
    this.save();
    return this.currentSeed;
  },

  save() { sessionStorage.setItem(this.STORAGE_KEY, String(this.currentSeed)); },
  clear() { sessionStorage.removeItem(this.STORAGE_KEY); },
};
