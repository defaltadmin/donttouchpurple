import { logger } from './logger';

export interface GameSession {
  version: 1;
  timestamp: number;
  state: Record<string, unknown>;
  engineSnapshot: { hearts: number; score: number; timeLeft: number; isPaused: boolean };
}

export const sessionManager = {
  KEY: 'dtp:session',
  
  save(snapshot: GameSession['engineSnapshot'], extraState: Record<string, unknown> = {}) {
    try {
      const data: GameSession = {
        version: 1,
        timestamp: Date.now(),
        state: extraState,
        engineSnapshot: snapshot
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
      if (Date.now() - data.timestamp > 4.32e7) {
        this.clear();
        return null;
      }
      return data;
    } catch {
      this.clear();
      return null;
    }
  },

  clear() { sessionStorage.removeItem(this.KEY); }
};
