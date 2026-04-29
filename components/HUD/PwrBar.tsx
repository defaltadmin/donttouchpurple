import React, { useEffect, useState } from "react";
import type { PlayerState } from "../../engine/types";

interface PwrBarProps { ps: PlayerState }

export function PwrBar({ ps }: PwrBarProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const freezeLeft = Math.max(0, ps.freezeEnd - now);
  const multLeft   = Math.max(0, ps.multiplierEnd - now);
  const freezeTotal = 15000, multTotal = 24000;

  if (freezeLeft <= 0 && multLeft <= 0 && ps.shieldCount <= 0) return null;

  return (
    <div className="pwr-bar">
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
