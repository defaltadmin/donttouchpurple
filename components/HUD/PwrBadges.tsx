import React, { useState, useEffect } from "react";

interface PwrBadgesProps {
  shield: boolean;
  freezeEnd: number;
  multiplierEnd: number;
  freezeTotal?: number;
  multTotal?: number;
  levelUpBadge?: string | null;
}

export function PwrBadges({
  shield,
  freezeEnd,
  multiplierEnd,
  freezeTotal,
  multTotal,
  levelUpBadge,
}: PwrBadgesProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const active = shield || freezeEnd > Date.now() || multiplierEnd > Date.now();
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [shield, freezeEnd, multiplierEnd]);

  const freezeActive = freezeEnd > now;
  const multActive   = multiplierEnd > now;
  const freezePct    = freezeActive ? Math.max(0, ((freezeEnd - now) / (freezeTotal ?? 15000)) * 100) : 0;
  const multPct      = multActive   ? Math.max(0, ((multiplierEnd - now) / (multTotal ?? 24000)) * 100) : 0;

  if (!shield && !freezeActive && !multActive && !levelUpBadge) return null;
  return (
    <div className="pwr-pills">
      {levelUpBadge && (
        <div className="pwr-chip pwr-chip--levelup">
          <span className="pwr-chip-icon">🔥</span>
          <span className="pwr-chip-lbl">{levelUpBadge}</span>
        </div>
      )}
      {shield && (
        <div className="pwr-chip pwr-chip--shield">
          <span className="pwr-chip-icon">◈</span>
          <span className="pwr-chip-lbl">Shield</span>
        </div>
      )}
      {freezeActive && (
        <div className="pwr-chip pwr-chip--freeze">
          <span className="pwr-chip-icon">❄</span>
          <div className="pwr-chip-bar-track">
            <div className="pwr-chip-bar pwr-chip-bar--freeze" style={{ width: `${freezePct}%` }} />
          </div>
        </div>
      )}
      {multActive && (
        <div className="pwr-chip pwr-chip--mult">
          <span className="pwr-chip-icon">⚡</span>
          <div className="pwr-chip-bar-track">
            <div className="pwr-chip-bar pwr-chip-bar--mult" style={{ width: `${multPct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
