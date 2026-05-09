// utils/seed-challenge.ts
import { logger } from './logger';

async function hashDailySeed(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 12);
}

export class DailyChallenge {
  private seed: string = '';                    // populated async in init()
  private ready: Promise<void>;
  private readonly challengeId = 'dtp:daily';

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    // v2 suffix invalidates any cached seeds from the btoa era
    this.ready = hashDailySeed(`${today}-donttouchpurple-daily-v2`)
      .then(s => { this.seed = s; });
  }

  /** Await before calling getSeed() on first use. */
  async init(): Promise<void> { return this.ready; }

  getSeed(): string { return this.seed; }

  isTodayComplete(): boolean {
    const saved = localStorage.getItem(this.challengeId);
    if (!saved) return false;
    try {
      const { seed, completed } = JSON.parse(saved);
      return seed === this.seed && completed === true;
    } catch { return false; }
  }

  markComplete(score: number, time: number) {
    localStorage.setItem(this.challengeId, JSON.stringify({
      seed: this.seed, completed: true, score, time,
      date: new Date().toISOString(),
    }));
    logger.info('Daily challenge completed!', { score, time });
    window.dispatchEvent(new CustomEvent('dtp:daily-complete', { detail: { score, time } }));
  }

  reset() { localStorage.removeItem(this.challengeId); }
}
