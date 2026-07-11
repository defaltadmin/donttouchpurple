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

export type ScoreQueueItem = {
  score: number;
  initials: string;
  mode: string;
  tick?: number;
  attempts?: number;
  nextRetry?: number;
  sessionId?: string;
  practiceMode?: boolean;
  godMode?: boolean;
  /** When set, score is written to weekly ladder collection instead of global. */
  weekId?: string;
  ladderSeed?: number;
  id?: number;
};

export const scoreSync = {
  _flushing: false,
  async queue(
    score: number,
    mode: 'classic' | 'evolve' = 'evolve',
    tick = 0,
    practiceMode = false,
    godMode = false,
    opts?: { weekId?: string; ladderSeed?: number },
  ) {
    let initials = 'ANON';
    try {
      const rawInitials = localStorage.getItem(LS_KEYS.PLAYER_NAME) || 'ANON';
      initials = rawInitials.replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON';
    } catch { /* storage denied */ }
    const pending: ScoreQueueItem = {
      score,
      initials,
      mode,
      tick,
      attempts: 0,
      nextRetry: Date.now(),
      sessionId: crypto.randomUUID?.() || `sess-${Date.now()}`,
      practiceMode,
      godMode,
      ...(opts?.weekId ? { weekId: opts.weekId, ladderSeed: opts.ladderSeed } : {}),
    };

    // Always persist to IDB first — prevents score loss if tab closes during network submit
    try {
      await idb.enqueue(pending);
    } catch (e) {
      logger.warn('Failed to persist score to IDB', e);
    }

    if (navigator.onLine) {
      const result = await this._submit(pending);
      if (result === 'success' || result === 'permanent') {
        try { await idb.removeBySessionId?.(pending.sessionId!); } catch { /* */ }
        return;
      }
    }
  },

  /** @param item - must be pre-sanitized by queue() */
  async _submit(item: ScoreQueueItem): Promise<'success' | 'permanent' | 'temporary'> {
    try {
      const token = await getAuthToken();
      const res = await fetch('https://game.mscarabia.com/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          score: Math.max(0, Math.min(9999, Math.floor(item.score || 0))),
          initials: item.initials,
          mode: item.mode,
          tick: typeof item.tick === 'number' ? item.tick : 0,
          sessionId: item.sessionId || crypto.randomUUID?.() || `sess-${Date.now()}`,
          practiceMode: item.practiceMode || false,
          godMode: item.godMode || false,
          ...(item.weekId
            ? { weekId: item.weekId, ladderSeed: item.ladderSeed ?? 0, ladder: true }
            : {}),
        }),
      });
      if (!res.ok) {
        // 4xx = permanent error (bad payload, auth failure) — don't retry
        if (res.status >= 400 && res.status < 500) return 'permanent';
        throw new Error(`HTTP ${res.status}`);
      }
      return 'success';
    } catch {
      return 'temporary';
    }
  },

  async flush() {
    if (this._flushing || !navigator.onLine) return;
    this._flushing = true;
    const flushTimeout = setTimeout(() => { this._flushing = false; }, 30_000);
    try {
      const pending = await idb.peekAll();
      if (pending.length === 0) return;

      logger.info(`Flushing ${pending.length} offline scores`);

      const succeededIds: number[] = [];
      const failedIds: number[] = [];
      const permanentIds: number[] = [];
      const now = Date.now();
      for (const item of pending) {
        // Exponential backoff: skip items not yet due for retry
        const nextRetry = item.nextRetry ?? 0;
        if (nextRetry > now) continue;

        const result = await this._submit(item);
        if (result === 'success') {
          if (item.id != null) succeededIds.push(item.id);
        } else if (result === 'permanent') {
          // 4xx error — drop from queue permanently
          if (item.id != null) permanentIds.push(item.id);
        } else {
          if (item.id != null) failedIds.push(item.id);
        }
      }
      // Atomic: delete succeeded+permanent, update failed in-place (prevents data loss on page close)
      const toRemove = [...succeededIds, ...permanentIds];
      const updates = failedIds.map(id => {
        const item = pending.find(p => p.id === id);
        const safeAttempts = Math.max(0, Math.floor(Number(item?.attempts) || 0));
        const attempts = safeAttempts + 1;
        const backoffMs = Math.min(1000 * Math.pow(2, attempts), 30 * 60 * 1000);
        return { id, patch: { attempts, nextRetry: Date.now() + backoffMs } };
      });
      await idb.removeAndUpdate(toRemove, updates);
    } finally {
      clearTimeout(flushTimeout);
      this._flushing = false;
    }
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
