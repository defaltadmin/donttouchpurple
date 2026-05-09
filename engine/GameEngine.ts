import { DIFFICULTY, GAME, LS_KEYS } from "../config/difficulty";
import { STAGES, EVOLVE_PATTERNS, getRareModeConfig } from "../config/gridPatterns";
import { POWERUP_TABLE } from "../config/powerupWeights";
import { computeMs, makeGameSeed, getSpinConfig, mulberry32 } from "./DifficultyScaler";
import { logError } from "../utils/devLog";
import { InputBuffer } from "../utils/input-smoothing";
import { haptics } from "../utils/haptics";
import { sessionManager } from "../utils/session";
import { stateGuard } from "../utils/state-guard";
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
import { rhythmFeedback } from "../utils/feedback-rhythm";
import type {
  ActiveCell, CellType, CellShape, GameConfig, GameEvent,
  GameMode, GameSnapshot, NumPlayers, PlayerState, RareColorMode, Winner,
  BombCell, BossEvent, BossEventType, HoldCell,
} from "./types";
import {
  activeToCellsP, spawnActive,
} from "./subsystems/CellLifecycle";
import { calculateTapScore, checkStreakMilestone } from "./subsystems/ScoreTracker";
import { challengeLink } from "../utils/challenge-link";
import { TickProcessor, type TickContext } from "./subsystems/TickProcessor";
import { BotController } from "./subsystems/BotController";

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

// ΓöÇΓöÇΓöÇ GameEngine class ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
  // K1: cell shuffle state
  private nextShuffleTick: number = 0;
  private readonly SHUFFLE_DURATION_MS = 200; // K3: slide animation duration
  // Boss/Bomb state
  private bossEvent: BossEvent | null = null;
  private nextBossTriggerScore = 500;
  private readonly SESSION_KEY = 'dtp:session';
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
  private _tickProcessor = new TickProcessor();
  private _tickCtx!: TickContext;
  private _bot: BotController;

  constructor(private config: GameConfig) {
    perfMonitor.observe();
    this._sessionStartTime = performance.now();
    this.iMult = config.speedMult;
    this.devGodMode = config.godMode ?? false;
    achievementSystem.load();
    achievementSystem.register({ id: 'first_blood', name: 'First Strike', desc: 'Clear your first cell', icon: '≡ƒÆÑ', unlocked: false });
    achievementSystem.register({ id: 'survivor', name: 'Iron Will', desc: 'Reach last heart and survive 30s', icon: '≡ƒ¢í∩╕Å', unlocked: false });
    achievementSystem.register({ id: 'daily_master', name: 'Daily Grind', desc: "Complete today's challenge", icon: '≡ƒôà', unlocked: false });
    audioEngine.init();
    import('../utils/settings').then(m => {
      this._settingsUnsub = m.settingsManager.subscribe(s => this._applySettings(s));
    }).catch(e => logError('Settings module failed', e));
    window.addEventListener('dtp:boss:complete', () => { this._bossActive = false; });
    window.addEventListener('dtp:difficulty:emergency', () => {
      const bonus = Math.round(50 * rhythmFeedback.state.multiplier);
      this.p1.score += bonus;
      this.emit({ type: "toast", message: `ΓÜû∩╕Å Difficulty adjusted! +${bonus} pts` });
      document.documentElement.setAttribute('data-dda-emergency', 'true');
      setTimeout(() => document.documentElement.removeAttribute('data-dda-emergency'), 2200);
    });
    gamepadManager.init();
    this._gamepadUnsub = gamepadManager.on((btn, state) => {
      if (state !== 'press') return;
      if (btn === 'a' || btn === 'dpad_up') this.handleTap(1, parseInt(this._lastFocusedCell) || 0);
      if (btn === 'start') this.paused ? this.resume() : this.pause();
    });
    const self = this;
    this._tickCtx = {
      get config() { return self.config; },
      get phase() { return self.phase; }, set phase(v) { self.phase = v; },
      get tickCount() { return self.tickCount; }, set tickCount(v) { self.tickCount = v; },
      get evolveTick() { return self.evolveTick; }, set evolveTick(v) { self.evolveTick = v; },
      get cellShape() { return self.cellShape; }, set cellShape(v) { self.cellShape = v; },
      get rareMode() { return self.rareMode; }, set rareMode(v) { self.rareMode = v; },
      get spinLevel() { return self.spinLevel; }, set spinLevel(v) { self.spinLevel = v; },
      get p1() { return self.p1; },
      get p2() { return self.p2; },
      get bossEvent() { return self.bossEvent; }, set bossEvent(v) { self.bossEvent = v; },
      get _bossActive() { return self._bossActive; }, set _bossActive(v) { self._bossActive = v; },
      get _isInverted() { return self._isInverted; }, set _isInverted(v) { self._isInverted = v; },
      get nextShuffleTick() { return self.nextShuffleTick; }, set nextShuffleTick(v) { self.nextShuffleTick = v; },
      get nextBossTriggerScore() { return self.nextBossTriggerScore; }, set nextBossTriggerScore(v) { self.nextBossTriggerScore = v; },
      get activeBomb() { return self.activeBomb; }, set activeBomb(v) { self.activeBomb = v; },
      get dirty() { return self.dirty; }, set dirty(v) { self.dirty = v; },
      get _tickSoundCounter() { return self._tickSoundCounter; }, set _tickSoundCounter(v) { self._tickSoundCounter = v; },
      get _lastTickTs() { return self._lastTickTs; }, set _lastTickTs(v) { self._lastTickTs = v; },
      get numPlayers() { return self.config.numPlayers; },
      get _deltaTimers() { return self._deltaTimers; }, set _deltaTimers(v) { self._deltaTimers = v; },
      get devGodMode() { return self.devGodMode; }, set devGodMode(v) { self.devGodMode = v; },
      get devFreezeTime() { return self.devFreezeTime; }, set devFreezeTime(v) { self.devFreezeTime = v; },
      get devForcedPwr() { return self.devForcedPwr; }, set devForcedPwr(v) { self.devForcedPwr = v; },
      get botAssistActive() { return self.botAssistActive; }, set botAssistActive(v) { self.botAssistActive = v; },
      get dda() { return self.dda; },
      emit: (e) => self.emit(e),
      _flushTapBuffer: (p) => self._flushTapBuffer(p),
      checkStageProgress: (p) => self.checkStageProgress(p),
      autoSaveSession: () => self.autoSaveSession(),
      triggerGameOver: (w) => self.triggerGameOver(w),
      scheduleTimeout: (cb, ms) => self.scheduleTimeout(cb, ms),
      addDeltaTimer: (id, dur, cb) => self.addDeltaTimer(id, dur, cb),
      removeDeltaTimer: (id) => self.removeDeltaTimer(id),
      get rng() { return self.rng; },
    };
    this._bot = new BotController({
      getDangerColor:  () => this.rareMode?.active ? this.rareMode.color : 'purple',
      isInverted:      () => this.bossEvent?.type === 'inversion' && Date.now() < (this.bossEvent?.endsAt ?? 0),
      handleTap:       (player, idx) => this.handleTap(player, idx),
      emit:            (event) => this.emit(event as any),
      getActiveCells:  (player) => (player === 1 ? this.p1 : this.p2).active,
      isPlaying:       () => this.phase === 'playing',
    });
  }

  private _applySettings(s: { reducedMotion?: boolean; liteMode?: boolean }) {
    if (s.liteMode !== undefined) {
      this.skipParticles = s.liteMode;
      // Cap engine tick rate if needed, but computeMs already handles difficulty.
      // We mainly want to reduce visual load.
    }
    if (s.reducedMotion !== undefined) {
      this.devRotationSpeed = s.reducedMotion ? 0.5 : 1;
    }
  }

  private skipParticles = false;

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

  start(forceSeed?: number): void {
    this._isDisposed = false;
    this.stop();
    rhythmFeedback.reset();
    sessionStorage.removeItem(this.SESSION_KEY);
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
    this._bot.setRng(this.rng);
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
    this._bot.dispose();
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
    sessionStorage.removeItem(this.SESSION_KEY);
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
    this._bot.dispose();

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

  private processTick(): void {
    this._tickProcessor.processTick(this._tickCtx);
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
    // Bomb cell ΓÇö defuse it
    if (cell.type === "bomb") {
      cell.clicked = true;
      if (this.activeBomb?.idx === idx && this.activeBomb?.player === player) this.activeBomb = null;
      this.triggerCellAnim(player, idx, "pop");
      this.emit({ type: "sound", name: "powerup" });
      this.emit({ type: "bombDefused", player });
      this.emit({ type: "toast", message: "≡ƒÆúΓ£ô Defused! +3" });
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
        this.emit({ type: "pwrToast", message: `≡ƒ¢í Shield ├ù${ref.shieldCount}!`, player });
      } else if (cell.type === "medpack") {
        this.emit({ type: "toast", message: "ΓÖÑ +1 Heart!" });
      } else if (cell.type === "multiplier") {
        this.emit({ type: "pwrToast", message: "ΓÜí multiplier ├ù2!", player });
      } else {
        this.emit({ type: "pwrToast", message: "Γ¥ä Freeze activated!", player });
      }
    } else {
      const tappedIsDanger = isInvertedTap ? cell.type !== 'purple' : cell.type === danger;
      if (tappedIsDanger) {
        cell.clicked = true;
        this.dda.recordAttempt(false, 0, true);
        if (!this.devGodMode) {
          if (ref.shieldCount > 0) { ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; this.emit({ type: "sound", name: "ok" }); this.triggerCellAnim(player, idx, "pop"); }
          else {
            if (ref.streak >= 5) this.emit({ type: "toast", message: `≡ƒÆö ${ref.streak} streak lost!` });
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
      if (checkStreakMilestone(ref.streak)) this.emit({ type: "toast", message: `≡ƒöÑ ${ref.streak} Streak!` });
      if (ref.health === 1 && !this.devGodMode) this.emit({ type: "toast", message: "Γ¥ñ∩╕Å Last heart!" });
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
      this.emit({ type: "toast", message: "≡ƒÆ¬ Hold! +2" });
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
    this.emit({ type: "toast", message: "Γ¥ä Freeze activated!" });
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
    this.emit({ type: "toast", message: `≡ƒ¢í Shield ├ù${ref.shieldCount}!` });
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

  async generateChallengeUrl(): Promise<string> {
    return challengeLink.generate(this.p1.score, this.gameSeed.toString(), this.p1.health);
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

  getSessionSnapshot(): Record<string, unknown> {
    return {
      version: 1,
      ts: Date.now(),
      gameSeed: this.gameSeed,
      tickCount: this.tickCount,
      evolveTick: this.evolveTick,
      cellShape: this.cellShape,
      spinLevel: this.spinLevel,
      rareMode: { ...this.rareMode },
      isInverted: this._isInverted,
      nextShuffleTick: this.nextShuffleTick,
      bossEvent: this.bossEvent ? { type: this.bossEvent.type, endsAt: this.bossEvent.endsAt } : null,
      nextBossTriggerScore: this.nextBossTriggerScore,
      _bossActive: this._bossActive,
      bossEngineActive: bossEngine.state.active,
      bossEngineShieldHits: bossEngine.state.shieldHits,
      activeBomb: this.activeBomb ? { idx: this.activeBomb.idx, expiresAt: this.activeBomb.expiresAt, player: this.activeBomb.player } : null,
      ddaSpawnRate: this.dda.spawnRate,
      hearts: this.p1.health,
      score: this.p1.score,
      timeLeft: GAME.HUMAN_LIMIT_TICK - this.tickCount,
      isPaused: this.paused,
      p1: {
        score: this.p1.score, health: this.p1.health, streak: this.p1.streak,
        gridStage: this.p1.gridStage, stageProgress: this.p1.stageProgress, patternIdx: this.p1.patternIdx,
        shield: this.p1.shield, shieldCount: this.p1.shieldCount,
        freezeEnd: this.p1.freezeEnd, multiplierEnd: this.p1.multiplierEnd,
        storedFreezeCharges: this.p1.storedFreezeCharges, storedShieldCharges: this.p1.storedShieldCharges,
        alive: this.p1.alive,
        active: this.p1.active.map(c => ({ ...c })),
      },
      p2: this.config.numPlayers === 2 ? {
        score: this.p2.score, health: this.p2.health, streak: this.p2.streak,
        gridStage: this.p2.gridStage, stageProgress: this.p2.stageProgress, patternIdx: this.p2.patternIdx,
        shield: this.p2.shield, shieldCount: this.p2.shieldCount,
        freezeEnd: this.p2.freezeEnd, multiplierEnd: this.p2.multiplierEnd,
        storedFreezeCharges: this.p2.storedFreezeCharges, storedShieldCharges: this.p2.storedShieldCharges,
        alive: this.p2.alive,
        active: this.p2.active.map(c => ({ ...c })),
      } : null,
    };
  }

  restoreSessionSnapshot(data: Record<string, unknown>): boolean {
    try {
      if (!data || !data.gameSeed) return false;
      this.gameSeed = data.gameSeed as number;
      this.rng = mulberry32(this.gameSeed);
      this.tickCount = (data.tickCount as number) ?? 0;
      this.evolveTick = (data.evolveTick as number) ?? 0;
      this.cellShape = (data.cellShape as CellShape) ?? "square";
      this.spinLevel = (data.spinLevel as number) ?? 0;
      if (data.rareMode) this.rareMode = stateGuard.sanitize(data.rareMode, this.rareMode);
      this._isInverted = (data.isInverted as boolean) ?? false;
      this.nextShuffleTick = (data.nextShuffleTick as number) ?? 40;
      this.bossEvent = data.bossEvent ? { type: (data.bossEvent as any).type, endsAt: (data.bossEvent as any).endsAt } : null;
      this.nextBossTriggerScore = (data.nextBossTriggerScore as number) ?? 500;
      this._bossActive = (data._bossActive as boolean) ?? false;
      if (data.bossEngineActive) bossEngine.activate((data.bossEngineShieldHits as number) ?? 5);
      this.activeBomb = data.activeBomb ? { idx: (data.activeBomb as any).idx, expiresAt: (data.activeBomb as any).expiresAt, player: (data.activeBomb as any).player } : null;
      this.dda.reset((data.ddaSpawnRate as number) ?? 1200);
      const p1 = data.p1 as Record<string, unknown> | undefined;
      if (p1) {
        this.p1.score = (p1.score as number) ?? 0;
        this.p1.health = (p1.health as number) ?? GAME.MAX_HEARTS;
        this.p1.streak = (p1.streak as number) ?? 0;
        this.p1.gridStage = (p1.gridStage as number) ?? 0;
        this.p1.stageProgress = (p1.stageProgress as number) ?? 0;
        this.p1.patternIdx = (p1.patternIdx as number) ?? 0;
        this.p1.shield = (p1.shield as boolean) ?? false;
        this.p1.shieldCount = (p1.shieldCount as number) ?? 0;
        this.p1.freezeEnd = (p1.freezeEnd as number) ?? 0;
        this.p1.multiplierEnd = (p1.multiplierEnd as number) ?? 0;
        this.p1.storedFreezeCharges = (p1.storedFreezeCharges as number) ?? 0;
        this.p1.storedShieldCharges = (p1.storedShieldCharges as number) ?? 0;
        this.p1.alive = (p1.alive as boolean) ?? true;
        this.p1.active = ((p1.active as Array<Record<string, unknown>>) ?? []).map(c => ({ ...c } as any));
        const pat = EVOLVE_PATTERNS[this.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
        this.p1.cells = activeToCellsP(this.p1.active, pat);
      }
      const p2 = data.p2 as Record<string, unknown> | null | undefined;
      if (p2 && this.config.numPlayers === 2) {
        this.p2.score = (p2.score as number) ?? 0;
        this.p2.health = (p2.health as number) ?? GAME.MAX_HEARTS;
        this.p2.streak = (p2.streak as number) ?? 0;
        this.p2.gridStage = (p2.gridStage as number) ?? 0;
        this.p2.stageProgress = (p2.stageProgress as number) ?? 0;
        this.p2.patternIdx = (p2.patternIdx as number) ?? 0;
        this.p2.shield = (p2.shield as boolean) ?? false;
        this.p2.shieldCount = (p2.shieldCount as number) ?? 0;
        this.p2.freezeEnd = (p2.freezeEnd as number) ?? 0;
        this.p2.multiplierEnd = (p2.multiplierEnd as number) ?? 0;
        this.p2.storedFreezeCharges = (p2.storedFreezeCharges as number) ?? 0;
        this.p2.storedShieldCharges = (p2.storedShieldCharges as number) ?? 0;
        this.p2.alive = (p2.alive as boolean) ?? true;
        this.p2.active = ((p2.active as Array<Record<string, unknown>>) ?? []).map(c => ({ ...c } as any));
        const pat2 = EVOLVE_PATTERNS[this.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
        this.p2.cells = activeToCellsP(this.p2.active, pat2);
      }
      this.emit({ type: "phaseChange", phase: "playing" });
      this.dirty = true;
      this.emitSnapshot();
      return true;
    } catch (e) {
      logError("Session restore failed", e);
      return false;
    }
  }

  private autoSaveSession(): void {
    if (this.phase !== "playing" || this.paused) return;
    try {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(this.getSessionSnapshot()));
    } catch {}
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

  startBot(): void { this._bot.start(this.config.mode, this.config.botAssist); }

  stopBot(): void { this._bot.stop(); }

  isBotActive(): boolean { return this._bot.isActive(); }

  setBotAssist(player: 1 | 2, enabled: boolean): void {
    this._bot.setAssist(player, enabled);
    if (player === 1 && enabled) this._bot.start(this.config.mode, this.config.botAssist);
  }

  getBotAssistActive(): { 1: boolean; 2: boolean } { return this._bot.getAssistState(); }
}
