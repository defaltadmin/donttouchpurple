import { useState, useCallback, useRef, useEffect } from "react";
import { LS_KEYS } from "../config/difficulty";
import { fbSyncDust } from "../services/firebase";

// Lazy import to avoid pulling gameanalytics (~91KB) into initial bundle
type LogResourceFn = (flowType: "Source" | "Sink", resourceType: string, itemType: string, itemId: string, amount: number) => void;
let _logResourceEvent: LogResourceFn | null = null;
import("../services/gameanalytics").then(m => { _logResourceEvent = m.logResourceEvent; }).catch(() => {});

export function useDustEconomy(playerName: string) {
  const [dust, setDust] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.DUST);
      const parsed = parseInt(raw ?? "0", 10);
      if (isNaN(parsed) || !isFinite(parsed) || parsed < 0 || parsed > 9_999_999) {
        localStorage.setItem(LS_KEYS.DUST, "0");
        return 0;
      }
      return parsed;
    } catch { return 0; }
  });

  const dustRef = useRef(dust);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { dustRef.current = dust; }, [dust]);
  useEffect(() => () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); }, []);

  const persistDust = useCallback((d: number) => {
    try { localStorage.setItem(LS_KEYS.DUST, d.toString()); } catch {}
  }, []);

  const getLifetimeDustSpent = useCallback(() => {
    try { return parseInt(localStorage.getItem("dtp-lifetime-dust") || "0"); } catch { return 0; }
  }, []);

  const getBotAccuracy = useCallback(() => {
    const spent = getLifetimeDustSpent();
    if (spent >= 2000) return 0.95;
    if (spent >= 500) return 0.90;
    return 0.85;
  }, [getLifetimeDustSpent]);

  const addDust = useCallback((amount: number, source: string): number => {
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) return dustRef.current;
    const base = isNaN(dustRef.current) ? 0 : dustRef.current;
    const newDust = Math.min(9_999_999, base + amount);
    setDust(newDust);
    dustRef.current = newDust;
    try { localStorage.setItem(LS_KEYS.DUST, newDust.toString()); } catch {}
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => fbSyncDust(playerName, newDust).catch(() => {}), 5000);
    _logResourceEvent?.("Source", "Dust", source, "earned", amount);
    return newDust;
  }, [playerName]);

  const spendDust = useCallback((amount: number) => {
    if (amount === 0) return;
    const raw = dustRef.current - amount;
    const newDust = isNaN(raw) || !isFinite(raw) ? 0 : Math.max(0, raw);
    const actualDeducted = dustRef.current - newDust;
    const spent = getLifetimeDustSpent() + Math.max(0, actualDeducted);
    try { localStorage.setItem("dtp-lifetime-dust", spent.toString()); } catch {}
    setDust(newDust);
    dustRef.current = newDust;
    try { localStorage.setItem(LS_KEYS.DUST, newDust.toString()); } catch {}
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => fbSyncDust(playerName, newDust).catch(() => {}), 5000);
    _logResourceEvent?.("Sink", "Dust", "Shop", "generic_spend", amount);
  }, [getLifetimeDustSpent, playerName]);

  return { dust, dustRef, setDust, addDust, spendDust, persistDust, getLifetimeDustSpent, getBotAccuracy };
}
