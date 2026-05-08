import { DIFFICULTY, GAME, LS_KEYS } from "../config/difficulty";
import { STAGES, EVOLVE_PATTERNS, RARE_COLORS, getRareModeConfig } from "../config/gridPatterns";
import { POWERUP_TABLE } from "../config/powerupWeights";
import { computeMs, makeGameSeed, getSpinConfig, mulberry32 } from "./DifficultyScaler";
import { logError } from "../utils/devLog";
import { InputBuffer } from "../utils/input-smoothing";
import { haptics } from "../utils/haptics";
import { sessionManager } from "../utils/session";
import { scoreSync } from "../utils/score-sync";
import { audioEngine } from "../utils/audio";
import { analytics } from "../utils/analytics";
import { gamepadManager } from "../utils/gamepad";
import { configManager } from "../utils/game-config";
import { errorTracker } from "../utils/error-tracker";
import { DynamicDifficulty } from "../utils/dda";
import { seedManager } from "../utils/seed-manager";
import { bossEngine } from "../utils/boss-engine";
import { achievementSystem } from "../utils/achievements";
import { DailyChallenge } from "../utils/seed-challenge";
import { perfMonitor } from "../utils/perf-monitor";
import { scoreCardGen } from "../utils/score-card";
import { privacyManager } from "../utils/privacy";
import { rhythmFeedback } from "../utils/feedback-rhythm";
import type {
  ActiveCell, CellType, CellShape, GameConfig, GameEvent,
  GameMode, GameSnapshot, NumPlayers, PlayerState, RareColorMode, Winner,
  BombCell, BossEvent, BossEventType, HoldCell,
} from "./types";
import {
  activeToCellsP, spawnActive, pickPattern, pickCellShape,
} from "./subsystems/CellLifecycle";
import { calculateTapScore, checkStreakMilestone } from "./subsystems/ScoreTracker";
import {
  getNextBossEventType, getBossDuration, getBossLabel, getBossDoneLabel,
  getNextBossTriggerScore, shouldTriggerBossEvent, shouldTriggerShieldBoss,
} from "./subsystems/EventOrchestrator";

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
  private rareMode: RareColorMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
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
  private _pauseListeners: Array<() => void> = [];
  private _resumeListeners: Array<() => void> = [];
  private inputBuffer = new InputBuffer();
  private _sessionAutoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private fpsHistory: number[] = [];
  private autoLowQuality = false;
  private lowQualityThreshold = 40;
  private botActive      = false;
  private botIntervalRef: ReturnType<typeof setInterval> | null = null;
  private dustSpentTotal = 0;
  // K1: cell shuffle state
  private nextShuffleTick: number = 0;
  private readonly SHUFFLE_DURATION_MS = 200; // K3: slide animation duration
  // Boss/Bomb state
  private bossEvent: BossEvent | null = null;
  private nextBossTriggerScore = 500;
  private activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null = null;
  private _settingsUnsub: (() => void) | null = null;
  private _gamepadUnsub: (() => void) | null = null;
  private _lastFocusedCell = '0';
  private _config = configManager.get();
  private dda = new DynamicDifficulty(1200);
  private daily = new DailyChallenge();
  private _lastTapTime = 0;
  private _sessionStartTime = performance.now();
  private _isDisposed = false;
  private _isInverted = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];
  private _tickSoundCounter = 0;
  private _deltaTimers: Array<{ id: string; remaining: number; duration: number; callback: () => void }> = [];
  private _lastTickTs = performance.now();
  private _bossActive = false;

  constructor(private config: GameConfig) {
    perfMonitor.observe();
    this._sessionStartTime = performance.now();
    this.iMult = config.speedMult;
    this.devGodMode = config.godMode ?? false;
    achievementSystem.load();
    achievementSystem.register({ id: 'first_blood', name: 'First Strike', desc: 'Clear your first cell', icon: '💥', unlocked: false });
    achievementSystem.register({ id: 'survivor', name: 'Iron Will', desc: 'Reach last heart and survive 30s', icon: '🛡️', unlocked: false });
    achievementSystem.register({ id: 'daily_master', name: 'Daily Grind', desc: "Complete today's challenge", icon: '📅', unlocked: false });
    audioEngine.init();
    import('../utils/settings').then(m => {
      this._settingsUnsub = m.settingsManager.subscribe(s => this._applySettings(s));
    }).catch(e => logError('Settings module failed', e));
    window.addEventListener('dtp:boss:complete', () => { this._bossActive = false; });
    gamepadManager.init();
    this._gamepadUnsub = gamepadManager.on((btn, state) => {
      if (state !== 'press') return;
      if (btn === 'a' || btn === 'dpad_up') this.handleTap(1, parseInt(this._lastFocusedCell) || 0);
      if (btn === 'start') this.paused ? this.resume() : this.pause();
    });
  }

  private _applySettings(s: { reducedMotion?: boolean }) {
    // Bridge settings to engine behavior if needed
  }

  setConfig(cfg: typeof this._config) { this._config = cfg; }

  handleError(err: Error, phase: string) {
    errorTracker.capture(err, { phase, tick: this.tickCount, p1Score: this.p1?.score, p2Score: this.p2?.score });
    if (this.phase === "playing") {
      this.pause();
    }
  }

  getDDASpawnRate() { return this.dda.spawnRate; }
  isDailyComplete() { return this.daily.isTodayComplete(); }

  async generateScoreCard(score: number): Promise<string> {
    return scoreCardGen.generate({
      score,
      hearts: this.p1?.health ?? 0,
      time: Math.round(this.tickCount / 2),
      rank: score > 5000 ? 'S' : score > 3000 ? 'A' : score > 1000 ? 'B' : 'C',
      seed: this.daily.getSeed() || 'casual'
    });
  }

  isTelemetryAllowed() { return privacyManager.getConsent(); }
  exportUserData() { return privacyManager.getAllData(); }
  wipeUserData(keepSettings: boolean) { privacyManager.deleteAll(keepSettings); }

  start(forceSeed?: number): void {
    this._isDisposed = false;
    this.stop();
    rhythmFeedback.reset();
    this.tickCount  = 0;
    this.evolveTick = 0;
    this.iMult      = this.config.speedMult;
    this.devGodMode = this.config.godMode ?? false;
    this.paused     = false;
    this.phase      = "playing";
    this.cellShape  = "square";
    this.spinLevel  = 0;
    this._lastTickTs = performance.now();
    this._deltaTimers = [];
    this._bossActive = false;
    this.gameSeed   = forceSeed ?? seedManager.initOrRestore();
    this.rng        = mulberry32(this.gameSeed);
    this.rareMode        = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
    this.nextShuffleTick = 40 + Math.floor(this.rng() * 20); // K2: first shuffle at tick 40-60
    this.bossEvent = null;
    this.nextBossTriggerScore = 500;
    this.activeBomb = null;
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
    analytics.track('game_start', { mode: this.config.mode, seed: this.gameSeed });
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

  private lastFrameTime = 0;

  private startSnapshotRaf(): void {
    this.lastFrameTime = performance.now();
    const loop = (timestamp: number) => {
      if (this.rafId === null) return;
      if (this.lastFrameTime > 0) {
        const frameTime = timestamp - this.lastFrameTime;
        if (this.phase === "playing") {
          this.updatePerformanceMetrics(frameTime);
        }
      }
      this.lastFrameTime = timestamp;
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

  private scheduleTimeout(cb: () => void, ms: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this._timeouts = this._timeouts.filter(t => t !== id);
      cb();
    }, ms);
    this._timeouts.push(id);
    return id;
  }

  private clearAllTimeouts(): void {
    this._timeouts.forEach(clearTimeout);
    this._timeouts = [];
  }

  addDeltaTimer(id: string, durationMs: number, callback: () => void) {
    this._deltaTimers.push({ id, remaining: durationMs, duration: durationMs, callback });
  }

  removeDeltaTimer(id: string) {
    this._deltaTimers = this._deltaTimers.filter(t => t.id !== id);
  }

  clearAllDeltaTimers() { this._deltaTimers = []; }

  pause(): void {
    if (this.phase !== "playing") return;
    this.paused = true;
    this.phase  = "paused";
    if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; }
    this.dirty = true;
    this._pauseListeners.forEach(fn => fn());
    this.emit({ type: "phaseChange", phase: "paused" });
    this.emitSnapshot();
  }

  resume(): void {
    if (this.phase !== "paused") return;
    this.paused = false;
    this.phase  = "playing";
    this.scheduleTick();
    this.dirty = true;
    this._resumeListeners.forEach(fn => fn());
    this.emit({ type: "phaseChange", phase: "playing" });
    this.emitSnapshot();
  }

  onPause(cb: () => void): void { this._pauseListeners.push(cb); }
  onResume(cb: () => void): void { this._resumeListeners.push(cb); }

destroy(): void {
    this._isDisposed = true;
    this._settingsUnsub?.();
    this._gamepadUnsub?.();
    this.holdTimers.forEach(({ timer }) => clearTimeout(timer));
    this.holdTimers.clear();
    this.tapBuffer = { 1: null, 2: null };
    this.clearAllTimeouts();
    this.clearAllDeltaTimers();
    this.stop();
    this.listeners.clear();
  }

  safeReset(keepSettings = false) {
    this.paused = false;
    this.phase = "playing";
    this.clearAllTimeouts();
    this.clearAllDeltaTimers();
    this.stop();
    this._sessionStartTime = performance.now();
    this._lastTapTime = 0;
    this._tickSoundCounter = 0;
    this._isInverted = false;

    this.p1.health = GAME.MAX_HEARTS;
    this.p1.score = 0;
    this.p1.streak = 0;
    this.p1.active = [];
    this.p2.health = GAME.MAX_HEARTS;
    this.p2.score = 0;
    this.p2.streak = 0;
    this.p2.active = [];
    this.tickCount = 0;
    this.evolveTick = 0;
    this.activeBomb = null;
    rhythmFeedback.reset();
    this.dda.reset(1200);

    if (!keepSettings) this._settingsUnsub?.();
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

  // K1-K4: Cell shuffle — 1-2 cells slide to adjacent empty positions
  private tryShuffleCells(ref: PlayerState, pat: { cols: number; rows: number; mask: number[] | null }, player: 1 | 2): void {
    // K2: only Evolve, stage 3+
    if (this.config.mode !== "evolve" || ref.gridStage < 3) return;
    if (this.tickCount < this.nextShuffleTick) return;

    // Schedule next shuffle: 40-60 ticks from now
    this.nextShuffleTick = this.tickCount + 40 + Math.floor(this.rng() * 20);

    const { cols, rows, mask } = pat;
    const total = cols * rows;
    const validSlots = new Set<number>(mask ?? Array.from({ length: total }, (_, i) => i));

    // Find occupied (non-clicked, non-void) and empty valid slots
    const occupied = new Set<number>(ref.active.filter(c => !c.clicked).map(c => c.idx));
    const empty = [...validSlots].filter(i => !occupied.has(i));
    if (empty.length === 0) return;

    // Pick 1-2 cells to shuffle (K1)
    const shuffleCount = 1 + (this.rng() < 0.35 ? 1 : 0);
    const candidates = ref.active.filter(c =>
      !c.clicked &&
      validSlots.has(c.idx) &&
      c.type !== "hold" &&   // K4: don't shuffle hold — holdStart would be invalid
      c.type !== "ice"       // K4: don't shuffle ice — iceCount mid-tap confusing
    );

    if (candidates.length === 0) return;

    const moved: number[] = [];
    for (let i = 0; i < Math.min(shuffleCount, candidates.length); i++) {
      if (empty.length === 0) break;

      // Pick random candidate not already moved
      const cIdx = Math.floor(this.rng() * candidates.length);
      const cell  = candidates[cIdx];
      if (moved.includes(cell.idx)) continue;

      // Pick random adjacent empty slot (prefer adjacency for visual clarity)
      const adjacent = this.getAdjacentSlots(cell.idx, cols, rows, validSlots)
        .filter(s => !occupied.has(s) && !moved.includes(s));
      const targetPool = adjacent.length > 0 ? adjacent : empty.filter(s => !moved.includes(s));
      if (targetPool.length === 0) continue;

      const toIdx = targetPool[Math.floor(this.rng() * targetPool.length)];

      // K4: retain type and all other properties, only move idx
      const fromIdx = cell.idx;
      cell.idx = toIdx;
      occupied.delete(fromIdx);
      occupied.add(toIdx);
      const emptyI = empty.indexOf(toIdx);
      if (emptyI !== -1) empty.splice(emptyI, 1);
      empty.push(fromIdx);
      moved.push(toIdx);

      // K3: record slide animation on PlayerState
      if (!ref.slideAnim) ref.slideAnim = {};
      ref.slideAnim[toIdx] = { fromIdx, startMs: Date.now() };

      // Auto-clear slide anim after duration
      this.scheduleTimeout(() => {
        if (ref.slideAnim) delete ref.slideAnim[toIdx];
        this.dirty = true;
      }, this.SHUFFLE_DURATION_MS + 50);

      // K5: emit cellShuffle event
      this.emit({ type: "cellShuffle", player, fromIdx, toIdx });
      // M1: play sound on shuffle
      this.emit({ type: "sound", name: "shuffle" });
    }

    if (moved.length > 0) {
      ref.cells = activeToCellsP(ref.active, pat);
      this.dirty = true;
    }
  }

  // Helper: get valid adjacent slot indices (4-directional)
  private getAdjacentSlots(idx: number, cols: number, rows: number, validSlots: Set<number>): number[] {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const adj: number[] = [];
    if (row > 0)        { const n = idx - cols; if (validSlots.has(n)) adj.push(n); }
    if (row < rows - 1) { const n = idx + cols; if (validSlots.has(n)) adj.push(n); }
    if (col > 0)        { const n = idx - 1;    if (validSlots.has(n)) adj.push(n); }
    if (col < cols - 1) { const n = idx + 1;    if (validSlots.has(n)) adj.push(n); }
    return adj;
  }

  private processTick(): void {
    try {
    if (this.phase !== "playing") return;
    const now = performance.now();
    const delta = Math.min(now - this._lastTickTs, 100);
    this._lastTickTs = now;
    this._deltaTimers = this._deltaTimers.filter(timer => {
      timer.remaining -= delta;
      if (timer.remaining <= 0) { timer.callback(); return false; }
      return true;
    });
    const mode = this.config.mode;
    this._flushTapBuffer(1);
    if (this.config.numPlayers === 2) this._flushTapBuffer(2);
    this.evolveTick += 1;
    if (mode === "evolve") this.cellShape = pickCellShape(this.evolveTick);

    if (mode === "evolve") {
      if (this.rareMode.active) {
        this.rareMode.turnsLeft -= 1;
        if (this.rareMode.turnsLeft <= 0) {
          this.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
          this.emit({ type: "toast", message: "🟣 Back to Purple!" });
        }
      } else {
        const s1 = this.p1.score;
        // Pre-warn one score-window before rare mode activates
        const RARE_TRIGGER_INTERVAL = 50;
        const RARE_PRE_WARN_THRESHOLD = 3;
        if (
          s1 > 0 &&
          (s1 % RARE_TRIGGER_INTERVAL) === (RARE_TRIGGER_INTERVAL - RARE_PRE_WARN_THRESHOLD)
        ) {
          this.emit({ type: "toast", message: "⚠️ Danger color changing soon!" });
        }
        if (s1 >= 50 && s1 % 50 < 4 && this.rng() < 0.35) {
          const pick = RARE_COLORS[Math.floor(this.rng() * RARE_COLORS.length)];
          this.rareMode = { active: true, color: pick.color, cssColor: pick.cssColor, turnsLeft: 5 + Math.floor(this.rng() * 4), shape: pick.shape, emoji: pick.emoji };
          this.emit({ type: "rareStart", color: pick.color, cssColor: pick.cssColor });
          this.emit({ type: "sound", name: "rareStart" }); // M2
          this.emit({ type: "toast", message: `⚠️ Don't Touch ${pick.color.toUpperCase()}!` });
        }
      }
    }

    const players: Array<{ ref: PlayerState; pi: 0 | 1 }> = [{ ref: this.p1, pi: 0 }, { ref: this.p2, pi: 1 }];
    for (const { ref, pi } of players) {
      if (!ref.alive || (pi === 1 && this.config.numPlayers === 1)) continue;
      if (ref.pendingStageUpdate) {
        ref.pendingStageUpdate = false; ref.gridStage += 1; ref.stageProgress = 0;
        // Only increment spinLevel if not in keys mode (rotation locked for keyboard input)
        if (this.config.inputMode !== 'keys') {
          this.spinLevel += 1;
        }
        this.emit({ type: "sound",   name: "levelup" });
        this.emit({ type: "levelUp", player: (pi + 1) as 1 | 2, stage: ref.gridStage });
      }
      const curStage = ref.gridStage;
      const patIdx   = ref.patternIdx;
      const pat = mode === "evolve" ? (EVOLVE_PATTERNS[patIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      if (!pat || pat.cols === 0) { logError("[DTP-002]"); continue; }
      const validSlots = new Set(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i));
      const dangerColor = this.rareMode.active ? this.rareMode.color : "purple";
      this._isInverted = this.bossEvent?.type === "inversion" && Date.now() < (this.bossEvent?.endsAt ?? 0);

      const player = (pi + 1) as 1 | 2;

      ref.active.forEach(c => {
        if (!validSlots.has(c.idx) || c.clicked) return;
        const isPwr = ["medpack","shield","freeze","multiplier","ice","hold","bomb"].includes(c.type);
        // Inversion: purple is safe (miss = purple), normal: safe = non-danger (miss = non-danger)
        const isMiss = this._isInverted ? c.type === "purple" && !isPwr : c.type !== dangerColor && !isPwr;
        if (isMiss) {
          this.dda.recordAttempt(false, 0, true);
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
          haptics.damage();
          if (ref.streak >= 5) this.emit({ type: "toast", message: `💔 ${ref.streak} streak lost!` });
          ref.streak = 0;
        }
        // Danger color cells that weren't tapped just disappear — no penalty
      });
      if (!ref.alive) continue;

      // Expire hold cells that were never started (or started too long ago) — prevent permanent grid lock
      const now = Date.now();
      ref.active.forEach(c => {
        if (c.clicked || c.type !== "hold") return;
        const hold = c as import("./types").HoldCell;
        const deadline = hold.holdStart
          ? hold.holdStart + hold.holdRequired + 500   // started: expire 500ms after required
          : hold.spawnedAt + hold.holdRequired + 1500; // never started: expire after holdRequired + 1.5s grace
        if (now > deadline) {
          hold.clicked = true; // mark expired — tick will proceed, no infinite freeze
          const dmg = mode === "evolve" ? 0.5 : 1;
          if (!this.devGodMode) {
            if (ref.shieldCount > 0) { ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
            else {
              ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
              this.emit({ type: "damage", player }); this.emit({ type: "shake", player });
              this.emit({ type: "toast", message: "⏳ Hold expired!" });
              if (ref.health <= 0) {
                ref.alive = false;
                const other = this.config.numPlayers === 2 ? (pi === 0 ? this.p2.alive : this.p1.alive) : false;
                this.triggerGameOver(this.config.numPlayers === 1 ? null : other ? (pi === 0 ? "p2" : "p1") : "tie");
              }
            }
          }
        }
      });

      if (ref.active.some(c => !c.clicked && (c.type === "hold" || c.type === "ice"))) { ref.cells = activeToCellsP(ref.active, pat); continue; }
      const nextPatIdx = mode === "evolve" ? pickPattern(this.rng, curStage, patIdx, ref.score) : 0;
      ref.patternIdx = nextPatIdx;
      const nextPat = mode === "evolve" ? (EVOLVE_PATTERNS[nextPatIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      const rareColor = this.rareMode.active ? this.rareMode.color : undefined;
      const rareShape = this.rareMode.active ? this.rareMode.shape : undefined;
      const spawnStage = mode === "evolve" ? curStage : Math.min(Math.floor(this.tickCount / 12), 7);
      const newActive = spawnActive(this.rng, spawnStage, ref.health, nextPat, mode === "evolve", rareColor, rareShape, this.tickCount, this.devGodMode);
      if (this.devForcedPwr && newActive.length > 0) {
        newActive[0] = { ...newActive[0], type: (this.devForcedPwr === "heart" ? "medpack" : this.devForcedPwr) } as ActiveCell;
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
        const botInverted = this.bossEvent?.type === "inversion" && Date.now() < (this.bossEvent?.endsAt ?? 0);
        const missedCells = ref.active.filter(c =>
          !c.clicked &&
          (botInverted ? c.type === dangerColor : c.type !== dangerColor) &&
          (c.type as string) !== "void" &&
          c.type !== "hold" &&
          c.type !== "ice"
        );
        for (const cell of missedCells) {
          if (this.rng() > accuracy) continue; // accuracy miss (use seeded rng)
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

    // K1: Cell shuffle — only for p1 in single player (or both in 2P)
    if (this.config.mode === "evolve") {
      // Boss event: Storm triples shuffle frequency
      const stormActive = this.bossEvent?.type === "storm" && Date.now() < (this.bossEvent?.endsAt ?? 0);
      const shufflePat = EVOLVE_PATTERNS[this.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
      if (stormActive) {
        // Force shuffle every tick by zeroing threshold; tryShuffleCells advances nextShuffleTick naturally
        this.nextShuffleTick = 0;
        if (this.p1.alive) this.tryShuffleCells(this.p1, shufflePat, 1);
        if (this.config.numPlayers === 2 && this.p2.alive) {
          const p2Pat = EVOLVE_PATTERNS[this.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
          this.tryShuffleCells(this.p2, p2Pat, 2);
        }
      } else {
        if (this.p1.alive) this.tryShuffleCells(this.p1, shufflePat, 1);
        if (this.config.numPlayers === 2 && this.p2.alive) {
          const p2Pat = EVOLVE_PATTERNS[this.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
          this.tryShuffleCells(this.p2, p2Pat, 2);
        }
      }

      // Boss event trigger: every 500 score points
      if (this.p1.score >= this.nextBossTriggerScore) this.triggerBossEvent();

      // Bomb spawn attempt each tick
      if (this.p1.alive) {
        const bombPat = EVOLVE_PATTERNS[this.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
        this.trySpawnBomb(this.p1, 1, bombPat);
      }
      if (this.config.numPlayers === 2 && this.p2.alive) {
        const bombPat2 = EVOLVE_PATTERNS[this.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
        this.trySpawnBomb(this.p2, 2, bombPat2);
      }
    }

    if (shouldTriggerShieldBoss(this.p1.score, this._bossActive, this.bossEvent !== null, mode, this.rng)) {
      this._bossActive = true;
      bossEngine.activate(5 + Math.floor(this.rng() * 3));
    }

    this.tickCount += 1;
    if (this.phase === "playing" && this.tickCount >= GAME.HUMAN_LIMIT_TICK) { this.phase = "humanlimit"; this.emit({ type: "phaseChange", phase: "humanlimit" }); }
    if (this.tickCount > GAME.SURVIVAL_BONUS_START_TICK && this.tickCount % 20 === 0) {
      const bonus = this.tickCount > 200 ? 5 : this.tickCount > 120 ? 3 : 2;
      const multBonus = Math.round(bonus * rhythmFeedback.state.multiplier);
      if (this.p1.alive) this.p1.score += multBonus;
      if (this.config.numPlayers === 2 && this.p2.alive) this.p2.score += multBonus;
      this.emit({ type: "toast", message: `🔥 Survival +${multBonus}!` });
    }
    this.dirty = true;
    this._tickSoundCounter++;
    if (this._tickSoundCounter % 4 === 0) {
      this.emit({ type: "sound", name: "tick" });
    }
    } catch (err) {
      logError("[GameEngine] processTick crashed:", err);
      errorTracker.capture(err instanceof Error ? err : new Error(String(err)), { phase: 'processTick', tick: this.tickCount });
      this.emit({ type: "toast", message: "⚠️ Engine error — game ended" });
      this.triggerGameOver(null);
    }
  }

  handleTap(player: 1 | 2, idx: number): void {
    if (this.phase !== "playing") return;
    const cellId = `p${player}-${idx}`;
    if (!this.inputBuffer.register(cellId)) return;
    haptics.tap();
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
    const isInvertedTap = this.bossEvent?.type === "inversion" && Date.now() < (this.bossEvent?.endsAt ?? 0);
    const danger = this.rareMode.active ? this.rareMode.color : "purple";

    if (cell.type === "ice") {
      const rem = (cell.iceCount ?? 1) - 1;
      this.triggerCellAnim(player, idx, rem <= 0 ? "pop" : "shake");
      this.emit({ type: "sound", name: rem <= 0 ? "ok" : "tick" });
      if (rem <= 0) {
        haptics.success();
        cell.clicked = true;
        const { mult } = calculateTapScore(Date.now() < ref.multiplierEnd, false, 1);
        ref.score += mult; ref.streak += 1; ref.stageProgress += 1;
        this.checkStageProgress(player);
        if (ref.active.every(c => c.clicked || (c.type as string) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.dirty = true; this.emitSnapshot(); return; }
      } else cell.iceCount = rem;
      ref.cells = activeToCellsP(ref.active, pat);
      this.dirty = true;
      this.emitSnapshot();
      return;
    }
    if (cell.type === "hold") return;
    // Bomb cell — defuse it
    if (cell.type === "bomb") {
      cell.clicked = true;
      if (this.activeBomb?.idx === idx && this.activeBomb?.player === player) this.activeBomb = null;
      this.triggerCellAnim(player, idx, "pop");
      this.emit({ type: "sound", name: "powerup" });
      this.emit({ type: "bombDefused", player });
      this.emit({ type: "toast", message: "💣✓ Defused! +3" });
      const { mult } = calculateTapScore(Date.now() < ref.multiplierEnd, false, 1);
      ref.score += mult * 3; ref.streak += 1; ref.stageProgress += 1;
      this.checkStageProgress(player);
      ref.cells = activeToCellsP(ref.active, pat);
      this.dirty = true;
      this.emitSnapshot();
      return;
    }
    const dmg = this.config.mode === "evolve" ? 0.5 : 1;
    if (["medpack","shield","freeze","multiplier"].includes(cell.type)) {
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
      const tappedIsDanger = isInvertedTap ? cell.type !== 'purple' : cell.type === danger;
      if (tappedIsDanger) {
        cell.clicked = true;
        this.dda.recordAttempt(false, 0, true);
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
      } else {
      cell.clicked = true; this.emit({ type: "sound", name: "ok" }); this.triggerCellAnim(player, idx, "pop");
      if (this._bossActive) bossEngine.onSafeTap();
      rhythmFeedback.recordTap();
      const { mult, bossMult } = calculateTapScore(Date.now() < ref.multiplierEnd, this._bossActive, bossEngine.combo.multiplier);
      ref.score += mult * bossMult; ref.streak += 1; ref.stageProgress += 1;
      if (checkStreakMilestone(ref.streak)) this.emit({ type: "toast", message: `🔥 ${ref.streak} Streak!` });
      if (ref.health === 1 && !this.devGodMode) this.emit({ type: "toast", message: "❤️ Last heart!" });
      this.checkStageProgress(player);
      const now = performance.now();
      const reaction = this._lastTapTime ? now - this._lastTapTime : 0;
      this._lastTapTime = now;
      if (reaction > 0) this.dda.recordAttempt(true, reaction, false);
      achievementSystem.check('first_blood', () => true);
      achievementSystem.check('survivor', () => ref.health <= 1 && this.tickCount > 300);
    }
    }
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private checkStageProgress(player: 1 | 2): void {
    const ref = player === 1 ? this.p1 : this.p2;
    if (this.config.mode === "evolve" && ref.stageProgress >= GAME.STAGE_TAPS_NEEDED && ref.gridStage < STAGES.length - 1) ref.pendingStageUpdate = true;
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
    (cell as HoldCell).holdStart = Date.now();
    const key = `${player}_${idx}`;
    if (this.holdTimers.has(key)) {
      clearTimeout(this.holdTimers.get(key)!.timer);
      this.removeDeltaTimer(`hold_${key}`);
      this.holdTimers.delete(key);
    }
    this.addDeltaTimer(`hold_${key}`, GAME.HOLD_TIMEOUT_MS, () => {
      const entry = this.holdTimers.get(key);
      if (!entry || entry.cell.clicked) return;
      (entry.cell as HoldCell).holdStart = undefined;
      this.dirty = true;
      this.triggerCellAnim(entry.player, entry.cell.idx, "shake");
      this.emitSnapshot();
      this.holdTimers.delete(key);
    });
    this.holdTimers.set(key, { timer: null as unknown as NodeJS.Timeout, cell, player });
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
    if (entry) { clearTimeout(entry.timer); this.removeDeltaTimer(`hold_${key}`); this.holdTimers.delete(key); }
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    const elapsed = Date.now() - ((cell as HoldCell).holdStart ?? Date.now());
    if (elapsed >= (cell as HoldCell).holdRequired) {
      cell.clicked = true; this.triggerCellAnim(player, idx, "pop");
      this.emit({ type: "sound", name: "powerup" });
      const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
      ref.score += mult * 2; ref.streak += 1; ref.stageProgress += 1;
      this.checkStageProgress(player);
      this.emit({ type: "toast", message: "💪 Hold! +2" });
      if (ref.active.every(c => c.clicked || (c.type as string) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.emitSnapshot(); return; }
    } else { (cell as HoldCell).holdStart = undefined; this.triggerCellAnim(player, idx, "shake"); }
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
    const rareShape = this.rareMode.active ? this.rareMode.shape : undefined;
    this.p1.active = spawnActive(this.rng, this.p1.gridStage, this.p1.health, pat, this.config.mode === "evolve", rareColor, rareShape, this.tickCount, this.devGodMode);
    this.p1.cells = activeToCellsP(this.p1.active, pat);

    this.p2.active = spawnActive(this.rng, this.p2.gridStage, this.p2.health, pat, this.config.mode === "evolve", rareColor, rareShape, this.tickCount, this.devGodMode);
    this.p2.cells  = activeToCellsP(this.p2.active, pat);
    this.emitSnapshot();
  }

  devForceRare(r: { color: string; cssColor: string; shape?: CellShape; emoji?: string } | null): void {
    if (!r) this.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
    else { this.rareMode = { active: true, color: r.color, cssColor: r.cssColor, turnsLeft: 10, shape: r.shape ?? "circle", emoji: r.emoji ?? "" }; this.emit({ type: "rareStart", color: r.color, cssColor: r.cssColor }); this.emit({ type: "sound", name: "rareStart" }); }
    this.emitSnapshot();
  }

  devSetGodMode(v: boolean): void { this.devGodMode = v; }
  devSetFreezeTime(v: boolean): void { this.devFreezeTime = v; }
  devSetRotationSpeed(v: number): void { this.devRotationSpeed = Math.max(0.1, v); }
  devSpawnPowerup(type: "shield" | "freeze" | "heart"): void { this.devForcedPwr = type; }
  getDevRotationSpeed(): number { return this.devRotationSpeed; }

  updatePerformanceMetrics(frameTime: number): void {
    const fps = 1000 / Math.max(frameTime, 1);
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 60) this.fpsHistory.shift();
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    if (!this.autoLowQuality && avgFps < this.lowQualityThreshold) {
      this.autoLowQuality = true;
      document.documentElement.style.setProperty('--particles-enabled', '0');
      document.documentElement.style.setProperty('--motion-scale', '0.5');
      this.emit({ type: "qualityDowngrade", reason: "fps-drop", avgFps } as any);
    } else if (this.autoLowQuality && avgFps > 50) {
      this.autoLowQuality = false;
      document.documentElement.style.setProperty('--particles-enabled', '1');
      document.documentElement.style.setProperty('--motion-scale', '1');
      this.emit({ type: "qualityUpgrade", avgFps } as any);
    }
  }

  getAutoLowQuality(): boolean { return this.autoLowQuality; }

  startSessionPersistence(): void {
    if (this._sessionAutoSaveInterval) return;
    this._sessionAutoSaveInterval = setInterval(() => {
      if (this.phase === "playing" && !this.paused && this.p1.alive) {
        sessionManager.save({
          hearts: this.p1.health,
          score: this.p1.score,
          timeLeft: GAME.HUMAN_LIMIT_TICK - this.tickCount,
          isPaused: this.paused
        }, { theme: (this as any)._currentThemeId, difficulty: this.config.mode });
      }
    }, 5000);
  }

  stopSessionPersistence(): void {
    if (this._sessionAutoSaveInterval) {
      clearInterval(this._sessionAutoSaveInterval);
      this._sessionAutoSaveInterval = null;
    }
  }

  restoreFromSession(data: { hearts?: number; score?: number; timeLeft?: number }): void {
    if (data.hearts != null) this.p1.health = data.hearts;
    if (data.score != null) this.p1.score = data.score;
    if (data.timeLeft != null) this.tickCount = Math.max(0, GAME.HUMAN_LIMIT_TICK - data.timeLeft);
  }

  submitScoreToLeaderboard(score: number): void {
    scoreSync.queue(score);
  }

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
      bossEvent:  this.bossEvent ? { ...this.bossEvent } : null,
      activeBomb: this.activeBomb ? { ...this.activeBomb } : null,
      isInverted: this.bossEvent?.type === "inversion" && Date.now() < (this.bossEvent?.endsAt ?? 0),
      isBlackout: this.bossEvent?.type === "blackout"  && Date.now() < (this.bossEvent?.endsAt ?? 0),
    };
  }

  getSpinConfig(level: number): { duration: number; direction: 1 | -1 } { return getSpinConfig(level, this.gameSeed); }

  private triggerBossEvent(): void {
    const prevType = this.bossEvent?.type ?? null;
    const type = getNextBossEventType(prevType);
    const durationMs = getBossDuration(type);
    this.bossEvent = { type, endsAt: Date.now() + durationMs };
    this.nextBossTriggerScore = getNextBossTriggerScore(this.nextBossTriggerScore);
    this.emit({ type: "bossStart", bossType: type });
    this.emit({ type: "sound", name: "bossStart" });
    this.emit({ type: "toast", message: getBossLabel(type) });
    setTimeout(() => {
      if (this.bossEvent?.type === type) {
        this.bossEvent = null;
        this.dirty = true;
        this.emit({ type: "toast", message: getBossDoneLabel(type) });
      }
    }, durationMs);
  }

  // Spawn a bomb cell for player if none active and score > 100
  private trySpawnBomb(ref: PlayerState, player: 1 | 2, pat: { cols: number; rows: number; mask: number[] | null }): void {
    if (this.activeBomb && this.activeBomb.player === player) return;
    if (ref.score < 100) return;
    if (this.rng() > 0.12) return; // ~12% chance per tick when eligible

    const validSlots = pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i);
    const occupied = new Set(ref.active.filter(c => !c.clicked).map(c => c.idx));
    const free = validSlots.filter(i => !occupied.has(i));
    if (free.length === 0) return;

    const idx = free[Math.floor(this.rng() * free.length)];
    const expiresAt = Date.now() + 2000;
    const bomb: BombCell = { idx, clicked: false, type: "bomb", expiresAt };
    ref.active.push(bomb);
    ref.cells = activeToCellsP(ref.active, pat);
    this.activeBomb = { idx, expiresAt, player };
    this.dirty = true;
    this.emit({ type: "bombSpawn", player, idx, expiresAt });
    haptics.bomb();
    this.emit({ type: "sound", name: "bomb" });
    this.emit({ type: "toast", message: "💣 BOMB! Tap it!" });

    this.addDeltaTimer(`bomb_${player}_${idx}`, 2000, () => {
      if (!this.activeBomb || this.activeBomb.idx !== idx || this.activeBomb.player !== player) return;
      const stillActive = ref.active.find(c => c.idx === idx && c.type === "bomb" && !c.clicked);
      if (!stillActive) return;
      stillActive.clicked = true;
      this.activeBomb = null;
      if (!this.devGodMode) {
        if (ref.shieldCount > 0) { ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
        else {
          const dmg = this.config.mode === "evolve" ? 0.5 : 1;
          ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
          this.emit({ type: "damage", player }); this.emit({ type: "shake", player });
          if (ref.health <= 0) {
            ref.alive = false;
            this.triggerGameOver(this.config.numPlayers === 1 ? null : (player === 1 ? "p2" : "p1"));
          }
        }
      }
      this.emit({ type: "bombExplode", player });
      this.emit({ type: "toast", message: "💥 Bomb exploded!" });
      const pat2 = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      ref.cells = activeToCellsP(ref.active, pat2);
      this.dirty = true;
    });
  }

private triggerGameOver(winner: Winner): void {
    // Clear pending taps, hold timers, and delta timers
    this.tapBuffer = { 1: null, 2: null };
    this.holdTimers.forEach(({ timer }) => clearTimeout(timer));
    this.holdTimers.clear();
    this.clearAllDeltaTimers();

    this.stop(); this.phase = "gameover";
    const cur = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    this.config.storage?.saveStoredPowerups({
      freeze: Math.max(0, this.p1.storedFreezeCharges ?? 0),
      shield: Math.max(0, this.p1.storedShieldCharges ?? 0),
      mult: cur.mult,
      heart: cur.heart,
    });
    this.emit({ type: "phaseChange", phase: "gameover" });
    this.emit({ type: "gameOver", winner });
    analytics.track('game_over', { score: this.p1.score, mode: this.config.mode, winner });
    this.dda.reset(this._config.grid.spawnRateMs);
    if (!this.daily.isTodayComplete()) {
      this.daily.markComplete(this.p1.score, this.tickCount);
      achievementSystem.unlock('daily_master');
    }
  }

  startBot(): void {
    if (this.config.mode !== "evolve") return;

    if (this.botIntervalRef) {
      clearInterval(this.botIntervalRef);
      this.botIntervalRef = null;
    }

    // Unit tests may not provide config.botAssist.
    // Provide a safe fallback so botActive can still be toggled deterministically.
    const botCfg = this.config.botAssist ?? {
      getDust: () => 9999,
      spendDust: (_amount: number) => {},
      getAccuracy: () => 1,
    };

    this.botActive = true;
    this.dustSpentTotal = 0;


    this.botIntervalRef = setInterval(() => {
      if (!this.botActive || this.phase !== "playing") return;
      if (typeof document !== "undefined" && document.hidden) return;

      const currentDust = botCfg.getDust();
      if (currentDust < 30) {
        this.botActive = false;
        this.emit({ type: "toast", message: "🤖 Bot off — low dust!" });
        return;
      }

      const delay = Math.max(80, 200 - this.dustSpentTotal * 0.5);
      const active = this.p1.active;

      const dangerColorNow = this.rareMode.active ? this.rareMode.color : "purple";
      const accuracy = botCfg.getAccuracy();
      const costPerTap = 3;
      const dangerIdentity = dangerColorNow;

      active.forEach(cell => {
        if (cell.clicked) return;
        if ((cell.type as string) === "void") return;

        if (cell.type === dangerIdentity) return;
        if (this.rng() > accuracy) return;

        // Skip specials in this timer-based bot path.
        if (cell.type === "hold" || cell.type === "ice") return;

        const dustNow = botCfg.getDust();
        if (dustNow < costPerTap) return;

        botCfg.spendDust(costPerTap);
        this.dustSpentTotal += costPerTap;
        this.emit({ type: "dustConsumed", amount: costPerTap });

        setTimeout(() => {
          if (!this.botActive || this.phase !== "playing") return;
          this.handleTap(1, cell.idx);
          this.emit({ type: "botTap", player: 1, idx: cell.idx, dustCost: costPerTap });
        }, delay);
      });
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
    if (player === 1) {
      if (enabled) this.startBot(); else this.stopBot();
    }
  }

  getBotAssistActive(): { 1: boolean; 2: boolean } {
    return { ...this.botAssistActive };
  }
}
