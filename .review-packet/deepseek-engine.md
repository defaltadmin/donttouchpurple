# DTP Engine Source — For DeepSeek Review

Game engine core — pure TypeScript, zero React imports.


---
## `engine/GameEngine.ts`
---

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
  ActiveCell, CellShape, GameConfig, GameEvent,
  GameSnapshot, PlayerState, RareColorMode, Winner,
  BossEvent, BossEventType, HoldCell, CellType,
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
  private _sessionAutoSaveInterval: ReturnType<typeof setInterval> | null = null;
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
  private readonly SESSION_KEY = 'dtp:session';
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
  private _bombDefuseCount = 0; // unused — kept for type compat; achievements use localStorage
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
    // Core achievements
    achievementSystem.register({ id: 'first_blood', name: 'First Strike', desc: 'Clear your first cell', icon: '⚔️', unlocked: false });
    achievementSystem.register({ id: 'survivor', name: 'Iron Will', desc: 'Reach last heart and survive 30s', icon: '💪', unlocked: false });
    achievementSystem.register({ id: 'daily_master', name: 'Daily Grind', desc: "Complete today's challenge", icon: '📅', unlocked: false });
    // Score milestones
    achievementSystem.register({ id: 'score_100', name: 'Getting Started', desc: 'Score 100 points', icon: '🌟', unlocked: false });
    achievementSystem.register({ id: 'score_500', name: 'Rising Star', desc: 'Score 500 points', icon: '⭐', unlocked: false });
    achievementSystem.register({ id: 'score_1000', name: 'Thousand Club', desc: 'Score 1,000 points', icon: '💫', unlocked: false });
    achievementSystem.register({ id: 'score_2500', name: 'Quarter King', desc: 'Score 2,500 points', icon: '👑', unlocked: false });
    achievementSystem.register({ id: 'score_5000', name: 'Half Hero', desc: 'Score 5,000 points', icon: '🏆', unlocked: false });
    achievementSystem.register({ id: 'score_9999', name: 'Max Master', desc: 'Score 9,999 points (max)', icon: '💎', unlocked: false });
    // Streak milestones
    achievementSystem.register({ id: 'streak_10', name: 'On Fire', desc: 'Reach a 10-streak', icon: '🔥', unlocked: false });
    achievementSystem.register({ id: 'streak_25', name: 'Unstoppable', desc: 'Reach a 25-streak', icon: '💥', unlocked: false });
    achievementSystem.register({ id: 'streak_50', name: 'Legend', desc: 'Reach a 50-streak', icon: '⚡', unlocked: false });
    // Mode completions
    achievementSystem.register({ id: 'classic_win', name: 'Classic Champion', desc: 'Win a Classic game', icon: '🎯', unlocked: false });
    achievementSystem.register({ id: 'evolve_win', name: 'Evolution Complete', desc: 'Win an Evolve game', icon: '🧬', unlocked: false });
    // Boss achievements
    achievementSystem.register({ id: 'boss_defeat', name: 'Boss Slayer', desc: 'Defeat a boss event', icon: '🐉', unlocked: false });
    achievementSystem.register({ id: 'boss_inversion', name: 'Mind Bender', desc: 'Survive an Inversion event', icon: '🔄', unlocked: false });
    // Bomb achievements
    achievementSystem.register({ id: 'bomb_defuse', name: 'Defuser', desc: 'Defuse 10 bombs', icon: '💣', unlocked: false });
    achievementSystem.register({ id: 'bomb_master', name: 'Bomb Expert', desc: 'Defuse 50 bombs', icon: '🧨', unlocked: false });
    // Daily streak
    achievementSystem.register({ id: 'streak_3', name: 'Consistent', desc: '3-day daily streak', icon: '📅', unlocked: false });
    achievementSystem.register({ id: 'streak_7', name: 'Weekly Warrior', desc: '7-day daily streak', icon: '🗓️', unlocked: false });
    achievementSystem.register({ id: 'streak_14', name: 'Fortnight Fighter', desc: '14-day daily streak', icon: '🏅', unlocked: false });
    achievementSystem.register({ id: 'streak_30', name: 'Monthly Master', desc: '30-day daily streak', icon: '👑', unlocked: false });
    // Dust achievements
    achievementSystem.register({ id: 'dust_1000', name: 'Dust Collector', desc: 'Earn 1,000 dust total', icon: '💜', unlocked: false });
    achievementSystem.register({ id: 'dust_10000', name: 'Dust Baron', desc: 'Earn 10,000 dust total', icon: '💰', unlocked: false });
    // Speed achievements
    achievementSystem.register({ id: 'speed_2x', name: 'Quick Draw', desc: 'Reach 2.0x speed', icon: '⚡', unlocked: false });
    achievementSystem.register({ id: 'speed_3x', name: 'Lightning Fast', desc: 'Reach 3.0x speed', icon: '🌩️', unlocked: false });
    // Powerup achievements
    achievementSystem.register({ id: 'shield_5', name: 'Shield Bearer', desc: 'Collect 5 shields in one game', icon: '🛡️', unlocked: false });
    achievementSystem.register({ id: 'freeze_5', name: 'Frost Master', desc: 'Collect 5 freezes in one game', icon: '❄️', unlocked: false });
    // Perfect round
    achievementSystem.register({ id: 'perfect_round', name: 'Untouchable', desc: 'Complete a round with no damage', icon: '✨', unlocked: false });
    // Play count
    achievementSystem.register({ id: 'games_50', name: 'Dedicated', desc: 'Play 50 games', icon: '🎮', unlocked: false });
    achievementSystem.register({ id: 'games_200', name: 'Veteran', desc: 'Play 200 games', icon: '🏅', unlocked: false });
    // Secret achievements
    achievementSystem.register({ id: 'secret_purple_tap', name: '???', desc: '???', icon: '🔮', unlocked: false });
    achievementSystem.register({ id: 'secret_speed_run', name: '???', desc: '???', icon: '🔮', unlocked: false });
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
    this.clearAllTimeouts();
    this._bossActive = false;
    this._deathSlowdown = false;
    this._shieldCollected = 0;
    this._freezeCollected = 0;
    this._purpleTaps = 0;
    this._tookDamage = false;
    // _bombDefuseCount removed — achievements now use localStorage lifetime counter
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
      if (this.phase !== 'paused') cb();
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
    if (this._sessionAutoSaveInterval) { clearInterval(this._sessionAutoSaveInterval); this._sessionAutoSaveInterval = null; }
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
    if (this._sessionAutoSaveInterval) { clearInterval(this._sessionAutoSaveInterval); this._sessionAutoSaveInterval = null; }
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
        const nextStreak = ref.streak + 1;
        ref.score += mult + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
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
      this.emit({ type: "toast", message: "💣 Defused! +3" });
      this.hitPause(30);
      const { mult } = calculateTapScore(Date.now() < ref.multiplierEnd, false, 1);
      const nextStreak = ref.streak + 1;
      ref.score += (mult * 3) + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
      this.checkStageProgress(player);
      // Bomb achievements — lifetime counter across games
      const lifetime = (parseInt(localStorage.getItem('dtp_lifetime_bomb_defuses') ?? '0') || 0) + 1;
      try { localStorage.setItem('dtp_lifetime_bomb_defuses', String(lifetime)); } catch {}
      achievementSystem.check('bomb_defuse', () => lifetime >= 10);
      achievementSystem.check('bomb_master', () => lifetime >= 50);
      ref.cells = activeToCellsP(ref.active, pat);
      this.dirty = true;
      this.emitSnapshot();
      return;
    }
    const dmg = this.config.mode === "evolve" ? 0.5 : 1;
    if (["medpack","shield","freeze","multiplier"].includes(cell.type)) {
      cell.clicked = true; this.emit({ type: "sound", name: "powerup" }); this.triggerCellAnim(player, idx, "pop");
      if (cell.type === "medpack") haptics.medpack();
      else if (cell.type === "shield") haptics.shield();
      else if (cell.type === "freeze") haptics.freeze();
      else if (cell.type === "multiplier") haptics.multiplier();
      if (cell.type === "medpack") {
        if (ref.health >= GAME.MAX_HEARTS) {
          // Overheal → gain shield instead
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
        this.emit({ type: "pwrToast", message: `≡ƒ¢í Shield ├ù${ref.shieldCount}!`, player });
      } else if (cell.type === "multiplier") {
        this.emit({ type: "pwrToast", message: "ΓÜí multiplier ├ù2!", player });
      } else if (cell.type === "freeze") {
        this.emit({ type: "pwrToast", message: "Γ¥ä Freeze activated!", player });
      }
    } else {
      const tappedIsDanger = isInvertedTap ? cell.type !== danger : cell.type === danger;
      if (tappedIsDanger) {
        cell.clicked = true;
        if (!this.devGodMode) {
          if (ref.shieldCount > 0) { this.dda.recordAttempt(false, 0, false); ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 }); this.triggerCellAnim(player, idx, "pop"); }
          else {
            this.dda.recordAttempt(false, 0, true);
            if (ref.streak >= 5) this.emit({ type: "toast", message: `🔥 ${ref.streak} streak lost!` });
            ref.health = Math.max(0, ref.health - dmg); ref.shield = false; ref.streak = 0; this._tookDamage = true;
            this.emit({ type: "sound", name: "bad" }); this.triggerCellAnim(player, idx, "shake");
            this.emit({ type: "damage", player }); this.emit({ type: "shake", player });
            this.hitPause(ref.health < 1 ? 200 : 40); // Death: 200ms, damage: 40ms
            if (ref.health < 1) { ref.alive = false; this.triggerGameOver(this.config.numPlayers === 1 ? null : (player === 1 ? "p2" : "p1")); }
          }
        } else { this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 }); this.triggerCellAnim(player, idx, "pop"); }
        // Count purple taps for secret achievement (danger branch: normal play where purple is dangerous)
        this._purpleTaps = (this._purpleTaps ?? 0) + (cell.type === 'purple' ? 1 : 0);
        achievementSystem.check('secret_purple_tap', () => (this._purpleTaps ?? 0) >= 10);
      } else {
      cell.clicked = true; this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 }); this.triggerCellAnim(player, idx, "pop");
      if (this._bossActive) bossEngine.onSafeTap();
      rhythmFeedback.recordTap();
      const { mult, bossMult } = calculateTapScore(Date.now() < ref.multiplierEnd, this._bossActive, bossEngine.combo.multiplier);
      const nextStreak = ref.streak + 1;
      const tapScore = (mult * bossMult) + calculateStreakBonus(nextStreak);
      ref.score += tapScore; ref.streak = nextStreak; ref.stageProgress += 1;
      this.emit({ type: "scoreFloat", player, idx, amount: tapScore });
      if (checkStreakMilestone(ref.streak)) { this.emit({ type: "toast", message: `🔥 ${ref.streak} Streak!` }); this.hitPause(25); haptics.combo(ref.streak); }
      if (ref.health === 1 && !this.devGodMode) this.emit({ type: "toast", message: "Γ¥ñ∩╕Å Last heart!" });
      this.checkStageProgress(player);
      const now = performance.now();
      const reaction = this._lastTapTime ? now - this._lastTapTime : 0;
      this._lastTapTime = now;
      if (reaction > 0) this.dda.recordAttempt(true, reaction, false);
      achievementSystem.check('first_blood', () => true);
      achievementSystem.check('survivor', () => ref.health <= 1 && this.tickCount > 300);
      // Score milestones
      achievementSystem.check('score_100', () => ref.score >= 100);
      achievementSystem.check('score_500', () => ref.score >= 500);
      achievementSystem.check('score_1000', () => ref.score >= 1000);
      achievementSystem.check('score_2500', () => ref.score >= 2500);
      achievementSystem.check('score_5000', () => ref.score >= 5000);
      achievementSystem.check('score_9999', () => ref.score >= 9999);
      // Streak milestones
      achievementSystem.check('streak_10', () => ref.streak >= 10);
      achievementSystem.check('streak_25', () => ref.streak >= 25);
      achievementSystem.check('streak_50', () => ref.streak >= 50);
      // Speed achievements
      const currentSpeed = parseFloat(speedLabel(this.tickCount, ref.freezeEnd > Date.now()));
      achievementSystem.check('speed_2x', () => currentSpeed >= 2.0);
      achievementSystem.check('speed_3x', () => currentSpeed >= 3.0);
      achievementSystem.check('shield_5', () => (this._shieldCollected ?? 0) >= 5);
      achievementSystem.check('freeze_5', () => (this._freezeCollected ?? 0) >= 5);
      // Secret: score 500+ at 3x speed
      achievementSystem.check('secret_speed_run', () => ref.score >= 500 && currentSpeed >= 3.0);
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

  startSessionPersistence(): void {
    if (this._sessionAutoSaveInterval) return;
    this._sessionAutoSaveInterval = setInterval(() => {
      if (this.phase === "playing" && !this.paused && this.p1.alive) {
        sessionManager.save({
          hearts: this.p1.health,
          score: this.p1.score,
          timeLeft: GAME.HUMAN_LIMIT_TICK - this.tickCount,
          isPaused: this.paused
        }, { theme: 'default', difficulty: this.config.mode });
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
    if (!this.p1) return;
    if (data.hearts != null) this.p1.health = Math.max(0, Math.min(GAME.MAX_HEARTS, data.hearts));
    if (data.score != null) this.p1.score = Math.max(0, Math.min(9999, Math.floor(data.score)));
    if (data.timeLeft != null) this.tickCount = Math.max(0, GAME.HUMAN_LIMIT_TICK - data.timeLeft);
  }

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

  // SESSION_SNAPSHOT_VERSION — bump ONLY for breaking schema changes (field rename/removal/type change).
  // Adding new optional fields with ?? defaults is NOT a breaking change and must NOT bump this.
  // Current breaking changes from v1→v2: added `p1.active`, `p2.active`, `bossEvent`, `activeBomb`.
  private static readonly SESSION_SNAPSHOT_VERSION = 2;
  private static readonly VALID_CELL_TYPES = new Set<string>([
    "inactive", "void", "purple", "white", "blue", "red", "orange", "yellow",
    "green", "cyan", "lime", "teal", "pink", "rose", "magenta",
    "medpack", "shield", "freeze", "multiplier", "ice", "hold", "bomb",
  ]);

  getSessionSnapshot(): Record<string, unknown> {
    return {
      version: GameEngine.SESSION_SNAPSHOT_VERSION,
      ts: Date.now(),
      gameSeed: this.gameSeed,
      tickCount: this.tickCount,
      evolveTick: this.evolveTick,
      cellShape: this.cellShape,
      spinLevel: this.spinLevel,
      rareMode: { ...this.rareMode },
      isInverted: this._isInverted,
      nextShuffleTick: this.p1.nextShuffleTick,
      p2NextShuffleTick: this.p2.nextShuffleTick,
      bossEvent: this.bossEvent ? { type: this.bossEvent.type, endsAt: this.bossEvent.endsAt } : null,
      nextBossTriggerScore: this.nextBossTriggerScore,
      _bossActive: this._bossActive,
      _hitPauseUntil: this._hitPauseUntil,
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
      // Clear stale timers from any prior session before restoring
      this.clearAllTimeouts();
      this.clearAllDeltaTimers();
      if (!data || !data.gameSeed) return false;
      // Reject snapshots from incompatible versions to avoid silent state corruption
      const snapshotVersion = typeof data.version === 'number' ? data.version : 1;
      if (snapshotVersion < GameEngine.SESSION_SNAPSHOT_VERSION) {
        logError(`[GameEngine] Session snapshot version ${snapshotVersion} < current ${GameEngine.SESSION_SNAPSHOT_VERSION}, discarding`);
        return false;
      }
      // Create p1/p2 from snapshot if engine wasn't started (e.g. resume on reload)
      if (!this.p1 || !this.p2) {
        const n = 25; // 5×5 max grid
        const mkPlayer = (): PlayerState => ({
          cells: Array(n).fill('inactive') as CellType[], active: [], score: 0, streak: 0, alive: true,
          health: GAME.MAX_HEARTS, shield: false, shieldCount: 0, freezeEnd: 0, multiplierEnd: 0,
          gridStage: 0, stageProgress: 0, patternIdx: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 40,
          anim: {} as Record<number, string>,
        });
        if (!this.p1) this.p1 = mkPlayer();
        if (!this.p2) this.p2 = mkPlayer();
      }
      this.gameSeed = data.gameSeed as number;
      // #16 fix: fast-forward RNG to match tickCount so post-restore spawns
      // use the correct position in the seed sequence.
      this.rng = mulberry32(this.gameSeed);
      const rawTick = typeof data.tickCount === 'number' ? data.tickCount : 0;
      const rngStepsToSkip = Math.min(rawTick, GAME.HUMAN_LIMIT_TICK + 100); // Cap to prevent infinite loop from tampered data
      for (let i = 0; i < rngStepsToSkip; i++) this.rng();
      this.tickCount = rngStepsToSkip;
      this.evolveTick = (data.evolveTick as number) ?? 0;
      this.cellShape = (data.cellShape as CellShape) ?? "square";
      this.spinLevel = (data.spinLevel as number) ?? 0;
      if (data._hitPauseUntil != null) this._hitPauseUntil = Math.max(0, data._hitPauseUntil as number);
      if (data.rareMode) this.rareMode = stateGuard.sanitize(data.rareMode as Record<string, unknown>, this.rareMode as unknown as Record<string, unknown>) as unknown as RareColorMode;
      this._isInverted = (data.isInverted as boolean) ?? false;
      this.p1.nextShuffleTick = (data.nextShuffleTick as number) ?? 40;
      this.p2.nextShuffleTick = (data.p2NextShuffleTick as number) ?? 40;
      this.bossEvent = data.bossEvent ? { type: (data.bossEvent as Record<string, unknown>).type as BossEventType, endsAt: (data.bossEvent as Record<string, unknown>).endsAt as number } : null;
      this.nextBossTriggerScore = (data.nextBossTriggerScore as number) ?? 500;
      this._bossActive = (data._bossActive as boolean) ?? false;
      if (data.bossEngineActive) bossEngine.activate((data.bossEngineShieldHits as number) ?? 5);
      this.activeBomb = data.activeBomb ? { idx: (data.activeBomb as Record<string, unknown>).idx as number, expiresAt: (data.activeBomb as Record<string, unknown>).expiresAt as number, player: (data.activeBomb as Record<string, unknown>).player as 1 | 2 } : null;
      // Re-register bomb delta timer if bomb is still active
      if (this.activeBomb) {
        const bombRemaining = Math.max(0, this.activeBomb.expiresAt - Date.now());
        const bombPlayer = this.activeBomb.player;
        const bombIdx = this.activeBomb.idx;
        const bombRef = bombPlayer === 1 ? this.p1 : this.p2;
        this.addDeltaTimer(`bomb_${bombPlayer}_${bombIdx}`, bombRemaining, () => {
          if (!this.activeBomb || this.activeBomb.idx !== bombIdx || this.activeBomb.player !== bombPlayer) return;
          const stillActive = bombRef.active.find(c => c.idx === bombIdx && c.type === "bomb" && !c.clicked);
          if (!stillActive) { if (this.activeBomb?.idx === bombIdx) this.activeBomb = null; return; }
          this.activeBomb = null;
          stillActive.clicked = true;
          if (!this.devGodMode) {
            if (bombRef.shieldCount > 0) { bombRef.shieldCount -= 1; bombRef.shield = bombRef.shieldCount > 0; }
            else {
              const dmg = this.config.mode === "evolve" ? 0.5 : 1;
              bombRef.health = Math.max(0, bombRef.health - dmg); bombRef.shield = false;
              this._tookDamage = true;
              this.emit({ type: "damage", player: bombPlayer });
              this.emit({ type: "shake", player: bombPlayer });
              if (bombRef.health < 1) { bombRef.alive = false; this.triggerGameOver(this.config.numPlayers === 1 ? null : (bombPlayer === 1 ? "p2" : "p1")); }
            }
          }
          this.emit({ type: "bombExplode", player: bombPlayer });
          this.emit({ type: "toast", message: "💥 Bomb exploded!" });
        });
      }
      this.dda.reset((data.ddaSpawnRate as number) ?? 1200);
      const p1 = data.p1 as Record<string, unknown> | undefined;
      if (p1) {
        // Bounds checking — clamp values to prevent tampered session data
        this.p1.score = Math.max(0, Math.min(9999, (p1.score as number) ?? 0));
        this.p1.health = Math.max(0, Math.min(GAME.MAX_HEARTS + 2, (p1.health as number) ?? GAME.MAX_HEARTS));
        this.p1.streak = Math.max(0, Math.min(999, (p1.streak as number) ?? 0));
        this.p1.gridStage = Math.max(0, Math.min(10, (p1.gridStage as number) ?? 0));
        this.p1.stageProgress = Math.max(0, Math.min(999, (p1.stageProgress as number) ?? 0));
        this.p1.patternIdx = Math.max(0, Math.min(EVOLVE_PATTERNS.length - 1, (p1.patternIdx as number) ?? 0));
        this.p1.shield = (p1.shield as boolean) ?? false;
        this.p1.shieldCount = Math.max(0, Math.min(5, (p1.shieldCount as number) ?? 0));
        this.p1.freezeEnd = Math.max(0, (p1.freezeEnd as number) ?? 0);
        this.p1.multiplierEnd = Math.max(0, (p1.multiplierEnd as number) ?? 0);
        this.p1.storedFreezeCharges = Math.max(0, Math.min(10, (p1.storedFreezeCharges as number) ?? 0));
        this.p1.storedShieldCharges = Math.max(0, Math.min(10, (p1.storedShieldCharges as number) ?? 0));
        this.p1.alive = (p1.alive as boolean) ?? true;
        this.p1.active = ((p1.active as Array<Record<string, unknown>>) ?? []).map(c => {
          const cell = { ...c } as Record<string, unknown>;
          if (typeof cell.idx !== 'number' || (cell.idx as number) < 0) cell.idx = 0;
          if (!GameEngine.VALID_CELL_TYPES.has(cell.type as string)) cell.type = 'inactive';
          if (typeof cell.clicked !== 'boolean') cell.clicked = false;
          return cell as unknown as ActiveCell;
        });
        const pat = EVOLVE_PATTERNS[this.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
        this.p1.cells = activeToCellsP(this.p1.active, pat);
      }
      const p2 = data.p2 as Record<string, unknown> | null | undefined;
      if (p2 && this.config.numPlayers === 2) {
        this.p2.score = Math.max(0, Math.min(9999, (p2.score as number) ?? 0));
        this.p2.health = Math.max(0, Math.min(GAME.MAX_HEARTS + 2, (p2.health as number) ?? GAME.MAX_HEARTS));
        this.p2.streak = Math.max(0, Math.min(999, (p2.streak as number) ?? 0));
        this.p2.gridStage = Math.max(0, Math.min(10, (p2.gridStage as number) ?? 0));
        this.p2.stageProgress = Math.max(0, Math.min(999, (p2.stageProgress as number) ?? 0));
        this.p2.patternIdx = Math.max(0, Math.min(EVOLVE_PATTERNS.length - 1, (p2.patternIdx as number) ?? 0));
        this.p2.shield = (p2.shield as boolean) ?? false;
        this.p2.shieldCount = Math.max(0, Math.min(5, (p2.shieldCount as number) ?? 0));
        this.p2.freezeEnd = Math.max(0, (p2.freezeEnd as number) ?? 0);
        this.p2.multiplierEnd = Math.max(0, (p2.multiplierEnd as number) ?? 0);
        this.p2.storedFreezeCharges = Math.max(0, Math.min(10, (p2.storedFreezeCharges as number) ?? 0));
        this.p2.storedShieldCharges = Math.max(0, Math.min(10, (p2.storedShieldCharges as number) ?? 0));
        this.p2.alive = (p2.alive as boolean) ?? true;
        this.p2.active = ((p2.active as Array<Record<string, unknown>>) ?? []).map(c => {
          const cell = { ...c } as Record<string, unknown>;
          if (typeof cell.idx !== 'number' || (cell.idx as number) < 0) cell.idx = 0;
          if (!GameEngine.VALID_CELL_TYPES.has(cell.type as string)) cell.type = 'inactive';
          if (typeof cell.clicked !== 'boolean') cell.clicked = false;
          return cell as unknown as ActiveCell;
        });
        const pat2 = EVOLVE_PATTERNS[this.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
        this.p2.cells = activeToCellsP(this.p2.active, pat2);
      }
      this.emit({ type: "phaseChange", phase: "playing" });
      this.dirty = true;
      this.emitSnapshot();
      this.scheduleTick();
      this.startSnapshotRaf();
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
    } catch (e) { logError('autoSaveSession failed', e); }
  }

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


---
## `engine/subsystems/TickProcessor.ts`
---

import { GAME } from "../../config/difficulty";
import { BALANCE } from "../../config/gameBalance";
import { EVOLVE_PATTERNS, RARE_COLORS } from "../../config/gridPatterns";
import { logError } from "../../utils/devLog";
import { haptics } from "../../utils/haptics";
import { errorTracker } from "../../utils/error-tracker";
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
  autoSaveSession(): void;
  triggerGameOver(winner: Winner): void;
  scheduleTimeout(cb: () => void, ms: number): ReturnType<typeof setTimeout>;
  addDeltaTimer(id: string, durationMs: number, callback: () => void): void;
  removeDeltaTimer(id: string): void;
  readonly rng: () => number;
}

const _slotsCache = new WeakMap<{ cols: number; rows: number; mask: number[] | null }, Set<number>>();

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
    for (const cb of expiredCallbacks) cb();

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
      const pat = mode === "evolve" ? (EVOLVE_PATTERNS[patIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      if (!pat || pat.cols === 0) { logError("[DTP-002]"); continue; }
      let validSlots = _slotsCache.get(pat);
      if (!validSlots) { validSlots = new Set(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)); _slotsCache.set(pat, validSlots); }
      const dangerColor = ctx.rareMode.active ? ctx.rareMode.color : "purple";
      ctx._isInverted = ctx.bossEvent?.type === "inversion" && ctx.now < (ctx.bossEvent?.endsAt ?? 0);
      ctx._isBlackout  = ctx.bossEvent?.type === "blackout"  && ctx.now < (ctx.bossEvent?.endsAt ?? 0);

      const player = (pi + 1) as 1 | 2;

      ref.active.forEach(c => {
        if (!validSlots.has(c.idx) || c.clicked) return;
        const isPwr = ["medpack","shield","freeze","multiplier","ice","hold","bomb"].includes(c.type);
        const isMiss = ctx._isInverted ? c.type === "purple" : c.type !== dangerColor && !isPwr;
        if (isMiss) {
          const dmg = mode === "evolve" ? 0.5 : 1;
          if (!ctx.devGodMode) {
            if (ref.shieldCount > 0) { ctx.dda.recordAttempt(false, 0, false); ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
            else {
              ctx.dda.recordAttempt(false, 0, true);
              ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
              ctx.emit({ type: "damage", player }); ctx.emit({ type: "shake", player });
              if (ref.health < 1) {
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
      const nextPat = mode === "evolve" ? (EVOLVE_PATTERNS[nextPatIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      const rareColor = ctx.rareMode.active ? ctx.rareMode.color : undefined;
      const rareShape = ctx.rareMode.active ? ctx.rareMode.shape : undefined;
      const spawnStage = mode === "evolve" ? curStage : Math.min(Math.floor(ctx.tickCount / 12), 7);
      const newActive = spawnActive(ctx.rng, spawnStage, ref.health, nextPat, mode === "evolve", rareColor, rareShape, ctx.tickCount, ctx.devGodMode);
      if (ctx.devForcedPwr && newActive.length > 0) {
        newActive[0] = { ...newActive[0], type: (ctx.devForcedPwr === "heart" ? "medpack" : ctx.devForcedPwr) } as ActiveCell;
        if (pi === 0) ctx.devForcedPwr = null;
      }
      ref.active = newActive;
      ref.cells = activeToCellsP(newActive, nextPat);
      for (const c of newActive) {
        if (["medpack", "shield", "freeze", "multiplier"].includes(c.type)) {
          ref.anim[c.idx] = "pwr-drop";
          ctx.scheduleTimeout(() => { if (ref.anim[c.idx] === "pwr-drop") { ref.anim = { ...ref.anim }; delete ref.anim[c.idx]; } }, 600);
        }
      }
    }

    // Cell shuffle + boss event + bomb spawn
    if (mode === "evolve") {
      const stormActive = ctx.bossEvent?.type === "storm" && ctx.now < (ctx.bossEvent?.endsAt ?? 0);
      const shufflePat = EVOLVE_PATTERNS[ctx.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
      if (stormActive) {
        ctx.p1.nextShuffleTick = 0;
        ctx.p2.nextShuffleTick = 0;
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
    if (ctx.tickCount % 10 === 0) ctx.autoSaveSession();
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
    ref.active.push(bomb);
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
          if (ref.health < 1) {
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
          // Dynamic import to avoid circular dependency
          import('../../utils/achievements').then(m => m.achievementSystem.unlock('boss_inversion')).catch(() => {});
        }
      }
    }, durationMs);
  }
}


---
## `engine/subsystems/CellLifecycle.ts`
---

import { GAME } from "../../config/difficulty";
import { STAGES, EVOLVE_PATTERNS } from "../../config/gridPatterns";
import { POWERUP_TABLE } from "../../config/powerupWeights";
import type { ActiveCell, CellType, CellShape } from "../types";

const SAFE: CellType[] = [
  "white","blue","red","orange","yellow",
  "green","cyan","lime","teal","pink","rose","magenta",
];

function randCell(rng: () => number, tick = 0, isClassic = false): CellType {
  const purpleChance = isClassic
    ? Math.min(0.42, 0.22 + Math.floor(tick / 20) * 0.02)
    : 0.22;
  if (rng() < purpleChance) return "purple";
  return SAFE[Math.floor(rng() * SAFE.length)];
}

export function pickCellShape(tick: number): CellShape {
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

export function activeToCellsP(
  active: ActiveCell[],
  pattern: { cols: number; rows: number; mask: number[] | null }
): CellType[] {
  const cells: CellType[] = new Array(25).fill("inactive");
  const { cols, rows, mask } = pattern;
  const gridTotal = cols * rows;
  if (mask) {
    const maskSet = new Set(mask);
    for (let i = 0; i < gridTotal; i++) {
      if (!maskSet.has(i)) cells[i] = "void" as CellType;
    }
  }
  active.forEach(c => { if (!c.clicked && c.idx >= 0 && c.idx < cells.length) cells[c.idx] = c.type; });
  return cells;
}

// Pre-computed base powerup table (health-independent portion)
const BASE_POWERUP_TABLE = POWERUP_TABLE.filter(p => p.type !== 'medpack');
const BASE_POWERUP_WEIGHT = BASE_POWERUP_TABLE.reduce((s, p) => s + p.weight, 0);
const MEDPACK_BASE_WEIGHT = POWERUP_TABLE.find(p => p.type === 'medpack')?.weight ?? 7;

export function spawnActive(
  rng: () => number,
  stage: number,
  health: number,
  patternOverride?: { cols: number; rows: number; mask: number[] | null },
  isEvolve?: boolean,
  rareColor?: string,
  rareShape?: CellShape,
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
  // Use pre-computed base table — only adjust medpack weight dynamically
  const medpackWeight = (!godMode && health < GAME.MAX_HEARTS) ? MEDPACK_BASE_WEIGHT + 10 : (godMode ? 0 : MEDPACK_BASE_WEIGHT);
  const totalWeight = BASE_POWERUP_WEIGHT + medpackWeight;
  if (powerupEligible && totalWeight > 0) {
    const roll = rng() * 100;
    if (roll < totalWeight) {
      let cursor = 0;
      // Check medpack first
      if (medpackWeight > 0) {
        cursor += medpackWeight;
        if (roll < cursor) { powerup = 'medpack' as CellType; }
      }
      if (!powerup) {
        for (const p of BASE_POWERUP_TABLE) {
          cursor += p.weight;
          if (roll < cursor) { powerup = p.type as CellType; break; }
        }
      }
    }
  }

  let evolveSpecial: CellType | null = null;
  if (isEvolve && stage >= 2) { // Special cells start at stage 2 (was 3 — reduces difficulty spike)
    const r = rng();
    if (r < 0.12) evolveSpecial = "ice"; // Only ice — hold cells removed (contradict tap-based core)
  }

  return idxs.map((idx, i) => {
    if (i === 0 && powerup) return { idx, clicked: false, type: powerup } as ActiveCell;
    if (i === 0 && evolveSpecial === "ice") {
      return { idx, clicked: false, type: "ice", iceCount: 2 + Math.floor(rng() * 3) };
    }
    const baseType = randCell(rng, tick, !isEvolve);
    if (rareColor && baseType === "purple") return { idx, clicked: false, type: rareColor, shape: rareShape } as ActiveCell;
    return { idx, clicked: false, type: baseType } as ActiveCell;
  });
}

export function pickPattern(rng: () => number, stage: number, lastIdx: number, score: number): number {
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


---
## `engine/subsystems/BotController.ts`
---

import { BALANCE } from '../../config/gameBalance';
import { logger } from '../../utils/logger';

export interface BotConfig {
  getDust: () => number;
  spendDust: (amount: number) => void;
  getAccuracy: () => number;
}

export interface BotCallbacks {
  getDangerColor: () => string;
  isInverted: () => boolean;
  handleTap: (player: 1 | 2, idx: number) => void;
  emit: (event: { type: string; [k: string]: unknown }) => void;
  getActiveCells: (player: 1 | 2) => import('../types').ActiveCell[];
  isPlaying: () => boolean;
}

export class BotController {
  private _active: { 1: boolean; 2: boolean } = { 1: false, 2: false };
  private _intervalRef: ReturnType<typeof setInterval> | null = null;
  private _pendingTaps: ReturnType<typeof setTimeout>[] = [];
  private _dustSpentTotal = 0;
  private _rng: (() => number) | null = null;

  constructor(private callbacks: BotCallbacks) {}

  setRng(rng: () => number) { this._rng = rng; }

  start(mode: string, config?: BotConfig): void {
    if (mode !== 'evolve') return;
    this._stop();

    const botCfg: BotConfig = config ?? {
      getDust: () => 9999,
      spendDust: () => {},
      getAccuracy: () => 1,
    };

    this._active[1] = true;
    this._dustSpentTotal = 0;

    this._intervalRef = setInterval(() => {
      if (!this._active[1] || !this.callbacks.isPlaying()) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      const dust = botCfg.getDust();
      if (dust < BALANCE.bot.minDustToStart) {
        this._active[1] = false;
        this.callbacks.emit({ type: 'toast', message: '🤖 Bot off — low dust!' });
        return;
      }

      const delay = Math.max(BALANCE.bot.minDelayMs, BALANCE.bot.baseDelayMs - this._dustSpentTotal * BALANCE.bot.delayReductionPerTap);
      const accuracy = botCfg.getAccuracy();
      const danger = this.callbacks.getDangerColor();
      const inverted = this.callbacks.isInverted();
      const costPerTap = BALANCE.bot.baseCostPerTap;
      const rng = this._rng ?? Math.random;

      // Issue 26: Process cells for all active players (P1 and P2)
      for (const player of ([1, 2] as const)) {
        if (!this._active[player]) continue;
        for (const cell of this.callbacks.getActiveCells(player)) {
          if (cell.clicked) continue;
          if ((cell.type as string) === 'void') continue;
          if (cell.type === 'hold' || cell.type === 'ice') continue;
          // During inversion: only purple is safe; normal play: skip danger color
          if (inverted ? cell.type !== 'purple' : cell.type === danger) continue;
          if (rng() > accuracy) continue;

          const dustNow = botCfg.getDust();
          if (dustNow < costPerTap) break;

          botCfg.spendDust(costPerTap);
          this._dustSpentTotal += costPerTap;
          this.callbacks.emit({ type: 'dustConsumed', amount: costPerTap });

          const idx = cell.idx;
          const expectedType = cell.type;
          const tapPlayer = player;
          const tapTimer = setTimeout(() => {
            this._pendingTaps = this._pendingTaps.filter(t => t !== tapTimer);
            if (!this._active[tapPlayer] || !this.callbacks.isPlaying()) return;
            // Verify cell at idx is still the same safe cell (could have been replaced by a new spawn)
            const current = this.callbacks.getActiveCells(tapPlayer).find(c => c.idx === idx && !c.clicked);
            if (!current || current.type !== expectedType) return;
            this.callbacks.handleTap(tapPlayer, idx);
            this.callbacks.emit({ type: 'botTap', player: tapPlayer, idx, dustCost: costPerTap });
          }, delay);
          this._pendingTaps.push(tapTimer);
        }
      }
    }, BALANCE.bot.checkIntervalMs);
  }

  private _stop(): void {
    if (this._intervalRef) {
      clearInterval(this._intervalRef);
      this._intervalRef = null;
    }
  }

  stop(): void {
    this._active[1] = false;
    this._active[2] = false;
    this._stop();
    this._pendingTaps.forEach(clearTimeout);
    this._pendingTaps = [];
  }

  isActive(): boolean { return this._active[1]; }

  setAssist(player: 1 | 2, enabled: boolean): void {
    this._active[player] = enabled;
    if (player === 1) {
      if (enabled) logger.info('BotController: assist enabled for P1');
      else this.stop();
    }
  }

  getAssistState(): { 1: boolean; 2: boolean } {
    return { ...this._active };
  }

  dispose(): void {
    this._stop();
    this._pendingTaps.forEach(clearTimeout);
    this._pendingTaps = [];
    this._active = { 1: false, 2: false };
  }
}


---
## `engine/subsystems/ScoreTracker.ts`
---

const STREAK_MILESTONES = [5, 10, 25, 50];
const STREAK_BONUS_TIERS = [
  { streak: 30, bonus: 3 },
  { streak: 16, bonus: 2 },
  { streak: 8, bonus: 1 },
];

export function calculateTapScore(
  multiplierActive: boolean,
  bossActive: boolean,
  bossComboMultiplier: number
): { mult: number; bossMult: number; total: number } {
  const mult = multiplierActive ? 2 : 1;
  const bossMult = bossActive ? bossComboMultiplier : 1;
  return { mult, bossMult, total: mult * bossMult };
}

export function calculateStreakBonus(nextStreak: number): number {
  return STREAK_BONUS_TIERS.find(tier => nextStreak >= tier.streak)?.bonus ?? 0;
}

export function checkStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}


---
## `engine/subsystems/EventOrchestrator.ts`
---

import type { BossEventType } from "../types";

// Only inversion provides genuine skill expression — storm is chaos, blackout contradicts core mechanic
const BOSS_ROTATION: BossEventType[] = ["inversion"];

const DURATIONS: Record<BossEventType, number> = {
  storm: 8000,       // dead — BOSS_ROTATION only contains "inversion"
  inversion: 4000,
  blackout: 5000,    // dead — BOSS_ROTATION only contains "inversion"
};

const LABELS: Record<BossEventType, string> = {
  storm:     "⚡ STORM! Cells shuffle faster!",    // dead
  inversion: "🔄 INVERSION! Safe and danger swapped!",
  blackout:  "🌑 BLACKOUT! Grid goes dark!",       // dead
};

const DONE_LABELS: Record<BossEventType, string> = {
  storm:     "✅ Storm over.",     // dead
  inversion: "✅ Inversion over.",
  blackout:  "✅ Blackout over.", // dead
};

export function getNextBossEventType(prevType: BossEventType | null): BossEventType {
  const prevIdx = prevType ? BOSS_ROTATION.indexOf(prevType) : -1;
  return BOSS_ROTATION[(prevIdx + 1) % BOSS_ROTATION.length];
}

export function getBossDuration(type: BossEventType): number {
  return DURATIONS[type];
}

export function getBossLabel(type: BossEventType): string {
  return LABELS[type];
}

export function getBossDoneLabel(type: BossEventType): string {
  return DONE_LABELS[type];
}

export function getNextBossTriggerScore(current: number): number {
  return current + 500;
}

export function shouldTriggerShieldBoss(
  score: number,
  bossActive: boolean,
  weatherActive: boolean,
  mode: string,
  rng: () => number
): boolean {
  return mode === "evolve" && !bossActive && !weatherActive && score > 100 && score % 300 < 4 && rng() < 0.35;
}


---
## `engine/DifficultyScaler.ts`
---

import { DIFFICULTY } from "../config/difficulty";
import { difficultyOverrides } from "../config/difficultyOverrides";

// ─── Read overrides on each call (not at module load) ─────────────
function _initMs() { return difficultyOverrides.INIT_MS ?? DIFFICULTY.INIT_MS; }
function _minMs() { return difficultyOverrides.MIN_MS ?? DIFFICULTY.MIN_MS; }
function _decayExp() { return difficultyOverrides.DECAY_EXP ?? DIFFICULTY.DECAY_EXP; }
function _decayEvery() { return difficultyOverrides.DECAY_EVERY ?? DIFFICULTY.DECAY_EVERY; }
function _spinBaseDuration() { return difficultyOverrides.SPIN_BASE_DURATION ?? DIFFICULTY.SPIN_BASE_DURATION; }
function _spinGrowth() { return difficultyOverrides.SPIN_GROWTH ?? DIFFICULTY.SPIN_GROWTH; }
function _spinSpeedCap() { return difficultyOverrides.SPIN_SPEED_CAP ?? DIFFICULTY.SPIN_SPEED_CAP; }
function _spinEpochLevels() { return difficultyOverrides.SPIN_EPOCH_LEVELS ?? DIFFICULTY.SPIN_EPOCH_LEVELS; }

// ─── Tick interval (ms) ───────────────────────────────────────────
export function computeMs(tick: number, mult = 1): number {
  return Math.max(
    _minMs(),
    _initMs() * Math.pow(_decayExp(), Math.floor(tick / _decayEvery())) * mult
  );
}

// ─── Speed display helpers ────────────────────────────────────────
export function speedLabel(tick: number, frozen: boolean): string {
  return (_initMs() / computeMs(tick, frozen ? 1.4 : 1)).toFixed(1) + "×";
}

export function speedPct(tick: number): number {
  const initMs = _initMs(), minMs = _minMs();
  return Math.max(
    4,
    ((initMs - computeMs(tick)) / (initMs - minMs)) * 96
  );
}

// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────
export function mulberry32(seed: number): () => number {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeGameSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

// ─── Spin config ──────────────────────────────────────────────────
export function getSpinConfig(
  level: number,
  gameSeed: number
): { duration: number; direction: 1 | -1 } {
  const rawDur = _spinBaseDuration() * Math.pow(1 - _spinGrowth(), level);
  const duration = Math.max(_spinSpeedCap(), rawDur);
  const epoch = Math.floor(level / _spinEpochLevels());
  const epochSeed = (gameSeed ^ (epoch * 0x9e3779b9)) >>> 0;
  const rng = mulberry32(epochSeed);
  const direction: 1 | -1 = rng() > 0.5 ? 1 : -1;
  return { duration, direction };
}


---
## `engine/types.ts`
---

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
  slideAnim?: Record<number, { fromIdx: number; startMs: number; gen: number }>; // K3: cell shuffle slide
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
