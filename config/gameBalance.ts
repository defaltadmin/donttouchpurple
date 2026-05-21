export const BALANCE = {
  rare: {
    triggerInterval: 50,
    warnThreshold: 3,
    minScore: 50,
    modCheck: 4,
    chance: 0.35,
    minTurns: 5,
    bonusTurns: 4,
  },

  bot: {
    minDustToStart: 30,
    baseCostPerTap: 3,
    baseDelayMs: 200,
    minDelayMs: 80,
    delayReductionPerTap: 0.5,
    defaultAccuracy: 0.85,
    checkIntervalMs: 1000,
  },

  survival: {
    startTick: 60,
    interval: 20,
    lateThreshold: 200,
    midThreshold: 120,
    lateAmount: 5,
    midAmount: 3,
    earlyAmount: 2,
    maxScoreCap: 9999,
  },

  boss: {
    shieldBaseHits: 5,
    shieldBonusHits: 3,
  },

  bomb: {
    minScore: 100,
    spawnChance: 0.12,
    fuseTimeMs: 2000,
    warningTimeMs: 700,
  },

  shuffle: {
    minInterval: 40,
    bonusInterval: 20,
    secondShuffleChance: 0.35,
    slideCleanupMs: 250,
  },

  cells: {
    earlyGame: {
      graceTicks: 15,
    },
  },
} as const;

