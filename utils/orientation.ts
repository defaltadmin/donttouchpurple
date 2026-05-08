import { logger } from './logger';

export const orientationMonitor = {
  isLandscape: false,
  _listeners: new Set<(isLand: boolean) => void>(),

  init() {
    const check = () => {
      this.isLandscape = window.matchMedia('(orientation: landscape)').matches;
      this._listeners.forEach(cb => cb(this.isLandscape));
      logger.debug('Orientation changed', this.isLandscape ? 'Landscape' : 'Portrait');
    };
    window.matchMedia('(orientation: landscape)').addEventListener('change', check);
    check();
  },

  onChange(cb: (isLand: boolean) => void) {
    this._listeners.add(cb);
    return () => { this._listeners.delete(cb); };
  }
};
