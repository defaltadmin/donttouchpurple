import { describe, it, expect } from 'vitest';
import { DynamicDifficulty } from '../utils/dda';

describe('DynamicDifficulty', () => {
  it('should start at baseline spawn rate', () => {
    const dda = new DynamicDifficulty(1000);
    expect(dda.spawnRate).toBe(1000);
  });

  it('should decrease spawn rate after high performance', () => {
    const dda = new DynamicDifficulty(1000);
    for (let i = 0; i < 10; i++) dda.recordAttempt(true, 200, false);
    const newRate = dda.compute();
    expect(newRate).toBeLessThan(1000);
    expect(newRate).toBeGreaterThanOrEqual(400);
  });

  it('adjusts at most once for the same attempt window', () => {
    const dda = new DynamicDifficulty(1000);
    for (let i = 0; i < 10; i++) dda.recordAttempt(true, 200, false);

    const adjusted = dda.compute();
    expect(dda.compute()).toBe(adjusted);
    expect(dda.compute()).toBe(adjusted);
  });

  it('should reset metrics and spawn rate', () => {
    const dda = new DynamicDifficulty(800);
    dda.recordAttempt(false, 500, true);
    dda.compute();
    dda.reset(800);
    expect(dda.spawnRate).toBe(800);
  });
});
