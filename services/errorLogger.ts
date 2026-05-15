// Centralized error logging service
import { logger } from '../utils/logger';

export interface ErrorContext {
  userId?: string;
  gameMode?: string;
  score?: number;
  sessionId?: string;
  feature?: string;
  [key: string]: string | number | boolean | undefined;
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private sentryLoaded = false;
  private sentryModule: any = null;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private async ensureSentry(): Promise<any> {
    if (this.sentryLoaded && this.sentryModule) return this.sentryModule;
    try {
      this.sentryModule = await import('@sentry/react');
      this.sentryLoaded = true;
      return this.sentryModule;
    } catch (error) {
      console.warn('[ErrorLogger] Failed to load Sentry:', error);
      return null;
    }
  }

  // Log error with context
  async error(error: Error | string, context?: ErrorContext): Promise<void> {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const Sentry = await this.ensureSentry();

    // Add context to Sentry
    if (Sentry && context) {
      Sentry.withScope((scope: any) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setTag(key, String(value));
        });
        Sentry.captureException(errorObj);
      });
    } else if (Sentry) {
      Sentry.captureException(errorObj);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorLogger]', errorObj, context);
    }

    // Log to our custom logger
    logger.error('[ErrorLogger]', {
      message: errorObj.message,
      stack: errorObj.stack,
      context
    });
  }

  // Log warning
  async warn(message: string, context?: ErrorContext): Promise<void> {
    const Sentry = await this.ensureSentry();
    if (Sentry) {
      if (context) {
        Sentry.withScope((scope: any) => {
          Object.entries(context).forEach(([key, value]) => {
            scope.setTag(key, String(value));
          });
          Sentry.captureMessage(message, 'warning');
        });
      } else {
        Sentry.captureMessage(message, 'warning');
      }
    }

    logger.warn('[ErrorLogger]', { message, context });
  }

  // Log info
  info(message: string, context?: ErrorContext): void {
    // Info messages go to logger only, not Sentry
    logger.info('[ErrorLogger]', { message, context });
  }

  // Set user context for all future logs
  async setUser(userId: string, email?: string): Promise<void> {
    const Sentry = await this.ensureSentry();
    if (Sentry) {
      Sentry.setUser({ id: userId, email });
    }
  }

  // Set global context tags
  async setTag(key: string, value: string): Promise<void> {
    const Sentry = await this.ensureSentry();
    if (Sentry) {
      Sentry.setTag(key, value);
    }
  }

  // Clear user context
  async clearUser(): Promise<void> {
    const Sentry = await this.ensureSentry();
    if (Sentry) {
      Sentry.setUser(null);
    }
  }

  // Add breadcrumb for debugging
  async addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error'): Promise<void> {
    const Sentry = await this.ensureSentry();
    if (Sentry) {
      Sentry.addBreadcrumb({
        message,
        category: category || 'custom',
        level: level || 'info'
      });
    }
  }

  // Flush pending events (useful before app close)
  async flush(timeout = 2000): Promise<boolean> {
    const Sentry = await this.ensureSentry();
    if (Sentry) {
      return await Sentry.flush(timeout);
    }
    return false;
  }
}

// Safe wrapper for Sentry methods (handles cases where Sentry isn't loaded)
export const safeSentry = {
  captureException: async (error: unknown, hint?: Record<string, unknown>) => {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.captureException(error, hint as any);
    } catch {}
  },

  captureMessage: async (message: string, level?: string) => {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.captureMessage(message, level as any);
    } catch {}
  },

  setUser: async (user: Record<string, unknown> | null) => {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.setUser(user as any);
    } catch {}
  },

  setTag: async (key: string, value: string) => {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.setTag(key, value);
    } catch {}
  },

  addBreadcrumb: async (breadcrumb: Record<string, unknown>) => {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.addBreadcrumb(breadcrumb as any);
    } catch {}
  },

  flush: async (timeout?: number) => {
    try {
      const Sentry = await import('@sentry/react');
      return await Sentry.flush(timeout);
    } catch {
      return Promise.resolve(false);
    }
  }
};

// Export singleton
export const errorLogger = ErrorLogger.getInstance();