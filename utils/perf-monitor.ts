import { logger } from './logger';

type Metric = 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB';
const STORAGE_KEY = 'dtp:perf';

export const perfMonitor = {
  metrics: { LCP: 0, FID: 0, CLS: 0, INP: 0, TTFB: 0 } as Record<Metric, number>,

  observe() {
    if (!('PerformanceObserver' in window)) return;

    new PerformanceObserver((list) => {
      const entry = list.getEntries().at(-1);
      if (entry) { this.metrics.LCP = entry.startTime; this._flush(); }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.INP = Math.max(this.metrics.INP || 0, entry.duration);
        this._flush();
      }
    }).observe({ type: 'event', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          this.metrics.CLS = (this.metrics.CLS || 0) + (entry as any).value;
          this._flush();
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    logger.info('Web Vitals observers attached');
  },

  _flush() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.metrics)); } catch {}
  },

  getReport() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : this.metrics;
  },

  reset() { this.metrics = { LCP: 0, FID: 0, CLS: 0, INP: 0, TTFB: 0 }; this._flush(); }
};
