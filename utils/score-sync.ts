import { logger } from './logger';

interface PendingScore { score: number; attempts: number; nextRetry: number; }
const RETRY_DELAY_MS = 2000;
const MAX_ATTEMPTS = 3;

const queueKey = 'dtp:score-queue';
const USE_REAL_API = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_LEADERBOARD === 'true';

export const scoreSync = {
  queue(score: number) {
    const pending: PendingScore = { score, attempts: 0, nextRetry: Date.now() };
    const queue = this.getQueue();
    queue.push(pending);
    localStorage.setItem(queueKey, JSON.stringify(queue));
    logger.info('Score queued for sync', score);
    this.flush();
  },

  getQueue(): PendingScore[] {
    try { return JSON.parse(localStorage.getItem(queueKey) || '[]'); } catch { return []; }
  },

  async flush() {
    const queue = this.getQueue();
    if (queue.length === 0) return;
    
    const now = Date.now();
    const due = queue.filter(p => p.nextRetry <= now);
    const stillPending = queue.filter(p => p.nextRetry > now);

    for (const item of due) {
      try {
        if (USE_REAL_API) {
          const res = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: item.score })
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } else {
          await new Promise(res => setTimeout(res, 300));
        }
        logger.info('Score synced successfully', item.score);
      } catch (err) {
        logger.warn('Score sync failed, retrying', item.score, err);
        item.attempts += 1;
        if (item.attempts < MAX_ATTEMPTS) {
          item.nextRetry = now + (RETRY_DELAY_MS * 2 ** item.attempts);
          stillPending.push(item);
        } else {
          logger.error('Score sync exhausted retries', item.score);
        }
      }
    }

    localStorage.setItem(queueKey, JSON.stringify(stillPending));
    if (stillPending.length > 0) {
      setTimeout(() => this.flush(), Math.min(5000, ...stillPending.map(p => p.nextRetry - Date.now())));
    }
  }
};
