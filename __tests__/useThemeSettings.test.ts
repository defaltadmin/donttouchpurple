import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useThemeSettings } from "../hooks/useThemeSettings";
import type { ShopData } from "../utils/shop-storage";

const defaultShopData: ShopData = {
  equippedTheme: "default",
  equippedBackground: "default",
  unlockedThemes: [],
  unlockedBadges: [],
  unlockedSkins: [],
  unlockedBackgrounds: [],
  unlockedTrails: [],
  equippedBadge: "",
  equippedSkin: "",
  equippedTrail: "",
};

describe("useThemeSettings", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light-theme");
  });

  it("defaults to dark theme", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.theme).toBe("dark");
  });

  it("toggles to light theme and adds CSS class", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    act(() => { result.current.setTheme("light"); });
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("light-theme")).toBe(true);
  });

  it("removes light-theme class when switching back to dark", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    act(() => { result.current.setTheme("light"); });
    act(() => { result.current.setTheme("dark"); });
    expect(document.documentElement.classList.contains("light-theme")).toBe(false);
  });

  it("defaults colorblind mode to none", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.colorblindMode).toBe("none");
  });

  it("changes colorblind mode", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    act(() => { result.current.setColorblindMode("deuteranopia"); });
    expect(result.current.colorblindMode).toBe("deuteranopia");
  });

  it("toggles FPS overlay with F key", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.showFps).toBe(false);
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "f" })); });
    expect(result.current.showFps).toBe(true);
    expect(localStorage.getItem("showFps")).toBe("true");
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "f" })); });
    expect(result.current.showFps).toBe(false);
    expect(localStorage.getItem("showFps")).toBe("false");
  });

  it("reads showFps from localStorage", () => {
    localStorage.setItem("showFps", "true");
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.showFps).toBe(true);
  });

  it("defaults to settingsOpen false", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.settingsOpen).toBe(false);
    act(() => { result.current.setSettingsOpen(true); });
    expect(result.current.settingsOpen).toBe(true);
  });
});
