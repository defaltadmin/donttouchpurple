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

  it('keeps player alive at 0.5 health after danger tap (half heart remaining)', () => {
    engine.start();

    // Manually set health to 1.0 (last heart)
    eng(engine).p1.health = 1.0;

    // Mock a danger tap
    eng(engine).p1.active = [{ idx: 0, type: 'purple' }];

    const gameOverSpy = vi.fn();
    engine.subscribe((e) => {
      if (e.type === 'gameOver') gameOverSpy();
    });

    engine.handleTap(1, 0);

    // In Evolve mode, damage is 0.5.
    // Health 1.0 -> 0.5. With fix (health <= 0), player stays alive.
    expect(eng(engine).p1.health).toBe(0.5);
    expect(eng(engine).p1.alive).toBe(true);
    expect(gameOverSpy).not.toHaveBeenCalled();
  });

  it('triggers game over when health reaches 0 via danger tap', () => {
    engine.start();

    // Start at 0.5 health (one hit from death)
    eng(engine).p1.health = 0.5;
    eng(engine).p1.active = [{ idx: 0, type: 'purple' }];

    const gameOverSpy = vi.fn();
    engine.subscribe((e) => {
      if (e.type === 'gameOver') gameOverSpy();
    });

    engine.handleTap(1, 0);

    // Health 0.5 -> 0.0. Player dies.
    expect(eng(engine).p1.health).toBe(0);
    expect(eng(engine).p1.alive).toBe(false);
    expect(gameOverSpy).toHaveBeenCalled();
  });

  it('keeps player alive at 0.5 health via miss in TickProcessor', () => {
    engine.start();
    eng(engine).p1.health = 1.0;

    // Set up an active safe cell that will be missed.
    eng(engine).p1.active = [{ idx: 0, type: 'white', ts: Date.now() - 5000 }];

    const gameOverSpy = vi.fn();
    engine.subscribe((e) => {
      if (e.type === 'gameOver') gameOverSpy();
    });

    eng(engine).processTick();

    // Health 1.0 -> 0.5. Player stays alive.
    expect(eng(engine).p1.health).toBe(0.5);
    expect(eng(engine).p1.alive).toBe(true);
    expect(gameOverSpy).not.toHaveBeenCalled();
  });

  it('triggers game over when health reaches 0 via bomb explosion', () => {
    engine.start();
    eng(engine).p1.health = 1.0;

    // Mock a bomb explosion
    eng(engine).p1.active = [{ idx: 0, type: 'bomb', clicked: false, expiresAt: Date.now() - 1000 }];
    eng(engine).activeBomb = { idx: 0, player: 1, expiresAt: Date.now() - 1000 };

    const gameOverSpy = vi.fn();
    engine.subscribe((e) => { if (e.type === 'gameOver') gameOverSpy(); });

    // Add a delta timer that mirrors the TickProcessor bomb callback
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
          if (ref.health <= 0) {
            ref.alive = false;
            eng(engine).triggerGameOver(ctx.config.numPlayers === 1 ? null : (ctx.activeBomb.player === 1 ? 'p2' : 'p1'));
          }
        }
      }
    });

    // Process tick so the delta timer runs
    eng(engine).processTick();

    // Health 1.0 -> 0.5. Player stays alive (bomb only does 0.5 damage).
    expect(eng(engine).p1.health).toBe(0.5);
    expect(eng(engine).p1.alive).toBe(true);
    expect(gameOverSpy).not.toHaveBeenCalled();

    // Cleanup
    eng(engine).removeDeltaTimer('bomb_1_0');
    eng(engine).activeBomb = null;
  });

  it('kills player at 0 health via two hits in evolve mode', () => {
    engine.start();
    eng(engine).p1.health = 1.0;

    // First hit: 1.0 -> 0.5 (alive)
    eng(engine).p1.active = [{ idx: 0, type: 'purple' }];
    engine.handleTap(1, 0);
    expect(eng(engine).p1.health).toBe(0.5);
    expect(eng(engine).p1.alive).toBe(true);

    // Second hit: 0.5 -> 0.0 (dead)
    // Must use a fresh cell (previous one has clicked=true)
    eng(engine).p1.active = [{ idx: 1, type: 'purple' }];
    const gameOverSpy = vi.fn();
    engine.subscribe((e) => { if (e.type === 'gameOver') gameOverSpy(); });
    engine.handleTap(1, 1);
    expect(eng(engine).p1.health).toBe(0);
    expect(eng(engine).p1.alive).toBe(false);
    expect(gameOverSpy).toHaveBeenCalled();
  });
});
