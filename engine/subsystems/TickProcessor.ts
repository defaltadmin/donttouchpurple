import { GAME } from "../../config/difficulty";
import { STAGES, EVOLVE_PATTERNS, RARE_COLORS } from "../../config/gridPatterns";
import { logError } from "../../utils/devLog";
import { haptics } from "../../utils/haptics";
import { errorTracker } from "../../utils/error-tracker";
import { bossEngine } from "../../utils/boss-engine";
import { rhythmFeedback } from "../../utils/feedback-rhythm";
import { analytics } from "../../utils/analytics";
import { spawnActive, activeToCellsP, pickPattern, pickCellShape } from "./CellLifecycle";
import {
  getNextBossEventType, getBossDuration, getBossLabel, getBossDoneLabel,
  getNextBossTriggerScore, shouldTriggerShieldBoss,
} from "./EventOrchestrator";
import { calculateStreakBonus } from "./ScoreTracker";
import type { ActiveCell, CellShape, GameConfig, GameEvent, GameSnapshot, PlayerState, RareColorMode, Winner, BombCell, BossEvent, NumPlayers } from "../types";

export interface TickContext {
  config: GameConfig;
  phase: GameSnapshot["phase"];
  tickCount: number;
  evolveTick: number;
  cellShape: CellShape;
  rareMode: RareColorMode;
  spinLevel: number;
  p1: PlayerState;
  p2: PlayerState;
  bossEvent: BossEvent | null;
  _bossActive: boolean;
  _isInverted: boolean;
  nextShuffleTick: number;
  nextBossTriggerScore: number;
  activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null;
  dirty: boolean;
  _tickSoundCounter: number;
  _lastTickTs: number;
  numPlayers: NumPlayers;
  _deltaTimers: Array<{ id: string; remaining: number; duration: number; callback: () => void }>;
  devGodMode: boolean;
  devFreezeTime: boolean;
  devForcedPwr: "shield" | "freeze" | "heart" | null;
  botAssistActive: { 1: boolean; 2: boolean };
  dda: { recordAttempt(success: boolean, reaction: number, miss: boolean): void; spawnRate: number };

  emit(event: GameEvent): void;
  _flushTapBuffer(player: 1 | 2): void;
  checkStageProgress(player: 1 | 2): void;
  autoSaveSession(): void;
  triggerGameOver(winner: Winner): void;
  scheduleTimeout(cb: () => void, ms: number): ReturnType<typeof setTimeout>;
  addDeltaTimer(id: string, durationMs: number, callback: () => void): void;
  removeDeltaTimer(id: string): void;
  readonly rng: () => number;
}

export class TickProcessor {
  processTick(ctx: TickContext): void {
    try {
    if (ctx.phase !== "playing") return;
    const now = performance.now();
    const delta = Math.min(now - ctx._lastTickTs, 100);
    ctx._lastTickTs = now;
    ctx._deltaTimers = ctx._deltaTimers.filter(timer => {
      timer.remaining -= delta;
      if (timer.remaining <= 0) { timer.callback(); return false; }
      return true;
    });
    const mode = ctx.config.mode;
    ctx._flushTapBuffer(1);
    if (ctx.numPlayers === 2) ctx._flushTapBuffer(2);
    ctx.evolveTick += 1;
    if (mode === "evolve") ctx.cellShape = pickCellShape(ctx.evolveTick);

    if (mode === "evolve") {
      if (ctx.rareMode.active) {
        ctx.rareMode.turnsLeft -= 1;
        if (ctx.rareMode.turnsLeft <= 0) {
          ctx.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
          ctx.emit({ type: "toast", message: "🟣 Back to Purple!" });
        }
      } else {
        const s1 = ctx.p1.score;
        const RARE_TRIGGER_INTERVAL = 50;
        const RARE_PRE_WARN_THRESHOLD = 3;
        if (
          s1 > 0 &&
          (s1 % RARE_TRIGGER_INTERVAL) === (RARE_TRIGGER_INTERVAL - RARE_PRE_WARN_THRESHOLD)
        ) {
          ctx.emit({ type: "toast", message: "⚠️ Danger color changing soon!" });
        }
        if (s1 >= 50 && s1 % 50 < 4 && ctx.rng() < 0.35) {
          const pick = RARE_COLORS[Math.floor(ctx.rng() * RARE_COLORS.length)];
          ctx.rareMode = { active: true, color: pick.color, cssColor: pick.cssColor, turnsLeft: 5 + Math.floor(ctx.rng() * 4), shape: pick.shape, emoji: pick.emoji };
          ctx.emit({ type: "rareStart", color: pick.color, cssColor: pick.cssColor });
          ctx.emit({ type: "sound", name: "rareStart" });
          ctx.emit({ type: "toast", message: `⚠️ Don't Touch ${pick.color.toUpperCase()}!` });
        }
      }
    }

    const players: Array<{ ref: PlayerState; pi: 0 | 1 }> = [{ ref: ctx.p1, pi: 0 }, { ref: ctx.p2, pi: 1 }];
    for (const { ref, pi } of players) {
      if (!ref.alive || (pi === 1 && ctx.numPlayers === 1)) continue;
      if (ref.pendingStageUpdate) {
        ref.pendingStageUpdate = false; ref.gridStage += 1; ref.stageProgress = 0;
        if (ctx.config.inputMode !== 'keys') {
          ctx.spinLevel += 1;
        }
        ctx.emit({ type: "sound", name: "levelup" });
        ctx.emit({ type: "levelUp", player: (pi + 1) as 1 | 2, stage: ref.gridStage });
      }
      const curStage = ref.gridStage;
      const patIdx = ref.patternIdx;
      const pat = mode === "evolve" ? (EVOLVE_PATTERNS[patIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      if (!pat || pat.cols === 0) { logError("[DTP-002]"); continue; }
      const validSlots = new Set(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i));
      const dangerColor = ctx.rareMode.active ? ctx.rareMode.color : "purple";
      ctx._isInverted = ctx.bossEvent?.type === "inversion" && Date.now() < (ctx.bossEvent?.endsAt ?? 0);

      const player = (pi + 1) as 1 | 2;

      ref.active.forEach(c => {
        if (!validSlots.has(c.idx) || c.clicked) return;
        const isPwr = ["medpack","shield","freeze","multiplier","ice","hold","bomb"].includes(c.type);
        const isMiss = ctx._isInverted ? c.type === "purple" && !isPwr : c.type !== dangerColor && !isPwr;
        if (isMiss) {
          const dmg = mode === "evolve" ? 0.5 : 1;
          if (!ctx.devGodMode) {
            if (ref.shieldCount > 0) { ctx.dda.recordAttempt(false, 0, false); ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
            else {
              ctx.dda.recordAttempt(false, 0, true);
              ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
              ctx.emit({ type: "damage", player }); ctx.emit({ type: "shake", player });
              if (ref.health <= 0) {
                ref.alive = false;
                const other = ctx.numPlayers === 2 ? (pi === 0 ? ctx.p2.alive : ctx.p1.alive) : false;
                ctx.triggerGameOver(ctx.numPlayers === 1 ? null : other ? (pi === 0 ? "p2" : "p1") : "tie");
              }
            }
          }
          haptics.damage();
          if (ref.streak >= 5) ctx.emit({ type: "toast", message: `🔥 ${ref.streak} streak lost!` });
          ref.streak = 0;
        }
      });
      if (!ref.alive) continue;

      const now2 = Date.now();
      ref.active.forEach(c => {
        if (c.clicked || c.type !== "hold") return;
        const hold = c as import("../types").HoldCell;
        const deadline = hold.holdStart
          ? hold.holdStart + hold.holdRequired + 500
          : hold.spawnedAt + hold.holdRequired + 1500;
        if (now2 > deadline) {
          hold.clicked = true;
          const dmg = mode === "evolve" ? 0.5 : 1;
          if (!ctx.devGodMode) {
            if (ref.shieldCount > 0) { ctx.dda.recordAttempt(false, 0, false); ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
            else {
              ctx.dda.recordAttempt(false, 0, true);
              ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
              ctx.emit({ type: "damage", player }); ctx.emit({ type: "shake", player });
              ctx.emit({ type: "toast", message: "⏳ Hold expired!" });
              if (ref.health <= 0) {
                ref.alive = false;
                const other = ctx.numPlayers === 2 ? (pi === 0 ? ctx.p2.alive : ctx.p1.alive) : false;
                ctx.triggerGameOver(ctx.numPlayers === 1 ? null : other ? (pi === 0 ? "p2" : "p1") : "tie");
              }
            }
          }
        }
      });

      if (ref.active.some(c => !c.clicked && (c.type === "hold" || c.type === "ice"))) { ref.cells = activeToCellsP(ref.active, pat); continue; }
      const nextPatIdx = mode === "evolve" ? pickPattern(ctx.rng, curStage, patIdx, ref.score) : 0;
      ref.patternIdx = nextPatIdx;
      const nextPat = mode === "evolve" ? (EVOLVE_PATTERNS[nextPatIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      const rareColor = ctx.rareMode.active ? ctx.rareMode.color : undefined;
      const rareShape = ctx.rareMode.active ? ctx.rareMode.shape : undefined;
      const spawnStage = mode === "evolve" ? curStage : Math.min(Math.floor(ctx.tickCount / 12), 7);
      const newActive = spawnActive(ctx.rng, spawnStage, ref.health, nextPat, mode === "evolve", rareColor, rareShape, ctx.tickCount, ctx.devGodMode);
      if (ctx.devForcedPwr && newActive.length > 0) {
        newActive[0] = { ...newActive[0], type: (ctx.devForcedPwr === "heart" ? "medpack" : ctx.devForcedPwr) } as ActiveCell;
        if (pi === (ctx.numPlayers === 1 ? 0 : 1)) ctx.devForcedPwr = null;
      }
      ref.active = newActive;
      ref.cells = activeToCellsP(newActive, nextPat);
      for (const c of newActive) {
        if (["medpack", "shield", "freeze", "multiplier"].includes(c.type)) {
          ref.anim[c.idx] = "pwr-drop";
          setTimeout(() => { if (ref.anim[c.idx] === "pwr-drop") delete ref.anim[c.idx]; }, 600);
        }
      }
    }

    // Bot Assist
    const botCfg = ctx.config.botAssist;
    if (botCfg) {
      const botPlayers: Array<{ ref: PlayerState; player: 1 | 2 }> = [
        { ref: ctx.p1, player: 1 },
        ...(ctx.numPlayers === 2 ? [{ ref: ctx.p2, player: 2 as const }] : []),
      ];
      for (const { ref, player } of botPlayers) {
        if (!ctx.botAssistActive[player] || !ref.alive) continue;
        const dust = botCfg.getDust();
        if (dust < 30) { ctx.botAssistActive[player] = false; ctx.emit({ type: "toast", message: "🤖 Bot off — low dust!" }); continue; }
        const accuracy = botCfg.getAccuracy();
        const dangerColor = ctx.rareMode.active ? ctx.rareMode.color : "purple";
        const botInverted = ctx.bossEvent?.type === "inversion" && Date.now() < (ctx.bossEvent?.endsAt ?? 0);
        const missedCells = ref.active.filter(c =>
          !c.clicked &&
          (botInverted ? c.type === dangerColor : c.type !== dangerColor) &&
          (c.type as string) !== "void" &&
          c.type !== "hold" &&
          c.type !== "ice"
        );
        for (const cell of missedCells) {
          if (ctx.rng() > accuracy) continue;
          const costPerTap = 3;
          const currentDust = botCfg.getDust();
          if (currentDust < costPerTap) break;
          botCfg.spendDust(costPerTap);
          ctx.emit({ type: "botTap", player, idx: cell.idx, dustCost: costPerTap });
          cell.clicked = true;
          const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
          const nextStreak = ref.streak + 1;
          ref.score += mult + calculateStreakBonus(nextStreak);
          ref.streak = nextStreak;
          ref.stageProgress += 1;
          ctx.checkStageProgress(player);
        }
        if (missedCells.length > 0) {
          const pat = mode === "evolve"
            ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0])
            : { cols: 3, rows: 3, mask: null as number[] | null };
          ref.cells = activeToCellsP(ref.active, pat);
        }
      }
    }

    // Cell shuffle + boss event + bomb spawn
    if (mode === "evolve") {
      const stormActive = ctx.bossEvent?.type === "storm" && Date.now() < (ctx.bossEvent?.endsAt ?? 0);
      const shufflePat = EVOLVE_PATTERNS[ctx.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
      if (stormActive) {
        ctx.nextShuffleTick = 0;
        if (ctx.p1.alive) this._tryShuffleCells(ctx, ctx.p1, shufflePat, 1);
        if (ctx.numPlayers === 2 && ctx.p2.alive) {
          const p2Pat = EVOLVE_PATTERNS[ctx.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
          this._tryShuffleCells(ctx, ctx.p2, p2Pat, 2);
        }
      } else {
        if (ctx.p1.alive) this._tryShuffleCells(ctx, ctx.p1, shufflePat, 1);
        if (ctx.numPlayers === 2 && ctx.p2.alive) {
          const p2Pat = EVOLVE_PATTERNS[ctx.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
          this._tryShuffleCells(ctx, ctx.p2, p2Pat, 2);
        }
      }

      if (ctx.p1.score >= ctx.nextBossTriggerScore) this._triggerBossEvent(ctx);

      if (ctx.p1.alive) {
        const bombPat = EVOLVE_PATTERNS[ctx.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
        this._trySpawnBomb(ctx, ctx.p1, 1, bombPat);
      }
      if (ctx.numPlayers === 2 && ctx.p2.alive) {
        const bombPat2 = EVOLVE_PATTERNS[ctx.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
        this._trySpawnBomb(ctx, ctx.p2, 2, bombPat2);
      }
    }

    if (shouldTriggerShieldBoss(ctx.p1.score, ctx._bossActive, ctx.bossEvent !== null, mode, ctx.rng)) {
      ctx._bossActive = true;
      bossEngine.activate(5 + Math.floor(ctx.rng() * 3));
    }

    ctx.tickCount += 1;
    if (ctx.tickCount % 10 === 0) ctx.autoSaveSession();
    if (ctx.phase === "playing" && ctx.tickCount >= GAME.HUMAN_LIMIT_TICK) { ctx.phase = "humanlimit"; ctx.emit({ type: "phaseChange", phase: "humanlimit" }); }
    if (ctx.tickCount > GAME.SURVIVAL_BONUS_START_TICK && ctx.tickCount % 20 === 0) {
      const bonus = ctx.tickCount > 200 ? 5 : ctx.tickCount > 120 ? 3 : 2;
      const multBonus = Math.round(bonus * rhythmFeedback.state.multiplier);
      if (ctx.p1.alive) ctx.p1.score += multBonus;
      if (ctx.numPlayers === 2 && ctx.p2.alive) ctx.p2.score += multBonus;
      ctx.emit({ type: "toast", message: `🔵 Survival +${multBonus}!` });
    }
    ctx.dirty = true;
    ctx._tickSoundCounter++;
    if (ctx._tickSoundCounter % 4 === 0) {
      ctx.emit({ type: "sound", name: "tick" });
    }
    } catch (err) {
      logError("[TickProcessor] processTick crashed:", err);
      errorTracker.capture(err instanceof Error ? err : new Error(String(err)), { phase: 'processTick', tick: ctx.tickCount });
      ctx.emit({ type: "toast", message: "⚠️ Engine error — game ended" });
      ctx.triggerGameOver(null);
    }
  }

  // Shuffle cells — 1-2 cells slide to adjacent empty positions
  private _tryShuffleCells(ctx: TickContext, ref: PlayerState, pat: { cols: number; rows: number; mask: number[] | null }, player: 1 | 2): void {
    if (ctx.config.mode !== "evolve" || ref.gridStage < 3) return;
    if (ctx.tickCount < ctx.nextShuffleTick) return;

    ctx.nextShuffleTick = ctx.tickCount + 40 + Math.floor(ctx.rng() * 20);

    const { cols, rows, mask } = pat;
    const total = cols * rows;
    const validSlots = new Set<number>(mask ?? Array.from({ length: total }, (_, i) => i));

    const occupied = new Set<number>(ref.active.filter(c => !c.clicked).map(c => c.idx));
    const empty = [...validSlots].filter(i => !occupied.has(i));
    if (empty.length === 0) return;

    const shuffleCount = 1 + (ctx.rng() < 0.35 ? 1 : 0);
    const candidates = ref.active.filter(c =>
      !c.clicked &&
      validSlots.has(c.idx) &&
      c.type !== "hold" &&
      c.type !== "ice"
    );

    if (candidates.length === 0) return;

    const moved: number[] = [];
    for (let i = 0; i < Math.min(shuffleCount, candidates.length); i++) {
      if (empty.length === 0) break;

      const cIdx = Math.floor(ctx.rng() * candidates.length);
      const cell = candidates[cIdx];
      if (moved.includes(cell.idx)) continue;

      const adjacent = this._getAdjacentSlots(cell.idx, cols, rows, validSlots)
        .filter(s => !occupied.has(s) && !moved.includes(s));
      const targetPool = adjacent.length > 0 ? adjacent : empty.filter(s => !moved.includes(s));
      if (targetPool.length === 0) continue;

      const toIdx = targetPool[Math.floor(ctx.rng() * targetPool.length)];

      const fromIdx = cell.idx;
      cell.idx = toIdx;
      occupied.delete(fromIdx);
      occupied.add(toIdx);
      const emptyI = empty.indexOf(toIdx);
      if (emptyI !== -1) empty.splice(emptyI, 1);
      empty.push(fromIdx);
      moved.push(toIdx);

      if (!ref.slideAnim) ref.slideAnim = {};
      ref.slideAnim[toIdx] = { fromIdx, startMs: Date.now() };

      ctx.scheduleTimeout(() => {
        if (ref.slideAnim) delete ref.slideAnim[toIdx];
        ctx.dirty = true;
      }, 200 + 50);

      ctx.emit({ type: "cellShuffle", player, fromIdx, toIdx });
      ctx.emit({ type: "sound", name: "shuffle" });
    }

    if (moved.length > 0) {
      ref.cells = activeToCellsP(ref.active, pat);
      ctx.dirty = true;
    }
  }

  private _getAdjacentSlots(idx: number, cols: number, rows: number, validSlots: Set<number>): number[] {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const adj: number[] = [];
    if (row > 0)        { const n = idx - cols; if (validSlots.has(n)) adj.push(n); }
    if (row < rows - 1) { const n = idx + cols; if (validSlots.has(n)) adj.push(n); }
    if (col > 0)        { const n = idx - 1;    if (validSlots.has(n)) adj.push(n); }
    if (col < cols - 1) { const n = idx + 1;    if (validSlots.has(n)) adj.push(n); }
    return adj;
  }

  private _trySpawnBomb(ctx: TickContext, ref: PlayerState, player: 1 | 2, pat: { cols: number; rows: number; mask: number[] | null }): void {
    if (ctx.activeBomb && ctx.activeBomb.player === player) return;
    if (ref.score < 100) return;
    if (ctx.rng() > 0.12) return;

    const validSlots = pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i);
    const occupied = new Set(ref.active.filter(c => !c.clicked).map(c => c.idx));
    const free = validSlots.filter(i => !occupied.has(i));
    if (free.length === 0) return;

    const idx = free[Math.floor(ctx.rng() * free.length)];
    const expiresAt = Date.now() + 2000;
    const bomb: BombCell = { idx, clicked: false, type: "bomb", expiresAt };
    ref.active.push(bomb);
    ref.cells = activeToCellsP(ref.active, pat);
    ctx.activeBomb = { idx, expiresAt, player };
    ctx.dirty = true;
    ctx.emit({ type: "bombSpawn", player, idx, expiresAt });
    haptics.bomb();
    ctx.emit({ type: "sound", name: "bomb" });
    ctx.emit({ type: "toast", message: "💣 BOMB! Tap it!" });

    ctx.addDeltaTimer(`bomb_${player}_${idx}`, 2000, () => {
      if (!ctx.activeBomb || ctx.activeBomb.idx !== idx || ctx.activeBomb.player !== player) return;
      const stillActive = ref.active.find(c => c.idx === idx && c.type === "bomb" && !c.clicked);
      if (!stillActive) return;
      stillActive.clicked = true;
      ctx.activeBomb = null;
      if (!ctx.devGodMode) {
        if (ref.shieldCount > 0) { ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
        else {
          const dmg = ctx.config.mode === "evolve" ? 0.5 : 1;
          ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
          ctx.emit({ type: "damage", player }); ctx.emit({ type: "shake", player });
          if (ref.health <= 0) {
            ref.alive = false;
            ctx.triggerGameOver(ctx.numPlayers === 1 ? null : (player === 1 ? "p2" : "p1"));
          }
        }
      }
      ctx.emit({ type: "bombExplode", player });
      ctx.emit({ type: "toast", message: "💥 Bomb exploded!" });
      const pat2 = ctx.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      ref.cells = activeToCellsP(ref.active, pat2);
      ctx.dirty = true;
    });
  }

  private _triggerBossEvent(ctx: TickContext): void {
    const prevType = ctx.bossEvent?.type ?? null;
    const type = getNextBossEventType(prevType);
    const durationMs = getBossDuration(type);
    ctx.bossEvent = { type, endsAt: Date.now() + durationMs };
    ctx.nextBossTriggerScore = getNextBossTriggerScore(ctx.nextBossTriggerScore);
    ctx.emit({ type: "bossStart", bossType: type });
    ctx.emit({ type: "sound", name: "bossStart" });
    ctx.emit({ type: "toast", message: getBossLabel(type) });
    setTimeout(() => {
      if (ctx.bossEvent?.type === type) {
        ctx.bossEvent = null;
        ctx.dirty = true;
        ctx.emit({ type: "toast", message: getBossDoneLabel(type) });
      }
    }, durationMs);
  }
}
