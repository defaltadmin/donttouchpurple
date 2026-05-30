/**
 * CLOCK DOMAIN CONVENTION:
 * - Date.now(): Used for real-time game state (energy regen, bomb expiry, login streaks)
 * - performance.now(): Used for sub-frame timing (FPS measurement, animation deltas)
 * - Game ticks: Internal engine clock, advances once per tick interval
 *
 * Do NOT mix domains. When a value crosses domains, convert explicitly.
 */
import { GAME } from "../config/difficulty";
import { STAGES, EVOLVE_PATTERNS } from "../config/gridPatterns";
import { computeMs, makeGameSeed, getSpinConfig, mulberry32, speedLabel } from "./DifficultyScaler";
import { logError } from "../utils/devLog";
import { InputBuffer } from "../utils/input-smoothing";
import { haptics } from "../utils/haptics";
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
import { ACHIEVEMENT_DEFS } from "../config/achievementDefs";
import { DailyChallenge } from "../utils/seed-challenge";
import { perfMonitor } from "../utils/perf-monitor";
import { scoreCardGen } from "../utils/score-card";
import { rhythmFeedback } from "../utils/feedback-rhythm";
import type {
  ActiveCell, CellShape, GameConfig, GameEvent,
  GameSnapshot, PlayerState, RareColorMode, Winner,
  BossEvent, HoldCell, IceCell,
} from "./types";
import {
  activeToCellsP, spawnActive,
} from "./subsystems/CellLifecycle";
import { calculateStreakBonus, calculateTapScore, checkStreakMilestone } from "./subsystems/ScoreTracker";
import { challengeLink } from "../utils/challenge-link";
import { TickProcessor, type TickContext } from "./subsystems/TickProcessor";
import { BotController } from "./subsystems/BotController";
import { getBossDoneLabel } from "./subsystems/EventOrchestrator";

function makePS(bonusHearts: number, hasMult: boolean, stored: { freeze: number; shield: number; mult: number; heart: number }): PlayerState {
  return {
    cells: Array(25).fill("inactive"), active: [], score: 0, streak: 0,
    alive: true, anim: {}, health: GAME.MAX_HEARTS + bonusHearts,
    shield: false, shieldCount: 0, freezeEnd: 0,
    multiplierEnd: hasMult ? Date.now() + 24000 : 0,
    gridStage: 0, stageProgress: 0, patternIdx: 0,
    storedFreezeCharges: stored.freeze,
    storedShieldCharges: stored.shield,
    nextShuffleTick: 0,
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
  private holdTimers = new Map<string, { cell: ActiveCell, player: 1 | 2, generation: number }>();
  private holdGeneration = 0;
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
  private   devGodMode     = false;
  private devFreezeTime  = false;
  private devForcedPwr: "shield" | "freeze" | "heart" | null = null;
  private devRotationSpeed = 1;
  private botAssistActive: { 1: boolean; 2: boolean } = { 1: false, 2: false };

  private listeners: Set<(e: GameEvent) => void> = new Set();
  private _pauseListeners: Array<() => void> = [];
  private _resumeListeners: Array<() => void> = [];
  private inputBuffer = new InputBuffer();

  private fpsHistory: number[] = [];
  private fpsIdx = 0;
  private autoLowQuality = false;
  private lowQualityThreshold = 40;
  // Snapshot cache fields
  private _cachedMask: number[] | null = null;
  private _cachedMaskSrc: number[] | null = null;
  private _cachedSpinCfg: { duration: number; direction: 1 | -1 } | null = null;
  private _cachedSpinLevel = -1;
  private _cachedSpinSeed = -1;
  private _cachedRotationSpeed = 1;
  // K1: cell shuffle state
  // nextShuffleTick moved to PlayerState for per-player tracking
  private readonly SHUFFLE_DURATION_MS = 200; // K3: slide animation duration
  // Boss/Bomb state
  private bossEvent: BossEvent | null = null;
  private nextBossTriggerScore = 500;
  private activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null = null;
  private _settingsUnsub: (() => void) | null = null;
  private _gamepadUnsub: (() => void) | null = null;
  private _bossCompleteHandler: (() => void) | null = null;
  private _bossShieldBreakHandler: (() => void) | null = null;
  private _difficultyEmergencyHandler: (() => void) | null = null;
  private _lastFocusedCell = '0';
  private _config = configManager.get();
  private _configUnsub: (() => void) | null = null;
  private dda = new DynamicDifficulty(1200);
  private daily = new DailyChallenge();
  private _lastTapTime = 0;
  private _sessionStartTime = performance.now();
  private _isDisposed = false;
  private _isInverted = false;
  private _isBlackout = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];
  private _tickSoundCounter = 0;
  private _deltaTimers: Array<{ id: string; remaining: number; duration: number; callback: () => void }> = [];
  private _lastTickTs = performance.now();
  private _hitPauseUntil = 0; // Hit pause: freeze game briefly on impactful moments
  private _deathSlowdown = false; // Slow-motion on death before game over
  private _deathCleanupTimer: ReturnType<typeof setTimeout> | null = null; // Track death cleanup timeout
  private _cachedNow = Date.now(); // Cached Date.now() per tick — avoids 10+ syscalls per frame
  private _bossActive = false;
  private _shieldCollected = 0;
  private _tookDamage = false;
  private _freezeCollected = 0;
  private _purpleTaps = 0;
  private _tickProcessor = new TickProcessor();
  private _tickCtx!: TickContext;
  private _bot: BotController;

  constructor(private config: GameConfig) {
    perfMonitor.observe();
    this._sessionStartTime = performance.now();
    this.iMult = config.speedMult;
    this.devGodMode = config.godMode ?? false;
    achievementSystem.load();
    for (const def of ACHIEVEMENT_DEFS) {
      achievementSystem.register({ ...def, unlocked: false });
    }
    audioEngine.init();
    import('../utils/settings').then(m => {
      this._settingsUnsub = m.settingsManager.subscribe(s => this._applySettings(s));
    }).catch(e => logError('Settings module failed', e));
    this._configUnsub = configManager.subscribe(cfg => { this._config = cfg; });
    this._bossCompleteHandler = () => {
      this._bossActive = false;
      achievementSystem.unlock('boss_defeat');
    };
    this._bossShieldBreakHandler = () => { this.hitPause(80); this.emit({ type: "shake", player: 1 }); this.emit({ type: "sound", name: "powerup" }); };
    this._difficultyEmergencyHandler = () => {
      if (!this.p1 || this.phase !== 'playing') return;
      const bonus = Math.round(50 * rhythmFeedback.state.multiplier);
      this.p1.score += bonus;
      this.emit({ type: "toast", message: ` Difficulty adjusted! +${bonus} pts` });
      document.documentElement.setAttribute('data-dda-emergency', 'true');
      setTimeout(() => document.documentElement.removeAttribute('data-dda-emergency'), 2200);
    };
    window.addEventListener('dtp:boss:complete', this._bossCompleteHandler);
    window.addEventListener('dtp:boss:shield-break', this._bossShieldBreakHandler);
    window.addEventListener('dtp:difficulty:emergency', this._difficultyEmergencyHandler);
    gamepadManager.init();
    this._gamepadUnsub = gamepadManager.on((btn, state) => {
      if (state !== 'press') return;
      if (btn === 'a' || btn === 'dpad_up') { const v = parseInt(this._lastFocusedCell); this.handleTap(1, Number.isFinite(v) ? v : 0); }
      if (btn === 'start') {
        if (this.paused) this.resume();
        else this.pause();
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-this-alias
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
      get _isBlackout() { return self._isBlackout; }, set _isBlackout(v) { self._isBlackout = v; },
      get nextBossTriggerScore() { return self.nextBossTriggerScore; }, set nextBossTriggerScore(v) { self.nextBossTriggerScore = v; },
      get activeBomb() { return self.activeBomb; }, set activeBomb(v) { self.activeBomb = v; },
      get dirty() { return self.dirty; }, set dirty(v) { self.dirty = v; },
      get _tickSoundCounter() { return self._tickSoundCounter; }, set _tickSoundCounter(v) { self._tickSoundCounter = v; },
      get _lastTickTs() { return self._lastTickTs; }, set _lastTickTs(v) { self._lastTickTs = v; },
      get now() { return self._cachedNow; },
      get numPlayers() { return self.config.numPlayers; },
      get _deltaTimers() { return self._deltaTimers; }, set _deltaTimers(v) { self._deltaTimers = v; },
      get devGodMode() { return self.devGodMode; }, set devGodMode(v) { self.devGodMode = v; },
      get devFreezeTime() { return self.devFreezeTime; }, set devFreezeTime(v) { self.devFreezeTime = v; },
      get devForcedPwr() { return self.devForcedPwr; }, set devForcedPwr(v) { self.devForcedPwr = v; },
      get dda() { return self.dda; },
      emit: (e) => self.emit(e),
      _flushTapBuffer: (p) => self._flushTapBuffer(p),
      checkStageProgress: (p) => self.checkStageProgress(p),
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
      emit:            (event) => this.emit(event as unknown as GameEvent),
      getActiveCells:  (player) => (player === 1 ? this.p1 : this.p2).active,
      isPlaying:       () => this.phase === 'playing',
    });
  }

  private _applySettings(s: { reducedMotion?: boolean; liteMode?: boolean }) {
    if (s.reducedMotion !== undefined) {
      this.devRotationSpeed = s.reducedMotion ? 0.5 : 1;
    }
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
    if (this._isDisposed) return "";
    return scoreCardGen.generate({
      score,
      hearts: this.p1?.health ?? 0,
      time: Math.round(this.tickCount / 2),
      rank: score > 5000 ? 'S' : score > 3000 ? 'A' : score > 1000 ? 'B' : 'C',
      seed: this.daily.getSeed() || 'casual'
    });
  }

  start(forceSeed?: number): void {
    if (this._isDisposed) return; // Fix #2: Uninitialized/Disposed guard
    this.stop();
    // Issue 15: Temporarily detach boss complete handler to prevent
    // the boss_defeat achievement from firing on cleanup deactivation.
    if (this._bossCompleteHandler) window.removeEventListener('dtp:boss:complete', this._bossCompleteHandler);
    bossEngine.deactivate();
    if (this._bossCompleteHandler) window.addEventListener('dtp:boss:complete', this._bossCompleteHandler);
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
    this.clearAllTimeouts();
    this._bossActive = false;
    this._deathSlowdown = false;
    this._shieldCollected = 0;
    this._freezeCollected = 0;
    this._purpleTaps = 0;
    this._tookDamage = false;
    this.inputBuffer.clear();
    if (this._deathCleanupTimer) { clearTimeout(this._deathCleanupTimer); this._deathCleanupTimer = null; }
    this.gameSeed   = forceSeed ?? seedManager.initOrRestore();
    this.rng        = mulberry32(this.gameSeed);
    this._bot.setRng(this.rng);
    this.rareMode        = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
    this.bossEvent = null;
    this.nextBossTriggerScore = 500;
    this.activeBomb = null;
    // Load stored once, compute deductions, call saveStoredPowerups once for mult deduction if hasMult, once for heart reset if bonusHearts
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    const bonusHearts = (this.config.mode === "evolve" && stored.heart > 0) ? stored.heart : 0;
    const hasMult = (this.config.mode === "evolve" && (stored.mult ?? 0) > 0);
    if (hasMult || bonusHearts > 0) {
      const updated = { ...stored };
      if (hasMult) updated.mult = (stored.mult ?? 1) - 1;
      if (bonusHearts > 0) updated.heart = 0;
      this.config.storage?.saveStoredPowerups(updated);
    }
    this.p1 = makePS(bonusHearts, hasMult, stored);
    this.p2 = makePS(bonusHearts, hasMult, this.config.numPlayers === 2 ? { freeze: 0, shield: 0, mult: 0, heart: 0 } : stored);
    this.p1.nextShuffleTick = 40 + Math.floor(this.rng() * 20); // K2: first shuffle at tick 40-60
    this.p2.nextShuffleTick = 40 + Math.floor(this.rng() * 20);
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
    if (this.rafId !== null) cancelAnimationFrame(this.rafId); // Fix #1: Prevent RAF leak
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
    const ddaFactor = Math.max(0.75, Math.min(1.25, this.dda.compute() / 1200));
    const ms = computeMs(tickForCalc, frozen ? 1.4 : 1) * this.iMult * ddaFactor;
    // Add hit pause delay if active, and apply death slowdown
    const hitPauseRemaining = Math.max(0, this._hitPauseUntil - performance.now());
    const slowdownMult = this._deathSlowdown ? 3 : 1;
    const delay = (ms * slowdownMult) + hitPauseRemaining;
    this.tickTimer = setTimeout(() => {
      if (this.phase !== "playing") return;
      this.processTick();
      this.scheduleTick();
    }, delay);
  }

  private scheduleTimeout(cb: () => void, ms: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this._timeouts = this._timeouts.filter(t => t !== id);
      // FIX-04: Fire during pause too — animation cleanups are harmless,
      // and the tick loop is already stopped so no game state mutation occurs.
      // Dropped callbacks during tab-switch pauses caused stale animation state.
      if (this.phase !== 'gameover') cb();
    }, ms);
    this._timeouts.push(id);
    return id;
  }

  private clearAllTimeouts(): void {
    this._timeouts.forEach(clearTimeout);
    this._timeouts = [];
  }

  addDeltaTimer(id: string, durationMs: number, callback: () => void) {
    this.removeDeltaTimer(id);
    this._deltaTimers.push({ id, remaining: durationMs, duration: durationMs, callback });
  }

  removeDeltaTimer(id: string) {
    this._deltaTimers = this._deltaTimers.filter(t => t.id !== id);
  }

  clearAllDeltaTimers() { this._deltaTimers = []; }

  pause(): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing" || !this.p1 || !this.p2) return;
    this.paused = true;
    this.phase  = "paused";
    if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; }
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.dirty = true;
    this._pauseListeners.forEach(fn => fn());
    this.emit({ type: "phaseChange", phase: "paused" });
    this.emitSnapshot();
  }

  resume(): void {
    if (this._isDisposed) return;
    if (this.phase !== "paused") return;
    if (!this.p1?.alive) return; // Fix #7: Validation

    // Clear stale boss event that expired while paused
    if (this.bossEvent && this.bossEvent.endsAt <= Date.now()) {
      const expiredType = this.bossEvent.type;
      this.bossEvent = null;
      this._bossActive = false;
      window.dispatchEvent(new Event('dtp:boss:complete'));
      this.emit({ type: "toast", message: getBossDoneLabel(expiredType) });
      if (expiredType === 'inversion') {
        achievementSystem.unlock('boss_inversion');
      }
    }

    this.paused = false;
    this.phase  = "playing";
    this.scheduleTick();
    this.startSnapshotRaf(); // Restart RAF loop
    this.dirty = true;
    this._resumeListeners.forEach(fn => fn());
    this.emit({ type: "phaseChange", phase: "playing" });
    this.emitSnapshot();
  }

  onPause(cb: () => void): void { this._pauseListeners.push(cb); }
  onResume(cb: () => void): void { this._resumeListeners.push(cb); }

  /** Hit pause: briefly freeze the game on impactful moments (damage, boss, milestones) */
  hitPause(ms: number): void {
    this._hitPauseUntil = performance.now() + ms;
  }

  /** Check if currently in hit pause */
  get isHitPaused(): boolean {
    return performance.now() < this._hitPauseUntil;
  }

destroy(): void {
    this._isDisposed = true;
    this._settingsUnsub?.();
    this._configUnsub?.();
    this._gamepadUnsub?.();
    if (this._bossCompleteHandler) window.removeEventListener('dtp:boss:complete', this._bossCompleteHandler);
    if (this._bossShieldBreakHandler) window.removeEventListener('dtp:boss:shield-break', this._bossShieldBreakHandler);
    if (this._difficultyEmergencyHandler) window.removeEventListener('dtp:difficulty:emergency', this._difficultyEmergencyHandler);
    bossEngine.dispose();
    this.holdTimers.clear();
    this.tapBuffer = { 1: null, 2: null };
    this.clearAllTimeouts();
    this.clearAllDeltaTimers();
    if (this._deathCleanupTimer) { clearTimeout(this._deathCleanupTimer); this._deathCleanupTimer = null; }
    this.stop();
    this.listeners.clear();
    this._pauseListeners = [];
    this._resumeListeners = [];
  }

  safeReset(keepSettings = false) {
    if (this._isDisposed) return;
    if (!keepSettings) {
      this._settingsUnsub?.();
      this._settingsUnsub = null;
      // Re-subscribe to settings after reset
      import('../utils/settings').then(m => {
        this._settingsUnsub = m.settingsManager.subscribe(s => this._applySettings(s));
      }).catch(e => logError('Settings module failed', e));
    }
    this.start();
  }

  subscribe(fn: (e: GameEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(event: GameEvent): void {
    this.listeners.forEach(fn => fn(event));
  }

  private emitSnapshot(): void {
    this.emit({ type: "tick", snapshot: this.getSnapshot() });
    this.dirty = false;
  }

  private _currentTickMs(): number {
    const now = Date.now();
    const frozen = this.p1.freezeEnd > now || (this.config.numPlayers === 2 && this.p2.freezeEnd > now);
    const tickForCalc = this.devFreezeTime ? 0 : this.tickCount;
    return computeMs(tickForCalc, frozen ? 1.4 : 1) * this.iMult;
  }

  private processTick(): void {
    try {
      this._cachedNow = Date.now(); // Cache once per tick
      this._tickProcessor.processTick(this._tickCtx);
    } catch (e) {
      // Fix #6: Error handling to prevent engine lockup
      this.handleError(e as Error, "processTick");
    }
  }

  handleTap(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
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

    if (cell.type === "ice") { this._processTapIce(player, ref, cell as IceCell, idx, pat); return; }
    if (cell.type === "hold") return;
    if (cell.type === "bomb") { this._processTapBomb(player, ref, cell, idx, pat); return; }
    if (["medpack","shield","freeze","multiplier"].includes(cell.type)) { this._processTapPowerup(player, ref, cell, idx, pat); return; }

    const isInvertedTap = this.bossEvent?.type === "inversion" && Date.now() < (this.bossEvent?.endsAt ?? 0);
    const danger = this.rareMode.active ? this.rareMode.color : "purple";
    const tappedIsDanger = isInvertedTap ? cell.type !== danger : cell.type === danger;
    if (tappedIsDanger) {
      this._processTapDanger(player, ref, cell, idx, pat);
    } else {
      this._processTapSafe(player, ref, cell, idx, pat);
    }
  }

  private _processTapIce(player: 1 | 2, ref: PlayerState, cell: IceCell, idx: number, pat: { cols: number; rows: number; mask: number[] | null }): void {
    const rem = (cell.iceCount ?? 1) - 1;
    this.triggerCellAnim(player, idx, rem <= 0 ? "pop" : "shake");
    this.emit({ type: "sound", name: rem <= 0 ? "ok" : "tick" });
    if (rem <= 0) {
      haptics.success();
      cell.clicked = true;
      const { mult } = calculateTapScore(Date.now() < ref.multiplierEnd, false, 1);
      const nextStreak = ref.streak + 1;
      ref.score += mult + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
      this.checkStageProgress(player);
      if (ref.active.every(c => c.clicked || (c.type as string) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.dirty = true; this.emitSnapshot(); return; }
    } else cell.iceCount = rem;
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private _processTapBomb(player: 1 | 2, ref: PlayerState, cell: ActiveCell, idx: number, pat: { cols: number; rows: number; mask: number[] | null }): void {
    cell.clicked = true;
    if (this.activeBomb?.idx === idx && this.activeBomb?.player === player) this.activeBomb = null;
    this.triggerCellAnim(player, idx, "pop");
    this.emit({ type: "sound", name: "powerup" });
    this.emit({ type: "bombDefused", player });
    this.emit({ type: "toast", message: "💣 Defused! +3" });
    this.hitPause(30);
    const { mult } = calculateTapScore(Date.now() < ref.multiplierEnd, false, 1);
    const nextStreak = ref.streak + 1;
    ref.score += (mult * 3) + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
    this.checkStageProgress(player);
    const lifetime = (parseInt(localStorage.getItem('dtp_lifetime_bomb_defuses') ?? '0') || 0) + 1;
    try { localStorage.setItem('dtp_lifetime_bomb_defuses', String(lifetime)); } catch {}
    achievementSystem.check('bomb_defuse', () => lifetime >= 10);
    achievementSystem.check('bomb_master', () => lifetime >= 50);
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private _processTapPowerup(player: 1 | 2, ref: PlayerState, cell: ActiveCell, idx: number, pat: { cols: number; rows: number; mask: number[] | null }): void {
    cell.clicked = true;
    this.emit({ type: "sound", name: "powerup" });
    this.triggerCellAnim(player, idx, "pop");
    if (cell.type === "medpack") haptics.medpack();
    else if (cell.type === "shield") haptics.shield();
    else if (cell.type === "freeze") haptics.freeze();
    else if (cell.type === "multiplier") haptics.multiplier();
    if (cell.type === "medpack") {
      if (ref.health >= GAME.MAX_HEARTS) {
        ref.shieldCount += 1; ref.shield = true;
        this.emit({ type: "pwrToast", message: `🛡 Overheal! +1 Shield`, player });
      } else {
        ref.health += 1;
        this.emit({ type: "toast", message: "♥ +1 Heart!" });
      }
    }
    if (cell.type === "shield") { ref.shieldCount += 1; ref.shield = true; this._shieldCollected++; }
    if (cell.type === "freeze") { ref.freezeEnd = Math.max(ref.freezeEnd, Date.now()) + 15000; this._freezeCollected++; }
    if (cell.type === "multiplier") ref.multiplierEnd = Date.now() + 24000;
    if (cell.type === "shield") {
      this.emit({ type: "pwrToast", message: `🛡 Shield ×${ref.shieldCount}!`, player });
    } else if (cell.type === "multiplier") {
      this.emit({ type: "pwrToast", message: "×2 multiplier!", player });
    } else if (cell.type === "freeze") {
      this.emit({ type: "pwrToast", message: "❄ Freeze activated!", player });
    }
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private _processTapDanger(player: 1 | 2, ref: PlayerState, cell: ActiveCell, idx: number, pat: { cols: number; rows: number; mask: number[] | null }): void {
    const dmg = this.config.mode === "evolve" ? 0.5 : 1;
    cell.clicked = true;
    if (!this.devGodMode) {
      if (ref.shieldCount > 0) {
        this.dda.recordAttempt(false, 0, false);
        ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0;
        this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 });
        this.triggerCellAnim(player, idx, "pop");
      } else {
        this.dda.recordAttempt(false, 0, true);
        if (ref.streak >= 5) this.emit({ type: "toast", message: `🔥 ${ref.streak} streak lost!` });
        ref.health = Math.max(0, ref.health - dmg); ref.shield = false; ref.streak = 0; this._tookDamage = true;
        this.emit({ type: "sound", name: "bad" }); this.triggerCellAnim(player, idx, "shake");
        this.emit({ type: "damage", player }); this.emit({ type: "shake", player });
        this.hitPause(ref.health < 1 ? 200 : 40);
        if (ref.health < 1) { ref.alive = false; this.triggerGameOver(this.config.numPlayers === 1 ? null : (player === 1 ? "p2" : "p1")); }
      }
    } else {
      this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 });
      this.triggerCellAnim(player, idx, "pop");
    }
    this._purpleTaps = (this._purpleTaps ?? 0) + (cell.type === 'purple' ? 1 : 0);
    achievementSystem.check('secret_purple_tap', () => (this._purpleTaps ?? 0) >= 10);
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private _processTapSafe(player: 1 | 2, ref: PlayerState, cell: ActiveCell, idx: number, pat: { cols: number; rows: number; mask: number[] | null }): void {
    cell.clicked = true;
    this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 });
    this.triggerCellAnim(player, idx, "pop");
    if (this._bossActive) bossEngine.onSafeTap();
    rhythmFeedback.recordTap();
    const { mult, bossMult } = calculateTapScore(Date.now() < ref.multiplierEnd, this._bossActive, bossEngine.combo.multiplier);
    const nextStreak = ref.streak + 1;
    const tapScore = (mult * bossMult) + calculateStreakBonus(nextStreak);
    ref.score += tapScore; ref.streak = nextStreak; ref.stageProgress += 1;
    this.emit({ type: "scoreFloat", player, idx, amount: tapScore });
    if (checkStreakMilestone(ref.streak)) { this.emit({ type: "toast", message: `🔥 ${ref.streak} Streak!` }); this.hitPause(25); haptics.combo(ref.streak); }
    if (ref.health === 1 && !this.devGodMode) this.emit({ type: "toast", message: "❤️ Last heart!" });
    this.checkStageProgress(player);
    const now = performance.now();
    const reaction = this._lastTapTime ? now - this._lastTapTime : 0;
    this._lastTapTime = now;
    if (reaction > 0) this.dda.recordAttempt(true, reaction, false);
    this._checkTapAchievements(ref);
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private _checkTapAchievements(ref: PlayerState): void {
    achievementSystem.check('first_blood', () => true);
    achievementSystem.check('survivor', () => ref.health <= 1 && this.tickCount > 300);
    achievementSystem.check('score_100', () => ref.score >= 100);
    achievementSystem.check('score_500', () => ref.score >= 500);
    achievementSystem.check('score_1000', () => ref.score >= 1000);
    achievementSystem.check('score_2500', () => ref.score >= 2500);
    achievementSystem.check('score_5000', () => ref.score >= 5000);
    achievementSystem.check('score_9999', () => ref.score >= 9999);
    achievementSystem.check('streak_10', () => ref.streak >= 10);
    achievementSystem.check('streak_25', () => ref.streak >= 25);
    achievementSystem.check('streak_50', () => ref.streak >= 50);
    const currentSpeed = parseFloat(speedLabel(this.tickCount, ref.freezeEnd > Date.now()));
    achievementSystem.check('speed_2x', () => currentSpeed >= 2.0);
    achievementSystem.check('speed_3x', () => currentSpeed >= 3.0);
    achievementSystem.check('shield_5', () => (this._shieldCollected ?? 0) >= 5);
    achievementSystem.check('freeze_5', () => (this._freezeCollected ?? 0) >= 5);
    achievementSystem.check('secret_speed_run', () => ref.score >= 500 && currentSpeed >= 3.0);
  }

  private checkStageProgress(player: 1 | 2): void {
    const ref = player === 1 ? this.p1 : this.p2;
    if (this.config.mode === "evolve" && ref.stageProgress >= GAME.STAGE_TAPS_NEEDED && ref.gridStage < STAGES.length - 1) ref.pendingStageUpdate = true;
  }

  private triggerCellAnim(player: 1 | 2, idx: number, anim: "pop" | "shake"): void {
    const ref = player === 1 ? this.p1 : this.p2;
    ref.anim[idx] = anim;
    this.emit({ type: "cellAnim", player, idx, anim });
    this.scheduleTimeout(() => { if (ref.anim[idx] === anim) { ref.anim = { ...ref.anim }; delete ref.anim[idx]; } }, GAME.CELL_ANIM_MS);
  }

  handleHoldStart(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || cell.type !== "hold") return;
    (cell as HoldCell).holdStart = Date.now();
    const key = `${player}_${idx}`;
    if (this.holdTimers.has(key)) {
      this.removeDeltaTimer(`hold_${key}`);
      this.holdTimers.delete(key);
    }
    const gen = ++this.holdGeneration;
    this.addDeltaTimer(`hold_${key}`, GAME.HOLD_TIMEOUT_MS, () => {
      const entry = this.holdTimers.get(key);
      if (!entry || entry.generation !== gen || entry.cell.clicked) return;
      (entry.cell as HoldCell).holdStart = undefined;
      this.dirty = true;
      this.triggerCellAnim(entry.player, entry.cell.idx, "shake");
      this.emitSnapshot();
      this.holdTimers.delete(key);
    });
    this.holdTimers.set(key, { cell, player, generation: gen });
    this.dirty = true;
    this.emitSnapshot();
  }

  handleHoldEnd(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || cell.type !== "hold") return;
    const key = `${player}_${idx}`;
    const entry = this.holdTimers.get(key);
    if (entry) { this.removeDeltaTimer(`hold_${key}`); this.holdTimers.delete(key); }
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    const elapsed = Date.now() - ((cell as HoldCell).holdStart ?? Date.now());
    if (elapsed >= (cell as HoldCell).holdRequired) {
      cell.clicked = true; this.triggerCellAnim(player, idx, "pop");
      this.emit({ type: "sound", name: "powerup" });
      const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
      const nextStreak = ref.streak + 1;
      ref.score += (mult * 2) + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
      this.checkStageProgress(player);
      this.emit({ type: "toast", message: "≡ƒÆ¬ Hold! +2" });
      if (ref.active.every(c => c.clicked || (c.type as string) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.emitSnapshot(); return; }
    } else { (cell as HoldCell).holdStart = undefined; this.triggerCellAnim(player, idx, "shake"); }
    ref.cells = activeToCellsP(ref.active, pat);
    this.emitSnapshot();
  }

  activateStoredFreeze(player: 1 | 2): void {
    if (this._isDisposed) return;
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
    if (this._isDisposed) return;
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

  devSpawnSpecialCell(player: 1 | 2, type: "ice" | "hold" | "bomb" | "rare", idx?: number): void {
    const target = player === 1 ? this.p1 : this.p2;
    if (!target.alive) return;
    const slot = idx !== undefined ? idx : Math.floor(this.rng() * Math.max(target.active.length, 1));
    const existing = target.active[slot];
    if (existing) {
      const cellType = type === "rare"
        ? (this.rareMode.active ? this.rareMode.color : "purple")
        : type;
      const mutable = existing as Record<string, unknown>;
      mutable.type = cellType;
      if (type === "ice") { mutable.iceCount = 3; mutable.holdProgress = undefined; }
      if (type === "hold") { mutable.holdProgress = 0; mutable.iceCount = undefined; }
      if (type === "bomb") { mutable.expiresAt = Date.now() + 3000; }
    }
    this.emitSnapshot();
  }

  devTriggerBotTap(player: 1 | 2, idx: number, dustCost = 3): void {
    this.emit({ type: "botTap", player, idx, dustCost });
  }

  devToggleBotAssist(player: 1 | 2, enabled: boolean): void {
    this.setBotAssist(player, enabled);
  }

  updatePerformanceMetrics(frameTime: number): void {
    const fps = 1000 / Math.max(frameTime, 1);
    if (this.fpsHistory.length < 60) { this.fpsHistory.push(fps); } else { this.fpsHistory[this.fpsIdx] = fps; this.fpsIdx = (this.fpsIdx + 1) % 60; }
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    if (!this.autoLowQuality && avgFps < this.lowQualityThreshold) {
      this.autoLowQuality = true;
      document.documentElement.style.setProperty('--particles-enabled', '0');
      document.documentElement.style.setProperty('--motion-scale', '0.5');
      this.emit({ type: "qualityDowngrade", reason: "fps-drop", avgFps });
    } else if (this.autoLowQuality && avgFps > 50) {
      this.autoLowQuality = false;
      document.documentElement.style.setProperty('--particles-enabled', '1');
      document.documentElement.style.setProperty('--motion-scale', '1');
      this.emit({ type: "qualityUpgrade", avgFps });
    }
  }

  getAutoLowQuality(): boolean { return this.autoLowQuality; }

  submitScoreToLeaderboard(score: number): void {
    if (this._isDisposed) return;
    scoreSync.queue(score, this.config.mode, this.tickCount);
  }

  async generateChallengeUrl(): Promise<string> {
    return challengeLink.generate(this.p1.score, this.gameSeed.toString(), this.p1.health);
  }

  getSnapshot(): GameSnapshot {
    // Guard against uninitialized engine
    if (!this.p1 || !this.p2) {
      return {
        tick: 0, evolveTick: 0, gameSeed: 0,
        p1: { cells: Array(25).fill('inactive'), active: [], score: 0, streak: 0, alive: false, anim: {}, health: 0, shield: false, shieldCount: 0, freezeEnd: 0, multiplierEnd: 0, gridStage: 0, stageProgress: 0, patternIdx: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 0 },
        p2: { cells: Array(25).fill('inactive'), active: [], score: 0, streak: 0, alive: false, anim: {}, health: 0, shield: false, shieldCount: 0, freezeEnd: 0, multiplierEnd: 0, gridStage: 0, stageProgress: 0, patternIdx: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 0 },
        cellShape: 'square', rareMode: { active: false, color: '', cssColor: '', turnsLeft: 0, shape: 'circle', emoji: '' },
        spinLevel: 0, paused: false, phase: 'playing',
        grid: { cols: 3, rows: 3, mask: null }, spinCfg: null, devRotationSpeed: 1,
        bossEvent: null, activeBomb: null, isInverted: false, isBlackout: false,
      } as GameSnapshot;
    }
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[this.p1.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    const cloneActive = (active: ActiveCell[]): ActiveCell[] => active.map(c => ({ ...c }));

    // Cache mask array — only re-copy when the source reference changes
    if (pat.mask !== this._cachedMaskSrc) {
      this._cachedMaskSrc = pat.mask ?? null;
      this._cachedMask = pat.mask ? [...pat.mask] : null;
    }

    // Memoize spinCfg — only recompute when spinLevel or gameSeed changes
    let spinCfg: { duration: number; direction: 1 | -1 } | null = null;
    if (this.config.mode === "evolve" && this.spinLevel >= 3) {
      if (this._cachedSpinLevel !== this.spinLevel || this._cachedSpinSeed !== this.gameSeed || this._cachedRotationSpeed !== this.devRotationSpeed) {
        const cfg = getSpinConfig(this.spinLevel, this.gameSeed);
        this._cachedSpinCfg = { ...cfg, duration: cfg.duration * this.devRotationSpeed };
        this._cachedSpinLevel = this.spinLevel;
        this._cachedSpinSeed = this.gameSeed;
        this._cachedRotationSpeed = this.devRotationSpeed;
      }
      spinCfg = this._cachedSpinCfg;
    } else {
      this._cachedSpinCfg = null;
      this._cachedSpinLevel = -1;
      this._cachedSpinSeed = -1;
    }

    return {
      tick:       this.tickCount,
      evolveTick: this.evolveTick,
      gameSeed:   this.gameSeed,
      p1:         { ...this.p1, cells: [...this.p1.cells], active: cloneActive(this.p1.active), anim: { ...this.p1.anim } },
      p2:         { ...this.p2, cells: [...this.p2.cells], active: cloneActive(this.p2.active), anim: { ...this.p2.anim } },
      cellShape:  this.cellShape,
      rareMode:   { ...this.rareMode },
      spinLevel:  this.spinLevel,
      paused:     this.paused,
      phase:      this.phase,
      grid: { cols: pat.cols, rows: pat.rows, mask: this._cachedMask },
      spinCfg,
      devRotationSpeed: this.devRotationSpeed,
      bossEvent:  this.bossEvent ? { ...this.bossEvent } : null,
      activeBomb: this.activeBomb ? { ...this.activeBomb } : null,
      isInverted: this._isInverted,
      isBlackout: this._isBlackout,
    };
  }

  getSpinConfig(level: number): { duration: number; direction: 1 | -1 } { return getSpinConfig(level, this.gameSeed); }

  // Session methods removed — resume feature deleted

private triggerGameOver(winner: Winner): void {
    // Prevent double game over
    if (this._deathSlowdown || this.phase === "gameover") return;
    // Immediately set phase and emit game over events (logical end)
    this._deathSlowdown = true;
    this.hitPause(200); // Brief freeze on death
    this.phase = "gameover";
    this.emitSnapshot();
    this.emit({ type: "phaseChange", phase: "gameover" });
    this.emit({ type: "gameOver", winner });

    // Mode win achievements
    if (winner === "p1" || winner === "tie") {
      if (this.config.mode === "classic") achievementSystem.unlock('classic_win');
      if (this.config.mode === "evolve") achievementSystem.unlock('evolve_win');
    }

    // Game count achievements — read current count; hook layer handles the localStorage increment
    const gamesPlayed = Math.max(0, Math.min(99999, parseInt(localStorage.getItem('dtp-games-played') || '0') || 0)) + 1;
    achievementSystem.check('games_50', () => gamesPlayed >= 50);
    achievementSystem.check('games_200', () => gamesPlayed >= 200);

    // Perfect round — no damage taken
    achievementSystem.check('perfect_round', () => !this._tookDamage && this.tickCount > 100);

    // ORDERING DEPENDENCY: achievement checks MUST happen before counter resets.
    // games_50/games_200/perfect_round read counters that are zeroed below.
    // If you move resets above this line, those achievements will always see 0.

    // Reset per-game counters
    this._shieldCollected = 0;
    this._freezeCollected = 0;
    this._purpleTaps = 0;
    this._tookDamage = false;

    // Death slow-motion: visually slow for 600ms before cleanup
    if (this._deathCleanupTimer) clearTimeout(this._deathCleanupTimer);
    this._deathCleanupTimer = setTimeout(() => {
      this._deathCleanupTimer = null;
      if (this.phase !== 'gameover') return; // New game started during cleanup window
      this._deathSlowdown = false;
      this.tapBuffer = { 1: null, 2: null };
      this.holdTimers.clear();
      this.clearAllDeltaTimers();
      this.stop();
      // Only p1's charges are persisted — p2 charges are ephemeral (default 0, never saved).
      const cur = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
      this.config.storage?.saveStoredPowerups({
        freeze: Math.max(0, this.p1.storedFreezeCharges ?? 0),
        shield: Math.max(0, this.p1.storedShieldCharges ?? 0),
        mult: cur.mult,
        heart: cur.heart,
      });
    }, 600);
    analytics.track('game_over', { score: this.p1.score, mode: this.config.mode, winner });
    this.dda.reset(this._config.grid.spawnRateMs);
    if (!this.daily.isTodayComplete()) {
      this.daily.markComplete(this.p1.score, this.tickCount);
      // daily_master unlock moved to useDailyProgress — only fires when checkObjective confirms completion
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
