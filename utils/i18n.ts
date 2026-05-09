import { logger } from './logger';
import type { I18nKey } from './i18n-keys';

export type Locale = 'en' | 'es' | 'ja' | 'pt' | 'fr';
type Dict = Record<string, string>;
const FALLBACK: Locale = 'en';
const STORAGE_KEY = 'dtp:locale';

class I18nManager {
  private dicts: Partial<Record<Locale, Dict>> = {};
  private _current: Locale = (localStorage.getItem(STORAGE_KEY) as Locale) || FALLBACK;
  private _fallback: Dict = {};

  async init() {
    try {
      const [en, ...others] = await Promise.allSettled([
        import(`../locales/en.json`).then(m => m.default),
        import(`../locales/es.json`).then(m => m.default).catch(() => ({})),
        import(`../locales/ja.json`).then(m => m.default).catch(() => ({})),
        import(`../locales/pt.json`).then(m => m.default).catch(() => ({})),
        import(`../locales/fr.json`).then(m => m.default).catch(() => ({})),
      ]);
      if (en.status === 'fulfilled') this.dicts.en = en.value;
      this._fallback = this.dicts.en || {};
      others.forEach((p, i) => {
        if (p.status === 'fulfilled' && p.value) {
          const langs: Locale[] = ['es', 'ja', 'pt', 'fr'];
          this.dicts[langs[i]] = p.value;
        }
      });
      logger.info('🌍 i18n dictionaries loaded');
    } catch (e) {
      logger.warn('i18n fallback load failed', e);
      this.dicts.en = this._fallback;
    }
  }

  get current() { return this._current; }
  set(lang: Locale) {
    if (!this.dicts[lang]) { logger.warn(`Locale ${lang} not loaded`); return; }
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
