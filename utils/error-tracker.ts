import { logger } from './logger';

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
    const queue: TrackedError[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push(entry);
    if (queue.length > 20) queue.shift();
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    logger.error('[TRACKED]', err.message, entry.id);
    this._flush();
  },

  async _flush() {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    if (!queue.length || !navigator.onLine) return;
    try {
      logger.debug('Error batch flushed', queue.length);
      localStorage.setItem(QUEUE_KEY, '[]');
    } catch (_) { logger.warn('Error flush failed'); }
  }
};
