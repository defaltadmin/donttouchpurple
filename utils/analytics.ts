import { logger } from './logger';

type EventName = 'game_start' | 'game_over' | 'retry' | 'pause' | 'settings_change';
interface GameEvent { name: EventName; ts: number; payload?: Record<string, unknown>; }

const QUEUE_KEY = 'dtp:events';
const MAX_QUEUE = 50;

export const analytics = {
  track(name: EventName, payload: Record<string, unknown> = {}) {
    if ((navigator as any).doNotTrack === '1') return;
    const evt: GameEvent = { name, ts: Date.now(), payload };
    const queue = this._getQueue();
    queue.push(evt);
    if (queue.length > MAX_QUEUE) queue.shift();
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    this._flush();
  },

  _getQueue(): GameEvent[] {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
  },

  async _flush() {
    const queue = this._getQueue();
    if (!queue.length || !navigator.onLine) return;
    try {
      logger.debug('Analytics flushed', queue.length, 'events');
      localStorage.setItem(QUEUE_KEY, '[]');
    } catch { logger.warn('Analytics flush failed'); }
  }
};
