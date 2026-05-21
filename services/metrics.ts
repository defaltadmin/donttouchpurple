// Custom metrics and monitoring service
import { getSentry } from './sentry';

export class MetricsService {
  private static instance: MetricsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perfMetrics: Record<string, any> = {};

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  recordLoadTime(time: number): void {
    this.perfMetrics.loadTime = time;
    getSentry().then(Sentry => {
      try { Sentry.setTag('load_time', time.toString()); } catch {}
    }).catch(() => { /* Sentry unavailable */ });
  }
}

// Export singleton
export const metricsService = MetricsService.getInstance();
