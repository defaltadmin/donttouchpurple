// contexts/DustContext.tsx
// Isolates dust/energy/shop economy state.
// Updates here never trigger game grid re-renders.
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { LS_KEYS, GAME } from "../config/difficulty";

export interface EnergyData { current: number; max: number; lastRefill: number; }
export interface ShopData { [key: string]: unknown; }

interface DustContextValue {
  dust: number;
  setDust: (v: number | ((prev: number) => number)) => void;
  addDust: (amount: number, source?: string) => number;
  spendDust: (amount: number) => boolean;
  energyData: EnergyData;
  setEnergyData: (v: EnergyData | ((prev: EnergyData) => EnergyData)) => void;
  shopData: ShopData;
  setShopData: (v: ShopData | ((prev: ShopData) => ShopData)) => void;
  playerName: string;
  setPlayerName: (v: string) => void;
}

const DustContext = createContext<DustContextValue | null>(null);

function loadInitialDust(): number {
  try {
    const raw = localStorage.getItem(LS_KEYS.DUST);
    const parsed = parseInt(raw ?? "0", 10);
    if (isNaN(parsed) || !isFinite(parsed) || parsed < 0 || parsed > 9_999_999) {
      localStorage.setItem(LS_KEYS.DUST, "0");
      return 0;
    }
    return parsed;
  } catch { return 0; }
}

function loadInitialEnergy(): EnergyData {
  try {
    const r = localStorage.getItem(LS_KEYS.ENERGY);
    if (r) { const d = JSON.parse(r); return { current: d.current ?? d.count ?? GAME.MAX_ENERGY, max: GAME.MAX_ENERGY, lastRefill: d.lastRefill ?? Date.now() }; }
  } catch {}
  return { current: GAME.MAX_ENERGY, max: GAME.MAX_ENERGY, lastRefill: Date.now() };
}

function loadInitialShop(): ShopData {
  try {
    const r = localStorage.getItem(LS_KEYS.SHOP);
    if (r) return JSON.parse(r);
  } catch {}
  return {};
}

function loadInitialPlayerName(): string {
  try { return localStorage.getItem(LS_KEYS.PLAYER_NAME) || ""; } catch { return ""; }
}

export function DustProvider({ children }: { children: React.ReactNode }) {
  const [dust, setDust] = useState(loadInitialDust);
  const [energyData, setEnergyData] = useState<EnergyData>(loadInitialEnergy);
  const [shopData, setShopData] = useState<ShopData>(loadInitialShop);
  const [playerName, setPlayerName] = useState(loadInitialPlayerName);

  const dustRef = useRef(loadInitialDust());

  const addDust = useCallback((amount: number, _source?: string): number => {
    let next = 0;
    setDust(prev => { next = prev + amount; return next; });
    dustRef.current = next || dustRef.current + amount;
    return dustRef.current;
  }, []);

  const spendDust = useCallback((amount: number): boolean => {
    let success = false;
    setDust(prev => {
      if (prev >= amount) { success = true; dustRef.current = prev - amount; return dustRef.current; }
      return prev;
    });
    return success || dustRef.current >= amount; // fallback for synchronous read
  }, []);

  return (
    <DustContext.Provider value={{
      dust, setDust, addDust, spendDust,
      energyData, setEnergyData,
      shopData, setShopData,
      playerName, setPlayerName,
    }}>
      {children}
    </DustContext.Provider>
  );
}

export function useDustContext(): DustContextValue {
  const ctx = useContext(DustContext);
  if (!ctx) throw new Error("useDustContext must be used within DustProvider");
  return ctx;
}
