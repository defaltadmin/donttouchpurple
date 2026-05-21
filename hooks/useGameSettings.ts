import { useState, useCallback, useEffect } from "react";
import { setAudioMuted, setAudioVolume, setHapticsEnabled, playVolumeChime } from "./useGameEngine";
import { fbLogEvent } from "../services/firebase";

export function useGameSettings() {
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem("dtp_muted") === "true"; } catch { return false; }
  });
  const [volume, setVolumeState] = useState(() => {
    try { return parseFloat(localStorage.getItem("dtp_volume") || "0.7"); } catch { return 0.7; }
  });
  const [haptics, setHapticsState] = useState(() => {
    try { return localStorage.getItem("dtp_haptics") !== "false"; } catch { return true; }
  });

  // Sync persisted haptics setting to audio + engine on mount
  useEffect(() => {
    setHapticsEnabled(haptics);
    setAudioMuted(muted);
    setAudioVolume(volume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [screenShake, setScreenShake] = useState(() => {
    try { return localStorage.getItem("dtp_screen_shake") !== "false"; } catch { return true; }
  });
  const [reducedMotion, setReducedMotionState] = useState(() => {
    try {
      const stored = localStorage.getItem("dtp_reduced_motion");
      if (stored !== null) return stored === "true";
      return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    } catch { return false; }
  });

  const setScreenShakePersisted = useCallback((v: boolean) => {
    setScreenShake(v);
    try { localStorage.setItem("dtp_screen_shake", v.toString()); } catch {}
    fbLogEvent("setting_changed", { setting: "screen_shake", enabled: v });
  }, []);

  const setReducedMotion = useCallback((v: boolean) => {
    setReducedMotionState(v);
    if (v) setScreenShakePersisted(false);
    try { localStorage.setItem("dtp_reduced_motion", v.toString()); } catch {}
    fbLogEvent("setting_changed", { setting: "reduced_motion", enabled: v });
  }, [setScreenShakePersisted]);

  const backgroundFPS = reducedMotion ? 30 : 60;

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    try { localStorage.setItem("dtp_volume", v.toString()); } catch {}
    setAudioVolume(v);
    playVolumeChime();
  }, []);

  const toggleMuted = useCallback((m: boolean) => {
    setMuted(m);
    try { localStorage.setItem("dtp_muted", m.toString()); } catch {}
    setAudioMuted(m);
  }, []);

  const setHaptics = useCallback((enabled: boolean) => {
    setHapticsState(enabled);
    try { localStorage.setItem("dtp_haptics", enabled.toString()); } catch {}
    setHapticsEnabled(enabled);
    fbLogEvent("setting_changed", { setting: "haptics", enabled });
  }, []);

  return {
    muted, toggleMuted,
    volume, setVolume,
    haptics, setHaptics,
    screenShake, setScreenShakePersisted,
    reducedMotion, setReducedMotion,
    backgroundFPS,
  };
}
