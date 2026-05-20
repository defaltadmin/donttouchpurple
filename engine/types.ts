// ─── Cell & grid types ────────────────────────────────────────────
export type CellType =
  | "inactive" | "void" | "purple"
  | "white" | "blue" | "red" | "orange" | "yellow"
  | "green" | "cyan" | "lime" | "teal"
  | "pink" | "rose" | "magenta"
  | "medpack" | "shield" | "freeze" | "multiplier"
  | "ice" | "hold" | "bomb";

export type BossEventType = "storm" | "inversion" | "blackout";

export type CellShape = "square" | "circle" | "triangle" | "roundedTriangle" | "mixed" | "diamond";

export type GameMode   = "classic" | "evolve";
export type NumPlayers = 1 | 2;
export type Winner     = "p1" | "p2" | "tie" | null;

// ─── Active cell (in-flight, not yet resolved) ────────────────────
type BaseCell = {
  idx: number;
  clicked: boolean;
  shape?: CellShape;
};

export type RegularCell = BaseCell & {
  type: "white" | "blue" | "red" | "orange" | "yellow" | "green" | "cyan" | "lime" | "teal" | "pink" | "rose" | "magenta" | "purple";
};

export type IceCell = BaseCell & {
  type: "ice";
  iceCount: number;
};

export type HoldCell = BaseCell & {
  type: "hold";
  holdRequired: number;
  holdStart?: number;
  spawnedAt: number;   // timestamp — hold cell expires if never started within holdRequired + 1500ms
};

export type PowerupCell = BaseCell & {
  type: "medpack" | "shield" | "freeze" | "multiplier";
};

export type BombCell = BaseCell & {
  type: "bomb";
  expiresAt: number;   // timestamp — must tap before this
};

export type ActiveCell = RegularCell | IceCell | HoldCell | PowerupCell | BombCell;

export interface BossEvent {
  type: BossEventType;
  endsAt: number;      // timestamp
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
  pendingStageUpdate?: boolean;
  slideAnim?: Record<number, { fromIdx: number; startMs: number }>; // K3: cell shuffle slide
  nextShuffleTick: number;  // per-player shuffle scheduling
}

// ─── Rare color mode ──────────────────────────────────────────────
export interface RareColorMode {
  active:   boolean;
  color:    string;
  cssColor: string;
  turnsLeft: number;
  shape:    CellShape;  // shape used for colorblind distinction
  emoji:    string;     // emoji shown in colorblind mode
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
  inputMode?: 'touch' | 'keys';  // default 'touch'
  godMode?:   boolean;     // practice / dev invincibility
  storage?: {
    loadStoredPowerups: () => StoredPowerups;
    saveStoredPowerups: (data: StoredPowerups) => void;
  };
  botAssist?: {
    enabled: boolean;
    getDust: () => number;
    spendDust: (amount: number) => void;
    getAccuracy: () => number;  // 0.0–1.0
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
  phase:      "playing" | "paused" | "gameover" | "humanlimit";
  grid: {
    cols: number;
    rows: number;
    mask: number[] | null;
  };
  devRotationSpeed?: number;
  spinCfg: { duration: number; direction: 1 | -1 } | null;
  bossEvent:  BossEvent | null;
  activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null;
  isInverted: boolean;   // true during inversion boss event
  isBlackout: boolean;   // true during blackout boss event
}

// ─── Events emitted by GameEngine ────────────────────────────────
export type GameEvent =
  | { type: "tick";        snapshot: GameSnapshot }
  | { type: "damage";      player: 1 | 2 }
  | { type: "shake";       player: 1 | 2 }
  | { type: "levelUp";     player: 1 | 2; stage: number }
  | { type: "sound";       name: "ok" | "bad" | "tick" | "powerup" | "levelup" | "shuffle" | "rareStart" | "claim" | "bomb" | "bossStart"; pitchMult?: number }
  | { type: "scoreFloat"; player: 1 | 2; idx: number; amount: number }
  | { type: "toast";       message: string }
  | { type: "pwrToast";    message: string; player: 1 | 2 } // Task 1: Inline pwr toast
  | { type: "rareStart";   color: string; cssColor: string }
  | { type: "bossStart";   bossType: BossEventType }
  | { type: "bombSpawn";   player: 1 | 2; idx: number; expiresAt: number }
  | { type: "bombDefused"; player: 1 | 2 }
  | { type: "bombExplode"; player: 1 | 2 }
  | { type: "cellAnim";    player: 1 | 2; idx: number; anim: "pop" | "shake" }
  | { type: "gameOver";    winner: Winner }
  | { type: "phaseChange"; phase: "playing" | "paused" | "gameover" | "humanlimit" }
  | { type: "dustConsumed"; amount: number }
  | { type: "botTap"; player: 1 | 2; idx: number; dustCost: number }
  | { type: "cellShuffle"; player: 1 | 2; fromIdx: number; toIdx: number }
  | { type: "qualityDowngrade"; reason: "fps-drop"; avgFps: number }
  | { type: "qualityUpgrade"; avgFps: number };
