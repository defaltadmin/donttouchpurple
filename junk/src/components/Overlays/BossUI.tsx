import React from "react";

interface BossUiState {
  active: boolean;
  shieldHits: number;
  maxShield: number;
  phase: number;
}

interface RareSplash {
  color: string;
  cssColor: string;
}

interface BossUIProps {
  bossUi: BossUiState;
  rareSplash: RareSplash | null;
  rareGridRing: boolean;
  gameMode: string;
  screen: string;
}

export const BossUI = React.memo(function BossUI({
  bossUi,
  rareSplash,
  rareGridRing,
  gameMode,
  screen,
}: BossUIProps) {
  if (screen !== "playing" || gameMode !== "evolve") return null;

  return (
    <>
      {/* Boss active banner */}
      {bossUi.active && (
        <div className="boss-banner" role="status" aria-live="assertive">
          <div className="boss-banner-inner">
            <span className="boss-icon">👾</span>
            <span className="boss-label">
              BOSS — Phase {bossUi.phase}
            </span>
            <div
              className="boss-shield-bar"
              role="progressbar"
              aria-valuenow={bossUi.shieldHits}
              aria-valuemax={bossUi.maxShield}
              aria-label="Boss shield"
            >
              {Array.from({ length: bossUi.maxShield }).map((_, i) => (
                <div
                  key={i}
                  className={`boss-shield-pip${
                    i < bossUi.shieldHits ? " boss-shield-pip--active" : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rare color splash banner */}
      {rareSplash && (
        <div
          className="rare-splash"
          style={{ "--rare-color": rareSplash.cssColor } as React.CSSProperties}
          role="status"
          aria-live="polite"
        >
          <span className="rare-splash-icon">⚡</span>
          <span className="rare-splash-text">
            Don't touch{" "}
            <span className="rare-splash-color" style={{ color: rareSplash.cssColor }}>
              {rareSplash.color}
            </span>
            !
          </span>
        </div>
      )}

      {/* Rare grid ring overlay */}
      {rareGridRing && rareSplash && (
        <div
          className="rare-grid-ring"
          style={{ "--rare-color": rareSplash.cssColor } as React.CSSProperties}
          aria-hidden="true"
        />
      )}
    </>
  );
});
