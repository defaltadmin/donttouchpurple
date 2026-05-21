import React from "react";

interface StatsBarProps {
  rank: number;
  playerName: string;
  bestScore: string;
  survival: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function StatsBar({
  rank,
  playerName,
  bestScore,
  survival,
  onAction,
  actionLabel = "BEAT RECORD",
  className = "",
}: StatsBarProps) {
  return (
    <div className={`dtp-statsbar ${className}`.trim()}>
      <div className="dtp-statsbar-inner">
        {/* Rank badge */}
        <div className="dtp-statsbar-rank">
          <span>{rank}</span>
        </div>

        {/* Player info — hidden on mobile via CSS */}
        <div className="dtp-statsbar-info">
          <span className="dtp-statsbar-label">YOUR CURRENT RANK</span>
          <span className="dtp-statsbar-name">{playerName}</span>
        </div>

        {/* Stats — hidden on mobile via CSS */}
        <div className="dtp-statsbar-stats">
          <div>
            <span className="dtp-statsbar-stat-label">BEST SCORE</span>
            <span className="dtp-statsbar-stat-value dtp-statsbar-stat-value--gold">
              {bestScore}
            </span>
          </div>
          <div>
            <span className="dtp-statsbar-stat-label">SURVIVAL</span>
            <span className="dtp-statsbar-stat-value dtp-statsbar-stat-value--primary">
              {survival}
            </span>
          </div>
        </div>

        {/* CTA */}
        {onAction && (
          <button className="dtp-statsbar-cta" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
