import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameEngine } from '../engine/GameEngine';

/** Access private engine internals in tests */
/* eslint-disable @typescript-eslint/no-explicit-any */
function eng(engine: GameEngine): any {
  return engine as unknown;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

describe('Fractional Health Bug Fix', () => {
  let engine: GameEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new GameEngine({
      mode: 'evolve',
      speedMult: 1,
      numPlayers: 1,
    });
  });

  it('triggers game over when health reaches 0.5 in evolve mode', () => {
    engine.start();
    
    // Manually set health to 1.0 (last heart)
    eng(engine).p1.health = 1.0;
    
    // Mock a danger tap
    // We need to find a danger cell in the active cells or force one.
    // In Evolve mode, 'purple' is usually danger unless inverted.
    eng(engine).p1.active = [{ idx: 0, type: 'purple' }];
    
    const gameOverSpy = vi.fn();
    engine.subscribe((e) => {
      if (e.type === 'gameOver') gameOverSpy();
    });

    engine.handleTap(1, 0);
    
    // In Evolve mode, damage is 0.5. 
    // Health 1.0 -> 0.5. 
    // With the fix (health < 1), this should trigger game over.
    expect(eng(engine).p1.health).toBe(0.5);
    expect(eng(engine).p1.alive).toBe(false);
    expect(gameOverSpy).toHaveBeenCalled();
  });

  it('triggers game over when health reaches 0.5 via miss in TickProcessor', () => {
    engine.start();
    eng(engine).p1.health = 1.0;
    
    // In Evolve mode, damage is 0.5.
    // Set up an active safe cell that will be missed.
    eng(engine).p1.active = [{ idx: 0, type: 'white', ts: Date.now() - 5000 }]; // old cell
    
    const gameOverSpy = vi.fn();
    engine.subscribe((e) => {
      if (e.type === 'gameOver') gameOverSpy();
    });

    // TickProcessor handles misses
    // In GameEngine, processTick calls _tickProcessor.processTick
    eng(engine).processTick();
    
    expect(eng(engine).p1.health).toBe(0.5);
    expect(eng(engine).p1.alive).toBe(false);
    expect(gameOverSpy).toHaveBeenCalled();
  });

  it('triggers game over when health reaches 0.5 via bomb explosion', () => {
    engine.start();
    eng(engine).p1.health = 1.0;
    
    // Mock a bomb explosion
    eng(engine).p1.active = [{ idx: 0, type: 'bomb', clicked: false, expiresAt: Date.now() - 1000 }];
    eng(engine).activeBomb = { idx: 0, player: 1, expiresAt: Date.now() - 1000 };

    const gameOverSpy = vi.fn();
    engine.subscribe((e) => { if (e.type === 'gameOver') gameOverSpy(); });

    // Add a delta timer that mirrors the TickProcessor bomb callback so we execute
    // the same production logic during the test, then run a tick to trigger it.
    // NOTE: This mirrors TickProcessor.ts:362 — if bomb logic changes there, update here too.
    // devSpawnSpecialCell doesn't create delta timers, so we add one manually.
    engine.addDeltaTimer('bomb_1_0', 0, () => {
      const ctx = eng(engine)._tickCtx;
      const ref = eng(engine).p1;
      const idx = 0;
      if (!ctx.activeBomb || ctx.activeBomb.idx !== idx || ctx.activeBomb.player !== 1) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stillActive = ref.active.find((c: any) => c.idx === idx && c.type === 'bomb' && !c.clicked);
      if (!stillActive) return;
      stillActive.clicked = true;
      ctx.activeBomb = null;
      if (!ctx.devGodMode) {
        if (ref.shieldCount > 0) { ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
        else {
          const dmg = ctx.config.mode === 'evolve' ? 0.5 : 1;
          ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
          if (ref.health < 1) {
            ref.alive = false;
            eng(engine).triggerGameOver(ctx.config.numPlayers === 1 ? null : (ctx.activeBomb.player === 1 ? 'p2' : 'p1'));
          }
        }
      }
    });

    // Process tick so the delta timer runs
    eng(engine).processTick();

    expect(eng(engine).p1.health).toBe(0.5);
    expect(eng(engine).p1.alive).toBe(false);
    expect(gameOverSpy).toHaveBeenCalled();

    // Cleanup
    eng(engine).removeDeltaTimer('bomb_1_0');
    eng(engine).activeBomb = null;
  });
});
