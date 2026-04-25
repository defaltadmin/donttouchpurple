// ─── Difficulty scaling constants ────────────────────────────────
export const DIFFICULTY = {
  INIT_MS:    2000,
  MIN_MS:     420,   // raised floor (was 380) — slightly slower ceiling
  DECAY_EXP:  0.968, // gentler decay (was 0.960)
  DECAY_EVERY: 6,    // slower steps (was 5)
  // Spin / rotation
  SPIN_BASE_DURATION: 14,
  SPIN_SPEED_CAP:     2.2,
  SPIN_GROWTH:        0.05, // +5% faster per level
  SPIN_EPOCH_LEVELS:  4,    // direction flips every N levels
} as const;

// ─── Game balance constants ───────────────────────────────────────
export const GAME = {
  MAX_HEARTS:       5,
  STAGE_TAPS_NEEDED: 12,
  MAX_ENERGY:       5,
  ENERGY_REGEN_MS:  15 * 60 * 1000, // 15 min
  DUST_PER_ENERGY:  50,
} as const;

// ─── localStorage keys ────────────────────────────────────────────
export const LS_KEYS = {
  P1_KEYS:      "dtp-keys-p1",
  P2_KEYS:      "dtp-keys-p2",
  LB_CLASSIC:   "dtp-lb-classic",
  LB_EVOLVE:    "dtp-lb-evolve",
  PRIVACY_OK:   "dtp-privacy-ok",
  PLAYER_NAME:  "dtp-player-name",
  DUST:         "dtp-dust",
  ENERGY:       "dtp-energy-data",
  SHOP:         "dtp-shop",
  WEEKLY_BONUS: "dtp-weekly-bonus",
  STORED_PWR:   "dtp-stored-pwr",
} as const;
