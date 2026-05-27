import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDevToolsState } from "../hooks/useDevToolsState";

describe("useDevToolsState", () => {
  it("initializes with correct defaults", () => {
    const { result } = renderHook(() => useDevToolsState());
    expect(result.current.devMode).toBe(false);
    expect(result.current.godMode).toBe(false);
    expect(result.current.devFreezeTime).toBe(false);
    expect(result.current.devRotationSpeed).toBe(1);
    expect(result.current.devAutoPlay).toBe(false);
    expect(result.current.devHeatmap).toEqual({});
  });

  it("toggles devMode", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevMode(true); });
    expect(result.current.devMode).toBe(true);
    act(() => { result.current.setDevMode(false); });
    expect(result.current.devMode).toBe(false);
  });

  it("toggles godMode", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setGodMode(true); });
    expect(result.current.godMode).toBe(true);
  });

  it("toggles devFreezeTime", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevFreezeTime(true); });
    expect(result.current.devFreezeTime).toBe(true);
  });

  it("sets devRotationSpeed", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevRotationSpeed(2.5); });
    expect(result.current.devRotationSpeed).toBe(2.5);
  });

  it("toggles devAutoPlay", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevAutoPlay(true); });
    expect(result.current.devAutoPlay).toBe(true);
  });

  it("sets devHeatmap", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevHeatmap({ 0: 5, 1: 3 }); });
    expect(result.current.devHeatmap).toEqual({ 0: 5, 1: 3 });
  });

  it("does not expose enableDevMode (dead code removed)", () => {
    const { result } = renderHook(() => useDevToolsState());
    expect((result.current as Record<string, unknown>).enableDevMode).toBeUndefined();
  });
});
