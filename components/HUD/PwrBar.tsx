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

  return (
    <div className="pwr-bar">
      {rareMode?.active && (
        <div className="pwr-pill pwr-pill--rare">
          <div className="pwr-progress" style={{ width: `${(rareMode.turnsLeft / 9) * 100}%` }} />
          <div className="pwr-center">
            <span className="pwr-icon">⚠️</span>
            <span className="pwr-count" style={{ color: rareMode.cssColor }}>{rareMode.turnsLeft}</span>
          </div>
        </div>
      )}
      {freezeLeft > 0 && (
        <div className="pwr-pill pwr-pill--freeze">
          <div className="pwr-progress" style={{ width: `${(freezeLeft / freezeTotal) * 100}%` }} />
          <div className="pwr-center">
            <span className="pwr-icon">❄️</span>
          </div>
        </div>
      )}
      {multLeft > 0 && (
        <div className="pwr-pill pwr-pill--multiplier">
          <div className="pwr-progress" style={{ width: `${(multLeft / multTotal) * 100}%` }} />
          <div className="pwr-center">
            <span className="pwr-icon">⚡</span>
          </div>
        </div>
      )}
      {ps.shieldCount > 0 && (
        <div className="pwr-pill pwr-pill--shield">
          <div className="pwr-progress" style={{ width: '100%' }} />
          <div className="pwr-center">
            <span className="pwr-icon">🛡️</span>
            <span className="pwr-count">×{ps.shieldCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
