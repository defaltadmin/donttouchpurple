// engine/subsystems/SessionPersistor.ts
import { stateGuard } from '../../utils/state-guard';

const SESSION_KEY = 'dtp:game-session'; // sessionStorage key (not a secret)

export const SessionPersistor = {
  save(snapshot: Record<string, unknown>): void {
    if (!snapshot || snapshot['phase'] !== 'playing') return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
    } catch { /* quota — silent */ }
  },

  load(): Record<string, unknown> | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return stateGuard.parse<Record<string, unknown> | null>(
      raw,
      null,
      (d) => typeof d === 'object' && d !== null && 'gameSeed' in (d as object),
    );
  },

  clear(): void {
    sessionStorage.removeItem(SESSION_KEY);
  },
};
