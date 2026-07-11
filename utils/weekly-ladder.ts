/**
 * Weekly seeded ladder — same seed for every player Mon–Sun (UTC).
 * Week boundaries use UTC exclusively (AGENTS.md / HANDOFF rule).
 */

const LADDER_SALT = 'donttouchpurple-ladder-v1';

/** ISO week id: YYYY-Www (UTC, ISO-8601 week date). */
export function getUtcWeekId(date: Date = new Date()): string {
  // ISO week: Thursday of this week determines the year
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1 … Sun=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const year = d.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

/** Monday 00:00:00.000 UTC → next Monday 00:00 exclusive. */
export function getUtcWeekBounds(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() - (dayNum - 1));
  d.setUTCHours(0, 0, 0, 0);
  const start = new Date(d);
  const end = new Date(d);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

/** ms until next Monday 00:00 UTC. */
export function msUntilWeekReset(date: Date = new Date()): number {
  const { end } = getUtcWeekBounds(date);
  return Math.max(0, end.getTime() - date.getTime());
}

/** Human-readable countdown for UI (e.g. "2d 5h"). */
export function formatWeekCountdown(ms: number): string {
  if (ms <= 0) return '0h';
  const totalH = Math.floor(ms / 3_600_000);
  const d = Math.floor(totalH / 24);
  const h = totalH % 24;
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Deterministic FNV-1a 32-bit hash → unsigned seed.
 * Sync-friendly for GameEngine.start(forceSeed). Same weekId → same seed forever.
 */
export function weeklySeedFromId(weekId: string): number {
  const input = `${LADDER_SALT}|${weekId}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function getCurrentWeeklySeed(date: Date = new Date()): number {
  return weeklySeedFromId(getUtcWeekId(date));
}

export function weeklyBestStorageKey(weekId: string = getUtcWeekId()): string {
  return `dtp-weekly-best-${weekId}`;
}

export function loadWeeklyBest(weekId: string = getUtcWeekId()): number {
  try {
    const v = parseInt(localStorage.getItem(weeklyBestStorageKey(weekId)) ?? '0', 10);
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

export function saveWeeklyBest(score: number, weekId: string = getUtcWeekId()): number {
  const prev = loadWeeklyBest(weekId);
  const next = Math.max(prev, Math.floor(score));
  try {
    localStorage.setItem(weeklyBestStorageKey(weekId), String(next));
  } catch { /* storage denied */ }
  return next;
}

/** Firestore path helpers (Worker + client). */
export function weeklyEntriesCollection(weekId: string = getUtcWeekId()): string {
  return `lb_weekly/${weekId}/entries`;
}
