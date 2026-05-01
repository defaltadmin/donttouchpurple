import { DIFFICULTY, GAME, LS_KEYS } from "../config/difficulty";
import { STAGES, EVOLVE_PATTERNS, RARE_COLORS } from "../config/gridPatterns";
import { POWERUP_TABLE } from "../config/powerupWeights";
import { computeMs, makeGameSeed, getSpinConfig, mulberry32 } from "./DifficultyScaler";
import type {
  ActiveCell, CellType, CellShape, GameConfig, GameEvent,
  GameMode, GameSnapshot, NumPlayers, PlayerState, RareColorMode, Winner,
} from "./types";

// ─── Safe cell palette ────────────────────────────────────────────
const SAFE: CellType[] = [
  "white","blue","red","orange","yellow",
  "green","cyan","lime","teal","pink","rose","magenta",
];

const TEMP_CELLS: CellType[] = new Array(25).fill("inactive");

// ─── Pure helpers ─────────────────────────────────────────────────
function randCell(rng: () => number, tick = 0, isClassic = false): CellType {
  const purpleChance = isClassic
    ? Math.min(0.42, 0.22 + Math.floor(tick / 20) * 0.02)
    : 0.22;
  if (rng() < purpleChance) return "purple";
  return SAFE[Math.floor(rng() * SAFE.length)];
}

function pickCellShape(tick: number): CellShape {
  const cycle = Math.floor(tick / 6) % 8;
  if (cycle === 0) return "square";
  if (cycle === 1) return "triangle";
  if (cycle === 2) return "circle";
  if (cycle === 3) return "roundedTriangle";
  if (cycle === 4) return "mixed";
  if (cycle === 5) return "triangle";
  if (cycle === 6) return "square";
  return "mixed";
}

function activeToCellsP(
  active: ActiveCell[],
  pattern: { cols: number; rows: number; mask: number[] | null }
): CellType[] {
  for (let i = 0; i < 25; i++) TEMP_CELLS[i] = "inactive";
  const { cols, rows, mask } = pattern;
  const gridTotal = cols * rows;
  if (mask) {
    const maskSet = new Set(mask);
    for (let i = 0; i < gridTotal; i++) {
      if (!maskSet.has(i)) TEMP_CELLS[i] = "void" as CellType;
    }
  }
  active.forEach(c => { if (!c.clicked) TEMP_CELLS[c.idx] = c.type; });
  return TEMP_CELLS.slice();
}

function spawnActive(
  rng: () => number,
  stage: number,
  health: number,
  patternOverride?: { cols: number; rows: number; mask: number[] | null },
  isEvolve?: boolean,
  rareColor?: string,
  tick = 0,
  godMode = false
): ActiveCell[] {
  const pat = patternOverride ?? STAGES[Math.min(stage, STAGES.length - 1)];
  const { mask } = pat;
  const total = pat.cols * pat.rows;
  const validSlots = mask ? [...mask] : Array.from({ length: total }, (_, i) => i);
  const validCount = validSlots.length;

  const minCount = Math.min(2 + Math.floor(stage * 0.4), validCount - 1);
  const maxCount = Math.min(2 + Math.floor(stage * 0.6), Math.min(validCount - 1, 5));
  const count = Math.max(1, minCount + Math.floor(rng() * (maxCount - minCount + 1)));

  const pool = [...validSlots];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const idxs = pool.slice(0, count);

  let powerup: CellType | null = null;
    const powerupEligible = isEvolve ? stage >= 2 : true;
    const totalWeight = (() => {
      if (!powerupEligible) return 0;
      let table = POWERUP_TABLE.map(p =>
        p.type === "medpack" && health < GAME.MAX_HEARTS ? { ...p, weight: p.weight + 10 } : p
      );
      if (godMode) table = table.filter(p => p.type !== "medpack");
      return table.reduce((s, p) => s + p.weight, 0);
    })();
    const effectiveTotal = powerupEligible ? totalWeight : totalWeight * 0.4;
    if (powerupEligible) {
      let table = POWERUP_TABLE.map(p =>
        p.type === "medpack" && health < GAME.MAX_HEARTS ? { ...p, weight: p.weight + 10 } : p
      );
      if (godMode) table = table.filter(p => p.type !== "medpack");
      const roll = rng();
      if (roll < effectiveTotal / 100) {
        let cursor = 0;
        for (const p of table) {
          cursor += p.weight;
          if (roll < cursor / totalWeight) { powerup = p.type as CellType; break; }
        }
      }
    }

    let evolveSpecial: CellType | null = null;
    if (isEvolve && stage >= 3) {
      const r = rng();
      if (r < 0.10) evolveSpecial = "ice";
      else if (r < 0.17) evolveSpecial = "hold";
    }

    return idxs.map((idx, i) => {
    if (i === 0 && powerup) return { idx, clicked: false, type: powerup } as any;
    if (i === 0 && evolveSpecial === "ice") {
      return { idx, clicked: false, type: "ice", iceCount: 2 + Math.floor(rng() * 3) };
    }
    if (i === 0 && evolveSpecial === "hold") {
      return { idx, clicked: false, type: "hold", holdRequired: 700 + rng() * 500 };
    }
    const baseType = randCell(rng, tick, !isEvolve);
    if (rareColor && baseType === "purple") return { idx, clicked: false, type: rareColor as any };
    return { idx, clicked: false, type: baseType } as any;
  });
}

function pickPattern(rng: () => number, stage: number, lastIdx: number, score: number): number {
  const valid = EVOLVE_PATTERNS
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.minStage <= stage)
    .filter(({ p }) => {
      if (score < 20)  return p.cols <= 2 && p.rows <= 2;
      if (score < 50)  return p.cols <= 3 && p.rows <= 3;
      if (score < 120) return p.cols <= 3 && p.rows <= 4;
      if (score < 250) return p.cols <= 4 && p.rows <= 4;
      return true;
    });
  if (valid.length <= 1) return valid[0]?.i ?? 0;
  const filtered = valid.filter(({ i }) => i !== lastIdx);
  const pick = filtered[Math.floor(rng() * filtered.length)];
  return pick?.i ?? valid[0].i;
}

function makePS(bonusHearts: number, hasMult: boolean, stored: { freeze: number; shield: number; mult: number; heart: number }): PlayerState {
  return {
    cells: Array(25).fill("inactive"), active: [], score: 0, streak: 0,
    alive: true, anim: {}, health: GAME.MAX_HEARTS + bonusHearts,
    shield: false, shieldCount: 0, freezeEnd: 0,
    multiplierEnd: hasMult ? Date.now() + 24000 : 0,
    gridStage: 0, stageProgress: 0, patternIdx: 0,
    storedFreezeCharges: stored.freeze,
    storedShieldCharges: stored.shield,
  };
}

// ─── GameEngine class ─────────────────────────────────────────────
export class GameEngine {
  private rafId: number | null = null;
  private tickTimer: ReturnType<typeof setTimeout> | null = null;
  private tickCount  = 0;
  private evolveTick = 0;
  private iMult      = 1;
  private paused     = false;
  private phase: GameSnapshot["phase"] = "playing";
  private holdTimers = new Map<string, { timer: NodeJS.Timeout, cell: ActiveCell, player: 1 | 2 }>();
  private dirty      = true;

  private rng: () => number = () => Math.random();
  private p1!: PlayerState;
  private p2!: PlayerState;
  private cellShape: CellShape    = "square";
  private rareMode: RareColorMode = { active: false, color: "", cssColor: "", turnsLeft: 0 };
  private spinLevel  = 0;
  private gameSeed   = makeGameSeed();
  private tapBuffer: Record<1 | 2, { idx: number; ts: number } | null> = { 1: null, 2: null };
  private static readonly TAP_BUFFER_MS = GAME.TAP_BUFFER_MS;
  private devGodMode     = false;
  private devFreezeTime  = false;
  private devForcedPwr: "shield" | "freeze" | "heart" | null = null;
  private devRotationSpeed = 1;
  private botAssistActive: { 1: boolean; 2: boolean } = { 1: false, 2: false };

  private listeners: Set<(e: GameEvent) => void> = new Set();
  private botActive      = false;
  private botIntervalRef: ReturnType<typeof setInterval> | null = null;
  private dustSpentTotal = 0; // Track total dust spent on bot

  constructor(private config: GameConfig) {
    this.iMult = config.speedMult;
    this.devGodMode = config.godMode ?? false;
    // Don't call makePS here — start() will do it properly
    // This avoids redundant storage reads and potential confusion with bonusHearts/hasMult
  }

  start(forceSeed?: number): void {
    this.stop();
    this.tickCount  = 0;
    this.evolveTick = 0;
    this.iMult      = this.config.speedMult;
    this.devGodMode = this.config.godMode ?? false;
    this.paused     = false;
    this.phase      = "playing";
    this.cellShape  = "square";
    this.spinLevel  = 0;
    this.gameSeed   = forceSeed ?? makeGameSeed();
    this.rng        = mulberry32(this.gameSeed);
    this.rareMode   = { active: false, color: "", cssColor: "", turnsLeft: 0 };
    // Load stored once, compute deductions, call saveStoredPowerups once for mult deduction if hasMult, once for heart reset if bonusHearts
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    const bonusHearts = (this.config.mode === "evolve" && stored.heart > 0) ? stored.heart : 0;
    const hasMult = (this.config.mode === "evolve" && (stored.mult ?? 0) > 0);
    if (hasMult) this.config.storage?.saveStoredPowerups({ ...stored, mult: (stored.mult ?? 1) - 1 });
    if (bonusHearts > 0) this.config.storage?.saveStoredPowerups({ ...stored, heart: 0 });
    this.p1 = makePS(bonusHearts, hasMult, stored);
    this.p2 = makePS(bonusHearts, hasMult, stored);
    this.tapBuffer  = { 1: null, 2: null };
    this.dirty = true;
    this.emit({ type: "phaseChange", phase: "playing" });
    this.emitSnapshot();
    this.scheduleTick();
    this.startSnapshotRaf();
  }

  stop(): void {
    if (this.tickTimer !== null) {
      clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private startSnapshotRaf(): void {
    const loop = () => {
      if (this.rafId === null) return;
      if (this.dirty && this.phase !== "gameover") {
        this.dirty = false;
        this.emitSnapshot();
      }
      if (this.phase !== "gameover") {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private scheduleTick(): void {
    if (this.phase !== "playing") return;
    const now = Date.now();
    const frozen = this.p1.freezeEnd > now || (this.config.numPlayers === 2 && this.p2.freezeEnd > now);
    const tickForCalc = this.devFreezeTime ? 0 : this.tickCount;
    const ms = computeMs(tickForCalc, frozen ? 1.4 : 1) * this.iMult;
    this.tickTimer = setTimeout(() => {
      if (this.phase !== "playing") return;
      this.processTick();
      this.scheduleTick();
    }, ms);
  }

  pause(): void {
    if (this.phase !== "playing") return;
    this.paused = true;
    this.phase  = "paused";
    if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; }
    this.dirty = true;
    this.emit({ type: "phaseChange", phase: "paused" });
    this.emitSnapshot();
  }

  resume(): void {
    if (this.phase !== "paused") return;
    this.paused = false;
    this.phase  = "playing";
    this.scheduleTick();
    this.dirty = true;
    this.emit({ type: "phaseChange", phase: "playing" });
    this.emitSnapshot();
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
  }

  subscribe(fn: (e: GameEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(event: GameEvent): void {
    this.listeners.forEach(fn => fn(event));
  }

  private emitSnapshot(): void {
    this.dirty = false;
    this.emit({ type: "tick", snapshot: this.getSnapshot() });
  }

  private _currentTickMs(): number {
    const now = Date.now();
    const frozen = this.p1.freezeEnd > now || (this.config.numPlayers === 2 && this.p2.freezeEnd > now);
    const tickForCalc = this.devFreezeTime ? 0 : this.tickCount;
    return computeMs(tickForCalc, frozen ? 1.4 : 1) * this.iMult;
  }

  private processTick(): void {
    if (this.phase !== "playing") return;
    const mode = this.config.mode;
    this._flushTapBuffer(1);
    if (this.config.numPlayers === 2) this._flushTapBuffer(2);
    this.evolveTick += 1;
    if (mode === "evolve") this.cellShape = pickCellShape(this.evolveTick);

    if (mode === "evolve") {
      if (this.rareMode.active) {
        this.rareMode.turnsLeft -= 1;
        if (this.rareMode.turnsLeft <= 0) {
          this.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0 };
          this.emit({ type: "toast", message: "🟣 Back to Purple!" });
        }
      } else {
        const s1 = this.p1.score;
        if (s1 >= 50 && s1 % 50 < 4 && this.rng() < 0.35) {
          const pick = RARE_COLORS[Math.floor(this.rng() * RARE_COLORS.length)];
          this.rareMode = { active: true, color: pick.color, cssColor: pick.cssColor, turnsLeft: 5 + Math.floor(this.rng() * 4) };
          this.emit({ type: "rareStart", color: pick.color, cssColor: pick.cssColor });
          this.emit({ type: "toast", message: `⚠️ Don't Touch ${pick.color.toUpperCase()}!` });
        }
      }
    }

    const players: Array<{ ref: PlayerState; pi: 0 | 1 }> = [{ ref: this.p1, pi: 0 }, { ref: this.p2, pi: 1 }];
    for (const { ref, pi } of players) {
      if (!ref.alive || (pi === 1 && this.config.numPlayers === 1)) continue;
      if ((ref as any).pendingStageUpdate) {
        (ref as any).pendingStageUpdate = false; ref.gridStage += 1; ref.stageProgress = 0;
        this.spinLevel += 1;
        this.emit({ type: "sound",   name: "levelup" });
        this.emit({ type: "levelUp", player: (pi + 1) as 1 | 2, stage: ref.gridStage });
      }
      const curStage = ref.gridStage;
      const patIdx   = ref.patternIdx;
      const pat = mode === "evolve" ? (EVOLVE_PATTERNS[patIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      if (!pat || pat.cols === 0) { console.error("[DTP-002]"); continue; }
      const validSlots = new Set(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i));
      const dangerColor = this.rareMode.active ? this.rareMode.color : "purple";
      const player = (pi + 1) as 1 | 2;

      ref.active.forEach(c => {
        if (!validSlots.has(c.idx) || c.clicked) return;
        const isPwr = ["medpack","shield","freeze","multiplier","ice","hold"].includes(c.type);
        // Damage for missing a SAFE cell (not the danger color, not a powerup/special)
        if (c.type !== dangerColor && !isPwr) {
          const dmg = mode === "evolve" ? 0.5 : 1;
          if (!this.devGodMode) {
            if (ref.shieldCount > 0) { ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
            else {
              ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
              this.emit({ type: "damage", player }); this.emit({ type: "shake", player });
              if (ref.health <= 0) {
                ref.alive = false;
                const other = this.config.numPlayers === 2 ? (pi === 0 ? this.p2.alive : this.p1.alive) : false;
                this.triggerGameOver(this.config.numPlayers === 1 ? null : other ? (pi === 0 ? "p2" : "p1") : "tie");
              }
            }
          }
          if (ref.streak >= 5) this.emit({ type: "toast", message: `💔 ${ref.streak} streak lost!` });
          ref.streak = 0;
        }
        // Danger color cells that weren't tapped just disappear — no penalty
      });
      if (!ref.alive) continue;
      if (ref.active.some(c => !c.clicked && (c.type === "hold" || c.type === "ice"))) { ref.cells = activeToCellsP(ref.active, pat); continue; }
      const nextPatIdx = mode === "evolve" ? pickPattern(this.rng, curStage, patIdx, ref.score) : 0;
      ref.patternIdx = nextPatIdx;
      const nextPat = mode === "evolve" ? (EVOLVE_PATTERNS[nextPatIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      const rareColor = this.rareMode.active ? this.rareMode.color : undefined;
      const spawnStage = mode === "evolve" ? curStage : Math.min(Math.floor(this.tickCount / 12), 7);
      const newActive = spawnActive(this.rng, spawnStage, ref.health, nextPat, mode === "evolve", rareColor, this.tickCount, this.devGodMode);
      if (this.devForcedPwr && newActive.length > 0) {
        newActive[0] = { ...newActive[0], type: (this.devForcedPwr === "heart" ? "medpack" : this.devForcedPwr) as any };
        if (pi === (this.config.numPlayers === 1 ? 0 : 1)) this.devForcedPwr = null;
      }
      ref.active = newActive;
      ref.cells  = activeToCellsP(newActive, nextPat);
      // Trigger powerup drop animation on newly spawned powerups
      for (const c of newActive) {
        if (["medpack", "shield", "freeze", "multiplier"].includes(c.type)) {
          ref.anim[c.idx] = "pwr-drop";
          setTimeout(() => { if (ref.anim[c.idx] === "pwr-drop") delete ref.anim[c.idx]; }, 600);
        }
      }
    }

    // ─── Bot Assist ────────────────────────────────────────────
    const botCfg = this.config.botAssist;
    if (botCfg) {
      const botPlayers: Array<{ ref: PlayerState; player: 1 | 2 }> = [
        { ref: this.p1, player: 1 },
        ...(this.config.numPlayers === 2 ? [{ ref: this.p2, player: 2 as const }] : []),
      ];
      for (const { ref, player } of botPlayers) {
        if (!this.botAssistActive[player] || !ref.alive) continue;
        const dust = botCfg.getDust();
        if (dust < 30) { this.botAssistActive[player] = false; this.emit({ type: "toast", message: "🤖 Bot off — low dust!" }); continue; }
        const accuracy = botCfg.getAccuracy();
        const dangerColor = this.rareMode.active ? this.rareMode.color : "purple";
        const missedCells = ref.active.filter(c =>
          !c.clicked &&
          c.type !== dangerColor &&
          (c.type as string) !== "void" &&
          c.type !== "hold" &&
          c.type !== "ice"
        );
        for (const cell of missedCells) {
          if (Math.random() > accuracy) continue; // accuracy miss
          const costPerTap = 3;
          const currentDust = botCfg.getDust();
          if (currentDust < costPerTap) break;
          botCfg.spendDust(costPerTap);
          this.emit({ type: "botTap", player, idx: cell.idx, dustCost: costPerTap });
          // Simulate the tap directly
          cell.clicked = true;
          const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
          ref.score += mult;
          ref.streak += 1;
          ref.stageProgress += 1;
          this.checkStageProgress(player);
        }
        if (missedCells.length > 0) {
          const pat = this.config.mode === "evolve"
            ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0])
            : { cols: 3, rows: 3, mask: null as number[] | null };
          ref.cells = activeToCellsP(ref.active, pat);
        }
      }
    }

    this.tickCount += 1;
    if (this.phase === "playing" && this.tickCount >= GAME.HUMAN_LIMIT_TICK) { this.phase = "humanlimit"; this.emit({ type: "phaseChange", phase: "humanlimit" }); }
    if (this.tickCount > GAME.SURVIVAL_BONUS_START_TICK && this.tickCount % 20 === 0) {
      const bonus = this.tickCount > 200 ? 5 : this.tickCount > 120 ? 3 : 2;
      if (this.p1.alive) this.p1.score += bonus;
      if (this.config.numPlayers === 2 && this.p2.alive) this.p2.score += bonus;
      this.emit({ type: "toast", message: `🔥 Survival +${bonus}!` });
    }
    this.dirty = true;
    this.emit({ type: "sound", name: "tick" });
  }

  handleTap(player: 1 | 2, idx: number): void {
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref || !ref.alive) return;
    this.tapBuffer[player] = { idx, ts: Date.now() };
    this._flushTapBuffer(player);
  }

  private _flushTapBuffer(player: 1 | 2): void {
    const entry = this.tapBuffer[player];
    if (!entry || Date.now() - entry.ts > GameEngine.TAP_BUFFER_MS) { this.tapBuffer[player] = null; return; }
    const ref = player === 1 ? this.p1 : this.p2;
    const cell = ref.active.find(c => c.idx === entry.idx);
    if (!cell || cell.clicked) return;
    this.tapBuffer[player] = null;
    this._processTap(player, entry.idx);
  }

  private _processTap(player: 1 | 2, idx: number): void {
    const ref = player === 1 ? this.p1 : this.p2;
    const cell = ref.active.find(c => c.idx === idx);
    if (!cell || cell.clicked) return;
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    if (!(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)).includes(idx)) return;
    const danger = this.rareMode.active ? this.rareMode.color : "purple";

    if (cell.type === "ice") {
      const rem = (cell.iceCount ?? 1) - 1;
      this.triggerCellAnim(player, idx, rem <= 0 ? "pop" : "shake");
      this.emit({ type: "sound", name: rem <= 0 ? "ok" : "tick" });
      if (rem <= 0) {
        cell.clicked = true;
        const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
        ref.score += mult; ref.streak += 1; ref.stageProgress += 1;
        this.checkStageProgress(player);
        if (ref.active.every(c => c.clicked || (c.type as any) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.dirty = true; this.emitSnapshot(); return; }
      } else cell.iceCount = rem;
      ref.cells = activeToCellsP(ref.active, pat);
      this.dirty = true;
      this.emitSnapshot();
      return;
    }
    if (cell.type === "hold") return;
    const dmg = this.config.mode === "evolve" ? 0.5 : 1;
    if (cell.type === danger) {
      cell.clicked = true;
      if (!this.devGodMode) {
        if (ref.shieldCount > 0) { ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; this.emit({ type: "sound", name: "ok" }); this.triggerCellAnim(player, idx, "pop"); }
        else {
          if (ref.streak >= 5) this.emit({ type: "toast", message: `💔 ${ref.streak} streak lost!` });
          ref.health = Math.max(0, ref.health - dmg); ref.shield = false; ref.streak = 0;
          this.emit({ type: "sound", name: "bad" }); this.triggerCellAnim(player, idx, "shake");
          this.emit({ type: "damage", player }); this.emit({ type: "shake", player });
          if (ref.health <= 0) { ref.alive = false; this.triggerGameOver(this.config.numPlayers === 1 ? null : (player === 1 ? "p2" : "p1")); }
        }
      } else { this.emit({ type: "sound", name: "ok" }); this.triggerCellAnim(player, idx, "pop"); }
    } else if (["medpack","shield","freeze","multiplier"].includes(cell.type)) {
      cell.clicked = true; this.emit({ type: "sound", name: "powerup" }); this.triggerCellAnim(player, idx, "pop");
      if (cell.type === "medpack") ref.health = Math.min(GAME.MAX_HEARTS, ref.health + 1);
      if (cell.type === "shield") { ref.shieldCount += 1; ref.shield = true; }
      if (cell.type === "freeze") ref.freezeEnd = Math.max(ref.freezeEnd, Date.now()) + 15000;
      if (cell.type === "multiplier") ref.multiplierEnd = Date.now() + 24000;
      if (cell.type === "shield") {
        this.emit({ type: "pwrToast", message: `🛡 Shield ×${ref.shieldCount}!`, player });
      } else if (cell.type === "medpack") {
        this.emit({ type: "toast", message: "♥ +1 Heart!" });
      } else if (cell.type === "multiplier") {
        this.emit({ type: "pwrToast", message: "⚡ multiplier ×2!", player });
      } else {
        this.emit({ type: "pwrToast", message: "❄ Freeze activated!", player });
      }
    } else {
      cell.clicked = true; this.emit({ type: "sound", name: "ok" }); this.triggerCellAnim(player, idx, "pop");
      const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
      ref.score += mult; ref.streak += 1; ref.stageProgress += 1;
      if ([5, 10, 25, 50].includes(ref.streak)) this.emit({ type: "toast", message: `🔥 ${ref.streak} Streak!` });
      if (ref.health === 1 && !this.devGodMode) this.emit({ type: "toast", message: "❤️ Last heart!" });
      this.checkStageProgress(player);
    }
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private checkStageProgress(player: 1 | 2): void {
    const ref = player === 1 ? this.p1 : this.p2;
    if (this.config.mode === "evolve" && ref.stageProgress >= GAME.STAGE_TAPS_NEEDED && ref.gridStage < STAGES.length - 1) (ref as any).pendingStageUpdate = true;
  }

  private triggerCellAnim(player: 1 | 2, idx: number, anim: "pop" | "shake"): void {
    const ref = player === 1 ? this.p1 : this.p2;
    ref.anim[idx] = anim;
    this.emit({ type: "cellAnim", player, idx, anim });
    setTimeout(() => { if (ref.anim[idx] === anim) delete ref.anim[idx]; }, GAME.CELL_ANIM_MS);
  }

  handleHoldStart(player: 1 | 2, idx: number): void {
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || cell.type !== "hold") return;
    (cell as any).holdStart = Date.now();
    const key = `${player}_${idx}`;
    if (this.holdTimers.has(key)) clearTimeout(this.holdTimers.get(key)!.timer);
    const timer = setTimeout(() => {
      const entry = this.holdTimers.get(key);
      if (!entry || entry.cell.clicked) return;
      (entry.cell as any).holdStart = undefined;
      this.dirty = true;
      this.triggerCellAnim(entry.player, entry.cell.idx, "shake");
      this.emitSnapshot();
      this.holdTimers.delete(key);
    }, GAME.HOLD_TIMEOUT_MS);
    this.holdTimers.set(key, { timer, cell, player });
    this.dirty = true;
    this.emitSnapshot();
  }

  handleHoldEnd(player: 1 | 2, idx: number): void {
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || cell.type !== "hold") return;
    const key = `${player}_${idx}`;
    const entry = this.holdTimers.get(key);
    if (entry) { clearTimeout(entry.timer); this.holdTimers.delete(key); }
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    const elapsed = Date.now() - ((cell as any).holdStart ?? Date.now());
    if (elapsed >= (cell as any).holdRequired) {
      cell.clicked = true; this.triggerCellAnim(player, idx, "pop");
      this.emit({ type: "sound", name: "powerup" });
      const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
      ref.score += mult * 2; ref.streak += 1; ref.stageProgress += 1;
      this.checkStageProgress(player);
      this.emit({ type: "toast", message: "💪 Hold! +2" });
      if (ref.active.every(c => c.clicked || (c.type as any) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.emitSnapshot(); return; }
    } else { (cell as any).holdStart = undefined; this.triggerCellAnim(player, idx, "shake"); }
    ref.cells = activeToCellsP(ref.active, pat);
    this.emitSnapshot();
  }

  activateStoredFreeze(player: 1 | 2): void {
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive || ref.storedFreezeCharges <= 0) return;
    ref.storedFreezeCharges -= 1;
    ref.freezeEnd = Math.max(ref.freezeEnd, Date.now()) + 15000;
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    this.config.storage?.saveStoredPowerups({ freeze: ref.storedFreezeCharges, shield: ref.storedShieldCharges, mult: stored.mult, heart: stored.heart });
    this.emit({ type: "toast", message: "❄ Freeze activated!" });
    this.emitSnapshot();
  }

  activateStoredShield(player: 1 | 2): void {
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive || ref.storedShieldCharges <= 0) return;
    ref.storedShieldCharges -= 1;
    ref.shieldCount += 1;
    ref.shield = true;
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    this.config.storage?.saveStoredPowerups({ freeze: ref.storedFreezeCharges, shield: ref.storedShieldCharges, mult: stored.mult, heart: stored.heart });
    this.emit({ type: "toast", message: `🛡 Shield ×${ref.shieldCount}!` });
    this.emitSnapshot();
  }

  devForceStage(stage: number): void {
    const validPatterns = EVOLVE_PATTERNS.map((p, i) => ({ p, i })).filter(({ p }) => p.minStage <= stage);
    const pick = validPatterns[Math.floor(this.rng() * validPatterns.length)];
    this.p1.gridStage = stage; this.p1.stageProgress = 0; this.p1.patternIdx = pick?.i ?? 0;
    this.p2.gridStage = stage; this.p2.stageProgress = 0; this.p2.patternIdx = pick?.i ?? 0;
    this.emitSnapshot();
  }

  devForcePattern(idx: number): void {
    this.p1.patternIdx = idx; this.p2.patternIdx = idx;
    const pat = EVOLVE_PATTERNS[idx] ?? EVOLVE_PATTERNS[0];
    const rareColor = this.rareMode.active ? this.rareMode.color : undefined;
    this.p1.active = spawnActive(this.rng, this.p1.gridStage, this.p1.health, pat, this.config.mode === "evolve", rareColor, this.tickCount, this.devGodMode);
    this.p1.cells = activeToCellsP(this.p1.active, pat);

    this.p2.active = spawnActive(this.rng, this.p2.gridStage, this.p2.health, pat, this.config.mode === "evolve", rareColor, this.tickCount, this.devGodMode);
    this.p2.cells  = activeToCellsP(this.p2.active, pat);
    this.emitSnapshot();
  }

  devForceRare(r: { color: string; cssColor: string } | null): void {
    if (!r) this.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0 };
    else { this.rareMode = { active: true, color: r.color, cssColor: r.cssColor, turnsLeft: 10 }; this.emit({ type: "rareStart", color: r.color, cssColor: r.cssColor }); }
    this.emitSnapshot();
  }

  devSetGodMode(v: boolean): void { this.devGodMode = v; }
  devSetFreezeTime(v: boolean): void { this.devFreezeTime = v; }
  devSetRotationSpeed(v: number): void { this.devRotationSpeed = Math.max(0.1, v); }
  devSpawnPowerup(type: "shield" | "freeze" | "heart"): void { this.devForcedPwr = type; }
  getDevRotationSpeed(): number { return this.devRotationSpeed; }

  getSnapshot(): GameSnapshot {
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[this.p1.patternIdx] ?? STAGES[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    const cloneActive = (active: ActiveCell[]): ActiveCell[] => active.map(c => ({ ...c }));
    return {
      tick:       this.tickCount,
      evolveTick: this.evolveTick,
      gameSeed:   this.gameSeed,
      p1:         { ...this.p1, active: cloneActive(this.p1.active), anim: { ...this.p1.anim } },
      p2:         { ...this.p2, active: cloneActive(this.p2.active), anim: { ...this.p2.anim } },
      cellShape:  this.cellShape,
      rareMode:   { ...this.rareMode },
      spinLevel:  this.spinLevel,
      paused:     this.paused,
      phase:      this.phase,
      grid: { cols: pat.cols, rows: pat.rows, mask: pat.mask ? [...pat.mask] : null },
      spinCfg: (this.config.mode === "evolve" && this.spinLevel >= 3) ? ((): typeof cfg => { const cfg = getSpinConfig(this.spinLevel, this.gameSeed); return { ...cfg, duration: cfg.duration * this.devRotationSpeed }; })() : null,
      devRotationSpeed: this.devRotationSpeed,
    };
  }

  getSpinConfig(level: number): { duration: number; direction: 1 | -1 } { return getSpinConfig(level, this.gameSeed); }

  private triggerGameOver(winner: Winner): void {
    this.stop(); this.phase = "gameover";
    const cur = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    this.config.storage?.saveStoredPowerups({
      freeze: Math.max(0, this.p1.storedFreezeCharges ?? 0),
      shield: Math.max(0, this.p1.storedShieldCharges ?? 0),
      mult: cur.mult,
      heart: cur.heart,
    });
    this.emit({ type: "phaseChange", phase: "gameover" });
    this.emit({ type: "gameOver",    winner });
  }

  startBot(): void {
    if (this.botActive || this.config.mode !== "evolve") return;
    this.botActive = true;
    this.dustSpentTotal = 0;
    this.botIntervalRef = setInterval(() => {
      if (!this.botActive || this.phase !== "playing") return;
      // Calculate reaction delay: 200ms - (dustSpentTotal * 0.5ms), floor at 80ms
      const delay = Math.max(80, 200 - this.dustSpentTotal * 0.5);
      const active = this.p1.active;
      active.forEach(cell => {
        if (cell.clicked || cell.type === "purple" || cell.type === "ice" || cell.type === "hold") return;
        // Use seeded RNG for deterministic error rate
        const errorRate = Math.min(0.18, this.p1.gridStage * 0.02);
        if (this.rng() < errorRate) return;
        setTimeout(() => {
          if (this.botActive && this.phase === "playing") {
            this.handleTap(1, cell.idx);
          }
        }, delay);
      });
      this.dustSpentTotal += 10;
      this.emit({ type: "dustConsumed", amount: 10 });
    }, 1000);
  }

  stopBot(): void {
    this.botActive = false;
    if (this.botIntervalRef) {
      clearInterval(this.botIntervalRef);
      this.botIntervalRef = null;
    }
  }

  isBotActive(): boolean {
    return this.botActive;
  }

  setBotAssist(player: 1 | 2, enabled: boolean): void {
    this.botAssistActive[player] = enabled;
  }

  getBotAssistActive(): { 1: boolean; 2: boolean } {
    return { ...this.botAssistActive };
  }
}
