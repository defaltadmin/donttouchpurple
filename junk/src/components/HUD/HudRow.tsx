import React from "react";
import { Hearts } from "./Hearts";

interface HudRowProps {
  screen: string;
  score: number;
  speedPct: number;
  health: number;
  heartAnim: boolean;
  shieldCount: number;
  combo: { count: number; multiplier: number };
  streak: number;
  level: number;
  isEvolve: boolean;
  is2P?: boolean;
  // 2P
  score2?: number;
  health2?: number;
  heartAnim2?: boolean;
  shieldCount2?: number;
}

export const HudRow = React.memo(function HudRow({
  screen,
  score,
  speedPct,
  health,
  heartAnim,
  shieldCount,
  combo,
  streak,
  level,
  isEvolve,
  is2P = false,
  score2,
  health2,
  heartAnim2,
  shieldCount2,
}: HudRowProps) {
  const showCombo = combo.count > 1 && screen === "playing";

  return (
    <div className="hud" role="region" aria-label="Game HUD">

      {/* Score card */}
      <div
        className={`hud-card hud-card--score${
          streak >= 10 ? " streak--high" : streak >= 5 ? " streak--mid" : ""
        }`}
      >
        <div className="hud-lbl">Score</div>
        <div className="hud-score-row">
          <span className="hud-val">{score}</span>
        </div>
        {isEvolve && (
          <div className="spd-wrap" aria-label={`Speed ${Math.round(speedPct)}%`}>
            <div className="spd-track">
              <div className="spd-fill" style={{ width: `${speedPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Level card — Evolve only */}
      {isEvolve && (
        <div className="hud-card hud-card--level">
          <div className="hud-lbl">Level</div>
          <div className="hud-val hud-val--sm">{level}</div>
        </div>
      )}

      {/* Hearts card P1 */}
      <div className="hud-card hud-card--hearts">
        <div className="hud-lbl">{is2P ? "P1" : "Lives"}</div>
        <Hearts health={health} anim={heartAnim} shieldCount={shieldCount} />
      </div>

      {/* Hearts card P2 */}
      {is2P && health2 !== undefined && (
        <div className="hud-card hud-card--hearts">
          <div className="hud-lbl">P2</div>
          <Hearts health={health2} anim={heartAnim2 ?? false} shieldCount={shieldCount2 ?? 0} />
        </div>
      )}

      {/* Combo card */}
      {showCombo && (
        <div
          className="hud-card hud-card--combo"
          aria-live="polite"
          aria-atomic="true"
          key={combo.count} /* remount animation on each new count */
        >
          <div className="hud-lbl">Combo</div>
          <div className="hud-combo-val">
            🔥 <span className="hud-combo-count">{combo.count}x</span>
          </div>
        </div>
      )}

    </div>
  );
});
