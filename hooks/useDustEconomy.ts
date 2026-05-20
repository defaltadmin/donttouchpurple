import { useState, useCallback, useRef, useEffect } from "react";
import { LS_KEYS } from "../config/difficulty";
import { fbSyncDust } from "../services/firebase";
import { logResourceEvent } from "../services/gameanalytics";

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
  useEffect(() => { dustRef.current = dust; }, [dust]);

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
    const newDust = base + amount;
    setDust(newDust);
    dustRef.current = newDust;
    localStorage.setItem(LS_KEYS.DUST, newDust.toString());
    fbSyncDust(playerName, newDust).catch(() => {});
    logResourceEvent("Source", "Dust", source, "earned", amount);
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
    logResourceEvent("Sink", "Dust", "Shop", "generic_spend", amount);
  }, [getLifetimeDustSpent]);

  return { dust, dustRef, setDust, addDust, spendDust, persistDust, getLifetimeDustSpent, getBotAccuracy };
}
