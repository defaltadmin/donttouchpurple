import { logger } from './logger';

type SafeParseResult<T> = { ok: true; data: T } | { ok: false; reason: string; fallback: T };

export const stateGuard = {
  parse<T>(raw: string | null, fallback: T, validator?: (d: unknown) => boolean): T {
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (validator && !validator(parsed)) throw new Error('Schema mismatch');
      return parsed as T;
    } catch (e) {
      logger.warn('State corruption detected, applying fallback', (e as Error).message);
      return fallback;
    }
  },

  safeStore(key: string, data: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if ((e as Error).name === 'QuotaExceededError') {
        logger.error('Storage quota exceeded, clearing stale keys');
        const keys = Object.keys(localStorage).filter(k => k.startsWith('dtp:'));
        keys.forEach(k => localStorage.removeItem(k));
      }
    }
  },

  sanitize<T extends Record<string, any>>(raw: unknown, defaults: T): T {
    if (!raw || typeof raw !== 'object') return defaults;
    const clean: Record<string, any> = {};
    for (const k of Object.keys(defaults)) clean[k] = (raw as any)[k] ?? defaults[k];
    return clean as T;
  }
};
