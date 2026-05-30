// contexts/DustContext.tsx
// Isolates dust/energy/shop economy state.
// Updates here never trigger game grid re-renders.
import React, { createContext, useState, useCallback, useRef } from "react";
import { LS_KEYS, GAME } from "../config/difficulty";

interface EnergyData { current: number; max: number; lastRefill: number; }
interface ShopData { [key: string]: unknown; }

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
  const initialDust = loadInitialDust();
  const [dust, setDust] = useState(initialDust);
  const [energyData, setEnergyData] = useState<EnergyData>(loadInitialEnergy);
  const [shopData, setShopData] = useState<ShopData>(loadInitialShop);
  const [playerName, setPlayerName] = useState(loadInitialPlayerName);

  const dustRef = useRef(initialDust);

  const addDust = useCallback((amount: number, _source?: string): number => {
    setDust(prev => { dustRef.current = prev + amount; return dustRef.current; });
    return dustRef.current;
  }, []);

  const spendDust = useCallback((amount: number): boolean => {
    if (dustRef.current < amount) return false;
    setDust(prev => {
      if (prev < amount) return prev; // guard inside callback for batched updates
      dustRef.current = prev - amount;
      return dustRef.current;
    });
    return true;
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

