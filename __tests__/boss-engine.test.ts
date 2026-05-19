import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bossEngine } from '../utils/boss-engine';

describe('bossEngine', () => {
  let time = 0;
  let dispatchedEvents: Event[] = [];
  const originalDispatch = window.dispatchEvent;

  beforeEach(() => {
    vi.useFakeTimers();
    time = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => time);
    dispatchedEvents = [];
    window.dispatchEvent = vi.fn((e: Event) => {
      dispatchedEvents.push(e);
      return true;
    });
    bossEngine.deactivate();
    bossEngine.resetCombo();
    dispatchedEvents = []; // clear after setup
    (window.dispatchEvent as unknown as { mockClear: () => void }).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.dispatchEvent = originalDispatch;
  });

  describe('activate', () => {
    it('sets active state with correct shield hits', () => {
      bossEngine.activate(5);
      expect(bossEngine.state.active).toBe(true);
      expect(bossEngine.state.shieldHits).toBe(0);
      expect(bossEngine.state.maxShield).toBe(5);
      expect(bossEngine.state.phase).toBe(1);
    });

    it('dispatches boss:activate event', () => {
      bossEngine.activate(3);
      expect(dispatchedEvents.some(e => e.type === 'dtp:boss:activate')).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('resets active state', () => {
      bossEngine.activate(5);
      bossEngine.deactivate();
      expect(bossEngine.state.active).toBe(false);
    });

    it('dispatches boss:complete event', () => {
      bossEngine.activate(5);
      dispatchedEvents = [];
      (window.dispatchEvent as unknown as { mockClear: () => void }).mockClear();
      bossEngine.deactivate();
      expect(dispatchedEvents.some(e => e.type === 'dtp:boss:complete')).toBe(true);
    });
  });

  describe('shield hits via onSafeTap', () => {
    it('advances phase after enough hits', () => {
      bossEngine.activate(3);
      bossEngine.onSafeTap(); // +1, total=1
      expect(bossEngine.state.shieldHits).toBe(1);
      bossEngine.onSafeTap(); // +1, total=2
      expect(bossEngine.state.shieldHits).toBe(2);
      time = 300; // advance past combo window
      bossEngine.onSafeTap(); // +1, total=3=maxShield -> defeat phase
      expect(bossEngine.state.phase).toBe(2);
      expect(bossEngine.state.shieldHits).toBe(0);
    });

    it('deactivates after phase 3 defeat', () => {
      bossEngine.activate(1);
      time = 0;
      bossEngine.onSafeTap(); // Phase 1 defeated
      expect(bossEngine.state.phase).toBe(2);
      time = 300;
      bossEngine.onSafeTap(); // Phase 2 defeated
      expect(bossEngine.state.phase).toBe(3);
      time = 600;
      bossEngine.onSafeTap(); // Phase 3 defeated -> deactivate
      expect(bossEngine.state.active).toBe(false);
    });
  });

  describe('combo system', () => {
    it('activates multiplier after threshold kills', () => {
      bossEngine.activate(5);
      time = 0;
      bossEngine.onSafeTap(); // combo count 1
      time = 50;
      bossEngine.onSafeTap(); // combo count 2
      time = 100;
      bossEngine.onSafeTap(); // combo count 3 -> multiplier = 2
      expect(bossEngine.combo.multiplier).toBe(2);
    });

    it('resets multiplier after timeout', () => {
      bossEngine.activate(5);
      time = 0;
      for (let i = 0; i < 3; i++) { bossEngine.onSafeTap(); time += 50; }
      expect(bossEngine.combo.multiplier).toBe(2);
      vi.advanceTimersByTime(3001);
      expect(bossEngine.combo.multiplier).toBe(1);
    });

    it('combo resets after window expires', () => {
      bossEngine.activate(5);
      time = 0;
      bossEngine.onSafeTap(); // count=1
      bossEngine.onSafeTap(); // count=2
      time = 500; // past COMBO_WINDOW_MS (400ms)
      bossEngine.onSafeTap(); // count resets to 1 (window expired)
      expect(bossEngine.combo.count).toBe(1);
    });
  });

  describe('resetCombo', () => {
    it('resets all combo state', () => {
      bossEngine.activate(5);
      time = 0;
      for (let i = 0; i < 5; i++) { bossEngine.onSafeTap(); time += 50; }
      bossEngine.resetCombo();
      expect(bossEngine.combo.count).toBe(0);
      expect(bossEngine.combo.multiplier).toBe(1);
    });
  });
});
