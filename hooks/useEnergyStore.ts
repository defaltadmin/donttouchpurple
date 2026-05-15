import { useState, useEffect, useRef, useCallback } from "react";
import { GAME, LS_KEYS } from "../config/difficulty";

interface EnergyData {
  count: number;
  lastRegen: number;
}

export function useEnergyStore() {
  const [energyData, setEnergyData] = useState<EnergyData>(() => {
    try {
      const stored = localStorage.getItem(LS_KEYS.ENERGY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { count: GAME.MAX_ENERGY, lastRegen: Date.now() };
  });

  const energyDataRef = useRef(energyData);
  useEffect(() => { energyDataRef.current = energyData; }, [energyData]);

  const getEnergyCount = useCallback(() => energyDataRef.current.count, []);
  const getEnergyLastRegen = useCallback(() => energyDataRef.current.lastRegen, []);

  useEffect(() => {
    const id = setInterval(() => {
      const ed = energyDataRef.current;
      if (ed.count >= GAME.MAX_ENERGY) return;

      const now = Date.now();
      const elapsed = now - ed.lastRegen;
      if (elapsed >= GAME.ENERGY_REGEN_MS) {
        const gained = Math.floor(elapsed / GAME.ENERGY_REGEN_MS);
        const newCount = Math.min(GAME.MAX_ENERGY, ed.count + gained);
        const newLastRegen = ed.lastRegen + gained * GAME.ENERGY_REGEN_MS;
        const newEd = { count: newCount, lastRegen: newLastRegen };
        setEnergyData(newEd);
        localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
      }
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const spendEnergy = useCallback(() => {
    if (energyData.count <= 0) return false;
    setEnergyData(prev => {
      const newEd = { ...prev, count: prev.count - 1 };
      localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
      return newEd;
    });
    return true;
  }, []);

  const refillEnergy = useCallback((amount: number, _cost: number) => {
    setEnergyData(prev => {
      const newCount = Math.min(GAME.MAX_ENERGY, prev.count + amount);
      const newEd = { count: newCount, lastRegen: Date.now() };
      localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
      return newEd;
    });
  }, []);

  return {
    energyData,
    getEnergyCount,
    getEnergyLastRegen,
    spendEnergy,
    refillEnergy,
  };
}