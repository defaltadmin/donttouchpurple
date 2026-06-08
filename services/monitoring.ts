/**
 * Unified monitoring module.
 * Single entry point for error tracking, metrics, and performance monitoring.
 *
 * Replaces the scattered errorLogger + error-tracker + metrics + perf-monitor imports.
 */
import { logger } from '../utils/logger';
import { safeSet } from '../utils/storage';
import { getSentry } from './sentry';

// ─── Error Tracker (offline queue + Sentry flush) ──────────────
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
      logger.warn('Error flush failed — queue preserved for retry');
    }
  }
};

// ─── Error Logger (structured Sentry logging) ──────────────────
interface ErrorContext {
  userId?: string;
  gameMode?: string;
  score?: number;
  sessionId?: string;
  feature?: string;
  [key: string]: string | number | boolean | undefined;
}

class ErrorLogger {
  private static instance: ErrorLogger;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  async error(error: Error | string, context?: ErrorContext): Promise<void> {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    try {
      const Sentry = await getSentry();
      if (context) {
        Sentry.withScope((scope) => {
          Object.entries(context).forEach(([key, value]) => {
            scope.setTag(key, String(value));
          });
          Sentry.captureException(errorObj);
        });
      } else {
        Sentry.captureException(errorObj);
      }
    } catch { /* Sentry unavailable */ }
    logger.error('[ErrorLogger]', {
      message: errorObj.message,
      stack: errorObj.stack,
      context
    });
  }

  async warn(message: string, context?: ErrorContext): Promise<void> {
    try {
      const Sentry = await getSentry();
      if (context) {
        Sentry.withScope((scope) => {
          Object.entries(context).forEach(([key, value]) => {
            scope.setTag(key, String(value));
          });
          Sentry.captureMessage(message, 'warning');
        });
      } else {
        Sentry.captureMessage(message, 'warning');
      }
    } catch { /* Sentry unavailable */ }
    logger.warn('[ErrorLogger]', { message, context });
  }

  info(message: string, context?: ErrorContext): void {
    logger.info('[ErrorLogger]', { message, context });
  }

  async setUser(userId: string, email?: string): Promise<void> {
    try {
      const Sentry = await getSentry();
      Sentry.setUser({ id: userId, email });
    } catch { /* Sentry unavailable */ }
  }

  async setTag(key: string, value: string): Promise<void> {
    try {
      const Sentry = await getSentry();
      Sentry.setTag(key, value);
    } catch { /* Sentry unavailable */ }
  }

  async clearUser(): Promise<void> {
    try {
      const Sentry = await getSentry();
      Sentry.setUser(null);
    } catch { /* Sentry unavailable */ }
  }

  async addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error'): Promise<void> {
    try {
      const Sentry = await getSentry();
      Sentry.addBreadcrumb({
        message,
        category: category || 'custom',
        level: level || 'info'
      });
    } catch { /* Sentry unavailable */ }
  }

  async flush(timeout = 2000): Promise<boolean> {
    try {
      const Sentry = await getSentry();
      return await Sentry.flush(timeout);
    } catch { return false; }
  }
}

export const errorLogger = ErrorLogger.getInstance();

// ─── Metrics Service ───────────────────────────────────────────
export class MetricsService {
  private static instance: MetricsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perfMetrics: Record<string, any> = {};

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  recordLoadTime(time: number): void {
    this.perfMetrics.loadTime = time;
    getSentry().then(Sentry => {
      try { Sentry.setTag('load_time', time.toString()); } catch {}
    }).catch(() => { /* Sentry unavailable */ });
  }
}

export const metricsService = MetricsService.getInstance();

// ─── Unified logError (replaces utils/devLog) ──────────────────
export function logError(message: string, err?: unknown): void {
  const e = err instanceof Error ? err : (err != null ? new Error(String(err)) : undefined);
  logger.error(message, e ?? '');
  if (!import.meta.env.DEV) {
    try {
      errorTracker.capture(e ?? new Error(message), { message });
    } catch { /* Sentry unavailable */ }
  }
}
