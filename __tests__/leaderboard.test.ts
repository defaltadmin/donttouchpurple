import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase first
const mockDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockWhere = vi.fn();
const mockRunTransaction = vi.fn();
const mockTimestamp = {
  fromDate: vi.fn((date) => ({ toDate: () => date }))
};

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDocs: mockGetDocs,
  query: mockQuery,
  collection: mockCollection,
  orderBy: mockOrderBy,
  limit: mockLimit,
  where: mockWhere,
  runTransaction: mockRunTransaction,
  Timestamp: mockTimestamp
}));

// Mock device utils
vi.mock('../utils/device', () => ({
  getDeviceId: vi.fn(() => Promise.resolve('test-device-id'))
}));

import { LeaderboardService } from '../services/leaderboard';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = LeaderboardService.getInstance();
    mockDb = {};
    service.setFirestore(mockDb);

    // Setup default mock returns
    mockDoc.mockReturnValue('mock-doc-ref');
    mockCollection.mockReturnValue('mock-collection-ref');
    mockQuery.mockReturnValue('mock-query-ref');
    mockRunTransaction.mockResolvedValue(undefined);
    // Default getDocs returns empty snapshot (used by getUserRank)
    mockGetDocs.mockResolvedValue({ docs: [], size: 0, forEach: vi.fn() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('submitScore', () => {
    it('should submit valid score successfully', async () => {
      const result = await service.submitScore(1000, 'classic', 'test-seed');

      expect(result.success).toBe(true);
      expect(mockRunTransaction).toHaveBeenCalledWith(mockDb, expect.any(Function));
      // rank is optional — present when getDocs succeeds, undefined when it fails
      expect(result.rank === undefined || typeof result.rank === 'number').toBe(true);
    });

    it('should reject invalid scores', async () => {
      const result = await service.submitScore(-100, 'classic', 'test-seed');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid score');
    });

    it('should reject suspiciously high scores', async () => {
      const result = await service.submitScore(200000, 'classic', 'test-seed');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Score suspiciously high');
    });

    it('should handle Firebase errors', async () => {
      mockRunTransaction.mockRejectedValue(new Error('Firebase error'));

      const result = await service.submitScore(1000, 'classic', 'test-seed');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Firebase error');
    });
  });

  describe('getTopEntries', () => {
    it('should fetch top entries successfully', async () => {
      const mockSnapshot = {
        forEach: vi.fn((callback) => {
          callback({
            id: 'entry1',
            data: () => ({
              score: 1000,
              mode: 'classic',
              seed: 'seed1',
              timestamp: mockTimestamp.fromDate(new Date()),
              deviceId: 'device1',
              playerName: 'Player1',
              version: '1.0.0'
            })
          });
        })
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await service.getTopEntries('classic', 10);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].score).toBe(1000);
      expect(result.entries[0].mode).toBe('classic');
    });

    it('should handle Firebase errors', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firebase error'));

      const result = await service.getTopEntries('classic', 10);

      expect(result.entries).toHaveLength(0);
    });
  });

  describe('validateScore', () => {
    it('should validate normal scores', () => {
      expect(service.validateScore(1000)).toEqual({ valid: true });
      expect(service.validateScore(0)).toEqual({ valid: true });
      expect(service.validateScore(99999)).toEqual({ valid: true });
    });

    it('should reject invalid scores', () => {
      expect(service.validateScore(-1)).toEqual({
        valid: false,
        reason: 'Score cannot be negative'
      });
      expect(service.validateScore(NaN)).toEqual({
        valid: false,
        reason: 'Score must be a number'
      });
      expect(service.validateScore(100001)).toEqual({
        valid: false,
        reason: 'Score suspiciously high'
      });
    });
  });
});