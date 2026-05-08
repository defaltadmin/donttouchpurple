import { logger } from './logger';

export interface DDAMetrics {
  accuracy: number;
  avgReactionMs: number;
  streak: number;
  deaths: number;
}

export class DynamicDifficulty {
  private baselineSpawnMs: number;
  private currentSpawnMs: number;
  private readonly minSpawnMs: number = 400;
  private readonly maxSpawnMs: number = 2000;
  private readonly adjustmentWindow = 10;
  private tickCount = 0;
  private metrics: DDAMetrics = { accuracy: 0, avgReactionMs: 0, streak: 0, deaths: 0 };

  constructor(initialSpawnMs: number) {
    this.baselineSpawnMs = initialSpawnMs;
    this.currentSpawnMs = initialSpawnMs;
  }

  recordAttempt(hit: boolean, reactionMs: number, died: boolean) {
    const { accuracy, avgReactionMs, streak, deaths } = this.metrics;
    this.metrics.accuracy = (accuracy * this.tickCount + (hit ? 1 : 0)) / (this.tickCount + 1);
    this.metrics.avgReactionMs = (avgReactionMs * this.tickCount + reactionMs) / (this.tickCount + 1);
    this.metrics.streak = hit ? streak + 1 : 0;
    this.metrics.deaths = died ? deaths + 1 : deaths;
    this.tickCount++;
  }

  compute(): number {
    if (this.tickCount % this.adjustmentWindow !== 0) return this.currentSpawnMs;
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

  reset(ms: number) { this.baselineSpawnMs = ms; this.currentSpawnMs = ms; this.tickCount = 0; this.metrics = { accuracy: 0, avgReactionMs: 0, streak: 0, deaths: 0 }; }
  get spawnRate() { return this.currentSpawnMs; }
}
