import { useState, useRef, useCallback, useEffect } from "react";
import { LS_KEYS, GAME } from "../config/difficulty";
import { logResourceEvent } from "../services/gameanalytics";
import { fbLogEvent } from "../services/firebase";
import { logger } from "../utils/logger";

let _firebase: typeof import('../services/firebase') | null = null;
async function getFirebase() {
  if (!_firebase) _firebase = await import('../services/firebase');
  return _firebase;
}

export function useGameProgress(playerName: string) {
  // ── Scores ──────────────────────────────────────────────
  const [gamesPlayed, setGamesPlayed] = useState(() =>
    parseInt(localStorage.getItem('dtp-games-played') || '0', 10)
  );
  const [best1, setBest1] = useState(() =>
    parseInt(localStorage.getItem(LS_KEYS.BEST_CLASSIC) || "0")
  );
  const [best2, setBest2] = useState(() =>
    parseInt(localStorage.getItem(LS_KEYS.BEST_EVOLVE) || "0")
  );
  const [wins, setWins] = useState(() =>
    parseInt(localStorage.getItem('dtp:wins') || '0', 10)
  );
  const [deaths, setDeaths] = useState(() =>
    parseInt(localStorage.getItem('dtp:deaths') || '0', 10)
  );

  // ── Dust ────────────────────────────────────────────────
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

  const getLifetimeDustSpent = useCallback(() => {
    try { return parseInt(localStorage.getItem("dtp-lifetime-dust") || "0"); } catch { return 0; }
  }, []);

  const getBotAccuracy = useCallback(() => {
    const spent = getLifetimeDustSpent();
    if (spent >= 2000) return 0.95;
    if (spent >= 500)  return 0.90;
    return 0.85;
  }, [getLifetimeDustSpent]);

  const addDust = useCallback((amount: number, source: string): number => {
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) return dustRef.current;
    const base = isNaN(dustRef.current) ? 0 : dustRef.current;
    const newDust = base + amount;
    setDust(newDust);
    dustRef.current = newDust;
    localStorage.setItem(LS_KEYS.DUST, newDust.toString());
    getFirebase()
      .then(fb => fb.fbSyncDust(playerName, newDust).catch(() => {}))
      .catch(e => logger.warn('Firebase operation failed', e));
    logResourceEvent("Source", "Dust", source, "earned", amount);
    return newDust;
  }, [playerName]);

  const spendDust = useCallback((amount: number) => {
    if (amount === 0) return;
    const raw = dustRef.current - amount;
    const newDust = isNaN(raw) || !isFinite(raw) ? 0 : Math.max(0, raw);
    const spent = getLifetimeDustSpent() + amount;
    try { localStorage.setItem("dtp-lifetime-dust", spent.toString()); } catch {}
    setDust(newDust);
    dustRef.current = newDust;
    try { localStorage.setItem(LS_KEYS.DUST, newDust.toString()); } catch {}
    logResourceEvent("Sink", "Dust", "Shop", "generic_spend", amount);
  }, [getLifetimeDustSpent]);

  const persistDust = useCallback((d: number) => {
    try { localStorage.setItem(LS_KEYS.DUST, d.toString()); } catch {}
  }, []);

  // ── Energy ──────────────────────────────────────────────
  const [energyData, setEnergyData] = useState(() => {
    try {
      const r = localStorage.getItem(LS_KEYS.ENERGY);
      if (r) return JSON.parse(r);
    } catch {}
    return { count: GAME.MAX_ENERGY, lastRegen: Date.now() };
  });
  const energyDataRef = useRef(energyData);
  useEffect(() => { energyDataRef.current = energyData; }, [energyData]);

  // Natural regen interval
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

  // ── Best score updaters ──────────────────────────────────
  const updateBest = useCallback((mode: "classic" | "evolve", score: number) => {
    if (mode === "classic") {
      setBest1(b => {
        const nb = Math.max(b, score);
        localStorage.setItem(LS_KEYS.BEST_CLASSIC, nb.toString());
        return nb;
      });
    } else {
      setBest2(b => {
        const nb = Math.max(b, score);
        localStorage.setItem(LS_KEYS.BEST_EVOLVE, nb.toString());
        return nb;
      });
    }
  }, []);

  const incrementGamesPlayed = useCallback(() => {
    const next = parseInt(localStorage.getItem('dtp-games-played') || '0', 10) + 1;
    localStorage.setItem('dtp-games-played', String(next));
    setGamesPlayed(next);
    return next;
  }, []);

  const recordResult = useCallback((p1Score: number, numPlayers: number, engineWinner: string | null) => {
    const won = numPlayers === 1 ? p1Score > 0 : engineWinner === "p1";
    const died = p1Score === 0;

    setWins(w => {
      const nw = w + (won ? 1 : 0);
      localStorage.setItem('dtp:wins', nw.toString());
      return nw;
    });
    setDeaths(d => {
      const nd = d + (died ? 1 : 0);
      localStorage.setItem('dtp:deaths', nd.toString());
      return nd;
    });

    return {
      newWins: wins + (won ? 1 : 0),
      newDeaths: deaths + (died ? 1 : 0),
    };
  }, [wins, deaths]);

  const refillEnergy = useCallback((
    toast$: (msg: string) => void,
    amount: number = 1
  ) => {
    if (energyData.count >= GAME.MAX_ENERGY) { toast$("⚡ Energy already full!"); return; }
    const cost = amount * GAME.DUST_PER_ENERGY;
    if (dustRef.current < cost) { toast$("💜 Not enough dust!"); return; }
    const newDust = dustRef.current - cost;
    const newEd = {
      count: Math.min(GAME.MAX_ENERGY, energyData.count + amount),
      lastRegen: energyData.lastRegen,
    };
    setDust(newDust);
    localStorage.setItem(LS_KEYS.DUST, newDust.toString());
    setEnergyData(newEd);
    localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
    fbLogEvent("energy_refill", { cost, energy: newEd.count });
    toast$(amount > 1 ? "⚡ Energy full!" : "⚡ Energy refilled!");
  }, [energyData]);

  return {
    gamesPlayed, setGamesPlayed, incrementGamesPlayed,
    best1, best2, updateBest,
    wins, deaths, recordResult,
    dust, setDust, dustRef, addDust, spendDust, persistDust,
    getBotAccuracy,
    energyData, setEnergyData,
    refillEnergy,
  };
}
