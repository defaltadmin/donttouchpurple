// utils/score-sync.ts
import { logger } from './logger';
import { LS_KEYS } from '../config/difficulty';
import { idb } from './idb';

export const scoreSync = {
  async queue(score: number, mode: 'classic' | 'evolve' = 'evolve') {
    const rawInitials = localStorage.getItem(LS_KEYS.PLAYER_NAME) || 'ANON';
    const initials = rawInitials.replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON';
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
      const res = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: Math.max(0, Math.min(9999, Math.floor(item.score || 0))),
          initials: String(item.initials || 'ANON').replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON',
          mode: ['classic', 'evolve'].includes(item.mode) ? item.mode : 'classic',
          tick: typeof item.tick === 'number' ? item.tick : 0,
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
