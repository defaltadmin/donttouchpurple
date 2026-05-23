import { logger } from './logger';
import { LS_KEYS } from '../config/difficulty';

const DTP_KEYS = [
  'dtp:session', 'dtp:settings', 'dtp:events', 'dtp:errors',
  'dtp:locale', 'dtp:config', 'dtp:achievements', 'dtp:achievement-toasts',
  'dtp:daily', 'dtp:perf', 'dtp:vol:sfx', 'dtp:vol:music', 'dtp:vol:ambient',
  'dtp:telemetry-consent', 'dtp:wins', 'dtp:deaths', 'dtp:feature-unlocks',
  'dtp-lifetime-dust', 'dtp-device-id', 'dtp_ab_variant',
  'dtp_muted', 'dtp_volume', 'dtp_haptics', 'dtp_screen_shake', 'dtp_reduced_motion',
  'dtp-best-classic', 'dtp-best-evolve', 'dtp-daily-completed', 'dtp-obj-streak',
  'dtp-games-played', 'dtp-challenge-progress', 'dtp:daily-complete',
  // Derived from LS_KEYS — covers GDPR personal data
  LS_KEYS.PLAYER_NAME, LS_KEYS.DUST, LS_KEYS.ENERGY, LS_KEYS.SHOP,
  LS_KEYS.STORED_PWR, LS_KEYS.WEEKLY_BONUS, LS_KEYS.LB_CLASSIC, LS_KEYS.LB_EVOLVE,
  LS_KEYS.PRIVACY_OK, LS_KEYS.ONBOARD_SEEN, LS_KEYS.P1_KEYS, LS_KEYS.P2_KEYS,
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
