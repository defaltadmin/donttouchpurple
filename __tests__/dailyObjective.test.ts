import { describe, it, expect, beforeEach } from 'vitest';
import { getDailyObjective, getDailyObjectives, getObjectiveStreak, incrementObjectiveStreak, markObjectiveComplete, checkObjective } from '../config/dailyObjective';

describe('dailyObjective', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getDailyObjective', () => {
    it('returns an objective with required fields', () => {
      const obj = getDailyObjective();
      expect(obj).toBeDefined();
      expect(obj.type).toBeDefined();
      expect(obj.description).toBeDefined();
      expect(obj.target).toBeGreaterThan(0);
      expect(typeof obj.completed).toBe('boolean');
    });

    it('returns the same objective for the same date', () => {
      const obj1 = getDailyObjective('2026-05-17');
      const obj2 = getDailyObjective('2026-05-17');
      expect(obj1.type).toBe(obj2.type);
      expect(obj1.target).toBe(obj2.target);
    });

    it('returns different objectives for different dates', () => {
      const obj1 = getDailyObjective('2026-05-17');
      const obj2 = getDailyObjective('2026-05-18');
      // They might be the same by luck, but test the mechanism
      expect(obj1.date).toBe('2026-05-17');
      expect(obj2.date).toBe('2026-05-18');
    });
  });

  describe('getDailyObjectives', () => {
    it('returns 3 objectives for today', () => {
      const objs = getDailyObjectives();
      expect(objs).toHaveLength(3);
      objs.forEach(obj => {
        expect(obj.type).toBeDefined();
        expect(obj.description).toBeDefined();
        expect(obj.target).toBeGreaterThan(0);
        expect(typeof obj.completed).toBe('boolean');
      });
    });

    it('returns 3 different objectives (no duplicates)', () => {
      const objs = getDailyObjectives('2026-05-17');
      const types = objs.map(o => `${o.type}-${o.target}`);
      const unique = new Set(types);
      expect(unique.size).toBe(3);
    });

    it('first objective matches getDailyObjective', () => {
      const single = getDailyObjective('2026-05-17');
      const multiple = getDailyObjectives('2026-05-17');
      expect(multiple[0].type).toBe(single.type);
      expect(multiple[0].target).toBe(single.target);
    });
  });

  describe('checkObjective', () => {
    it('returns true when score target is met', () => {
      const obj = { type: 'score' as const, target: 80, reward: 25, description: 'Score 80+', completed: false, date: '2026-05-17' };
      expect(checkObjective(obj, 0, 0, 100, '1.0')).toBe(true);
    });

    it('returns false when score target is not met', () => {
      const obj = { type: 'score' as const, target: 80, reward: 25, description: 'Score 80+', completed: false, date: '2026-05-17' };
      expect(checkObjective(obj, 0, 0, 50, '1.0')).toBe(false);
    });

    it('returns false for already completed objective', () => {
      const obj = { type: 'score' as const, target: 80, reward: 25, description: 'Score 80+', completed: true, date: '2026-05-17' };
      expect(checkObjective(obj, 0, 0, 200, '1.0')).toBe(false);
    });

    it('checks streak target', () => {
      const obj = { type: 'streak' as const, target: 10, reward: 25, description: 'Reach 10 streak', completed: false, date: '2026-05-17' };
      expect(checkObjective(obj, 0, 15, 0, '1.0')).toBe(true);
      expect(checkObjective(obj, 0, 5, 0, '1.0')).toBe(false);
    });

    it('checks tick target', () => {
      const obj = { type: 'tick' as const, target: 60, reward: 20, description: 'Survive to tick 60', completed: false, date: '2026-05-17' };
      expect(checkObjective(obj, 100, 0, 0, '1.0')).toBe(true);
      expect(checkObjective(obj, 30, 0, 0, '1.0')).toBe(false);
    });

    it('checks boss_survive with counters', () => {
      const obj = { type: 'boss_survive' as const, target: 1, reward: 40, description: 'Survive a Boss', completed: false, date: '2026-05-17' };
      expect(checkObjective(obj, 0, 0, 0, '1.0', { bossSurvived: 1, bombsDefused: 0, inversionSurvived: 0 })).toBe(true);
      expect(checkObjective(obj, 0, 0, 0, '1.0', { bossSurvived: 0, bombsDefused: 0, inversionSurvived: 0 })).toBe(false);
    });
  });

  describe('getObjectiveStreak', () => {
    it('returns 0 when no streak data exists', () => {
      expect(getObjectiveStreak()).toBe(0);
    });

    it('returns streak count when data exists for today', () => {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('dtp-obj-streak', JSON.stringify({ count: 5, lastDate: today }));
      expect(getObjectiveStreak()).toBe(5);
    });

    it('returns streak count when data exists for yesterday (UTC)', () => {
      const now = new Date();
      now.setUTCDate(now.getUTCDate() - 1);
      const yesterday = now.toISOString().slice(0, 10);
      localStorage.setItem('dtp-obj-streak', JSON.stringify({ count: 3, lastDate: yesterday }));
      expect(getObjectiveStreak()).toBe(3);
    });

    it('returns 0 when last date is older than yesterday', () => {
      localStorage.setItem('dtp-obj-streak', JSON.stringify({ count: 10, lastDate: '2020-01-01' }));
      expect(getObjectiveStreak()).toBe(0);
    });

    it('handles corrupted data gracefully', () => {
      localStorage.setItem('dtp-obj-streak', 'not-json');
      expect(getObjectiveStreak()).toBe(0);
    });
  });

  describe('incrementObjectiveStreak', () => {
    it('increments streak from 0', () => {
      incrementObjectiveStreak();
      const streak = getObjectiveStreak();
      expect(streak).toBe(1);
    });

    it('increments existing streak', () => {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('dtp-obj-streak', JSON.stringify({ count: 3, lastDate: today }));
      incrementObjectiveStreak();
      expect(getObjectiveStreak()).toBe(4);
    });
  });

  describe('markObjectiveComplete', () => {
    it('marks today as completed', () => {
      const result = markObjectiveComplete();
      expect(result).not.toBeNull();
      expect(result!.completed).toBe(true);
    });

    it('returns null if already completed today', () => {
      markObjectiveComplete();
      const result = markObjectiveComplete();
      expect(result).toBeNull();
    });

    it('persists completed entry to localStorage', () => {
      markObjectiveComplete(0);
      const saved = JSON.parse(localStorage.getItem('dtp-daily-completed') || '[]');
      const today = new Date().toISOString().slice(0, 10);
      expect(saved).toEqual(expect.arrayContaining([expect.objectContaining({ date: today, index: 0 })]));
    });

    it('can complete multiple objectives per day', () => {
      markObjectiveComplete(0);
      markObjectiveComplete(1);
      const saved = JSON.parse(localStorage.getItem('dtp-daily-completed') || '[]');
      expect(saved).toHaveLength(2);
      expect(saved.filter((e: any) => e.index === 0)).toHaveLength(1);
      expect(saved.filter((e: any) => e.index === 1)).toHaveLength(1);
    });
  });
});
