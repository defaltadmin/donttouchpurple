import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameEngine } from "../engine/GameEngine";
import type { ActiveCell, GameConfig, GameEvent, Winner, HoldCell, IceCell } from "../engine/types";

function makeConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    mode: "classic",
    numPlayers: 1,
    speedMult: 1,
    ...overrides,
  };
}

/** Access private engine internals in tests via `as unknown as ...` */
/* eslint-disable @typescript-eslint/no-explicit-any */
function eng(engine: GameEngine): any {
  return engine as unknown;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function latestActive(engine: GameEngine): ActiveCell[] {
  return engine.getSnapshot().p1.active.filter((cell) => !cell.clicked);
}

describe("GameEngine", () => {
  let engine: GameEngine;
  let events: GameEvent[];

  beforeEach(() => {
    vi.useFakeTimers();
    events = [];
    engine = new GameEngine(makeConfig());
    engine.subscribe((event) => events.push(event));
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("emits a playing phase change and tick snapshot on start", () => {
    engine.start();

    expect(events[0]).toEqual({ type: "phaseChange", phase: "playing" });
    expect(events[1]?.type).toBe("tick");
    expect(engine.getSnapshot().phase).toBe("playing");
    expect(engine.getSnapshot().tick).toBe(0);
  });

  it("emits tick snapshots over time", () => {
    engine.start();
    vi.advanceTimersByTime(2_100);

    const tickEvents = events.filter((event) => event.type === "tick");
    expect(tickEvents.length).toBeGreaterThan(1);
    expect(engine.getSnapshot().tick).toBeGreaterThan(0);
  });

  it("pauses and resumes the loop", () => {
    engine.start();
    vi.advanceTimersByTime(2_100);
    const tickBeforePause = engine.getSnapshot().tick;

    engine.pause();
    vi.advanceTimersByTime(5_000);
    expect(engine.getSnapshot().phase).toBe("paused");
    expect(engine.getSnapshot().tick).toBe(tickBeforePause);

    engine.resume();
    vi.advanceTimersByTime(2_100);
    expect(engine.getSnapshot().phase).toBe("playing");
    expect(engine.getSnapshot().tick).toBeGreaterThan(tickBeforePause);
  });

  it("damages the player when safe cells are not tapped in time", () => {
    engine.start();
    // Override the engine's seeded rng AFTER start() (start resets rng to mulberry32)
    // 0.99 > purpleChance (0.28-0.35) + minPowerupWeight, so only safe cells spawn
    eng(engine).rng = () => 0.99;

    vi.advanceTimersByTime(4_100);

    // With safe cells expiring untapped, health should have dropped
    expect(engine.getSnapshot().p1.health).toBeLessThan(5);
    expect(events.some((event) => event.type === "damage")).toBe(true);
  });

  it("damages the player when a purple cell is tapped", () => {
    engine.start();
    vi.advanceTimersByTime(2_100);

    const existingCell = eng(engine).p1.active.find((cell: any) => !cell.clicked);
    if (existingCell) {
      existingCell.type = "purple";
    }

    const purpleCell = latestActive(engine).find((cell) => cell.type === "purple");
    expect(purpleCell).toBeDefined();

    const hpBefore = engine.getSnapshot().p1.health;
    engine.handleTap(1, purpleCell!.idx);

    expect(engine.getSnapshot().p1.health).toBeLessThan(hpBefore);
  });

  it("increases score when a safe cell is tapped", () => {
    engine.start();
    // Override rng AFTER start() (start resets rng to mulberry32)
    eng(engine).rng = () => 0.5;
    vi.advanceTimersByTime(2_100);

    const active = latestActive(engine);
    const safeCell = active.find((cell) => !["purple", "medpack", "shield", "freeze", "multiplier"].includes(cell.type));
    expect(safeCell).toBeDefined();

    engine.handleTap(1, safeCell!.idx);

    expect(engine.getSnapshot().p1.score).toBeGreaterThan(0);
  });

  it("can complete a hold cell and reward points", () => {
    engine.start();
    engine.devForcePattern(0);

    const holdCell: ActiveCell = {
      idx: 0,
      type: "hold",
      clicked: false,
      holdRequired: 700,
      spawnedAt: Date.now(),
    };

    // Mutate live engine state directly for test reliability
    eng(engine).p1.active = [holdCell];
    eng(engine).p1.cells = Array(25).fill("inactive");
    eng(engine).p1.cells[0] = "hold";

    engine.handleHoldStart(1, 0);
    vi.advanceTimersByTime(750);
    engine.handleHoldEnd(1, 0);

    expect(engine.getSnapshot().p1.score).toBeGreaterThanOrEqual(2);
    expect(events.some((event) => event.type === "toast")).toBe(true);
  });

  it("emits gameOver on a lethal purple tap", () => {
    let winner: Winner | undefined;
    engine.start();

    eng(engine).p1.health = 1;
    eng(engine).p1.active = [{ idx: 0, type: "purple", clicked: false }];
    eng(engine).p1.cells = Array(25).fill("inactive");
    eng(engine).p1.cells[0] = "purple";

    engine.handleTap(1, 0);

    const gameOver = events.find((event) => event.type === "gameOver");
    if (gameOver && gameOver.type === "gameOver") {
      winner = gameOver.winner;
    }

    expect(events.some((event) => event.type === "gameOver")).toBe(true);
    expect(winner).toBeNull();
    expect(engine.getSnapshot().phase).toBe("gameover");
  });

  it("stops emitting after destroy", () => {
    engine.start();
    vi.advanceTimersByTime(2_100);

    const eventCount = events.length;
    engine.destroy();
    vi.advanceTimersByTime(5_000);

    expect(events).toHaveLength(eventCount);
  });

  describe("Critical Path Logic", () => {
    it("prevents hold soft-lock with a 5s safety timer", () => {
      engine.start();

      eng(engine).p1.active = [{ idx: 0, clicked: false, type: "hold", holdRequired: 1000, spawnedAt: Date.now() }];

      engine.handleHoldStart(1, 0);
      const holdCell = engine.getSnapshot().p1.active[0] as HoldCell;
      expect(holdCell.holdStart).toBeDefined();

      vi.advanceTimersByTime(5001);
      expect((engine.getSnapshot().p1.active[0] as HoldCell).holdStart).toBeUndefined();
    });

    it("decrements and removes ice cells on multiple taps", () => {
      engine.start();
      const snapshot = engine.getSnapshot();
      // Add extra cell so grid doesn't regenerate when ice cell is cleared (all-clicked check)
      snapshot.p1.active = [
        { idx: 0, clicked: false, type: "ice", iceCount: 2 },
        { idx: 1, clicked: false, type: "white" },
      ];
      eng(engine).p1 = snapshot.p1;
      
      // _processTap is private, but engine.handleTap calls it
      engine.handleTap(1, 0);
      expect((engine.getSnapshot().p1.active[0] as IceCell).iceCount).toBe(1);
      expect(engine.getSnapshot().p1.active[0].clicked).toBe(false);
      
      // Clear input buffer between taps (InputBuffer uses performance.now() which is not faked by vitest)
      eng(engine).inputBuffer.clear();
      engine.handleTap(1, 0);
      expect(engine.getSnapshot().p1.active[0].clicked).toBe(true);
    });

    it("absorbs damage with a shield when tapping danger color", () => {
      engine.start();
      const snapshot = engine.getSnapshot();
      snapshot.p1.health = 3;
      snapshot.p1.shieldCount = 1;
      snapshot.p1.shield = true;
      snapshot.p1.active = [{ idx: 0, clicked: false, type: "purple" }];
      eng(engine).p1 = snapshot.p1;

      // Tapping the danger color should consume the shield instead of dealing damage
      engine.handleTap(1, 0);

      expect(engine.getSnapshot().p1.shield).toBe(false);
      expect(engine.getSnapshot().p1.shieldCount).toBe(0);
      expect(engine.getSnapshot().p1.health).toBe(3); // health unchanged
    });
  });

  describe("Powerups and Special States", () => {
    it("handles medpack powerup", () => {
      engine.start();
      const snapshot = engine.getSnapshot();
      snapshot.p1.health = 2;
      snapshot.p1.active = [{ idx: 0, clicked: false, type: "medpack" }];
      eng(engine).p1 = snapshot.p1;
      
      engine.handleTap(1, 0);
      expect(engine.getSnapshot().p1.health).toBe(3);
    });

    it("handles freeze powerup", () => {
      engine.start();
      const snapshot = engine.getSnapshot();
      snapshot.p1.active = [{ idx: 0, clicked: false, type: "freeze" }];
      eng(engine).p1 = snapshot.p1;
      
      const now = Date.now();
      engine.handleTap(1, 0);
      expect(engine.getSnapshot().p1.freezeEnd).toBeGreaterThan(now);
    });

    it("handles multiplier powerup", () => {
      engine.start();
      const snapshot = engine.getSnapshot();
      snapshot.p1.active = [{ idx: 0, clicked: false, type: "multiplier" }];
      eng(engine).p1 = snapshot.p1;
      
      const now = Date.now();
      engine.handleTap(1, 0);
      expect(engine.getSnapshot().p1.multiplierEnd).toBeGreaterThan(now);
    });

    it("handles streak toasts", () => {
      engine.start();
      const snapshot = engine.getSnapshot();
      snapshot.p1.streak = 4;
      snapshot.p1.active = [{ idx: 0, clicked: false, type: "white" }];
      eng(engine).p1 = snapshot.p1;
      
      engine.handleTap(1, 0);
      expect(events.some(e => e.type === "toast" && e.message?.includes("5 Streak"))).toBe(true);
    });

    it("handles rare mode transitions", () => {
      // Switch to evolve mode for rare colors
      engine = new GameEngine(makeConfig({ mode: "evolve" }));
      engine.subscribe(e => events.push(e));
      engine.start();
      
      // Force rare mode
      eng(engine).rareMode = { active: true, color: "gold", cssColor: "#ffd700", turnsLeft: 1 };
      
      // Advance timers to trigger processTick
      vi.advanceTimersByTime(2100); 
      
      expect(engine.getSnapshot().rareMode.active).toBe(false);
      expect(events.some(e => e.type === "toast" && e.message === "🟣 Back to Purple!")).toBe(true);
    });
  });

  describe("Bot and Assistance", () => {
    it("manages bot state in evolve mode", () => {
      engine = new GameEngine(makeConfig({ mode: "evolve" }));
      engine.start();
      
      const snapshot = engine.getSnapshot();
      snapshot.p1.active = [{ idx: 0, clicked: false, type: "white" }];
      eng(engine).p1 = snapshot.p1;

      engine.startBot();
      expect(engine.isBotActive()).toBe(true);
      
      // Advance for bot interval + reaction delay
      vi.advanceTimersByTime(1100);
      vi.advanceTimersByTime(500);

      expect(engine.getSnapshot().p1.active[0].clicked).toBe(true);

      engine.stopBot();
      expect(engine.isBotActive()).toBe(false);
    });

    it("allows forcing rare mode via dev tools", () => {
      engine.start();
      eng(engine).devForceRare({ color: 'gold', cssColor: '#ffd700' });
      expect(engine.getSnapshot().rareMode.active).toBe(true);

      eng(engine).devForceRare(null);
      expect(engine.getSnapshot().rareMode.active).toBe(false);
    });

    it("manages bot assist state", () => {
      expect(engine.getBotAssistActive()[1]).toBe(false);
      engine.setBotAssist(1, true);
      expect(engine.getBotAssistActive()[1]).toBe(true);
    });
  });
});
