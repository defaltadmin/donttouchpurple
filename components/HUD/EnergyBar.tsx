import React, { useEffect, useState } from "react";
import { GAME } from "../../config/difficulty";

interface EnergyBarProps {
  energy: number;
  energyLastRegen: number;
  onRefill: () => void;
  onRefillFull: () => void;
  dust: number;
}

export function EnergyBar({
  energy,
  energyLastRegen,
  onRefill,
  onRefillFull,
  dust,
}: EnergyBarProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (energy >= GAME.MAX_ENERGY) return;
    const id = setInterval(() => setNow(Date.now()), 1000); // 1s for visual precision
    return () => clearInterval(id);
  }, [energy]);

  const remaining = GAME.ENERGY_REGEN_MS - ((now - energyLastRegen) % GAME.ENERGY_REGEN_MS);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
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
