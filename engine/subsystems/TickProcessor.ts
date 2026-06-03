import { GAME } from "../../config/difficulty";
import { BALANCE } from "../../config/gameBalance";
import { EVOLVE_PATTERNS, RARE_COLORS } from "../../config/gridPatterns";
import { logError } from "../../utils/devLog";
import { haptics } from "../../utils/haptics";
import { errorTracker } from "../../utils/error-tracker";
import { achievementSystem } from "../../utils/achievements";
import { bossEngine } from "../../utils/boss-engine";
import { rhythmFeedback } from "../../utils/feedback-rhythm";
import { spawnActive, activeToCellsP, pickPattern, pickCellShape } from "./CellLifecycle";
import {
  getNextBossEventType, getBossDuration, getBossLabel, getBossDoneLabel,
  getNextBossTriggerScore, shouldTriggerShieldBoss,
} from "./EventOrchestrator";
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
  _isBlackout: boolean;
  nextBossTriggerScore: number;
  activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null;
  dirty: boolean;
  _tickSoundCounter: number;
  _lastTickTs: number;
  now: number; // Cached Date.now() for the current tick
  numPlayers: NumPlayers;
  _deltaTimers: Array<{ id: string; remaining: number; duration: number; callback: () => void }>;
  devGodMode: boolean;
  devFreezeTime: boolean;
  devForcedPwr: "shield" | "freeze" | "heart" | null;
  dda: { recordAttempt(success: boolean, reaction: number, miss: boolean): void; spawnRate: number };

  emit(event: GameEvent): void;
  _flushTapBuffer(player: 1 | 2): void;
  checkStageProgress(player: 1 | 2): void;
  triggerGameOver(winner: Winner): void;
  scheduleTimeout(cb: () => void, ms: number): ReturnType<typeof setTimeout>;
  addDeltaTimer(id: string, durationMs: number, callback: () => void): void;
  removeDeltaTimer(id: string): void;
  readonly rng: () => number;
}

const _slotsCache = new WeakMap<{ cols: number; rows: number; mask: number[] | null }, Set<number>>();
// WeakMap key MUST be the exact EVOLVE_PATTERNS[idx] reference — do not spread.

// Pre-computed constant sets — avoids allocating arrays every tick per cell
const SPECIAL_TYPES = new Set(["medpack","shield","freeze","multiplier","ice","hold","bomb"]);
const POWERUP_TYPES = new Set(["medpack","shield","freeze","multiplier"]);
const CLASSIC_PAT: { readonly cols: 3; readonly rows: 3; readonly mask: null } = { cols: 3, rows: 3, mask: null };

export class TickProcessor {
  processTick(ctx: TickContext): void {
    try {
    if (ctx.phase !== "playing") return;
    const now = performance.now();
    const delta = Math.min(now - ctx._lastTickTs, 100);
    ctx._lastTickTs = now;
    // Snapshot current timers; callbacks may add/remove via addDeltaTimer/removeDeltaTimer
    const snapshot = [...ctx._deltaTimers];
    const expiredCallbacks: Array<() => void> = [];
    const kept: typeof ctx._deltaTimers = [];

    for (const timer of snapshot) {
      timer.remaining -= delta;
      if (timer.remaining <= 0) {
        expiredCallbacks.push(timer.callback);
      } else {
        kept.push(timer);
      }
    }

    // Fire expired callbacks (may modify ctx._deltaTimers via add/removeDeltaTimer)
    for (const cb of expiredCallbacks) {
      cb();
      if (ctx.phase !== "playing") return; // Bail if callback triggered game over
    }

    // After callbacks: newly added timers are those NOT in the snapshot (by reference)
    const snapshotSet = new Set(snapshot);
    const newlyAdded = ctx._deltaTimers.filter(t => !snapshotSet.has(t));

    // kept = non-expired from snapshot MINUS any removed by callbacks via removeDeltaTimer
    const currentSet = new Set(ctx._deltaTimers);
    ctx._deltaTimers = [...kept.filter(t => currentSet.has(t)), ...newlyAdded];

    // If a delta timer callback triggered game over, bail out of the rest of the tick
    if (ctx.phase !== "playing") return;

    const mode = ctx.config.mode;
    ctx._flushTapBuffer(1);
    if (ctx.numPlayers === 2) ctx._flushTapBuffer(2);
    if (ctx.phase !== "playing") return; // tap buffer flush can trigger game over
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
        // Rare color events — already inside mode === "evolve" guard
        const s1 = ctx.p1.score;
        const { triggerInterval, warnThreshold, minScore, modCheck, chance, minTurns, bonusTurns } = BALANCE.rare;
        if (
          s1 > 0 &&
          (s1 % triggerInterval) === (triggerInterval - warnThreshold)
        ) {
          ctx.emit({ type: "toast", message: "⚠️ Danger color changing soon!" });
        }
        if (s1 >= minScore && s1 % 50 < modCheck && ctx.rng() < chance) {
          const pick = RARE_COLORS[Math.floor(ctx.rng() * RARE_COLORS.length)];
          ctx.rareMode = { active: true, color: pick.color, cssColor: pick.cssColor, turnsLeft: minTurns + Math.floor(ctx.rng() * bonusTurns), shape: pick.shape, emoji: pick.emoji };
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
        haptics.levelUp();
      }
      const curStage = ref.gridStage;
      const patIdx = ref.patternIdx;
      const pat = mode === "evolve" ? (EVOLVE_PATTERNS[patIdx] ?? EVOLVE_PATTERNS[0]) : CLASSIC_PAT;
      if (!pat || pat.cols === 0) { logError("[DTP-002]"); continue; }
      let validSlots = _slotsCache.get(pat);
      if (!validSlots) { validSlots = new Set(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)); _slotsCache.set(pat, validSlots); }
      const dangerColor = ctx.rareMode.active ? ctx.rareMode.color : "purple";
      ctx._isInverted = ctx.bossEvent?.type === "inversion" && ctx.now < (ctx.bossEvent?.endsAt ?? 0);
      ctx._isBlackout  = ctx.bossEvent?.type === "blackout"  && ctx.now < (ctx.bossEvent?.endsAt ?? 0);

      const player = (pi + 1) as 1 | 2;

      ref.active.forEach(c => {
        if (!validSlots.has(c.idx) || c.clicked) return;
        // All 7 special types — immune to expiry damage. This list covers all spawnable
        // types from CellLifecycle.spawnActive(). GameEngine._processTap has a separate,
        // intentionally narrower list for tap handling (4 collectible types); ice/hold/bomb
        // have their own dedicated tap blocks. Both must stay in sync with CellLifecycle.
        const isPwr = SPECIAL_TYPES.has(c.type);
        const isMiss = ctx._isInverted ? c.type === "purple" : c.type !== dangerColor && !isPwr;
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

if (ref.active.some(c => !c.clicked && c.type === "ice")) { ref.cells = activeToCellsP(ref.active, pat); continue; }
      const nextPatIdx = mode === "evolve" ? pickPattern(ctx.rng, curStage, patIdx, ref.score) : 0;
      ref.patternIdx = nextPatIdx;
      const nextPat = mode === "evolve" ? (EVOLVE_PATTERNS[nextPatIdx] ?? EVOLVE_PATTERNS[0]) : CLASSIC_PAT;
      const rareColor = ctx.rareMode.active ? ctx.rareMode.color : undefined;
      const rareShape = ctx.rareMode.active ? ctx.rareMode.shape : undefined;
      const spawnStage = mode === "evolve" ? curStage : Math.min(Math.floor(ctx.tickCount / 12), 7);
      // Preserve un-defused bomb from current tick (spawnActive creates a fresh array)
      const activeBombCell = ref.active.find(c => c.type === "bomb" && !c.clicked) as BombCell | undefined;
      const newActive = spawnActive(ctx.rng, spawnStage, ref.health, nextPat, mode === "evolve", rareColor, rareShape, ctx.tickCount, ctx.devGodMode);
      if (ctx.devForcedPwr && newActive.length > 0) {
        newActive[0] = { ...newActive[0], type: (ctx.devForcedPwr === "heart" ? "medpack" : ctx.devForcedPwr) } as ActiveCell;
        if (pi === 0) ctx.devForcedPwr = null;
      }
      ref.active = newActive;
      // Re-append active bomb so it persists across ticks until defused or exploded
      if (activeBombCell) { ref.active = [...newActive, activeBombCell]; }
      ref.cells = activeToCellsP(ref.active, nextPat);
      for (const c of newActive) {
        if (POWERUP_TYPES.has(c.type)) {
          ref.anim[c.idx] = "pwr-drop";
          ctx.scheduleTimeout(() => { if (ref.anim[c.idx] === "pwr-drop") { ref.anim = { ...ref.anim }; delete ref.anim[c.idx]; } }, 600);
        }
      }
    }

    // Cell shuffle + boss event + bomb spawn
    if (mode === "evolve") {
      const stormActive = ctx.bossEvent?.type === "storm" && ctx.now < (ctx.bossEvent?.endsAt ?? 0);
      const shufflePat = EVOLVE_PATTERNS[ctx.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
      if (stormActive) { ctx.p1.nextShuffleTick = 0; ctx.p2.nextShuffleTick = 0; }
      if (ctx.p1.alive) this._tryShuffleCells(ctx, ctx.p1, shufflePat, 1);
      if (ctx.numPlayers === 2 && ctx.p2.alive) {
        const p2Pat = EVOLVE_PATTERNS[ctx.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
        this._tryShuffleCells(ctx, ctx.p2, p2Pat, 2);
      }

      const effectiveScore = ctx.numPlayers === 2 ? ctx.p1.score + ctx.p2.score : ctx.p1.score;
      if (effectiveScore >= ctx.nextBossTriggerScore) this._triggerBossEvent(ctx);

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
      bossEngine.activate(BALANCE.boss.shieldBaseHits + Math.floor(ctx.rng() * BALANCE.boss.shieldBonusHits));
    }

    ctx.tickCount += 1;
    if (ctx.phase === "playing" && ctx.tickCount >= GAME.HUMAN_LIMIT_TICK) { ctx.phase = "humanlimit"; ctx.emit({ type: "phaseChange", phase: "humanlimit" }); }
    if (ctx.tickCount > GAME.SURVIVAL_BONUS_START_TICK && ctx.tickCount % BALANCE.survival.interval === 0) {
      const bonus = ctx.tickCount > BALANCE.survival.lateThreshold ? BALANCE.survival.lateAmount : ctx.tickCount > BALANCE.survival.midThreshold ? BALANCE.survival.midAmount : BALANCE.survival.earlyAmount;
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
      try { ctx.triggerGameOver(null); } catch (inner) {
        logError("[TickProcessor] triggerGameOver failed in catch:", inner);
      }
    }
  }

  // Shuffle cells — 1-2 cells slide to adjacent empty positions
  private _tryShuffleCells(ctx: TickContext, ref: PlayerState, pat: { cols: number; rows: number; mask: number[] | null }, player: 1 | 2): void {
    if (ctx.config.mode !== "evolve" || ref.gridStage < 3) return;
    if (ctx.tickCount < ref.nextShuffleTick) return;

    ref.nextShuffleTick = ctx.tickCount + BALANCE.shuffle.minInterval + Math.floor(ctx.rng() * BALANCE.shuffle.bonusInterval);

    const { cols, rows } = pat;
    let validSlots = _slotsCache.get(pat);
    if (!validSlots) { validSlots = new Set(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)); _slotsCache.set(pat, validSlots); }

    const occupied = new Set<number>(ref.active.filter(c => !c.clicked).map(c => c.idx));
    const empty = [...validSlots].filter(i => !occupied.has(i));
    if (empty.length === 0) return;

    const shuffleCount = 1 + (ctx.rng() < BALANCE.shuffle.secondShuffleChance ? 1 : 0);
    const candidates = ref.active.filter(c =>
      !c.clicked &&
      validSlots.has(c.idx) &&
      c.type !== "hold" &&
      c.type !== "ice" &&
      c.type !== "bomb"
    );

    if (candidates.length === 0) return;

    const moved: number[] = [];
    for (let i = 0; i < Math.min(shuffleCount, candidates.length); i++) {
      if (empty.length === 0) break;

      // Pick a candidate that hasn't been moved yet (retry up to candidates.length times)
      let cell: typeof candidates[number] | null = null;
      for (let attempt = 0; attempt < candidates.length; attempt++) {
        const cIdx = Math.floor(ctx.rng() * candidates.length);
        if (!moved.includes(candidates[cIdx].idx)) { cell = candidates[cIdx]; break; }
      }
      if (!cell) continue;

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
      const gen = (ref.slideAnim[toIdx]?.gen ?? -1) + 1;
      ref.slideAnim[toIdx] = { fromIdx, startMs: Date.now(), gen };

      ctx.scheduleTimeout(() => {
        // Only delete if no newer animation was placed at this index
        if (ref.slideAnim?.[toIdx]?.gen === gen) {
          ref.slideAnim = { ...ref.slideAnim }; delete ref.slideAnim[toIdx];
        }
        ctx.dirty = true;
      }, BALANCE.shuffle.slideCleanupMs);

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
    if (ctx.activeBomb) return;
    if (ref.score < BALANCE.bomb.minScore) return;
    if (ctx.rng() > BALANCE.bomb.spawnChance) return;

    const validSlots = pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i);
    const occupied = new Set(ref.active.filter(c => !c.clicked).map(c => c.idx));
    const free = validSlots.filter(i => !occupied.has(i));
    if (free.length === 0) return;

    const idx = free[Math.floor(ctx.rng() * free.length)];
    const expiresAt = Date.now() + BALANCE.bomb.fuseTimeMs;
    const bomb: BombCell = { idx, clicked: false, type: "bomb", expiresAt };
    ref.active = [...ref.active, bomb];
    ref.cells = activeToCellsP(ref.active, pat);
    ctx.activeBomb = { idx, expiresAt, player };
    ctx.dirty = true;
    ctx.emit({ type: "bombSpawn", player, idx, expiresAt });
    haptics.bomb();
    ctx.emit({ type: "sound", name: "bomb" });
    ctx.emit({ type: "toast", message: "💣 BOMB! Tap it!" });

    ctx.addDeltaTimer(`bomb_${player}_${idx}`, BALANCE.bomb.fuseTimeMs, () => {
      if (!ctx.activeBomb || ctx.activeBomb.idx !== idx || ctx.activeBomb.player !== player) return;
      const stillActive = ref.active.find(c => c.idx === idx && c.type === "bomb" && !c.clicked);
      if (!stillActive) { if (ctx.activeBomb?.idx === idx) ctx.activeBomb = null; return; }
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
      // Use the pattern captured at spawn time (pat), not the current one,
      // because the grid may have changed during the fuse delay.
      ref.cells = activeToCellsP(ref.active, pat);
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
    ctx.scheduleTimeout(() => {
      if (ctx.bossEvent?.type === type) {
        const completedType = type;
        ctx.bossEvent = null;
        ctx.dirty = true;
        ctx.emit({ type: "toast", message: getBossDoneLabel(completedType) });
        // Inversion survival achievement
        if (completedType === "inversion") {
          achievementSystem.unlock('boss_inversion');
        }
      }
    }, durationMs);
  }
}
