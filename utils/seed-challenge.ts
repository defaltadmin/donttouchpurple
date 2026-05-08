import { logger } from './logger';

export class DailyChallenge {
  private seed: string;
  private readonly challengeId = 'dtp:daily';

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    this.seed = btoa(today + '-donttouchpurple-daily').slice(0, 12);
  }

  getSeed(): string { return this.seed; }

  isTodayComplete(): boolean {
    const saved = localStorage.getItem(this.challengeId);
    if (!saved) return false;
    const { seed, completed } = JSON.parse(saved);
    return seed === this.seed && completed;
  }

  markComplete(score: number, time: number) {
    localStorage.setItem(this.challengeId, JSON.stringify({ seed: this.seed, completed: true, score, time, date: new Date().toISOString() }));
    logger.info('Daily challenge completed!', { score, time });
    window.dispatchEvent(new CustomEvent('dtp:daily-complete', { detail: { score, time } }));
  }

  reset() { localStorage.removeItem(this.challengeId); }
}
