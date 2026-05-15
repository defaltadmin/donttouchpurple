import { useState, useCallback, useEffect, useRef } from "react";
import { LS_KEYS, GAME } from "../config/difficulty";
import { logResourceEvent } from "../services/gameanalytics";

export type ShopData = {
  unlockedThemes: string[]; equippedTheme: string;
  unlockedBadges: string[]; equippedBadge: string;
  unlockedSkins:  string[]; equippedSkin:  string;
  unlockedBackgrounds: string[]; equippedBackground: string;
};

export interface EnergyData {
  count: number;
  lastRegen: number;
}

function loadShopData(): ShopData {
  try {
    const r = localStorage.getItem(LS_KEYS.SHOP);
    if (r) {
      const data = JSON.parse(r);
      return {
        unlockedThemes: data.unlockedThemes || data.ownedThemes || ["default"],
        equippedTheme:  data.equippedTheme || "default",
        unlockedBadges: data.unlockedBadges || data.ownedBadges || [],
        equippedBadge:  data.equippedBadge || "",
        unlockedSkins:  data.unlockedSkins || data.ownedSkins || ["default"],
        equippedSkin:   data.equippedSkin || "default",
        unlockedBackgrounds: data.unlockedBackgrounds || ["default"],
        equippedBackground: data.equippedBackground || "default"
      };
    }
  } catch (_) {}
  return { unlockedThemes: ["default"], equippedTheme: "default", unlockedBadges: [], equippedBadge: "", unlockedSkins: ["default"], equippedSkin: "default", unlockedBackgrounds: ["default"], equippedBackground: "default" };
}

function saveShopData(d: ShopData) {
  try { localStorage.setItem(LS_KEYS.SHOP, JSON.stringify(d)); } catch (_) {}
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
    } catch (_) { return 0; }
  });
  const dustRef = useRef(dust);
  useEffect(() => { dustRef.current = dust; }, [dust]);

  const [energyData, setEnergyData] = useState<EnergyData>(() => {
    try {
      const r = localStorage.getItem(LS_KEYS.ENERGY);
      if (r) return JSON.parse(r);
    } catch (_) {}
    return { count: GAME.MAX_ENERGY, lastRegen: Date.now() };
  });

  const [shopData, setShopDataState] = useState<ShopData>(() => loadShopData());

  const setPlayerName = useCallback((name: string) => {
    localStorage.setItem(LS_KEYS.PLAYER_NAME, name);
    setPlayerNameState(name);
  }, []);

  const saveShopDataState = useCallback((data: ShopData) => {
    saveShopData(data);
    setShopDataState(data);
  }, []);

  const getLifetimeDustSpent = useCallback(() => {
    try { return parseInt(localStorage.getItem("dtp-lifetime-dust") || "0"); } catch (_) { return 0; }
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

    logResourceEvent("Source", "Dust", source, "earned", amount);
    return newDust;
  }, [playerName]);

  const spendDust = useCallback((amount: number) => {
    if (amount === 0) return;
    const raw = dustRef.current - amount;
    const newDust = isNaN(raw) || !isFinite(raw) ? 0 : Math.max(0, raw);
    const spent = getLifetimeDustSpent() + amount;
    try { localStorage.setItem("dtp-lifetime-dust", spent.toString()); } catch (_) {}
    setDust(newDust);
    dustRef.current = newDust;
    try { localStorage.setItem(LS_KEYS.DUST, newDust.toString()); } catch (_) {}
    logResourceEvent("Sink", "Dust", "Shop", "generic_spend", amount);
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
