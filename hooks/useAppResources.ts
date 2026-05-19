import { useState, useCallback, useEffect, useRef } from "react";
import { LS_KEYS, GAME } from "../config/difficulty";
import { loadShopData, saveShopData, type ShopData } from "../utils/shop-storage";

export interface EnergyData {
  count: number;
  lastRegen: number;
}

export function useAppResources() {
  const [playerName, setPlayerNameState] = useState(() => localStorage.getItem(LS_KEYS.PLAYER_NAME) || "");
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

  const [energyData, setEnergyData] = useState<EnergyData>(() => {
    try {
      const r = localStorage.getItem(LS_KEYS.ENERGY);
      if (r) return JSON.parse(r);
    } catch { /* ignore */ }
    return { count: GAME.MAX_ENERGY, lastRegen: Date.now() };
  });

  const [shopData, setShopDataState] = useState<ShopData>(() => loadShopData());

  const setPlayerName = useCallback((name: string) => {
    // Sanitize at write time — prevent XSS and excessive length
    const safe = name.replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 20) || 'Player';
    localStorage.setItem(LS_KEYS.PLAYER_NAME, safe);
    setPlayerNameState(safe);
  }, []);

  const saveShopDataState = useCallback((data: ShopData) => {
    saveShopData(data);
    setShopDataState(data);
  }, []);

  const getLifetimeDustSpent = useCallback(() => {
    try { return parseInt(localStorage.getItem("dtp-lifetime-dust") || "0"); } catch { return 0; }
  }, []);

  const addDust = useCallback((amount: number, source: string): number => {
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) return dustRef.current;
    const base = isNaN(dustRef.current) ? 0 : dustRef.current;
    const newDust = base + amount;
    setDust(newDust);
    dustRef.current = newDust;
    localStorage.setItem(LS_KEYS.DUST, newDust.toString());
    
    // Lazy sync to firebase if possible
    import('../services/firebase').then(fb => {
        fb.fbSyncDust(playerName, newDust).catch(() => {});
    }).catch(() => {});

    import("../services/gameanalytics").then(m => m.logResourceEvent("Source", "Dust", source, "earned", amount)).catch(() => {});
    return newDust;
  }, [playerName]);

  const spendDust = useCallback((amount: number) => {
    const raw = dustRef.current - amount;
    const newDust = isNaN(raw) || !isFinite(raw) ? 0 : Math.max(0, raw);
    const actualSpent = dustRef.current - newDust; // actual amount deducted (respects floor at 0)
    const spent = getLifetimeDustSpent() + actualSpent;
    try { localStorage.setItem("dtp-lifetime-dust", spent.toString()); } catch { /* ignore */ }
    setDust(newDust);
    dustRef.current = newDust;
    try { localStorage.setItem(LS_KEYS.DUST, newDust.toString()); } catch { /* ignore */ }
    import("../services/gameanalytics").then(m => m.logResourceEvent("Sink", "Dust", "Shop", "generic_spend", amount)).catch(() => {});
  }, [getLifetimeDustSpent]);

  // Natural Energy Regeneration
  useEffect(() => {
    const id = setInterval(() => {
      setEnergyData(prev => {
        if (prev.count >= GAME.MAX_ENERGY) return prev;
        const now = Date.now();
        const elapsed = now - prev.lastRegen;
        if (elapsed >= GAME.ENERGY_REGEN_MS) {
          const gained = Math.floor(elapsed / GAME.ENERGY_REGEN_MS);
          const newCount = Math.min(GAME.MAX_ENERGY, prev.count + gained);
          const newLastRegen = prev.lastRegen + gained * GAME.ENERGY_REGEN_MS;
          const next = { count: newCount, lastRegen: newLastRegen };
          localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  return {
    playerName, setPlayerName,
    dust, setDust, addDust, spendDust,
    energyData, setEnergyData,
    shopData, setShopData: saveShopDataState,
    getLifetimeDustSpent,
    dustRef
  };
}
