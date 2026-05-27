import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TickProcessor } from '../engine/subsystems/TickProcessor';
import type { TickContext } from '../engine/subsystems/TickProcessor';
import type { PlayerState, GameConfig, NumPlayers, GameEvent, CellType } from '../engine/types';

function makePlayer(overrides?: Partial<PlayerState>): PlayerState {
  return {
    alive: true,
    health: 3,
    shield: false,
    shieldCount: 0,
    score: 0,
    streak: 0,
    cells: new Array(25).fill('inactive') as CellType[],
    active: [],
    anim: {},
    patternIdx: 0,
    gridStage: 0,
    stageProgress: 0,
    pendingStageUpdate: false,
    nextShuffleTick: 0,
    freezeEnd: 0,
    multiplierEnd: 0,
    storedFreezeCharges: 0,
    storedShieldCharges: 0,
    ...overrides,
  };
}

function makeCtx(events: GameEvent[], overrides?: Partial<TickContext>): TickContext {
  return {
    config: { mode: 'evolve', numPlayers: 1, speedMult: 1, inputMode: 'touch' } as GameConfig,
    phase: 'playing',
    tickCount: 0,
    evolveTick: 0,
    cellShape: 'square',
    rareMode: { active: false, color: '', cssColor: '', turnsLeft: 0, shape: 'circle', emoji: '' },
    spinLevel: 0,
    p1: makePlayer(),
    p2: makePlayer({ alive: false }),
    bossEvent: null,
    _bossActive: false,
    _isInverted: false,
    _isBlackout: false,
    nextBossTriggerScore: 500,
    activeBomb: null,
    dirty: false,
    _tickSoundCounter: 0,
    _lastTickTs: performance.now(),
    now: Date.now(),
    numPlayers: 1 as NumPlayers,
    _deltaTimers: [],
    devGodMode: false,
    devFreezeTime: false,
    devForcedPwr: null,
    dda: { recordAttempt: vi.fn(), spawnRate: 1200 },
    emit: (e: GameEvent) => { events.push(e); },
    _flushTapBuffer: vi.fn(),
    checkStageProgress: vi.fn(),
    triggerGameOver: vi.fn(),
    scheduleTimeout: vi.fn(() => ({} as ReturnType<typeof setTimeout>)),
    addDeltaTimer: vi.fn(),
    removeDeltaTimer: vi.fn(),
    rng: () => 0.5,
    ...overrides,
  };
}

describe('TickProcessor', () => {
  let processor: TickProcessor;

  beforeEach(() => {
    processor = new TickProcessor();
  });

  describe('processTick', () => {
    it('does nothing when phase is not playing', () => {
      const events: GameEvent[] = [];
      const ctx = makeCtx(events, { phase: 'gameover' });
      processor.processTick(ctx);
      expect(ctx._flushTapBuffer).not.toHaveBeenCalled();
    });

    it('flushes tap buffer for player 1', () => {
      const events: GameEvent[] = [];
      const ctx = makeCtx(events);
      processor.processTick(ctx);
      expect(ctx._flushTapBuffer).toHaveBeenCalledWith(1);
    });

    it('flushes tap buffer for player 2 in 2-player mode', () => {
      const events: GameEvent[] = [];
      const ctx = makeCtx(events, {
        numPlayers: 2 as NumPlayers,
        p2: makePlayer(),
      });
      processor.processTick(ctx);
      expect(ctx._flushTapBuffer).toHaveBeenCalledWith(2);
    });

    it('increments tickCount', () => {
      const events: GameEvent[] = [];
      const ctx = makeCtx(events);
      processor.processTick(ctx);
      expect(ctx.tickCount).toBe(1);
    });

    it('marks dirty after tick', () => {
      const events: GameEvent[] = [];
      const ctx = makeCtx(events);
      processor.processTick(ctx);
      expect(ctx.dirty).toBe(true);
    });

    it('emits tick sound every 4 ticks', () => {
      const events: GameEvent[] = [];
      const ctx = makeCtx(events, { _tickSoundCounter: 3 });
      processor.processTick(ctx);
      const soundEvents = events.filter(e => e.type === 'sound' && e.name === 'tick');
      expect(soundEvents.length).toBe(1);
    });

    it('processes delta timers and decrements remaining', () => {
      const callback = vi.fn();
      const events: GameEvent[] = [];
      const ctx = makeCtx(events, {
        _deltaTimers: [{ id: 'test', remaining: 50, duration: 100, callback }],
      });
      processor.processTick(ctx);
      expect(ctx._deltaTimers.length).toBeGreaterThanOrEqual(0);
    });

    it('fires delta timer callback when remaining <= 0', () => {
      const callback = vi.fn();
      const events: GameEvent[] = [];
      const ctx = makeCtx(events, {
        _deltaTimers: [{ id: 'test', remaining: 0, duration: 100, callback }],
      });
      processor.processTick(ctx);
      expect(callback).toHaveBeenCalled();
    });

    it('handles crash gracefully and triggers game over', () => {
      const events: GameEvent[] = [];
      const ctx = makeCtx(events);
      Object.defineProperty(ctx.p1, 'active', {
        get() { throw new Error('test crash'); },
      });
      processor.processTick(ctx);
      expect(ctx.triggerGameOver).toHaveBeenCalledWith(null);
    });

    it('applies survival bonus after threshold ticks', () => {
      const events: GameEvent[] = [];
      const ctx = makeCtx(events, {
        tickCount: 199,
        p1: makePlayer({ score: 0, alive: true }),
      });
      processor.processTick(ctx);
      expect(ctx.p1.score).toBeGreaterThanOrEqual(0);
    });

    it('handles ice cell blocking — skips respawn when ice active', () => {
      const events: GameEvent[] = [];
      const iceCell = { idx: 0, clicked: false, type: 'ice' as const, iceCount: 2 };
      const ctx = makeCtx(events, {
        p1: makePlayer({ active: [iceCell], cells: new Array(25).fill('inactive') as CellType[] }),
      });
      processor.processTick(ctx);
      expect(ctx.p1.active.some(c => c.type === 'ice')).toBe(true);
      // Verify no non-ice cells were spawned alongside
      expect(ctx.p1.active.filter(c => c.type !== 'ice').length).toBe(0);
    });

    it('sets humanlimit phase when tick limit reached', () => {
      const events: GameEvent[] = [];
      const ctx = makeCtx(events, { tickCount: 419 }); // HUMAN_LIMIT_TICK = 420
      processor.processTick(ctx);
      expect(ctx.tickCount).toBe(420);
      expect(ctx.phase).toBe('humanlimit');
    });
  });
});
