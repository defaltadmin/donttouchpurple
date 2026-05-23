import { logger } from './logger';
import { safeSet } from './storage';

interface TrackedError { id: string; msg: string; stack: string; ts: number; context?: Record<string, unknown>; }
const QUEUE_KEY = 'dtp:errors';

function cleanStack(stack: string): string {
  return stack.replace(/(webpack|vite|react|node_modules|chunk-)[\w\-./@]+/g, '[bundled]');
}

export const errorTracker = {
  capture(err: Error, context?: Record<string, unknown>) {
    if (navigator.doNotTrack === '1') return;
    const entry: TrackedError = {
      id: crypto.randomUUID?.() || Date.now().toString(36),
      msg: err.message, stack: cleanStack(err.stack || ''), ts: Date.now(), context
    };
    try {
      const queue: TrackedError[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      queue.push(entry);
      if (queue.length > 20) queue.shift();
      safeSet(QUEUE_KEY, JSON.stringify(queue));
    } catch {
      safeSet(QUEUE_KEY, JSON.stringify([entry]));
    }
    logger.error('[TRACKED]', err.message, entry.id);
    this._flush();
  },

  async _flush() {
    let queue: TrackedError[] = [];
    try { queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return; }
    if (!queue.length || !navigator.onLine) return;
    try {
      logger.debug('Error batch flushed', queue.length);
      safeSet(QUEUE_KEY, '[]');
    } catch { logger.warn('Error flush failed'); }
  }
};
