import React, { useEffect, useState } from "react";
import { GAME } from "../../config/difficulty";

interface EnergyBarProps {
  energy: number;
  nextRegenMs: number;
  onRefill: () => void;
  onRefillFull: () => void;
  dust: number;
  getNextRegenMs: () => number;
}

export function EnergyBar({
  energy,
  nextRegenMs,
  onRefill,
  onRefillFull,
  dust,
  getNextRegenMs,
}: EnergyBarProps) {
  const [timer, setTimer] = useState(nextRegenMs);

  useEffect(() => {
    setTimer(nextRegenMs);
  }, [nextRegenMs]);

  useEffect(() => {
    if (energy >= GAME.MAX_ENERGY) return;
    const id = setInterval(() => setTimer(getNextRegenMs()), 250);
    return () => clearInterval(id);
  }, [energy, getNextRegenMs]);

  const mins = Math.floor(timer / 60000);
  const secs = Math.floor((timer % 60000) / 1000);
  const costFull = GAME.DUST_PER_ENERGY * (GAME.MAX_ENERGY - energy);

  return (
    <div className="energy-bar-wrap">
      <div className="energy-pips">
        {Array.from({ length: GAME.MAX_ENERGY }, (_, i) => (
          <span
            key={i}
            className={`energy-pip${i < energy ? " energy-pip--full" : " energy-pip--empty-click"}`}
            onClick={() => i >= energy && dust >= GAME.DUST_PER_ENERGY && onRefill()}
            title={i >= energy && dust >= GAME.DUST_PER_ENERGY ? `Refill this pip — 💜${GAME.DUST_PER_ENERGY}` : undefined}
          >
            ⚡
          </span>
        ))}
      </div>
      {energy < GAME.MAX_ENERGY && (
        <div className="energy-regen-row">
          <span className="energy-timer">+1 in {mins}:{String(secs).padStart(2, "0")}</span>
          {dust >= GAME.DUST_PER_ENERGY && (
            <button className="energy-refill-btn" onClick={onRefill}>
              💜{GAME.DUST_PER_ENERGY}→+1
            </button>
          )}
          {dust >= costFull && energy < GAME.MAX_ENERGY - 1 && (
            <button className="energy-refill-btn" onClick={onRefillFull} style={{ marginLeft: 2 }}>
              💜{costFull}→Full
            </button>
          )}
        </div>
      )}
    </div>
  );
}
