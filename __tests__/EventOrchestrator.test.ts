import { describe, it, expect } from 'vitest';
import {
  getNextBossEventType,
  getBossDuration,
  getBossLabel,
  getBossDoneLabel,
  getNextBossTriggerScore,
  shouldTriggerShieldBoss,
} from '../engine/subsystems/EventOrchestrator';

describe('EventOrchestrator', () => {
  describe('getNextBossEventType', () => {
    it('returns first rotation type when prev is null', () => {
      expect(getNextBossEventType(null)).toBe('inversion');
    });

    it('cycles through rotation when given prev type', () => {
      // Only inversion in rotation, so after inversion it wraps back to inversion
      expect(getNextBossEventType('inversion')).toBe('inversion');
    });

    it('returns first type for non-rotation prev types', () => {
      expect(getNextBossEventType('storm')).toBe('inversion');
      expect(getNextBossEventType('blackout')).toBe('inversion');
    });
  });

  describe('getBossDuration', () => {
    it('returns correct duration for each type', () => {
      expect(getBossDuration('storm')).toBe(8000);
      expect(getBossDuration('inversion')).toBe(4000);
      expect(getBossDuration('blackout')).toBe(5000);
    });
  });

  describe('getBossLabel', () => {
    it('returns non-empty label for each type', () => {
      expect(getBossLabel('storm')).toBeTruthy();
      expect(getBossLabel('inversion')).toBeTruthy();
      expect(getBossLabel('blackout')).toBeTruthy();
    });
  });

  describe('getBossDoneLabel', () => {
    it('returns non-empty done label for each type', () => {
      expect(getBossDoneLabel('storm')).toBeTruthy();
      expect(getBossDoneLabel('inversion')).toBeTruthy();
      expect(getBossDoneLabel('blackout')).toBeTruthy();
    });
  });

  describe('getNextBossTriggerScore', () => {
    it('returns current + 500', () => {
      expect(getNextBossTriggerScore(0)).toBe(500);
      expect(getNextBossTriggerScore(500)).toBe(1000);
      expect(getNextBossTriggerScore(2500)).toBe(3000);
    });
  });

  describe('shouldTriggerShieldBoss', () => {
    const alwaysTrue = () => 0.1;
    const alwaysFalse = () => 0.99;

    it('returns true when all conditions met (evolve, no boss, no weather, score>100, score%300<4, rng<0.35)', () => {
      // score=302 → 302%300=2 < 4 ✓
      expect(shouldTriggerShieldBoss(302, false, false, 'evolve', alwaysTrue)).toBe(true);
    });

    it('returns false in classic mode', () => {
      expect(shouldTriggerShieldBoss(302, false, false, 'classic', alwaysTrue)).toBe(false);
    });

    it('returns false when boss is active', () => {
      expect(shouldTriggerShieldBoss(302, true, false, 'evolve', alwaysTrue)).toBe(false);
    });

    it('returns false when weather is active', () => {
      expect(shouldTriggerShieldBoss(302, false, true, 'evolve', alwaysTrue)).toBe(false);
    });

    it('returns false when score <= 100', () => {
      expect(shouldTriggerShieldBoss(50, false, false, 'evolve', alwaysTrue)).toBe(false);
    });

    it('returns false when score%300 >= 4', () => {
      // score=310 → 310%300=10 ≥ 4
      expect(shouldTriggerShieldBoss(310, false, false, 'evolve', alwaysTrue)).toBe(false);
    });

    it('returns false when rng >= 0.35', () => {
      expect(shouldTriggerShieldBoss(302, false, false, 'evolve', alwaysFalse)).toBe(false);
    });
  });
});
