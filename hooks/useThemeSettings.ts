import { useState, useEffect, useCallback } from "react";
import { settingsManager } from "../utils/settings";
import { SHOP_THEMES } from "../config/powerupWeights";
import type { ShopData } from "../utils/shop-storage";

export type ColorblindMode = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";

export function useThemeSettings(shopData: ShopData) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [colorblindMode, setColorblindMode] = useState<ColorblindMode>("none");
  const [isFS, setIsFS] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOffset, setShowOffset] = useState(() => settingsManager.get().offsetPointer ?? false);
  const [showFps, setShowFps] = useState(() => localStorage.getItem("showFps") === "true");
  const [fps, setFps] = useState(0);

  // Offset pointer persistence
  useEffect(() => { settingsManager.set({ offsetPointer: showOffset }); }, [showOffset]);

  // Theme class toggle + lazy CSS load
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
      import("../styles/light-theme.css");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme]);

  // Apply shop theme CSS variables
  useEffect(() => {
    const t = SHOP_THEMES.find(t => t.id === shopData.equippedTheme);
    if (!t || t.id === "default") {
      ["--theme-purple", "--theme-accent", "--theme-bg", "--theme-text", "--bg", "--purple", "--accent", "--text"]
        .forEach(p => document.documentElement.style.removeProperty(p));
      return;
    }
    document.documentElement.style.setProperty("--theme-purple", t.colors.purple);
    document.documentElement.style.setProperty("--theme-accent", t.colors.accent);
    document.documentElement.style.setProperty("--theme-bg", t.colors.bg);
    document.documentElement.style.setProperty("--theme-text", t.colors.text);
    document.documentElement.style.setProperty("--bg", t.colors.bg);
    document.documentElement.style.setProperty("--purple", t.colors.purple);
    document.documentElement.style.setProperty("--accent", t.colors.accent);
    document.documentElement.style.setProperty("--text", t.colors.text);
  }, [shopData.equippedTheme]);

  // FPS Monitor
  useEffect(() => {
    if (!showFps) return;
    let frameId = 0;
    let frameCount = 0;
    let lastTime = performance.now();
    const loop = () => {
      const now = performance.now();
      const delta = now - lastTime;
      if (delta >= 500) {
        setFps(Math.round(1000 / (delta / (frameCount || 1))));
        lastTime = now;
        frameCount = 0;
      }
      frameCount++;
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [showFps]);

  // F key → toggle FPS overlay
  useEffect(() => {
    const handleFpsKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "f" || e.key === "F") {
        setShowFps(prev => {
          const next = !prev;
          localStorage.setItem("showFps", String(next));
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleFpsKey);
    return () => window.removeEventListener("keydown", handleFpsKey);
  }, []);

  // Fullscreen toggle
  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFS(true)).catch(() => setIsFS(f => !f));
    } else {
      document.exitFullscreen?.().then(() => setIsFS(false));
    }
  }, []);

  const equippedTheme = SHOP_THEMES.find(t => t.id === shopData.equippedTheme) || SHOP_THEMES[0];

  return {
    theme, setTheme,
    colorblindMode, setColorblindMode,
    isFS, toggleFS,
    settingsOpen, setSettingsOpen,
    showOffset, setShowOffset,
    showFps, setShowFps, fps,
    equippedTheme,
  };
}
