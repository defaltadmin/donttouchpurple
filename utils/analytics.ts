import { logger } from './logger';
import { safeSet } from './storage';
import { safeSentry } from '../services/sentry';
import { logDesignEvent } from '../services/gameanalytics';

type EventName = 'game_start' | 'game_over' | 'retry' | 'pause' | 'settings_change' | 'achievement_unlocked';
interface GameEvent { name: EventName; ts: number; payload?: Record<string, unknown>; }

const QUEUE_KEY = 'dtp:events';
const MAX_QUEUE = 50;

export const analytics = {
  track(name: EventName, payload: Record<string, unknown> = {}) {
    if ((navigator as { doNotTrack?: string }).doNotTrack === '1') return;
    const evt: GameEvent = { name, ts: Date.now(), payload };
    const queue = this._getQueue();
    queue.push(evt);
    if (queue.length > MAX_QUEUE) queue.shift();
    safeSet(QUEUE_KEY, JSON.stringify(queue));
    this._flush();
  },

  _getQueue(): GameEvent[] {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
  },

  async _flush() {
    const queue = this._getQueue();
    if (!queue.length || !navigator.onLine) return;
    try {
      // Transmit each event before clearing the queue
      for (const evt of queue) {
        // Forward to GameAnalytics as a design event (prod only, per IS_PROD guard)
        logDesignEvent(`analytics/${evt.name}`, 1);
        // Add as Sentry breadcrumb for error correlation (no-op if Sentry not yet loaded)
        safeSentry.addBreadcrumb({
          message: `analytics: ${evt.name}`,
          category: 'analytics',
          level: 'info',
          data: evt.payload as Record<string, unknown>,
        });
        // In dev mode, log the full payload for debugging
        if (import.meta.env.DEV) {
          logger.debug('[Analytics]', evt.name, JSON.stringify({ name: evt.name, ...evt.payload }));
        }
      }
      safeSet(QUEUE_KEY, '[]');
      logger.debug('Analytics flushed', queue.length, 'events');
    } catch { logger.warn('Analytics flush failed'); }
  }
};
