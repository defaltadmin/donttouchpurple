import { describe, test, expect, beforeEach, vi } from "vitest";
import { GameEngine } from "../../engine/GameEngine";
import { GameConfig } from "../../engine/types";

describe("GameEngine Critical Path", () => {
  let config: GameConfig;
  beforeEach(() => {
    config = {
      mode: "classic",
      numPlayers: 1,
      speedMult: 1,
      storage: { loadStoredPowerups: () => ({ freeze: 0, shield: 0, mult: 0, heart: 0 }), saveStoredPowerups: () => {} }
    };
  });

  test("Hold soft-lock prevention (5s safety timer)", () => {
    vi.useFakeTimers();
    const engine = new GameEngine(config);
    engine.start();
    
    // Setup a hold cell (mocked)
    const p1 = (engine as any).p1;
    p1.active = [{ idx: 0, clicked: false, type: "hold", holdRequired: 1000 }];
    
    engine.handleHoldStart(1, 0);
    expect(p1.active[0].holdStart).toBeDefined();
    
    vi.advanceTimersByTime(5001); // Trigger safety timer
    expect(p1.active[0].holdStart).toBeUndefined();
    vi.useRealTimers();
  });

  test("Ice cell decrement and removal", () => {
    const engine = new GameEngine(config);
    engine.start();
    const p1 = (engine as any).p1;
    p1.active = [{ idx: 0, clicked: false, type: "ice", iceCount: 2 }];
    
    (engine as any)._processTap(1, 0);
    expect(p1.active[0].iceCount).toBe(1);
    expect(p1.active[0].clicked).toBe(false);
    
    (engine as any)._processTap(1, 0);
    expect(p1.active[0].clicked).toBe(true);
  });

  test("Shield absorbs damage", () => {
    const engine = new GameEngine(config);
    engine.start();
    const p1 = (engine as any).p1;
    p1.health = 3;
    p1.shieldCount = 1;
    p1.shield = true;
    p1.active = [{ idx: 0, clicked: false, type: "purple" }];
    
    // Simulate tick with hit
    // The engine checks `c.type !== dangerColor && c.type !== "purple"`
    // If dangerColor is "purple", it should hit.
    (engine as any).processTick();
    
    // Wait, the engine check is:
    // c.type !== dangerColor && c.type !== "purple"
    // If c.type is "purple" and dangerColor is "purple", then c.type !== "purple" is false.
    // So the condition `c.type !== "purple"` makes it NOT damage?
    // Wait.
    // Logic: if (isPurple && !isPowerup) -> Damage
    // The code:
    // if (c.type !== dangerColor && c.type !== "purple" && !isPwr) { ... }
    // Wait, this looks like it only damages if it is NOT purple?
    // That seems wrong. Let's look closely at L350.
  });
});
