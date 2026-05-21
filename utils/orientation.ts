import { logger } from './logger';

export const orientationMonitor = {
  isLandscape: false,
  _listeners: new Set<(isLand: boolean) => void>(),
  _initialized: false,
  _mql: null as MediaQueryList | null,
  _handler: null as (() => void) | null,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    const check = () => {
      this.isLandscape = window.matchMedia?.('(orientation: landscape)')?.matches ?? false;
      this._listeners.forEach(cb => cb(this.isLandscape));
      logger.debug('Orientation changed', this.isLandscape ? 'Landscape' : 'Portrait');
    };
    this._handler = check;
    this._mql = window.matchMedia?.('(orientation: landscape)') ?? null;
    this._mql?.addEventListener('change', check);
    check();
  },

  destroy() {
    if (this._mql && this._handler) {
      this._mql.removeEventListener('change', this._handler);
      this._mql = null;
      this._handler = null;
      this._initialized = false;
    }
  },

  onChange(cb: (isLand: boolean) => void) {
    this._listeners.add(cb);
    return () => { this._listeners.delete(cb); };
  }
};
