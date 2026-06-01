import { logger } from './logger';
import { safeSet } from './storage';

type Metric = 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB';
const STORAGE_KEY = 'dtp:perf';

export const perfMonitor = {
  metrics: { LCP: 0, FID: 0, CLS: 0, INP: 0, TTFB: 0 } as Record<Metric, number>,
  _observing: false,
  _observers: [] as PerformanceObserver[],

  observe() {
    if (!('PerformanceObserver' in window) || this._observing) return;
    this._observing = true;

    const obs1 = new PerformanceObserver((list) => {
      const entry = list.getEntries().at(-1);
      if (entry) { this.metrics.LCP = entry.startTime; this._flush(); }
    });
    obs1.observe({ type: 'largest-contentful-paint', buffered: true });
    this._observers.push(obs1);

    const obs2 = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.INP = Math.max(this.metrics.INP || 0, entry.duration);
        this._flush();
      }
    });
    obs2.observe({ type: 'event', buffered: true });
    this._observers.push(obs2);

    const obs3 = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as { hadRecentInput?: boolean; value?: number };
        if (!layoutShift.hadRecentInput) {
          this.metrics.CLS = (this.metrics.CLS || 0) + (layoutShift.value ?? 0);
          this._flush();
        }
      }
    });
    obs3.observe({ type: 'layout-shift', buffered: true });
    this._observers.push(obs3);

    logger.info('Web Vitals observers attached');
  },

  disconnect() {
    this._observers.forEach(o => o.disconnect());
    this._observers = [];
    this._observing = false;
  },

  _flush() {
    safeSet(STORAGE_KEY, JSON.stringify(this.metrics));
  },
};
