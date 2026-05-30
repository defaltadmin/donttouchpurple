import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React from "react";
import { StartScreen } from "../components/Screens/StartScreen";
import type { StartScreenProps } from "../components/Screens/StartScreen";

vi.mock("../hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    lang: "en",
    setLang: vi.fn(),
    dir: "ltr",
    supportedLangs: ["en", "ar"],
  }),
}));

vi.mock("../components/UI/Icon", () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

vi.mock("../components/Layout/ParticleLayer", () => ({
  ParticleLayer: ({ count }: { count: number }) => <div data-testid="particle-layer" data-count={count} />,
}));

Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
});

const defaultProps: StartScreenProps = {
  gameMode: "classic",
  setGameMode: vi.fn(),
  numPlayers: 1,
  setNumPlayers: vi.fn(),
  inputMode: "touch",
  setInputMode: vi.fn(),
  practiceMode: false,
  setPracticeMode: vi.fn(),
  energyCount: 5,
  energyLastRegen: Date.now(),
  dust: 100,
  devMode: false,
  playerName: "TestPlayer",
  isFeatureUnlocked: () => true,
  onPlay: vi.fn(),
  onHowTo: vi.fn(),
  onLeaderboard: vi.fn(),
  onShop: vi.fn(),
  onKeybind: vi.fn(),
  onRefillEnergy: vi.fn(),
  onSwitchPlayer: vi.fn(),
  onOpenRewardsHub: vi.fn(),
  dustWidget: <div data-testid="dust-widget" />,
  energyBar: <div data-testid="energy-bar" />,
};

function renderStart(overrides: Partial<StartScreenProps> = {}) {
  return render(<StartScreen {...defaultProps} {...overrides} />);
}

describe("StartScreen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders menu-card", () => {
    const { container } = renderStart();
    expect(container.querySelector("[data-testid='menu-card']")).toBeTruthy();
  });

  it("renders h1 menu-title", () => {
    const { container } = renderStart();
    const h1 = container.querySelector(".menu-title");
    expect(h1).toBeTruthy();
    expect(h1!.textContent).toBe("Don't Touch Purple");
  });

  it("renders subtitle", () => {
    const { container } = renderStart();
    expect(container.querySelector(".menu-sub")!.textContent).toBe("Tap fast. Survive longer.");
  });

  it("renders play button", () => {
    const { container } = renderStart();
    expect(container.querySelector(".btn-play")).toBeTruthy();
  });

  it("calls onPlay on play button click", () => {
    const onPlay = vi.fn();
    const { container } = renderStart({ onPlay });
    fireEvent.click(container.querySelector(".btn-play")!);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("renders game mode pills", () => {
    const { container } = renderStart();
    const pills = container.querySelectorAll(".pill-opt");
    const labels = Array.from(pills).map(p => p.textContent);
    expect(labels).toContain("menu.classic");
    expect(labels).toContain("menu.evolve");
  });

  it("calls setGameMode on pill click", () => {
    const setGameMode = vi.fn();
    const { container } = renderStart({ setGameMode });
    const pills = container.querySelectorAll(".pill-opt");
    const evolveBtn = Array.from(pills).find(p => p.textContent === "menu.evolve")!;
    fireEvent.click(evolveBtn);
    expect(setGameMode).toHaveBeenCalledWith("evolve");
  });

  it("renders input mode pills", () => {
    const { container } = renderStart();
    const pills = container.querySelectorAll(".pill-opt");
    const labels = Array.from(pills).map(p => p.textContent);
    expect(labels).toContain("menu.touch");
    expect(labels).toContain("menu.keys");
  });

  it("calls setInputMode on pill click", () => {
    const setInputMode = vi.fn();
    const { container } = renderStart({ setInputMode });
    const pills = container.querySelectorAll(".pill-opt");
    const keysBtn = Array.from(pills).find(p => p.textContent === "menu.keys")!;
    fireEvent.click(keysBtn);
    expect(setInputMode).toHaveBeenCalledWith("keyboard");
  });

  it("renders player name in pill", () => {
    const { container } = renderStart();
    const name = container.querySelector(".player-pill-name");
    expect(name!.textContent).toContain("TestPlayer");
  });

  it("renders energy bar", () => {
    const { container } = renderStart();
    expect(container.querySelector("[data-testid='energy-bar']")).toBeTruthy();
  });

  it("has glow div inside menu card", () => {
    const { container } = renderStart();
    const card = container.querySelector("[data-testid='menu-card']")!;
    expect(card.querySelector(".menu-card-glow")).toBeTruthy();
  });

  it("shows no-energy block when energy is 0", () => {
    const { container } = renderStart({ energyCount: 0 });
    expect(container.querySelector(".no-energy-block")).toBeTruthy();
    expect(container.querySelector(".btn-play")).toBeNull();
  });

  it("shows play button when energy > 0", () => {
    const { container } = renderStart({ energyCount: 3 });
    expect(container.querySelector(".btn-play")).toBeTruthy();
    expect(container.querySelector(".no-energy-block")).toBeNull();
  });

  it("renders particle layer when no background", () => {
    const { container } = renderStart({ hasBackground: false });
    expect(container.querySelector("[data-testid='particle-layer']")).toBeTruthy();
  });

  it("hides particle layer when has background", () => {
    const { container } = renderStart({ hasBackground: true });
    expect(container.querySelector("[data-testid='particle-layer']")).toBeNull();
  });

  it("calls onSwitchPlayer on player pill click", () => {
    const onSwitchPlayer = vi.fn();
    const { container } = renderStart({ onSwitchPlayer });
    fireEvent.click(container.querySelector(".player-pill")!);
    expect(onSwitchPlayer).toHaveBeenCalledTimes(1);
  });

  it("renders opt-grid with 4 sections", () => {
    const { container } = renderStart();
    const sections = container.querySelectorAll(".opt-section");
    expect(sections.length).toBe(4);
  });
});
