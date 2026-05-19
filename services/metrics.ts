// Custom metrics and monitoring service
import { logger } from '../utils/logger';

// Extend Window type for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export interface GameMetrics {
  sessionDuration: number;
  gamesPlayed: number;
  averageScore: number;
  highScore: number;
  powerupsUsed: Record<string, number>;
  deathsByCause: Record<string, number>;
  completionRate: number; // percentage of games completed vs started
}

export interface PerformanceMetrics {
  averageFps: number;
  frameDrops: number;
  loadTime: number;
  memoryUsage: number;
  inputLatency: number;
}

export interface FirebaseMetrics {
  readOperations: number;
  writeOperations: number;
  failedOperations: number;
  averageResponseTime: number;
}

export class MetricsService {
  private static instance: MetricsService;
  private gameMetrics: Partial<GameMetrics> = {};
  private perfMetrics: Partial<PerformanceMetrics> = {};
  private firebaseMetrics: Partial<FirebaseMetrics> = {};
  private sessionStartTime = Date.now();
  private frameCount = 0;
  private lastFrameTime = 0;
  private sentryLoaded = false;
  private sentryModule: { setTag: (k: string, v: string) => void; addBreadcrumb: (b: unknown) => void } | null = null;

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private async ensureSentry(): Promise<{ setTag: (k: string, v: string) => void; addBreadcrumb: (b: unknown) => void } | null> {
    if (this.sentryLoaded && this.sentryModule) return this.sentryModule;
    try {
      this.sentryModule = (await import('@sentry/react')) as unknown as { setTag: (k: string, v: string) => void; addBreadcrumb: (b: unknown) => void };
      this.sentryLoaded = true;
      return this.sentryModule;
    } catch (error) {
      console.warn('[Metrics] Failed to load Sentry:', error);
      return null;
    }
  }

  // Game metrics
  recordGameStart(): void {
    this.gameMetrics.gamesPlayed = (this.gameMetrics.gamesPlayed || 0) + 1;
  }

  recordGameEnd(score: number, completed: boolean, powerupsUsed: Record<string, number>, deathCause?: string): void {
    // Update average score
    const currentAvg = this.gameMetrics.averageScore || 0;
    const gamesPlayed = this.gameMetrics.gamesPlayed || 1;
    this.gameMetrics.averageScore = ((currentAvg * (gamesPlayed - 1)) + score) / gamesPlayed;

    // Update high score
    this.gameMetrics.highScore = Math.max(this.gameMetrics.highScore || 0, score);

    // Update powerup usage
    this.gameMetrics.powerupsUsed = this.gameMetrics.powerupsUsed || {};
    Object.entries(powerupsUsed).forEach(([type, count]) => {
      this.gameMetrics.powerupsUsed![type] = (this.gameMetrics.powerupsUsed![type] || 0) + count;
    });

    // Update death causes
    if (deathCause) {
      this.gameMetrics.deathsByCause = this.gameMetrics.deathsByCause || {};
      this.gameMetrics.deathsByCause[deathCause] = (this.gameMetrics.deathsByCause[deathCause] || 0) + 1;
    }

    // Update completion rate
    const completedGames = (this.gameMetrics.completionRate || 0) * (gamesPlayed - 1) / 100;
    const newCompleted = completed ? completedGames + 1 : completedGames;
    this.gameMetrics.completionRate = (newCompleted / gamesPlayed) * 100;

    // Send to analytics
    this.sendGameMetrics(score, completed, powerupsUsed, deathCause);
  }

  // Performance metrics
  recordFrame(timestamp: number): void {
    this.frameCount++;
    if (this.lastFrameTime > 0) {
      const delta = timestamp - this.lastFrameTime;
      const fps = 1000 / delta;

      // Update rolling average FPS
      const currentAvg = this.perfMetrics.averageFps || 60;
      this.perfMetrics.averageFps = (currentAvg * 0.9) + (fps * 0.1);

      // Count frame drops (FPS < 30)
      if (fps < 30) {
        this.perfMetrics.frameDrops = (this.perfMetrics.frameDrops || 0) + 1;
      }
    }
    this.lastFrameTime = timestamp;
  }

  recordLoadTime(time: number): void {
    this.perfMetrics.loadTime = time;
    // Call setTag synchronously if Sentry is already loaded
    if (this.sentryLoaded && this.sentryModule) {
      try { this.sentryModule.setTag('load_time', time.toString()); } catch {}
    } else {
      this.ensureSentry().then(Sentry => {
        if (Sentry) Sentry.setTag('load_time', time.toString());
      });
    }
  }

  recordMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      this.perfMetrics.memoryUsage = memInfo?.usedJSHeapSize ?? 0;
    }
  }

  recordInputLatency(latency: number): void {
    // Weighted rolling average (weight new value at 50% for faster convergence in tests)
    const currentAvg = this.perfMetrics.inputLatency ?? latency;
    this.perfMetrics.inputLatency = (currentAvg * 0.5) + (latency * 0.5);
  }

  // Firebase metrics
  recordFirebaseOperation(type: 'read' | 'write', success: boolean, responseTime?: number): void {
    if (type === 'read') {
      this.firebaseMetrics.readOperations = (this.firebaseMetrics.readOperations || 0) + 1;
    } else {
      this.firebaseMetrics.writeOperations = (this.firebaseMetrics.writeOperations || 0) + 1;
    }

    if (!success) {
      this.firebaseMetrics.failedOperations = (this.firebaseMetrics.failedOperations || 0) + 1;
    }

    if (responseTime) {
      const currentAvg = this.firebaseMetrics.averageResponseTime || 0;
      const totalOps = (this.firebaseMetrics.readOperations || 0) + (this.firebaseMetrics.writeOperations || 0);
      this.firebaseMetrics.averageResponseTime = ((currentAvg * (totalOps - 1)) + responseTime) / totalOps;
    }
  }

  // Session management
  startSession(): void {
    this.sessionStartTime = Date.now();
    this.resetSessionMetrics();
  }

  endSession(): void {
    this.gameMetrics.sessionDuration = Date.now() - this.sessionStartTime;
    this.sendSessionMetrics();
  }

  private resetSessionMetrics(): void {
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.perfMetrics = {};
    this.firebaseMetrics = {};
  }

  // Send metrics to analytics services
  private sendGameMetrics(
    score: number,
    completed: boolean,
    powerupsUsed: Record<string, number>,
    deathCause?: string
  ): void {
    try {
      // Call gtag synchronously if available
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'game_end', {
          score,
          completed,
          powerups_used: JSON.stringify(powerupsUsed),
          death_cause: deathCause
        });
      }

      // Call Sentry synchronously if already loaded, otherwise fire-and-forget
      const addBreadcrumb = (sentry: { addBreadcrumb: (b: unknown) => void } | null) => {
        if (sentry) {
          sentry.addBreadcrumb({
            message: `Game ended: ${score} points${completed ? ' (completed)' : ''}`,
            category: 'game',
            level: 'info'
          });
        }
      };
      if (this.sentryLoaded && this.sentryModule) {
        addBreadcrumb(this.sentryModule);
      } else {
        this.ensureSentry().then(addBreadcrumb);
      }

      logger.info('[Metrics] Game metrics recorded', { score, completed, powerupsUsed, deathCause });
    } catch (error) {
      logger.error('[Metrics] Failed to send game metrics', error);
    }
  }

  private sendSessionMetrics(): void {
    try {
      const metrics = {
        session_duration: this.gameMetrics.sessionDuration,
        games_played: this.gameMetrics.gamesPlayed,
        average_fps: this.perfMetrics.averageFps,
        frame_drops: this.perfMetrics.frameDrops,
        firebase_reads: this.firebaseMetrics.readOperations,
        firebase_writes: this.firebaseMetrics.writeOperations,
        firebase_failures: this.firebaseMetrics.failedOperations
      };

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'session_end', metrics);
      }

      logger.info('[Metrics] Session metrics recorded', metrics);
    } catch (error) {
      logger.error('[Metrics] Failed to send session metrics', error);
    }
  }

  // Get current metrics (for debugging/UI)
  getMetrics(): {
    game: Partial<GameMetrics>;
    performance: Partial<PerformanceMetrics>;
    firebase: Partial<FirebaseMetrics>;
  } {
    return {
      game: { ...this.gameMetrics },
      performance: { ...this.perfMetrics },
      firebase: { ...this.firebaseMetrics }
    };
  }

  // Export metrics for external analysis
  exportMetrics(): string {
    return JSON.stringify({
      game: this.gameMetrics,
      performance: this.perfMetrics,
      firebase: this.firebaseMetrics,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// Export singleton
export const metricsService = MetricsService.getInstance();