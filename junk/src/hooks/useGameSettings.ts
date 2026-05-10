import { useState, useCallback } from "react";
import { fbLogEvent } from "../services/firebase";
import {
  setAudioMuted,
  setAudioVolume,
  setHapticsEnabled,
  playVolumeChime,
} from "./useGameEngine";

export type ColorblindMode =
  | "none"
  | "deuteranopia"
  | "protanopia"
  | "tritanopia"
  | "monochrome";

export function useGameSettings() {
  const [muted, setMutedState] = useState(() => {
    try { return localStorage.getItem("dtp_muted") === "true"; } catch { return false; }
  });
  const [volume, setVolumeRaw] = useState(() => {
    try { return parseFloat(localStorage.getItem("dtp_volume") || "0.7"); } catch { return 0.7; }
  });
  const [haptics, setHapticsRaw] = useState(() => {
    try { return localStorage.getItem("dtp_haptics") !== "false"; } catch { return true; }
  });
  const [screenShake, setScreenShakeRaw] = useState(() => {
    try { return localStorage.getItem("dtp_screen_shake") !== "false"; } catch { return true; }
  });
  const [reducedMotion, setReducedMotionRaw] = useState(() => {
    try {
      const stored = localStorage.getItem("dtp_reduced_motion");
      if (stored !== null) return stored === "true";
      return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    } catch { return false; }
  });
  const [theme, setThemeRaw] = useState<"dark" | "light">("dark");
  const [colorblindMode, setColorblindMode] = useState<ColorblindMode>("none");
  const [isFS, setIsFS] = useState(false);

  const toggleMuted = useCallback((m: boolean) => {
    setMutedState(m);
    try { localStorage.setItem("dtp_muted", m.toString()); } catch {}
    setAudioMuted(m);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeRaw(v);
    try { localStorage.setItem("dtp_volume", v.toString()); } catch {}
    setAudioVolume(v);
    playVolumeChime();
  }, []);

  const setHaptics = useCallback((enabled: boolean) => {
    setHapticsRaw(enabled);
    try { localStorage.setItem("dtp_haptics", enabled.toString()); } catch {}
    setHapticsEnabled(enabled);
    fbLogEvent("setting_changed", { setting: "haptics", enabled });
  }, []);

  const setScreenShake = useCallback((v: boolean) => {
    setScreenShakeRaw(v);
    try { localStorage.setItem("dtp_screen_shake", v.toString()); } catch {}
    fbLogEvent("setting_changed", { setting: "screen_shake", enabled: v });
  }, []);

  const setReducedMotion = useCallback((v: boolean) => {
    setReducedMotionRaw(v);
    if (v) setScreenShake(false);
    try { localStorage.setItem("dtp_reduced_motion", v.toString()); } catch {}
    fbLogEvent("setting_changed", { setting: "reduced_motion", enabled: v });
  }, [setScreenShake]);

  const setTheme = useCallback((t: "dark" | "light") => {
    setThemeRaw(t);
    if (t === "light") document.documentElement.classList.add("light-theme");
    else document.documentElement.classList.remove("light-theme");
  }, []);

  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
        .then(() => setIsFS(true))
        .catch(() => setIsFS(f => !f));
    } else {
      document.exitFullscreen?.().then(() => setIsFS(false));
    }
  }, []);

  return {
    muted, toggleMuted,
    volume, setVolume,
    haptics, setHaptics,
    screenShake, setScreenShake,
    reducedMotion, setReducedMotion,
    theme, setTheme,
    colorblindMode, setColorblindMode,
    isFS, toggleFS,
  };
}
