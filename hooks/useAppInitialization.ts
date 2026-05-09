import { useEffect, useState, useMemo } from "react";
import { i18n } from "../utils/i18n";
import { webVitalsMonitor } from "../utils/web-vitals";
import { initGA } from "../services/gameanalytics";
import { configManager } from "../utils/game-config";
import { logger } from "../utils/logger";
import * as Sentry from "@sentry/react";

export function useAppInitialization(state: { 
  screen: string, 
  gameMode: string, 
  inputMode: string, 
  numPlayers: number,
  practiceMode: boolean,
  colorblindMode: string,
  reducedMotion: boolean
}) {
  const [uiReady, setUiReady] = useState(false);

  useEffect(() => {
    i18n.init().then(() => setUiReady(true));
    webVitalsMonitor.startMonitoring();
    configManager.load();
    initGA(typeof (window as any).__APP_VERSION__ !== "undefined" ? (window as any).__APP_VERSION__ : "5.9.0");
  }, []);

  const abTestVariant = useMemo(() => {
    const saved = localStorage.getItem('dtp_ab_variant');
    if (saved) return saved;
    const variant = Math.random() > 0.5 ? 'A' : 'B';
    localStorage.setItem('dtp_ab_variant', variant);
    return variant;
  }, []);

  useEffect(() => {
    try {
      Sentry.setTags({
        screen: state.screen,
        gameMode: state.gameMode,
        inputMode: state.inputMode,
        numPlayers: String(state.numPlayers),
        practiceMode: String(state.practiceMode),
        colorblindMode: state.colorblindMode,
        reducedMotion: String(state.reducedMotion),
      });
    } catch {}
  }, [state]);

  // Reduced Motion CSS Vars
  useEffect(() => {
    const handleMotionPref = (e: MediaQueryListEvent) => {
      document.documentElement.style.setProperty('--motion-scale', e.matches ? '0' : '1');
      document.documentElement.style.setProperty('--particles-enabled', e.matches ? '0' : '1');
    };
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.documentElement.style.setProperty('--motion-scale', prefersReduced.matches ? '0' : '1');
    document.documentElement.style.setProperty('--particles-enabled', prefersReduced.matches ? '0' : '1');
    prefersReduced.addEventListener('change', handleMotionPref);
    return () => prefersReduced.removeEventListener('change', handleMotionPref);
  }, []);

  return { uiReady, abTestVariant };
}
