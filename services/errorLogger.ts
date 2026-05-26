// Centralized error logging service
import { logger } from '../utils/logger';
import { getSentry } from './sentry';

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
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorLogger]', errorObj, context);
    }
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

// Export singleton
export const errorLogger = ErrorLogger.getInstance();
