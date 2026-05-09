// Web Vitals monitoring and reporting
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';
import { errorLogger } from '../services/errorLogger';
import { metricsService } from '../services/metrics';

// Extend Window type for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export interface WebVitalsMetrics {
  cls: number | null;
  fid: number | null;
  fcp: number | null;
  lcp: number | null;
  ttfb: number | null;
}

class WebVitalsMonitor {
  private static instance: WebVitalsMonitor;
  private metrics: WebVitalsMetrics = {
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null
  };

  static getInstance(): WebVitalsMonitor {
    if (!WebVitalsMonitor.instance) {
      WebVitalsMonitor.instance = new WebVitalsMonitor();
    }
    return WebVitalsMonitor.instance;
  }

  startMonitoring(): void {
    if (typeof window === 'undefined') return;

    try {
      onCLS((metric) => {
        this.metrics.cls = metric.value;
        this.reportMetric('CLS', metric);
        this.checkThresholds('cls', metric.value);
      });

      onFID((metric) => {
        this.metrics.fid = metric.value;
        this.reportMetric('FID', metric);
        this.checkThresholds('fid', metric.value);
      });

      onFCP((metric) => {
        this.metrics.fcp = metric.value;
        this.reportMetric('FCP', metric);
        this.checkThresholds('fcp', metric.value);
      });

      onLCP((metric) => {
        this.metrics.lcp = metric.value;
        this.reportMetric('LCP', metric);
        this.checkThresholds('lcp', metric.value);
      });

      onTTFB((metric) => {
        this.metrics.ttfb = metric.value;
        this.reportMetric('TTFB', metric);
        this.checkThresholds('ttfb', metric.value);
      });

      console.log('[WebVitals] Monitoring started');
    } catch (error) {
      errorLogger.error('Failed to start Web Vitals monitoring', { error });
    }
  }

  stopMonitoring(): void {
    // web-vitals v4 doesn't expose unsubscribe — no-op
  }

  getMetrics(): WebVitalsMetrics {
    return { ...this.metrics };
  }

  private checkThresholds(metric: keyof WebVitalsMetrics, value: number): void {
    const thresholds = {
      cls:  { good: 0.1,  poor: 0.25 },
      fid:  { good: 100,  poor: 300 },
      fcp:  { good: 1800, poor: 3000 },
      lcp:  { good: 2500, poor: 4000 },
      ttfb: { good: 800,  poor: 1800 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return;

    let rating: 'good' | 'needs-improvement' | 'poor';
    if (value <= threshold.good) {
      rating = 'good';
    } else if (value <= threshold.poor) {
      rating = 'needs-improvement';
    } else {
      rating = 'poor';
    }

    if (rating === 'poor') {
      errorLogger.warn(`Poor ${metric.toUpperCase()} performance: ${value}`, {
        metric,
        value,
        rating,
        threshold: threshold.poor
      });
    }

    metricsService.recordPerformanceMetric(metric, value, rating);
  }

  private reportMetric(name: string, metric: any): void {
    try {
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          name,
          value: Math.round(metric.value * 1000) / 1000,
          event_category: 'Web Vitals',
          event_label: metric.id,
        });
      }
    } catch (error) {
      errorLogger.error('Failed to report Web Vitals metric', { error, name });
    }
  }

  exportMetrics(): Record<string, any> {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }
}

// Extend metrics service to handle Web Vitals
declare module '../services/metrics' {
  interface MetricsService {
    recordPerformanceMetric(metric: string, value: number, rating: string): void;
  }
}

const originalMetricsService = metricsService as any;
originalMetricsService.recordPerformanceMetric = function(
  metric: string,
  value: number,
  rating: string
): void {
  if (!this.perfMetrics.webVitals) this.perfMetrics.webVitals = {};
  this.perfMetrics.webVitals[metric] = { value, rating, timestamp: Date.now() };
};

export const webVitalsMonitor = WebVitalsMonitor.getInstance();
