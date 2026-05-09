import React, { useEffect, useState } from "react";
import type { PlayerState } from "../../engine/types";

interface PwrBarProps { ps: PlayerState; rareMode?: import('../../engine/types').RareColorMode }

export function PwrBar({ ps, rareMode }: PwrBarProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const freezeLeft = Math.max(0, ps.freezeEnd - now);
  const multLeft   = Math.max(0, ps.multiplierEnd - now);
  const freezeTotal = 15000, multTotal = 24000;

  if (freezeLeft <= 0 && multLeft <= 0 && ps.shieldCount <= 0 && !rareMode?.active) return null;

  const activePowers = [];
  if (rareMode?.active) activePowers.push(`Rare mode: ${rareMode.turnsLeft} turns left`);
  if (freezeLeft > 0) activePowers.push(`Freeze: ${Math.ceil(freezeLeft / 1000)}s remaining`);
  if (multLeft > 0) activePowers.push(`Multiplier: ${Math.ceil(multLeft / 1000)}s remaining`);
  if (ps.shieldCount > 0) activePowers.push(`Shield: ${ps.shieldCount} charges`);

  const powerLabel = `Active powers: ${activePowers.join(', ')}`;

  return (
    <div className="pwr-bar" role="status" aria-label={powerLabel}>
      {rareMode?.active && (
        <div className="pwr-pill pwr-pill--rare" aria-label={`Rare mode active: ${rareMode.turnsLeft} turns remaining`}>
          <div className="pwr-progress" style={{ width: `${(rareMode.turnsLeft / 9) * 100}%` }} aria-hidden="true" />
          <div className="pwr-center">
            <span className="pwr-icon" aria-hidden="true">{rareMode.emoji || "⚠️"}</span>
            <span className="pwr-count" style={{ color: rareMode.cssColor }} aria-hidden="true">{rareMode.turnsLeft}</span>
            <span className="pwr-rare-shape" style={{ color: rareMode.cssColor }} aria-hidden="true">{rareMode.shape}</span>
          </div>
        </div>
      )}
      {freezeLeft > 0 && (
        <div className="pwr-pill pwr-pill--freeze" aria-label={`Freeze active: ${Math.ceil(freezeLeft / 1000)} seconds remaining`}>
          <div className="pwr-progress" style={{ width: `${(freezeLeft / freezeTotal) * 100}%` }} aria-hidden="true" />
          <div className="pwr-center">
            <span className="pwr-icon" aria-hidden="true">❄️</span>
          </div>
        </div>
      )}
      {multLeft > 0 && (
        <div className="pwr-pill pwr-pill--multiplier" aria-label={`Multiplier active: ${Math.ceil(multLeft / 1000)} seconds remaining`}>
          <div className="pwr-progress" style={{ width: `${(multLeft / multTotal) * 100}%` }} aria-hidden="true" />
          <div className="pwr-center">
            <span className="pwr-icon" aria-hidden="true">⚡</span>
          </div>
        </div>
      )}
      {ps.shieldCount > 0 && (
        <div className="pwr-pill pwr-pill--shield" aria-label={`Shield active: ${ps.shieldCount} charges remaining`}>
          <div className="pwr-progress" style={{ width: '100%' }} aria-hidden="true" />
          <div className="pwr-center">
            <span className="pwr-icon">🛡️</span>
            <span className="pwr-count">×{ps.shieldCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
