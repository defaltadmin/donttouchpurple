import { useState, useEffect, useRef } from "react";
import type { Locale } from "../utils/i18n";

export function useEngineEvents(initialLocale: Locale) {
  // ── Combo ────────────────────────────────────────────────
  const [combo, setCombo] = useState({ count: 0, multiplier: 1 });
  const resetCombo = () => setCombo({ count: 0, multiplier: 1 });

  useEffect(() => {
    const handler = (e: Event) => setCombo((e as CustomEvent).detail);
    window.addEventListener('dtp:combo', handler);
    return () => window.removeEventListener('dtp:combo', handler);
  }, []);

  // ── Boss UI ──────────────────────────────────────────────
  const [bossUi, setBossUi] = useState<{
    active: boolean; shieldHits: number; maxShield: number; phase: number;
  }>({ active: false, shieldHits: 0, maxShield: 5, phase: 1 });

  const [comboPop, setComboPop] = useState(false);

  useEffect(() => {
    const onBossUpdate   = (e: Event) => setBossUi((e as CustomEvent).detail);
    const onBossActivate = (e: Event) => setBossUi((e as CustomEvent).detail);
    const onBossBreak    = () => setComboPop(true);
    const onComboKill    = () => { setComboPop(true); setTimeout(() => setComboPop(false), 1500); };
    const onBossComplete = () => setBossUi({ active: false, shieldHits: 0, maxShield: 5, phase: 1 });

    window.addEventListener('dtp:boss:update',        onBossUpdate);
    window.addEventListener('dtp:boss:activate',      onBossActivate);
    window.addEventListener('dtp:boss:shield-break',  onBossBreak);
    window.addEventListener('dtp:combo:kill',         onComboKill);
    window.addEventListener('dtp:boss:complete',      onBossComplete);
    return () => {
      window.removeEventListener('dtp:boss:update',       onBossUpdate);
      window.removeEventListener('dtp:boss:activate',     onBossActivate);
      window.removeEventListener('dtp:boss:shield-break', onBossBreak);
      window.removeEventListener('dtp:combo:kill',        onComboKill);
      window.removeEventListener('dtp:boss:complete',     onBossComplete);
    };
  }, []);

  // ── Locale ───────────────────────────────────────────────
  const [currentLocale, setCurrentLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    const handler = (e: Event) => setCurrentLocale((e as CustomEvent<Locale>).detail);
    window.addEventListener('dtp:locale-change', handler);
    return () => window.removeEventListener('dtp:locale-change', handler);
  }, []);

  // ── Daily complete badge ─────────────────────────────────
  const [dailyComplete, setDailyComplete] = useState(false);

  useEffect(() => {
    const checkDaily = () => {
      const saved = localStorage.getItem('dtp:daily');
      if (!saved) return;
      try {
        const { seed, completed } = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];
        const expected = btoa(today + '-donttouchpurple-daily').slice(0, 12);
        setDailyComplete(seed === expected && completed);
      } catch { setDailyComplete(false); }
    };
    checkDaily();
    const onDaily = () => setDailyComplete(true);
    window.addEventListener('dtp:daily-complete', onDaily);
    return () => window.removeEventListener('dtp:daily-complete', onDaily);
  }, []);

  // ── Achievement queue ────────────────────────────────────
  const [achievementQueue, setAchievementQueue] = useState<any[]>([]);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const processQueue = () => {
      const raw = localStorage.getItem('dtp:achievement-toasts');
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (queue.length > 0) {
        setAchievementQueue(prev => [...prev, queue[0]]);
        localStorage.setItem('dtp:achievement-toasts', JSON.stringify(queue.slice(1)));
        toastTimerRef.current = setTimeout(processQueue, 3500);
      }
    };
    processQueue();
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, []);

  // ── Gamepad ──────────────────────────────────────────────
  const [gamepadActive, setGamepadActive] = useState(false);

  useEffect(() => {
    // Dynamic import to avoid circular dep with gamepadManager
    import("../utils/gamepad").then(({ gamepadManager }) => {
      const unsub = gamepadManager.on((_btn: string, state: string) => {
        if (state === 'press') setGamepadActive(true);
      });
      if (gamepadManager.connected) setGamepadActive(true);
      return unsub;
    });
  }, []);

  // ── Service Worker update toast ──────────────────────────
  // Returned as a callback so App can wire it to toast$
  const swUpdateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              swUpdateRef.current?.();
            }
          });
        }
      });
    });
  }, []);

  return {
    combo, resetCombo,
    bossUi,
    comboPop,
    currentLocale,
    dailyComplete,
    achievementQueue,
    gamepadActive,
    swUpdateRef,
  };
}
