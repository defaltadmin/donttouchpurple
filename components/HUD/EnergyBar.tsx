import React, { useEffect, useState } from "react";
import { GAME } from "../../config/difficulty";
import { useTranslation } from "../../hooks/useTranslation";

interface EnergyBarProps {
  energy: number;
  energyLastRegen: number;
  onRefill: () => void;
  onRefillFull: () => void;
  onEnergyIconClick?: () => void;
  dust: number;
}

export function EnergyBar({
  energy,
  energyLastRegen,
  onRefill,
  onRefillFull,
  onEnergyIconClick,
  dust,
}: EnergyBarProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  const isFull = energy >= GAME.MAX_ENERGY;

  useEffect(() => {
    if (isFull) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isFull]);

  const remaining = GAME.ENERGY_REGEN_MS - ((now - energyLastRegen) % GAME.ENERGY_REGEN_MS);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const costFull = GAME.DUST_PER_ENERGY * (GAME.MAX_ENERGY - energy);

  return (
    <div className="energy-bar-wrap">
      <div className="energy-pips" onClick={onEnergyIconClick} style={{ cursor: onEnergyIconClick ? "pointer" : "default" }}>
        {Array.from({ length: GAME.MAX_ENERGY }, (_, i) => (
          <span
            key={i}
            className={`energy-pip${i < energy ? " energy-pip--full" : " energy-pip--empty-click"}`}
            onClick={(e) => {
              if (i >= energy && dust >= GAME.DUST_PER_ENERGY) {
                e.stopPropagation();
                onRefill();
              }
            }}
            title={i >= energy && dust >= GAME.DUST_PER_ENERGY ? `${t('energy.refill_pip')} — 💜${GAME.DUST_PER_ENERGY}` : undefined}
          >
            ⚡
          </span>
        ))}
      </div>
      {energy < GAME.MAX_ENERGY && (
        <div className="energy-regen-row">
          <span className="energy-timer">{t('energy.plus_one', { mins, secs: String(secs).padStart(2, "0") })}</span>
          {dust >= GAME.DUST_PER_ENERGY && (
            <button className="energy-refill-btn" onClick={onRefill}>
              💜{GAME.DUST_PER_ENERGY}→+1
            </button>
          )}
          {dust >= costFull && energy < GAME.MAX_ENERGY - 1 && (
            <button className="energy-refill-btn" onClick={onRefillFull} style={{ marginLeft: 2 }}>
              💜{costFull}→{t('energy.full')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
