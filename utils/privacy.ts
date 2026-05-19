import { logger } from './logger';

const DTP_KEYS = [
  'dtp:session', 'dtp:score-queue', 'dtp:settings', 'dtp:events', 'dtp:errors',
  'dtp:locale', 'dtp:config', 'dtp:achievements', 'dtp:achievement-toasts',
  'dtp:daily', 'dtp:perf', 'dtp:vol:sfx', 'dtp:vol:music', 'dtp:vol:ambient',
  'dtp:telemetry-consent'
];

export const privacyManager = {
  getAllData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    DTP_KEYS.forEach(k => {
      try { data[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch { data[k] = localStorage.getItem(k); }
    });
    return { ...data, exportedAt: new Date().toISOString() };
  },

  deleteAll(excludeSettings = false) {
    DTP_KEYS.forEach(k => {
      if (excludeSettings && k === 'dtp:settings') return;
      localStorage.removeItem(k);
    });
    sessionStorage.removeItem('dtp:session');
    logger.info('🗑️ User data deleted');
  },

  getConsent(): boolean {
    return localStorage.getItem('dtp:telemetry-consent') === 'true';
  },

  setConsent(granted: boolean) {
    localStorage.setItem('dtp:telemetry-consent', String(granted));
    if (!granted) {
      ['dtp:events', 'dtp:errors'].forEach(k => localStorage.removeItem(k));
      logger.info('🚫 Telemetry consent revoked');
    }
  }
};
