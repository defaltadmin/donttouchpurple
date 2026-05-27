import { errorTracker } from './error-tracker';
import { logger } from './logger';

/**
 * CQ-001: Unified error logging.
 * - Always logs to console
 * - Sends to errorTracker/Sentry in production
 *
 * Usage: logError('message') | logError('message', error) | logError(error)
 */
export function logError(message: string, err?: unknown): void {
  const e = err instanceof Error ? err : (err != null ? new Error(String(err)) : undefined);
  logger.error(message, e ?? '');
  if (!import.meta.env.DEV) {
    try {
      errorTracker.capture(e ?? new Error(message), { message });
    } catch { /* Sentry unavailable */ }
  }
}
