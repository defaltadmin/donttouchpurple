// utils/score-sync.ts
import { logger } from './logger';
import { LS_KEYS } from '../config/difficulty';
import { idb } from './idb';

export const scoreSync = {
  async queue(score: number, mode: 'classic' | 'evolve' = 'evolve') {
    const initials = localStorage.getItem(LS_KEYS.PLAYER_NAME) || 'ANON';
    const pending = { score, initials, mode, attempts: 0, nextRetry: Date.now() };

    if (navigator.onLine) {
      const success = await this._submit(pending);
      if (success) return;
    }

    try {
      await idb.enqueue(pending);
      logger.info('📦 Score queued offline', { score, initials });
    } catch (e) {
      logger.warn('Failed to queue score offline', e);
    }
  },

  async _submit(item: any): Promise<boolean> {
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: item.score,
          initials: item.initials,
          mode: item.mode,
          tick: Date.now(),
          sessionId: crypto.randomUUID?.() || `sess-${Date.now()}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch {
      return false;
    }
  },

  async flush() {
    if (!navigator.onLine) return;

    const pending = await idb.dequeueAll();
    if (pending.length === 0) return;

    logger.info(`🔄 Flushing ${pending.length} offline scores`);

    for (const item of pending) {
      const success = await this._submit(item);
      if (!success) {
        await idb.enqueue({ ...item, attempts: (item.attempts || 0) + 1 });
      }
    }
  },

  async init() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => this.flush());
    await this.flush();
  },
};
