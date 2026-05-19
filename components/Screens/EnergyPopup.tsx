import React from "react";
import { GAME } from "../../config/difficulty";
import { useTranslation } from "../../hooks/useTranslation";

interface EnergyPopupProps {
  energyCount: number;
  dust: number;
  onClose: () => void;
  onRefill1: () => void;
  onRefillFull: () => void;
}

export const EnergyPopup = React.memo(function EnergyPopup({
  energyCount, dust, onClose, onRefill1, onRefillFull,
}: EnergyPopupProps) {
  const { t } = useTranslation();
  const needed = GAME.MAX_ENERGY - energyCount;
  const fullCost = needed * GAME.DUST_PER_ENERGY;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel energy-popup" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">⚡ {t('ui.energy')}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "var(--font-score)" }}>
            {energyCount} / {GAME.MAX_ENERGY}
          </div>
          <div style={{ fontSize: 12, opacity: 0.55, fontFamily: "var(--font-ui)", marginTop: 4 }}>
            {t('ui.refill_1')} {Math.round(GAME.ENERGY_REGEN_MS / 60000)} min
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn-ghost" style={{ width: "100%" }}
            disabled={energyCount >= GAME.MAX_ENERGY || dust < GAME.DUST_PER_ENERGY}
            onClick={onRefill1}>
            {t('ui.refill_1')} — {GAME.DUST_PER_ENERGY} 💜
          </button>
          <button className="btn-primary" style={{ width: "100%" }}
            disabled={energyCount >= GAME.MAX_ENERGY || dust < fullCost}
            onClick={onRefillFull}>
            {t('ui.refill_full')} — {fullCost} 💜
          </button>
        </div>
      </div>
    </div>
  );
});
