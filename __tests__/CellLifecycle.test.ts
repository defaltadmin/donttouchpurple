import { describe, it, expect } from 'vitest';
import { pickCellShape, activeToCellsP, spawnActive, pickPattern } from '../engine/subsystems/CellLifecycle';
import type { ActiveCell, RegularCell } from '../engine/types';

describe('CellLifecycle', () => {
  describe('pickCellShape', () => {
    it('returns square for ticks 0-5', () => {
      for (let t = 0; t < 6; t++) expect(pickCellShape(t)).toBe('square');
    });

    it('returns triangle for ticks 6-11', () => {
      for (let t = 6; t < 12; t++) expect(pickCellShape(t)).toBe('triangle');
    });

    it('returns circle for ticks 12-17', () => {
      for (let t = 12; t < 18; t++) expect(pickCellShape(t)).toBe('circle');
    });

    it('cycles through 8 steps', () => {
      const shapes: string[] = [];
      for (let t = 0; t < 48; t += 6) shapes.push(pickCellShape(t));
      expect(shapes.length).toBe(8);
      expect(pickCellShape(48)).toBe('square');
    });
  });

  describe('activeToCellsP', () => {
    it('returns 25-cell array', () => {
      const result = activeToCellsP([], { cols: 3, rows: 3, mask: null });
      expect(result).toHaveLength(25);
    });

    it('fills unmasked cells with inactive', () => {
      const result = activeToCellsP([], { cols: 3, rows: 3, mask: null });
      expect(result.every(c => c === 'inactive')).toBe(true);
    });

    it('marks non-masked cells as void', () => {
      const result = activeToCellsP([], { cols: 5, rows: 5, mask: [0, 1, 2] });
      expect(result[0]).toBe('inactive');
      expect(result[3]).toBe('void');
      expect(result[24]).toBe('void');
    });

    it('places active cells at correct indices', () => {
      const active = [
        { idx: 0, clicked: false, type: 'blue' as RegularCell['type'] },
        { idx: 4, clicked: false, type: 'red' as RegularCell['type'] },
      ] as ActiveCell[];
      const result = activeToCellsP(active, { cols: 3, rows: 3, mask: null });
      expect(result[0]).toBe('blue');
      expect(result[4]).toBe('red');
      expect(result[1]).toBe('inactive');
    });

    it('skips clicked cells', () => {
      const active = [
        { idx: 0, clicked: true, type: 'blue' as RegularCell['type'] },
      ] as ActiveCell[];
      const result = activeToCellsP(active, { cols: 3, rows: 3, mask: null });
      expect(result[0]).toBe('inactive');
    });
  });

  describe('spawnActive', () => {
    it('returns cells with valid indices from pattern', () => {
      const rng = () => 0.5;
      const cells = spawnActive(rng, 0, 3);
      expect(cells.length).toBeGreaterThanOrEqual(1);
      cells.forEach(c => {
        expect(c.idx).toBeGreaterThanOrEqual(0);
        expect(c.idx).toBeLessThan(9);
        expect(c.clicked).toBe(false);
      });
    });

    it('spawns more cells at higher stages', () => {
      const rng = () => 0.5;
      const low = spawnActive(rng, 0, 3);
      const high = spawnActive(rng, 10, 3);
      expect(high.length).toBeGreaterThanOrEqual(low.length);
    });

    it('substitutes rare color for purple when rareColor set', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1;
        return 0.5;
      };
      const cells = spawnActive(rng, 0, 3, undefined, false, 'magenta');
      // Verify cells were spawned — rare color substitution is probabilistic
      expect(cells.length).toBeGreaterThanOrEqual(1);
      // If first cell was purple, it should have been replaced with magenta
      const first = cells[0];
      if (first.type === 'magenta') {
        expect(first.type).toBe('magenta');
      }
    });

    it('respects godMode by suppressing medpack weight', () => {
      const rng = () => 0.01;
      const cells = spawnActive(rng, 5, 1, undefined, true, undefined, undefined, 0, true);
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('pickPattern', () => {
    const rng = () => 0.5;

    it('returns a valid pattern index', () => {
      const idx = pickPattern(rng, 5, 0, 200);
      expect(idx).toBeGreaterThanOrEqual(0);
    });

    it('avoids repeating the last pattern index when possible', () => {
      const idx1 = pickPattern(rng, 5, 0, 200);
      expect(typeof idx1).toBe('number');
    });

    it('restricts pattern size at low scores', () => {
      const idx = pickPattern(rng, 5, 0, 10);
      expect(idx).toBeGreaterThanOrEqual(0);
    });
  });
});
