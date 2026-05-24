// utils/dda.ts
import { logger } from './logger';

export interface DDAMetrics {
  accuracy: number;
  avgReactionMs: number;
  streak: number;
  deaths: number;
}

export class DynamicDifficulty {
  private currentSpawnMs: number;
  private readonly minSpawnMs = 400;
  private readonly maxSpawnMs = 2000;
  private readonly adjustmentWindow = 10;
  private tickCount = 0;
  private lastAdjustedTickCount = 0;
  private metrics: DDAMetrics = { accuracy: 0, avgReactionMs: 0, streak: 0, deaths: 0 };

  private _consecutiveDeaths = 0;
  private _recentReactions: number[] = [];
  private _lastAttemptTime = 0;
  private readonly MAX_REACTION_SAMPLES = 8;
  private readonly DEATH_SPIKE_THRESHOLD = 2;
  private readonly REACTION_SPIKE_PCT = 0.85;
  private _emergencyCooldown = 0;
  private readonly EMERGENCY_COOLDOWN_MS = 5000;

  constructor(initialSpawnMs: number) {
    this.currentSpawnMs = initialSpawnMs;
  }

  /**
   * @param hit       - true if the player tapped a safe cell
   * @param reactionMs - ms since last tap (0 on miss/death)
   * @param died      - true only when the player loses a heart (shield blocks do NOT set this)
   */
  recordAttempt(hit: boolean, reactionMs: number, died: boolean) {
    // FIX: consecutiveDeaths is driven by `died`, not by `!hit`.
    // Shield-blocks register hit=false but died=false — they should not
    // trigger the emergency drop that shield-blocks are meant to prevent.
    if (died) {
      this._consecutiveDeaths++;
      this._recentReactions = [];
    } else if (hit) {
      this._consecutiveDeaths = 0;
      this._recentReactions.push(reactionMs);
      if (this._recentReactions.length > this.MAX_REACTION_SAMPLES)
        this._recentReactions.shift();
    }
    // Non-lethal miss (shield block): neither counter changes

    this.tickCount++;
    this._lastAttemptTime = Date.now();
    this.metrics.accuracy =
      (this.metrics.accuracy * (this.tickCount - 1) + (hit ? 1 : 0)) / this.tickCount;
    this.metrics.avgReactionMs =
      (this.metrics.avgReactionMs * (this.tickCount - 1) + reactionMs) / this.tickCount;
    this.metrics.streak = hit ? this.metrics.streak + 1 : 0;
    if (died) this.metrics.deaths++;
  }

  compute(): number {
    const isAfk = this._lastAttemptTime > 0 && Date.now() - this._lastAttemptTime > 5000;
    if (this.tickCount % this.adjustmentWindow !== 0 && !isAfk) return this.currentSpawnMs;
    this._checkEmergency();
    if (this.tickCount === 0 || this.lastAdjustedTickCount === this.tickCount) return this.currentSpawnMs;
    this.lastAdjustedTickCount = this.tickCount;

    const { accuracy, avgReactionMs, streak, deaths } = this.metrics;
    const score = (accuracy * 400) - (avgReactionMs / 5) + (streak * 25) - (deaths * 150);

    if (score > 150 && this.currentSpawnMs > this.minSpawnMs) {
      this.currentSpawnMs = Math.max(this.minSpawnMs, this.currentSpawnMs - 120);
      logger.debug('DDA: Difficulty increased', { spawnMs: this.currentSpawnMs });
    } else if (score < -50 && this.currentSpawnMs < this.maxSpawnMs) {
      this.currentSpawnMs = Math.min(this.maxSpawnMs, this.currentSpawnMs + 90);
      logger.debug('DDA: Difficulty decreased', { spawnMs: this.currentSpawnMs });
    }
    return this.currentSpawnMs;
  }

  private _checkEmergency() {
    const now = performance.now();
    if (now < this._emergencyCooldown) return;

    const avgReaction = this._recentReactions.length
      ? this._recentReactions.reduce((a, b) => a + b, 0) / this._recentReactions.length
      : 0;
    const reactionSpike = avgReaction > 800 && this._recentReactions.length >= Math.ceil(this.MAX_REACTION_SAMPLES / 2);
    const deathSpike    = this._consecutiveDeaths >= this.DEATH_SPIKE_THRESHOLD;

    if (deathSpike || reactionSpike) {
      const drop = deathSpike ? 180 : 100;
      this.currentSpawnMs = Math.min(this.maxSpawnMs, this.currentSpawnMs + drop);
      this._emergencyCooldown = now + this.EMERGENCY_COOLDOWN_MS;
      this._consecutiveDeaths = 0;
      this._recentReactions   = [];
      logger.warn('DDA EMERGENCY DROP', {
        reason: deathSpike ? 'consecutive_deaths' : 'slow_reactions',
        newSpawn: this.currentSpawnMs,
      });
      window.dispatchEvent(new CustomEvent('dtp:difficulty:emergency', {
        detail: { newSpawnMs: this.currentSpawnMs, reason: deathSpike ? 'deaths' : 'reaction' },
      }));
    }
  }

  reset(ms: number) {
    this.currentSpawnMs     = ms;
    this.tickCount          = 0;
    this.lastAdjustedTickCount = 0;
    this.metrics            = { accuracy: 0, avgReactionMs: 0, streak: 0, deaths: 0 };
    this._consecutiveDeaths = 0;
    this._recentReactions   = [];
    this._emergencyCooldown = 0;
  }

  get spawnRate() { return this.currentSpawnMs; }
}
