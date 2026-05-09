import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry first
const mockCaptureException = vi.fn();
const mockCaptureMessage = vi.fn();
const mockSetTag = vi.fn();
const mockAddBreadcrumb = vi.fn();
const mockFlush = vi.fn();

vi.mock('@sentry/react', () => ({
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
  setTag: mockSetTag,
  addBreadcrumb: mockAddBreadcrumb,
  flush: mockFlush
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock gtag
const mockGtag = vi.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true
});

import { MetricsService } from '../services/metrics';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = MetricsService.getInstance();
    // Reset singleton state
    (service as any).gameMetrics = {};
    (service as any).perfMetrics = {};
    (service as any).firebaseMetrics = {};
    (service as any).sessionStartTime = Date.now();
    // Pre-inject the mocked Sentry so async ensureSentry() resolves immediately
    (service as any).sentryLoaded = true;
    (service as any).sentryModule = {
      addBreadcrumb: mockAddBreadcrumb,
      setTag: mockSetTag,
      captureException: mockCaptureException,
      captureMessage: mockCaptureMessage,
      flush: mockFlush,
    };
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

    it('should send metrics to analytics', () => {
      service.recordGameStart();
      service.recordGameEnd(1000, true, { shield: 1 }, 'purple_tap');

      expect(mockGtag).toHaveBeenCalledWith('event', 'game_end', {
        score: 1000,
        completed: true,
        powerups_used: JSON.stringify({ shield: 1 }),
        death_cause: 'purple_tap'
      });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith({
        message: 'Game ended: 1000 points (completed)',
        category: 'game',
        level: 'info'
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

    it('should record load time', () => {
      service.recordLoadTime(2500);

      expect(mockSetTag).toHaveBeenCalledWith('load_time', '2500');
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
      (service as any).sessionStartTime = Date.now() - 5000;

      service.endSession();

      const metrics = service.getMetrics();
      expect(metrics.game.sessionDuration).toBeCloseTo(5000, 100);
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