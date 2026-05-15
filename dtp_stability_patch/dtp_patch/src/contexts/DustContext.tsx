// contexts/DustContext.tsx
// Isolates dust/energy/shop economy state.
// Updates here never trigger game grid re-renders.
import React, { createContext, useContext, useState, useCallback } from "react";

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

const DEFAULT_ENERGY: EnergyData = { current: 100, max: 100, lastRefill: Date.now() };

export function DustProvider({
  children,
  initialDust,
  initialEnergy,
  initialShop,
  initialPlayerName,
}: {
  children: React.ReactNode;
  initialDust: number;
  initialEnergy: EnergyData;
  initialShop: ShopData;
  initialPlayerName: string;
}) {
  const [dust, setDust] = useState(initialDust);
  const [energyData, setEnergyData] = useState<EnergyData>(initialEnergy ?? DEFAULT_ENERGY);
  const [shopData, setShopData] = useState<ShopData>(initialShop ?? {});
  const [playerName, setPlayerName] = useState(initialPlayerName);

  const addDust = useCallback((amount: number, _source?: string): number => {
    let next = 0;
    setDust(prev => {
      next = prev + amount;
      return next;
    });
    return next;
  }, []);

  const spendDust = useCallback((amount: number): boolean => {
    let success = false;
    setDust(prev => {
      if (prev >= amount) { success = true; return prev - amount; }
      return prev;
    });
    return success;
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
