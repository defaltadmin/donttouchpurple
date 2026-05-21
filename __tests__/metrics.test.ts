import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry methods
const { mockSetTag, mockSentry } = vi.hoisted(() => {
  const mockSetTag = vi.fn();
  const mockSentry = {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    setTag: mockSetTag,
    addBreadcrumb: vi.fn(),
    flush: vi.fn()
  };
  return { mockSetTag, mockSentry };
});

vi.mock('../services/sentry', () => ({
  getSentry: () => Promise.resolve(mockSentry),
  safeSentry: mockSentry
}));

vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
}));

import { MetricsService } from '../services/metrics';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = MetricsService.getInstance();
    service.perfMetrics = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be a singleton', () => {
    const a = MetricsService.getInstance();
    const b = MetricsService.getInstance();
    expect(a).toBe(b);
  });

  it('should record load time', async () => {
    service.recordLoadTime(2500);

    await vi.waitFor(() => {
      expect(mockSetTag).toHaveBeenCalledWith('load_time', '2500');
    });
  });
});
