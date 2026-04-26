// ─── Cell & grid types ────────────────────────────────────────────
export type CellType =
  | "inactive" | "void" | "purple"
  | "white" | "blue" | "red" | "orange" | "yellow"
  | "green" | "cyan" | "lime" | "teal"
  | "pink" | "rose" | "magenta"
  | "medpack" | "shield" | "freeze" | "multiplier"
  | "ice" | "hold";

export type CellShape = "square" | "circle" | "triangle" | "mixed";

export type GameMode   = "classic" | "evolve";
export type NumPlayers = 1 | 2;
export type Winner     = "p1" | "p2" | "tie" | null;

// ─── Active cell (in-flight, not yet resolved) ────────────────────
export interface ActiveCell {
  idx:          number;
  type:         CellType;
  clicked:      boolean;
  iceCount?:    number;   // taps remaining for ice blocks
  holdStart?:   number;   // timestamp when hold began
  holdRequired?: number;  // ms needed to complete hold
  _holding?:    boolean;  // internal: player is actively holding
}

// ─── Per-player live state ────────────────────────────────────────
export interface PlayerState {
  cells:               CellType[];       // flat 25-cell display array
  active:              ActiveCell[];     // cells currently in play
  score:               number;
  streak:              number;
  alive:               boolean;
  anim:                Record<number, string>;
  health:              number;
  shield:              boolean;
  shieldCount:         number;
  freezeEnd:           number;           // timestamp
  multiplierEnd:       number;           // timestamp
  gridStage:           number;           // evolve stage index
  stageProgress:       number;           // taps toward next stage
  patternIdx:          number;           // current EVOLVE_PATTERNS index
  storedFreezeCharges: number;
  storedShieldCharges: number;
  pendingStageUpdate?: boolean;          // Task 2: defer stage change
}

// ─── Rare color mode ──────────────────────────────────────────────
export interface RareColorMode {
  active:   boolean;
  color:    string;
  cssColor: string;
  turnsLeft: number;
}

export interface StoredPowerups {
  freeze: number;
  shield: number;
  mult: number;
  heart: number;
}

// ─── Engine configuration (passed at construction) ────────────────
export interface GameConfig {
  mode:       GameMode;
  numPlayers: NumPlayers;
  speedMult:  number;      // iMultRef equivalent
  storage?: {
    loadStoredPowerups: () => StoredPowerups;
    saveStoredPowerups: (data: StoredPowerups) => void;
  };
}

// ─── Full engine snapshot emitted to React ────────────────────────
export interface GameSnapshot {
  tick:       number;
  evolveTick: number;
  gameSeed:   number;
  p1:         PlayerState;
  p2:         PlayerState;
  cellShape:  CellShape;
  rareMode:   RareColorMode;
  spinLevel:  number;
  paused:     boolean;
  phase:      "playing" | "paused" | "gameover";
  grid: {
    cols: number;
    rows: number;
    mask: number[] | null;
  };
  devRotationSpeed?: number;
  spinCfg: { duration: number; direction: 1 | -1 } | null;
}

// ─── Events emitted by GameEngine ────────────────────────────────
export type GameEvent =
  | { type: "tick";        snapshot: GameSnapshot }
  | { type: "damage";      player: 1 | 2 }
  | { type: "shake";       player: 1 | 2 }
  | { type: "levelUp";     player: 1 | 2; stage: number }
  | { type: "sound";       name: "ok" | "bad" | "tick" | "powerup" | "levelup" }
  | { type: "toast";       message: string }
  | { type: "pwrToast";    message: string; player: 1 | 2 } // Task 1: Inline pwr toast
  | { type: "rareStart";   color: string; cssColor: string }
  | { type: "cellAnim";    player: 1 | 2; idx: number; anim: "pop" | "shake" }
  | { type: "gameOver";    winner: Winner }
  | { type: "phaseChange"; phase: GameSnapshot["phase"] };
