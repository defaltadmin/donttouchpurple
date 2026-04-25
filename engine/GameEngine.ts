import { DIFFICULTY, GAME, LS_KEYS } from "../config/difficulty";
import { STAGES, EVOLVE_PATTERNS, RARE_COLORS } from "../config/gridPatterns";
import { POWERUP_TABLE } from "../config/powerupWeights";
import { computeMs, makeGameSeed, getSpinConfig } from "./DifficultyScaler";
import type {
  ActiveCell, CellType, CellShape, GameConfig, GameEvent,
  GameMode, GameSnapshot, NumPlayers, PlayerState, RareColorMode, Winner,
} from "./types";

// ─── Safe cell palette ────────────────────────────────────────────
const SAFE: CellType[] = [
  "white","blue","red","orange","yellow",
  "green","cyan","lime","teal","pink","rose","magenta",
];

// ─── Pure helpers ─────────────────────────────────────────────────
function randCell(tick = 0, isClassic = false): CellType {
  const purpleChance = isClassic
    ? Math.min(0.42, 0.22 + Math.floor(tick / 20) * 0.02)
    : 0.22;
  if (Math.random() < purpleChance) return "purple";
  return SAFE[Math.floor(Math.random() * SAFE.length)];
}

function pickCellShape(tick: number): CellShape {
  const cycle = Math.floor(tick / 8) % 5;
  if (cycle === 0) return "square";
  if (cycle === 1) return "circle";
  if (cycle === 2) return "square";
  if (cycle === 3) return "triangle";
  return "mixed";
}

function activeToCellsP(
  active: ActiveCell[],
  pattern: { cols: number; rows: number; mask: number[] | null }
): CellType[] {
  const { cols, rows, mask } = pattern;
  const gridTotal = cols * rows;
  const cells: CellType[] = Array(25).fill("inactive");
  if (mask) {
    const maskSet = new Set(mask);
    for (let i = 0; i < gridTotal; i++) {
      if (!maskSet.has(i)) cells[i] = "void" as CellType;
    }
  }
  active.forEach(c => { if (!c.clicked) cells[c.idx] = c.type; });
  return cells;
}

function spawnActive(
  stage: number,
  health: number,
  patternOverride?: { cols: number; rows: number; mask: number[] | null },
  isEvolve?: boolean,
  rareColor?: string,
  tick = 0
): ActiveCell[] {
  const pat = patternOverride ?? STAGES[Math.min(stage, STAGES.length - 1)];
  const { mask } = pat;
  const total = pat.cols * pat.rows;
  const validSlots = mask ? [...mask] : Array.from({ length: total }, (_, i) => i);
  const validCount = validSlots.length;

  const minCount = Math.min(2 + Math.floor(stage * 0.4), validCount - 1);
  const maxCount = Math.min(2 + Math.floor(stage * 0.6), Math.min(validCount - 1, 5));
  const count = Math.max(1, minCount + Math.floor(Math.random() * (maxCount - minCount + 1)));

  const pool = [...validSlots];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const idxs = pool.slice(0, count);

  let powerup: CellType | null = null;
  const powerupEligible = isEvolve ? stage >= 2 : true;
  if (powerupEligible) {
    const table = POWERUP_TABLE.map(p =>
      p.type === "medpack" && health < GAME.MAX_HEARTS ? { ...p, weight: p.weight + 10 } : p
    );
    const totalWeight = table.reduce((s, p) => s + p.weight, 0);
    const effectiveTotal = isEvolve ? totalWeight : totalWeight * 0.4;
    const roll = Math.random() * 100;
    if (roll < effectiveTotal) {
      let cursor = 0;
      for (const p of table) {
        cursor += p.weight;
        if (roll < cursor) { powerup = p.type as CellType; break; }
      }
    }
  }

  let evolveSpecial: CellType | null = null;
  if (isEvolve && stage >= 3) {
    const r = Math.random();
    if (r < 0.10) evolveSpecial = "ice";
    else if (r < 0.17) evolveSpecial = "hold";
  }

  return idxs.map((idx, i) => {
    if (i === 0 && powerup) return { idx, clicked: false, type: powerup };
    if (i === 0 && evolveSpecial === "ice") {
      return { idx, clicked: false, type: "ice" as CellType, iceCount: 2 + Math.floor(Math.random() * 3) };
    }
    if (i === 0 && evolveSpecial === "hold") {
      return { idx, clicked: false, type: "hold" as CellType, holdRequired: 700 + Math.random() * 500 };
    }
    const baseType = randCell(tick, !isEvolve);
    if (rareColor && baseType === "purple") return { idx, clicked: false, type: rareColor as CellType };
    return { idx, clicked: false, type: baseType };
  });
}

function pickPattern(stage: number, lastIdx: number, score: number): number {
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
  const pick = filtered[Math.floor(Math.random() * filtered.length)];
  return pick?.i ?? valid[0].i;
}

function makePS(config: GameConfig): PlayerState {
  const stored = config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
  const bonusHearts = (config.mode === "evolve" && stored.heart > 0) ? stored.heart : 0;
  const hasMult = (config.mode === "evolve" && (stored.mult ?? 0) > 0);
  if (hasMult) config.storage?.saveStoredPowerups({ ...stored, mult: (stored.mult ?? 1) - 1 });
  if (bonusHearts > 0) config.storage?.saveStoredPowerups({ ...stored, heart: 0 });
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
  // Loop
  private tickTimer: ReturnType<typeof setTimeout> | null = null;
  private tickCount  = 0;
  private evolveTick = 0;
  private iMult      = 1;          // speed multiplier (equiv. iMultRef)
  private paused     = false;
  private phase: GameSnapshot["phase"] = "playing";

  // Players
  private p1: PlayerState;
  private p2: PlayerState;

  // Evolve state
  private cellShape: CellShape    = "square";
  private rareMode: RareColorMode = { active: false, color: "", cssColor: "", turnsLeft: 0 };
  private spinLevel  = 0;
  private gameSeed   = makeGameSeed();

  // Dev runtime overrides
  private devGodMode     = false;
  private devFreezeTime  = false;
  private devForcedPwr: "shield" | "freeze" | "heart" | null = null;
  private devRotationSpeed = 1;

  // Event system
  private listeners: Set<(e: GameEvent) => void> = new Set();

  constructor(private config: GameConfig) {
    this.iMult = config.speedMult;
    this.p1 = makePS(config);
    this.p2 = makePS(config);
  }

  // ── Lifecycle ────────────────────────────────────────────────────

  start(): void {
    // Reset all state
    this.tickCount  = 0;
    this.evolveTick = 0;
    this.iMult      = this.config.speedMult;
    this.paused     = false;
    this.phase      = "playing";
    this.cellShape  = "square";
    this.spinLevel  = 0;
    this.gameSeed   = makeGameSeed();
    this.rareMode   = { active: false, color: "", cssColor: "", turnsLeft: 0 };
    this.p1 = makePS(this.config);
    this.p2 = makePS(this.config);

    this.emit({ type: "phaseChange", phase: "playing" });
    this.emitSnapshot();
    this.scheduleTick();
  }

  stop(): void {
    if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; }
  }

  pause(): void {
    if (this.phase !== "playing") return;
    this.stop();
    this.paused = true;
    this.phase  = "paused";
    this.emit({ type: "phaseChange", phase: "paused" });
    this.emitSnapshot();
  }

  resume(): void {
    if (this.phase !== "paused") return;
    this.paused = false;
    this.phase  = "playing";
    this.emit({ type: "phaseChange", phase: "playing" });
    this.scheduleTick();
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
  }

  // ── Event system ─────────────────────────────────────────────────

  subscribe(fn: (e: GameEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(event: GameEvent): void {
    this.listeners.forEach(fn => fn(event));
  }

  private emitSnapshot(): void {
    this.emit({
      type: "tick",
      snapshot: this.getSnapshot(),
    });
  }

  // ── Tick loop ────────────────────────────────────────────────────

  private scheduleTick(): void {
    if (this.paused || this.phase !== "playing") return;
    const now = Date.now();
    const frozen = this.p1.freezeEnd > now ||
      (this.config.numPlayers === 2 && this.p2.freezeEnd > now);
    // devFreezeTime: pass a huge iMult override to lock difficulty at tick 0 baseline
    const tickForCalc = this.devFreezeTime ? 0 : this.tickCount;
    const ms = computeMs(tickForCalc, frozen ? 1.4 : 1) * this.iMult;
    this.tickTimer = setTimeout(() => {
      this.processTick();
      this.scheduleTick();
    }, ms);
  }

  private processTick(): void {
    if (this.phase !== "playing") return;
    const now  = Date.now();
    const mode = this.config.mode;

    this.evolveTick += 1;
    const eTick = this.evolveTick;

    // ── Cell shape (evolve only) ──
    if (mode === "evolve") {
      this.cellShape = pickCellShape(eTick);
    }

    // ── Rare color mode (evolve only) ──
    if (mode === "evolve") {
      if (this.rareMode.active) {
        this.rareMode.turnsLeft -= 1;
        if (this.rareMode.turnsLeft <= 0) {
          this.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0 };
          this.emit({ type: "toast", message: "🟣 Back to Purple!" });
        }
      } else {
        const s1 = this.p1.score;
        if (s1 >= 50 && s1 % 50 < 4 && Math.random() < 0.35) {
          const pick = RARE_COLORS[Math.floor(Math.random() * RARE_COLORS.length)];
          this.rareMode = {
            active: true, color: pick.color, cssColor: pick.cssColor,
            turnsLeft: 5 + Math.floor(Math.random() * 4),
          };
          this.emit({ type: "rareStart", color: pick.color, cssColor: pick.cssColor });
          this.emit({ type: "toast", message: `⚠️ Don't Touch ${pick.color.toUpperCase()}!` });
        }
      }
    }

    // ── Per-player tick ──
    const players: Array<{ ref: PlayerState; pi: 0 | 1 }> = [
      { ref: this.p1, pi: 0 },
      { ref: this.p2, pi: 1 },
    ];

    for (const { ref, pi } of players) {
      if (!ref.alive || (pi === 1 && this.config.numPlayers === 1)) continue;

      const curStage = ref.gridStage;
      const patIdx   = ref.patternIdx;
      const pat = mode === "evolve"
        ? (EVOLVE_PATTERNS[patIdx] ?? EVOLVE_PATTERNS[0])
        : { cols: 3, rows: 3, mask: null as number[] | null };

      if (!pat || pat.cols === 0) { console.error("[DTP-002]"); continue; }

      const validSlots = new Set(
        pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)
      );
      const dangerColor = this.rareMode.active ? this.rareMode.color : "purple";
      const player = (pi + 1) as 1 | 2;

      // Damage for missed safe cells
      ref.active.forEach(c => {
        if (!validSlots.has(c.idx) || c.clicked) return;
        const isPwr = ["medpack","shield","freeze","multiplier","ice","hold"].includes(c.type);
        const isBeingHeld = (c as any)._holding === true;
        if (c.type !== dangerColor && c.type !== "purple" && !isPwr && !isBeingHeld) {
          const dmg = mode === "evolve" ? 0.5 : 1;
          if (this.devGodMode) {
            // god mode: no damage
          } else if (ref.shieldCount > 0) {
            ref.shieldCount -= 1;
            ref.shield = ref.shieldCount > 0;
          } else {
            ref.health = Math.max(0, ref.health - dmg);
            ref.shield = false;
            this.emit({ type: "damage", player });
            this.emit({ type: "shake",  player });
            if (ref.health <= 0) {
              ref.alive = false;
              const other = this.config.numPlayers === 2
                ? (pi === 0 ? this.p2.alive : this.p1.alive)
                : false;
              this.triggerGameOver(
                this.config.numPlayers === 1 ? null : other ? (pi === 0 ? "p2" : "p1") : "tie"
              );
            }
          }
          ref.streak = 0;
        }
      });

      if (!ref.alive) continue;

      // Don't advance grid if hold/ice unfinished
      const hasUnfinishedSpecial = ref.active.some(
        c => !c.clicked && (c.type === "hold" || c.type === "ice")
      );
      if (hasUnfinishedSpecial) {
        ref.cells = activeToCellsP(ref.active, pat);
        continue;
      }

      // Spawn new grid
      const nextPatIdx = mode === "evolve"
        ? pickPattern(curStage, patIdx, ref.score)
        : 0;
      ref.patternIdx = nextPatIdx;
      const nextPat = mode === "evolve"
        ? (EVOLVE_PATTERNS[nextPatIdx] ?? EVOLVE_PATTERNS[0])
        : { cols: 3, rows: 3, mask: null as number[] | null };

      const rareColor = this.rareMode.active ? this.rareMode.color : undefined;
      const spawnStage = mode === "evolve"
        ? curStage
        : Math.min(Math.floor(this.tickCount / 12), 7);

      const newActive = spawnActive(spawnStage, ref.health, nextPat, mode === "evolve", rareColor, this.tickCount);
      ref.active = newActive;
      ref.cells  = activeToCellsP(newActive, nextPat);
      if (newActive.length === 0) console.warn("[DTP-010]");
    }

    this.tickCount += 1;

    // Survival bonus
    if (this.tickCount > 60 && this.tickCount % 20 === 0) {
      if (this.p1.alive) this.p1.score += 2;
      if (this.config.numPlayers === 2 && this.p2.alive) this.p2.score += 2;
      this.emit({ type: "toast", message: "🔥 Survival +2!" });
    }

    this.emit({ type: "sound", name: "tick" });
    this.emitSnapshot();
  }

  // ── Input handling ────────────────────────────────────────────────

  handleTap(player: 1 | 2, idx: number): void {
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref || !ref.alive) { console.warn("[DTP-004]"); return; }

    const cell = ref.active.find(c => c.idx === idx);
    if (!cell || cell.clicked) return;

    const mode = this.config.mode;
    const isEvolve = mode === "evolve";
    const patIdx = ref.patternIdx;
    const pat = isEvolve
      ? (EVOLVE_PATTERNS[patIdx] ?? EVOLVE_PATTERNS[0])
      : { cols: 3, rows: 3, mask: null as number[] | null };
    const validSlots = pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i);
    if (!validSlots.includes(idx)) return;

    const dangerColor = this.rareMode.active ? this.rareMode.color : "purple";

    // ── Ice block ──
    if (cell.type === "ice") {
      const remaining = (cell.iceCount ?? 1) - 1;
      this.emit({ type: "cellAnim", player, idx, anim: remaining <= 0 ? "pop" : "shake" });
      this.emit({ type: "sound",    name: remaining <= 0 ? "ok" : "tick" });
      if (remaining <= 0) {
        cell.clicked = true;
        const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
        ref.score += mult; ref.streak += 1; ref.stageProgress += 1;
        // Fast-advance if grid cleared
        const allDone = ref.active.every(c => c.clicked || c.type === "void");
        if (allDone) {
          ref.cells = activeToCellsP(ref.active, pat);
          this.emitSnapshot();
          this.stop();
          this.tickTimer = setTimeout(() => {
            this.processTick();
            this.scheduleTick();
          }, 180);
          return;
        }
      } else {
        cell.iceCount = remaining;
      }
      ref.cells = activeToCellsP(ref.active, pat);
      this.emitSnapshot();
      return;
    }

    // ── Hold block (tap ignored — needs hold) ──
    if (cell.type === "hold") return;

    const dmg = isEvolve ? 0.5 : 1;

    // ── Danger color ──
    if (cell.type === dangerColor || (cell.type === "purple" && dangerColor !== "purple")) {
      cell.clicked = true;
      if (ref.shieldCount > 0) {
        ref.shieldCount -= 1;
        ref.shield = ref.shieldCount > 0;
        this.emit({ type: "sound",    name: "ok" });
        this.emit({ type: "cellAnim", player, idx, anim: "pop" });
      } else {
        ref.health = Math.max(0, ref.health - dmg);
        ref.shield = false;
        ref.streak = 0;
        this.emit({ type: "sound",  name: "bad" });
        this.emit({ type: "cellAnim", player, idx, anim: "shake" });
        this.emit({ type: "damage", player });
        this.emit({ type: "shake",  player });
        if (ref.health <= 0) {
          ref.alive = false;
          const other = this.config.numPlayers === 2
            ? (player === 1 ? this.p2.alive : this.p1.alive)
            : false;
          this.triggerGameOver(
            this.config.numPlayers === 1 ? null : other ? (player === 1 ? "p2" : "p1") : "tie"
          );
        }
      }

    // ── Powerup ──
    } else if (["medpack","shield","freeze","multiplier"].includes(cell.type)) {
      cell.clicked = true;
      this.emit({ type: "sound",    name: "powerup" });
      this.emit({ type: "cellAnim", player, idx, anim: "pop" });
      if (cell.type === "medpack")    ref.health += 1;
      if (cell.type === "shield")  { ref.shieldCount += 1; ref.shield = true; }
      if (cell.type === "freeze")    ref.freezeEnd = Math.max(ref.freezeEnd, Date.now()) + 15000;
      if (cell.type === "multiplier") ref.multiplierEnd = Date.now() + 24000;
      const toastMsg =
        cell.type === "medpack"    ? "♥ +1 Heart!" :
        cell.type === "shield"     ? `🛡 Shield ×${ref.shieldCount}!` :
        cell.type === "freeze"     ? "❄ Freeze activated!" :
                                     "⚡ 2× Points!";
      this.emit({ type: "toast", message: toastMsg });

    // ── Safe color ──
    } else {
      cell.clicked = true;
      this.emit({ type: "sound",    name: "ok" });
      this.emit({ type: "cellAnim", player, idx, anim: "pop" });
      const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
      ref.score += mult; ref.streak += 1; ref.stageProgress += 1;
      if (
        isEvolve &&
        ref.stageProgress >= GAME.STAGE_TAPS_NEEDED &&
        ref.gridStage < STAGES.length - 1
      ) {
        ref.gridStage += 1;
        ref.stageProgress = 0;
        this.spinLevel += 1;
        this.emit({ type: "sound",   name: "levelup" });
        this.emit({ type: "levelUp", player, stage: ref.gridStage });
      }
    }

    ref.cells = activeToCellsP(ref.active, pat);
    this.emitSnapshot();
  }

  handleHoldStart(player: 1 | 2, idx: number): void {
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell) return;
    cell.holdStart = Date.now();
    (cell as any)._holding = true;
    this.emitSnapshot();
  }

  handleHoldEnd(player: 1 | 2, idx: number): void {
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || !cell.holdStart || !cell.holdRequired) return;

    const mode = this.config.mode;
    const pat = mode === "evolve"
      ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0])
      : { cols: 3, rows: 3, mask: null as number[] | null };

    const elapsed = Date.now() - cell.holdStart;
    if (elapsed >= cell.holdRequired) {
      cell.clicked = true;
      (cell as any)._holding = false;
      this.emit({ type: "cellAnim", player, idx, anim: "pop" });
      this.emit({ type: "sound",    name: "powerup" });
      const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
      ref.score += mult * 2; ref.streak += 1; ref.stageProgress += 1;
      this.emit({ type: "toast", message: "💪 Hold! +2" });
      const allDone = ref.active.every(c => c.clicked || c.type === "void");
      if (allDone) {
        ref.cells = activeToCellsP(ref.active, pat);
        this.emitSnapshot();
        this.stop();
        this.tickTimer = setTimeout(() => {
          this.processTick();
          this.scheduleTick();
        }, 180);
        return;
      }
    } else {
      cell.holdStart = undefined;
      (cell as any)._holding = false;
      this.emit({ type: "cellAnim", player, idx, anim: "shake" });
    }

    ref.cells = activeToCellsP(ref.active, pat);
    this.emitSnapshot();
  }

  // ── Stored powerup activation (from HUD buttons) ──────────────────

  activateStoredFreeze(player: 1 | 2): void {
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive || ref.storedFreezeCharges <= 0) return;
    ref.storedFreezeCharges -= 1;
    ref.freezeEnd = Math.max(ref.freezeEnd, Date.now()) + 15000;
    this.config.storage?.saveStoredPowerups({
      freeze: ref.storedFreezeCharges,
      shield: ref.storedShieldCharges,
      mult: 0, // values are synced from PS
      heart: 0
    });
    this.emit({ type: "toast", message: "❄ Freeze activated!" });
    this.emitSnapshot();
  }

  activateStoredShield(player: 1 | 2): void {
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive || ref.storedShieldCharges <= 0) return;
    ref.storedShieldCharges -= 1;
    ref.shieldCount += 1;
    ref.shield = true;
    this.config.storage?.saveStoredPowerups({
      freeze: ref.storedFreezeCharges,
      shield: ref.storedShieldCharges,
      mult: 0,
      heart: 0
    });
    this.emit({ type: "toast", message: `🛡 Shield ×${ref.shieldCount}!` });
    this.emitSnapshot();
  }

  // ── Dev helpers ───────────────────────────────────────────────────

  devForceStage(stage: number): void {
    this.p1.gridStage = stage; this.p1.stageProgress = 0;
    this.p2.gridStage = stage; this.p2.stageProgress = 0;
    this.emitSnapshot();
  }

  devForcePattern(idx: number): void {
    this.p1.patternIdx = idx;
    this.p2.patternIdx = idx;
    this.emitSnapshot();
  }

  devForceRare(r: { color: string; cssColor: string } | null): void {
    if (!r) {
      this.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0 };
    } else {
      this.rareMode = { active: true, color: r.color, cssColor: r.cssColor, turnsLeft: 10 };
      this.emit({ type: "rareStart", color: r.color, cssColor: r.cssColor });
    }
    this.emitSnapshot();
  }

  devSetGodMode(v: boolean): void { this.devGodMode = v; }
  devSetFreezeTime(v: boolean): void { this.devFreezeTime = v; }
  devSetRotationSpeed(v: number): void { this.devRotationSpeed = Math.max(0.1, v); }
  devSpawnPowerup(type: "shield" | "freeze" | "heart"): void { this.devForcedPwr = type; }
  getDevRotationSpeed(): number { return this.devRotationSpeed; }

  // ── Snapshot read (for React to poll if needed) ───────────────────

  getSnapshot(): GameSnapshot {
    const pat = this.config.mode === "evolve"
      ? (EVOLVE_PATTERNS[this.p1.patternIdx] ?? STAGES[0])
      : { cols: 3, rows: 3, mask: null as number[] | null };

    return {
      tick:       this.tickCount,
      evolveTick: this.evolveTick,
      gameSeed:   this.gameSeed,
      p1:         { ...this.p1 },
      p2:         { ...this.p2 },
      cellShape:  this.cellShape,
      rareMode:   { ...this.rareMode },
      spinLevel:  this.spinLevel,
      paused:     this.paused,
      phase:      this.phase,
      grid: {
        cols: pat.cols,
        rows: pat.rows,
        mask: pat.mask ? [...pat.mask] : null
      },
      spinCfg: (this.config.mode === "evolve" && this.spinLevel >= 3)
        ? ((): typeof cfg => { const cfg = getSpinConfig(this.spinLevel, this.gameSeed); return { ...cfg, duration: cfg.duration * this.devRotationSpeed }; })()
        : null,
      devRotationSpeed: this.devRotationSpeed,
    };
  }

  getSpinConfig(level: number): { duration: number; direction: 1 | -1 } {
    return getSpinConfig(level, this.gameSeed);
  }

  // ── Private: game over ────────────────────────────────────────────

  private triggerGameOver(winner: Winner): void {
    this.stop();
    this.phase = "gameover";
    // Persist remaining stored charges
    this.config.storage?.saveStoredPowerups({
      freeze: Math.max(0, this.p1.storedFreezeCharges ?? 0),
      shield: Math.max(0, this.p1.storedShieldCharges ?? 0),
      mult: 0,
      heart: 0
    });
    this.emit({ type: "phaseChange", phase: "gameover" });
    this.emit({ type: "gameOver",    winner });
  }
}
