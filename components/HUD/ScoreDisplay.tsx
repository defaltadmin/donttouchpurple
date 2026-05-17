import React from "react";
import type { PlayerState } from "../../engine/types";
import { speedLabel, speedPct } from "../../engine/DifficultyScaler";
import { Hearts } from "./Hearts";

// ─── Props ────────────────────────────────────────────────────────
interface ScoreDisplayProps {
  p1:          PlayerState;
  tick:        number;
  best:        number;
  heartAnim:   boolean;
}

// ─── ScoreDisplay ─────────────────────────────────────────────────
export function ScoreDisplay({ p1, tick, best, heartAnim }: ScoreDisplayProps) {
  const frozen = p1.freezeEnd > Date.now();
  const isHighSpeed = speedPct(tick) > 70;

  return (
    <>
      <div className="hud">
        <div className="hud-card hud-card--score">
          <div className="hud-lbl">Score</div>
          <div className="hud-score-row">
            <div className={`hud-val${isHighSpeed ? ' hud-val--speed-high' : ''}`}>{p1.score}</div>
            {p1.streak >= 3 && <div className="combo-wrap" data-streak={p1.streak >= 7 ? "high" : undefined}>×{p1.streak}</div>}
          </div>
        </div>
        <div className="hud-card">
          <div className="hud-lbl">Best</div>
          <div className="hud-val">{best}</div>
        </div>
        <div className="hud-card">
          <div className="hud-lbl">Speed</div>
          <div className="hud-val hud-val--sm">{speedLabel(tick, frozen)}</div>
        </div>
        <div className="hud-card hud-card--hearts">
          <Hearts health={p1.health} anim={heartAnim} shieldCount={p1.shieldCount} />
        </div>
      </div>
      <div className="spd-wrap">
        <div className="spd-track">
          <div className="spd-fill" style={{ width: speedPct(tick) + "%" }} />
        </div>
      </div>
    </>
  );
}
