// utils/session.ts
// KEY CHANGE: 'dtp:session-ui' (was 'dtp:session') to prevent collision with
// GameEngine's full crash-recovery snapshot that also uses 'dtp:session'.
// The light UI snapshot (hearts/score/timeLeft) is only used by the
// resume-banner logic; the full snapshot owns the 'dtp:session' key exclusively.
import { logger } from './logger';

export interface GameSession {
  version: 1;
  timestamp: number;
  state: Record<string, unknown>;
  engineSnapshot: { hearts: number; score: number; timeLeft: number; isPaused: boolean };
}

export const sessionManager = {
  KEY: 'dtp:session-ui',          // ← was 'dtp:session' — collision fixed

  save(snapshot: GameSession['engineSnapshot'], extraState: Record<string, unknown> = {}) {
    try {
      const data: GameSession = {
        version: 1,
        timestamp: Date.now(),
        state: extraState,
        engineSnapshot: snapshot,
      };
      sessionStorage.setItem(this.KEY, JSON.stringify(data));
      logger.debug('Session saved', { ts: data.timestamp });
    } catch (e) {
      logger.warn('Failed to save session', e);
    }
  },

  load(): GameSession | null {
    try {
      const raw = sessionStorage.getItem(this.KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as GameSession;
      // Expire after 12 hours or reject future timestamps (clock skew)
      if (Date.now() - data.timestamp > 4.32e7 || data.timestamp > Date.now() + 60_000) {
        this.clear();
        return null;
      }
      return data;
    } catch {
      this.clear();
      return null;
    }
  },

  clear() { sessionStorage.removeItem(this.KEY); },
};
