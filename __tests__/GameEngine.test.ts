import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameEngine } from "../engine/GameEngine";
import type { ActiveCell, GameConfig, GameEvent, Winner } from "../engine/types";

function makeConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    mode: "classic",
    numPlayers: 1,
    speedMult: 1,
    ...overrides,
  };
}

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

  it("damages the player when safe cells are missed", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    engine.start();

    vi.advanceTimersByTime(4_100);

    expect(engine.getSnapshot().p1.health).toBeLessThan(5);
    expect(events.some((event) => event.type === "damage")).toBe(true);
  });

  it("damages the player when a purple cell is tapped", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    engine.start();
    vi.advanceTimersByTime(2_100);

    const purpleCell = latestActive(engine).find((cell) => cell.type === "purple");
    expect(purpleCell).toBeDefined();

    const hpBefore = engine.getSnapshot().p1.health;
    engine.handleTap(1, purpleCell!.idx);

    expect(engine.getSnapshot().p1.health).toBeLessThan(hpBefore);
  });

  it("increases score when a safe cell is tapped", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    engine.start();
    vi.advanceTimersByTime(2_100);

    const safeCell = latestActive(engine).find((cell) => cell.type !== "purple");
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
    };

    const snapshot = engine.getSnapshot();
    snapshot.p1.active = [holdCell];
    snapshot.p1.cells = Array(25).fill("inactive");
    snapshot.p1.cells[0] = "hold";

    // Patch private state through the snapshot source object to keep the test scoped to engine behavior.
    (engine as unknown as { p1: typeof snapshot.p1 }).p1 = snapshot.p1;

    engine.handleHoldStart(1, 0);
    vi.advanceTimersByTime(750);
    engine.handleHoldEnd(1, 0);

    expect(engine.getSnapshot().p1.score).toBeGreaterThanOrEqual(2);
    expect(events.some((event) => event.type === "toast")).toBe(true);
  });

  it("emits gameOver on a lethal purple tap", () => {
    let winner: Winner | undefined;
    engine.start();

    const snapshot = engine.getSnapshot();
    snapshot.p1.health = 1;
    snapshot.p1.active = [{ idx: 0, type: "purple", clicked: false }];
    snapshot.p1.cells = Array(25).fill("inactive");
    snapshot.p1.cells[0] = "purple";
    (engine as unknown as { p1: typeof snapshot.p1 }).p1 = snapshot.p1;

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
});
