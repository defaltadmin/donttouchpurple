import { logger } from './logger';

export type Locale = 'en' | 'es' | 'ja' | 'pt' | 'fr';

const dictionaries: Record<Locale, Record<string, string>> = {
  en: { 'game.title': "Don't Touch Purple", 'ui.pause': 'Pause', 'ui.retry': 'Retry', 'ui.score': 'Score', 'hud.last_heart': 'Last heart!', 'menu.play': 'Play', 'settings.title': 'Settings' },
  es: { 'game.title': 'No Toques el Morado', 'ui.pause': 'Pausa', 'ui.retry': 'Reintentar', 'ui.score': 'Puntuación', 'hud.last_heart': '¡Último corazón!', 'menu.play': 'Jugar', 'settings.title': 'Ajustes' },
  ja: { 'game.title': '紫に触れるな', 'ui.pause': '一時停止', 'ui.retry': 'リトライ', 'ui.score': 'スコア', 'hud.last_heart': '最後のハート！', 'menu.play': 'スタート', 'settings.title': '設定' },
  pt: { 'game.title': 'Não Toque no Roxo', 'ui.pause': 'Pausar', 'ui.retry': 'Tentar Novamente', 'ui.score': 'Pontuação', 'hud.last_heart': 'Último coração!', 'menu.play': 'Jogar', 'settings.title': 'Configurações' },
  fr: { 'game.title': 'Ne Touchez Pas le Violet', 'ui.pause': 'Pause', 'ui.retry': 'Réessayer', 'ui.score': 'Score', 'hud.last_heart': 'Dernier cœur !', 'menu.play': 'Jouer', 'settings.title': 'Paramètres' }
};

const STORAGE_KEY = 'dtp:locale';
const FALLBACK: Locale = 'en';

export const i18n = {
  current: (localStorage.getItem(STORAGE_KEY) as Locale) || FALLBACK,

  t(key: string, params?: Record<string, string | number>): string {
    const dict = dictionaries[this.current] || dictionaries[FALLBACK];
    let str = dict[key] || key;
    if (params) Object.entries(params).forEach(([k, v]) => { str = str.replace(`{${k}}`, String(v)); });
    return str;
  },

  set(lang: Locale) {
    if (!dictionaries[lang]) { logger.warn(`Unsupported locale: ${lang}`); return; }
    this.current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('dtp:locale-change', { detail: lang }));
  },

  getAvailable(): Locale[] { return Object.keys(dictionaries) as Locale[]; }
};
