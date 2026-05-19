// Firebase leaderboard service - handles score submission and retrieval
import { getDeviceId } from '../utils/device';
import { logger } from '../utils/logger';

// ─── Inlined lazy Firebase (no separate chunk) ────────────────────
interface FirebaseModule {
  getDB: () => unknown;
}
let _firebaseModule: FirebaseModule | null = null;
async function getFirebaseModule(): Promise<FirebaseModule | null> {
  if (!_firebaseModule) {
    _firebaseModule = await import('./firebase') as unknown as FirebaseModule;
  }
  return _firebaseModule;
}

export interface LeaderboardEntry {
  id: string;
  score: number;
  mode: 'classic' | 'evolve';
  seed: string;
  timestamp: Date;
  deviceId: string;
  playerName?: string;
  version: string;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  userRank?: number;
  userEntry?: LeaderboardEntry;
}

export class LeaderboardService {
  private static instance: LeaderboardService;
  private db: unknown; // Firestore instance

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  /** Inject a Firestore instance directly (used in tests). */
  setFirestore(db: unknown): void {
    this.db = db;
  }

  async ensureDB(): Promise<unknown> {
    if (!this.db) {
      const fb = await getFirebaseModule();
      this.db = fb?.getDB?.() ?? null;
    }
    return this.db;
  }

  // Submit score with validation and retry logic
  async submitScore(
    score: number,
    mode: 'classic' | 'evolve',
    seed: string,
    playerName?: string
  ): Promise<{ success: boolean; rank?: number; error?: string }> {
    const db = await this.ensureDB();
    if (!db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    // Validate score
    if (score < 0) {
      return { success: false, error: 'Invalid score' };
    }
    if (score > 100000) {
      return { success: false, error: 'Score suspiciously high' };
    }

    try {
      // Lazy load Firebase functions
      const {
        doc, runTransaction, Timestamp
      } = await import('firebase/firestore');

      const deviceId = await getDeviceId();
      const entryId = `${deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const entry: Omit<LeaderboardEntry, 'id'> = {
        score,
        mode,
        seed,
        timestamp: new Date(),
        deviceId,
        playerName: playerName || 'Anonymous',
        version: (globalThis as Record<string, unknown>).__APP_VERSION__ as string || 'unknown'
      };

      // Use transaction for atomic write
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Firebase dynamic import interop
      await runTransaction(db as any, async (transaction: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Firebase dynamic import interop
        const docRef = doc(db as any, 'leaderboard', entryId);
        transaction.set(docRef, {
          ...entry,
          timestamp: Timestamp.fromDate(entry.timestamp)
        });
      });

      logger.info('[Leaderboard] Score submitted successfully', { score, mode, entryId });

      // Get user's rank
      const rank = await this.getUserRank(score, mode, deviceId);

      return { success: true, rank };

    } catch (error) {
      logger.error('[Leaderboard] Failed to submit score', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get top N leaderboard entries
  async getTopEntries(
    mode: 'classic' | 'evolve',
    limitCount = 20
  ): Promise<LeaderboardResult> {
    const db = await this.ensureDB();
    if (!db) {
      return { entries: [] };
    }

    try {
      // Lazy load Firebase functions
      const {
        collection, query, where, orderBy, limit, getDocs
      } = await import('firebase/firestore');

      const q = query(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Firebase dynamic import interop
        collection(db as any, 'leaderboard'),
        where('mode', '==', mode),
        orderBy('score', 'desc'),
        orderBy('timestamp', 'asc'), // For tie-breaking
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];

      snapshot.forEach((doc: { id: string; data: () => Record<string, unknown> }) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          score: data.score as number,
          mode: data.mode as 'classic' | 'evolve',
          seed: data.seed as string,
          timestamp: (data.timestamp as { toDate: () => Date }).toDate(),
          deviceId: data.deviceId as string,
          playerName: data.playerName as string | undefined,
          version: data.version as string
        });
      });

      return { entries };

    } catch (error) {
      logger.error('[Leaderboard] Failed to fetch top entries', error);
      return { entries: [] };
    }
  }

  // Get user's rank for a score
  async getUserRank(
    score: number,
    mode: 'classic' | 'evolve',
    _deviceId: string
  ): Promise<number | undefined> {
    const db = await this.ensureDB();
    if (!db) return undefined;

    try {
      // Lazy load Firebase functions
      const {
        collection, query, where, getDocs
      } = await import('firebase/firestore');

      // Count how many scores are higher than this one
      const q = query(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Firebase dynamic import interop
        collection(db as any, 'leaderboard'),
        where('mode', '==', mode),
        where('score', '>', score)
      );

      const snapshot = await getDocs(q);
      return snapshot.size + 1; // +1 because rank starts at 1

    } catch (error) {
      logger.error('[Leaderboard] Failed to get user rank', error);
      return undefined;
    }
  }

  // Get user's best entries
  async getUserEntries(
    deviceId: string,
    mode?: 'classic' | 'evolve',
    limitCount = 10
  ): Promise<LeaderboardEntry[]> {
    const db = await this.ensureDB();
    if (!db) return [];

    try {
      // Lazy load Firebase functions
      const {
        collection, query, where, orderBy, limit, getDocs
      } = await import('firebase/firestore');

      let q = query(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Firebase dynamic import interop
        collection(db as any, 'leaderboard'),
        where('deviceId', '==', deviceId),
        orderBy('score', 'desc'),
        limit(limitCount)
      );

      if (mode) {
        q = query(q, where('mode', '==', mode));
      }

      const snapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];

      snapshot.forEach((doc: { id: string; data: () => Record<string, unknown> }) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          score: data.score as number,
          mode: data.mode as 'classic' | 'evolve',
          seed: data.seed as string,
          timestamp: (data.timestamp as { toDate: () => Date }).toDate(),
          deviceId: data.deviceId as string,
          playerName: data.playerName as string | undefined,
          version: data.version as string
        });
      });

      return entries;

    } catch (error) {
      logger.error('[Leaderboard] Failed to get user entries', error);
      return [];
    }
  }

  // Validate score before submission (client-side validation)
  validateScore(score: number): { valid: boolean; reason?: string } {
    if (typeof score !== 'number' || isNaN(score)) {
      return { valid: false, reason: 'Score must be a number' };
    }

    if (score < 0) {
      return { valid: false, reason: 'Score cannot be negative' };
    }

    if (score > 100000) {
      return { valid: false, reason: 'Score suspiciously high' };
    }

    // Check for obvious cheating patterns
    if (score % 1000 === 0 && score > 10000) {
      return { valid: false, reason: 'Suspicious score pattern' };
    }

    return { valid: true };
  }

  // Batch submit multiple scores (for offline queue)
  async submitScoreBatch(
    scores: Array<{ score: number; mode: 'classic' | 'evolve'; seed: string; playerName?: string }>
  ): Promise<{ successes: number; failures: number; errors: string[] }> {
    const results = { successes: 0, failures: 0, errors: [] as string[] };

    for (const scoreData of scores) {
      const result = await this.submitScore(
        scoreData.score,
        scoreData.mode,
        scoreData.seed,
        scoreData.playerName
      );

      if (result.success) {
        results.successes++;
      } else {
        results.failures++;
        if (result.error) {
          results.errors.push(result.error);
        }
      }
    }

    return results;
  }
}

// Export singleton instance
export const leaderboardService = LeaderboardService.getInstance();