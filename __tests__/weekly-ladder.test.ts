import { describe, it, expect } from 'vitest';
import {
  getUtcWeekId,
  getUtcWeekBounds,
  weeklySeedFromId,
  getCurrentWeeklySeed,
  formatWeekCountdown,
  msUntilWeekReset,
  weeklyEntriesCollection,
} from '../utils/weekly-ladder';

describe('weekly-ladder', () => {
  it('computes ISO week id in UTC', () => {
    // 2026-07-11 is a Saturday → ISO week 28 of 2026
    expect(getUtcWeekId(new Date('2026-07-11T12:00:00Z'))).toBe('2026-W28');
    // Monday of that week
    expect(getUtcWeekId(new Date('2026-07-06T00:00:00Z'))).toBe('2026-W28');
    // Sunday still same week
    expect(getUtcWeekId(new Date('2026-07-12T23:59:59Z'))).toBe('2026-W28');
    // Next Monday rolls to W29
    expect(getUtcWeekId(new Date('2026-07-13T00:00:00Z'))).toBe('2026-W29');
  });

  it('week bounds are Mon 00:00 UTC → next Mon 00:00 UTC', () => {
    const { start, end } = getUtcWeekBounds(new Date('2026-07-11T15:00:00Z'));
    expect(start.toISOString()).toBe('2026-07-06T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-07-13T00:00:00.000Z');
  });

  it('seed is deterministic per week id', () => {
    const a = weeklySeedFromId('2026-W28');
    const b = weeklySeedFromId('2026-W28');
    const c = weeklySeedFromId('2026-W29');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThanOrEqual(0xffffffff);
  });

  it('current seed matches week id seed', () => {
    const d = new Date('2026-07-11T12:00:00Z');
    expect(getCurrentWeeklySeed(d)).toBe(weeklySeedFromId(getUtcWeekId(d)));
  });

  it('formats countdown', () => {
    expect(formatWeekCountdown(0)).toBe('0h');
    expect(formatWeekCountdown(3_600_000)).toMatch(/1h/);
    expect(formatWeekCountdown(2 * 86_400_000 + 5 * 3_600_000)).toBe('2d 5h');
  });

  it('msUntilWeekReset is non-negative and within 7 days', () => {
    const ms = msUntilWeekReset(new Date('2026-07-11T12:00:00Z'));
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(7 * 86_400_000);
  });

  it('firestore collection path includes week id', () => {
    expect(weeklyEntriesCollection('2026-W28')).toBe('lb_weekly/2026-W28/entries');
  });
});
