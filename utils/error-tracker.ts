import { logger } from './logger';
import { safeSet } from './storage';
import { getSentry } from '../services/sentry';

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
      const Sentry = await getSentry();
      // Transmit each queued error to Sentry before clearing
      for (const entry of queue) {
        const errObj = new Error(entry.msg);
        errObj.stack = entry.stack;
        Sentry.withScope((scope) => {
          scope.setContext('errorTracker', {
            id: entry.id,
            ts: entry.ts,
            ...entry.context,
          });
          Sentry.captureException(errObj);
        });
      }
      safeSet(QUEUE_KEY, '[]');
      logger.debug('Error batch flushed', queue.length);
    } catch {
      // Keep queue intact so errors are retried on next _flush
      logger.warn('Error flush failed — queue preserved for retry');
    }
  }
};
