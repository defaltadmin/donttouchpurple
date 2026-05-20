import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry methods (hoisted so vi.mock factories can reference them)
const { mockSetTag, mockAddBreadcrumb, mockSentry, mockGtag } = vi.hoisted(() => {
  const mockCaptureException = vi.fn();
  const mockCaptureMessage = vi.fn();
  const mockSetTag = vi.fn();
  const mockAddBreadcrumb = vi.fn();
  const mockFlush = vi.fn();
  const mockSentry = {
    captureException: mockCaptureException,
    captureMessage: mockCaptureMessage,
    setTag: mockSetTag,
    addBreadcrumb: mockAddBreadcrumb,
    flush: mockFlush
  };
  const mockGtag = vi.fn();
  return { mockSetTag, mockAddBreadcrumb, mockSentry, mockGtag };
});

// Mock the centralized sentry module so getSentry() resolves immediately
vi.mock('../services/sentry', () => ({
  getSentry: () => Promise.resolve(mockSentry),
  safeSentry: mockSentry
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock gtag on window
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true
});

import { MetricsService } from '../services/metrics';

/** Access private service internals in tests */
/* eslint-disable @typescript-eslint/no-explicit-any */
function svc(service: MetricsService): any {
  return service as unknown;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = MetricsService.getInstance();
    // Reset singleton state
    svc(service).gameMetrics = {};
    svc(service).perfMetrics = {};
    svc(service).firebaseMetrics = {};
    svc(service).sessionStartTime = Date.now();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Game Metrics', () => {
    it('should record game start', () => {
      service.recordGameStart();
      const metrics = service.getMetrics();

      expect(metrics.game.gamesPlayed).toBe(1);
    });

    it('should record game end and calculate averages', () => {
      service.recordGameStart();
      service.recordGameEnd(1000, true, { shield: 2, freeze: 1 }, 'purple_tap');

      let metrics = service.getMetrics();
      expect(metrics.game.averageScore).toBe(1000);
      expect(metrics.game.highScore).toBe(1000);
      expect(metrics.game.powerupsUsed).toEqual({ shield: 2, freeze: 1 });
      expect(metrics.game.deathsByCause).toEqual({ purple_tap: 1 });
      expect(metrics.game.completionRate).toBe(100);

      // Second game
      service.recordGameStart();
      service.recordGameEnd(500, false, { heart: 1 }, 'time_up');

      metrics = service.getMetrics();
      expect(metrics.game.gamesPlayed).toBe(2);
      expect(metrics.game.averageScore).toBe(750); // (1000 + 500) / 2
      expect(metrics.game.highScore).toBe(1000);
      expect(metrics.game.powerupsUsed).toEqual({ shield: 2, freeze: 1, heart: 1 });
      expect(metrics.game.deathsByCause).toEqual({ purple_tap: 1, time_up: 1 });
      expect(metrics.game.completionRate).toBe(50); // 1 out of 2 completed
    });

    it('should send metrics to analytics', async () => {
      service.recordGameStart();
      service.recordGameEnd(1000, true, { shield: 1 }, 'purple_tap');

      expect(mockGtag).toHaveBeenCalledWith('event', 'game_end', {
        score: 1000,
        completed: true,
        powerups_used: JSON.stringify({ shield: 1 }),
        death_cause: 'purple_tap'
      });

      await vi.waitFor(() => {
        expect(mockAddBreadcrumb).toHaveBeenCalledWith({
          message: 'Game ended: 1000 points (completed)',
          category: 'game',
          level: 'info'
        });
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should record frame times and calculate FPS', () => {
      const startTime = 1000;
      service.recordFrame(startTime);

      // Simulate 60 FPS (16.67ms intervals)
      for (let i = 1; i <= 10; i++) {
        service.recordFrame(startTime + (i * 16.67));
      }

      const metrics = service.getMetrics();
      expect(metrics.performance.averageFps).toBeCloseTo(60, 1);
    });

    it('should count frame drops', () => {
      const startTime = 1000;
      service.recordFrame(startTime);

      // Simulate frame drops (50ms intervals = 20 FPS)
      for (let i = 1; i <= 5; i++) {
        service.recordFrame(startTime + (i * 50));
      }

      const metrics = service.getMetrics();
      expect(metrics.performance.frameDrops).toBeGreaterThan(0);
    });

    it('should record load time', async () => {
      service.recordLoadTime(2500);

      await vi.waitFor(() => {
        expect(mockSetTag).toHaveBeenCalledWith('load_time', '2500');
      });
    });

    it('should record input latency', () => {
      service.recordInputLatency(50);
      service.recordInputLatency(50);
      service.recordInputLatency(50);

      const metrics = service.getMetrics();
      // Should be rolling average around 50
      expect(metrics.performance.inputLatency).toBeCloseTo(50, 5);
    });
  });

  describe('Firebase Metrics', () => {
    it('should record Firebase operations', () => {
      service.recordFirebaseOperation('read', true, 100);
      service.recordFirebaseOperation('write', true, 150);
      service.recordFirebaseOperation('read', false, 200);

      const metrics = service.getMetrics();
      expect(metrics.firebase.readOperations).toBe(2);
      expect(metrics.firebase.writeOperations).toBe(1);
      expect(metrics.firebase.failedOperations).toBe(1);
      expect(metrics.firebase.averageResponseTime).toBeCloseTo(150, 1); // (100 + 150 + 200) / 3
    });
  });

  describe('Session Management', () => {
    it('should track session duration', () => {
      service.startSession();

      // Simulate time passing
      svc(service).sessionStartTime = Date.now() - 5000;

      service.endSession();

      const metrics = service.getMetrics();
      expect(metrics.game.sessionDuration).toBeGreaterThan(4900);
      expect(metrics.game.sessionDuration).toBeLessThan(6000);
    });

    it('should send session metrics', () => {
      service.startSession();
      service.recordGameStart();
      service.recordGameEnd(1000, true, {}, undefined);

      service.endSession();

      expect(mockGtag).toHaveBeenCalledWith('event', 'session_end', expect.objectContaining({
        games_played: 1
      }));
    });
  });

  describe('Export', () => {
    it('should export metrics as JSON', () => {
      service.recordGameStart();
      const exported = service.exportMetrics();

      const parsed = JSON.parse(exported);
      expect(parsed).toHaveProperty('game');
      expect(parsed).toHaveProperty('performance');
      expect(parsed).toHaveProperty('firebase');
      expect(parsed).toHaveProperty('timestamp');
    });
  });
});