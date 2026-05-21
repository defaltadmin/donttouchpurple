import { logger } from './logger';
import type { I18nKey } from './i18n-keys';

export type Locale = 'en' | 'es' | 'ja' | 'pt' | 'fr';
type Dict = Record<string, string>;
const FALLBACK: Locale = 'en';
const STORAGE_KEY = 'dtp:locale';

class I18nManager {
  private dicts: Partial<Record<Locale, Dict>> = {};
  private _current: Locale = (() => { try { return (localStorage.getItem(STORAGE_KEY) as Locale) || FALLBACK; } catch { return FALLBACK; } })();
  private _fallback: Dict = {};

  async init() {
    try {
      const en = await import(`../locales/en.json`).then(m => m.default).catch(() => ({}));
      this.dicts.en = en;
      this._fallback = this.dicts.en || {};
      // Lazy-load the user's saved locale if non-English
      if (this._current !== 'en' && !this.dicts[this._current]) {
        await this._loadLocale(this._current);
      }
      logger.info('🌍 i18n dictionaries loaded');
    } catch (e) {
      logger.warn('i18n fallback load failed', e);
      this.dicts.en = this._fallback;
    }
  }

  private async _loadLocale(lang: Locale): Promise<void> {
    try {
      const m = await import(`../locales/${lang}.json`);
      this.dicts[lang] = m.default;
    } catch { /* locale unavailable */ }
  }

  get current() { return this._current; }
  async set(lang: Locale) {
    if (!this.dicts[lang]) await this._loadLocale(lang);
    if (!this.dicts[lang]) { logger.warn(`Locale ${lang} not available`); return; }
    this._current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent('dtp:locale-change', { detail: lang }));
  }

  t(key: I18nKey, params?: Record<string, string | number>): string {
    const dict = this.dicts[this._current] || this._fallback;
    let str = dict[key] || this._fallback[key] || key;
    if (params) Object.entries(params).forEach(([k, v]) => { str = str.replace(`{${k}}`, String(v)); });
    return str;
  }

  getAvailable(): Locale[] {
    return (Object.entries(this.dicts) as [Locale, Dict][])
      .filter(([, d]) => d && Object.keys(d).length > 0)
      .map(([lang]) => lang);
  }
}

export const i18n = new I18nManager();
