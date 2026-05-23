// utils/score-sync.ts
import { logger } from './logger';
import { LS_KEYS } from '../config/difficulty';
import { idb } from './idb';

async function getAuthToken(): Promise<string | undefined> {
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    return await auth.currentUser?.getIdToken();
  } catch { return undefined; }
}

export const scoreSync = {
  async queue(score: number, mode: 'classic' | 'evolve' = 'evolve', tick = 0) {
    const rawInitials = localStorage.getItem(LS_KEYS.PLAYER_NAME) || 'ANON';
    const initials = rawInitials.replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON';
    const pending = { score, initials, mode, tick, attempts: 0, nextRetry: Date.now(), sessionId: crypto.randomUUID?.() || `sess-${Date.now()}` };

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

  async _submit(item: { score: number; initials: string; mode: string; tick?: number; attempts?: number; sessionId?: string }): Promise<boolean> {
    try {
      const token = await getAuthToken();
      const res = await fetch('https://game.mscarabia.com/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          score: Math.max(0, Math.min(9999, Math.floor(item.score || 0))),
          initials: String(item.initials || 'ANON').replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON',
          mode: ['classic', 'evolve'].includes(item.mode) ? item.mode : 'classic',
          tick: typeof item.tick === 'number' ? item.tick : 0,
          sessionId: item.sessionId || crypto.randomUUID?.() || `sess-${Date.now()}`,
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

    const pending = await idb.peekAll();
    if (pending.length === 0) return;

    logger.info(`🔄 Flushing ${pending.length} offline scores`);

    const succeededIds: number[] = [];
    const failedIds: number[] = [];
    const now = Date.now();
    for (const item of pending) {
      // Exponential backoff: skip items not yet due for retry
      const nextRetry = item.nextRetry ?? 0;
      if (nextRetry > now) continue;

      const success = await this._submit(item);
      if (success) {
        if (item.id != null) succeededIds.push(item.id);
      } else {
        if (item.id != null) failedIds.push(item.id);
        const attempts = (item.attempts || 0) + 1;
        const backoffMs = Math.min(1000 * Math.pow(2, attempts), 30 * 60 * 1000); // cap at 30 min
        await idb.enqueue({ ...item, id: undefined, attempts, nextRetry: Date.now() + backoffMs });
      }
    }
    // Delete all processed items (both succeeded and failed, since failed were re-enqueued)
    const toDelete = [...succeededIds, ...failedIds];
    if (toDelete.length > 0) await idb.removeItems(toDelete);
  },

  _onlineHandler: (null as (() => void) | null),

  async init() {
    if (typeof window === 'undefined') return;
    if (this._onlineHandler) return; // prevent double-registration
    this._onlineHandler = () => this.flush();
    window.addEventListener('online', this._onlineHandler);
    await this.flush();
  },

  destroy() {
    if (this._onlineHandler) {
      window.removeEventListener('online', this._onlineHandler);
      this._onlineHandler = null;
    }
  },
};
