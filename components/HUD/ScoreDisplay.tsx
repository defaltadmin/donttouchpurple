import React, { useState, useEffect } from "react";
import type { PlayerState } from "../../engine/types";
import { speedLabel, speedPct } from "../../engine/DifficultyScaler";
import { GAME } from "../../config/difficulty";

const MAX_HEARTS = GAME.MAX_HEARTS;

function Hearts({ health, anim, shieldCount }: { health: number; anim: boolean; shieldCount?: number }) {
  const sc            = shieldCount ?? 0;
  const actualHealth  = Math.max(0, health);
  const displayHealth = Math.min(actualHealth, MAX_HEARTS * 2);
  const overflow      = actualHealth > MAX_HEARTS * 2;

  const renderHeart = (i: number) => {
    const isFull          = i < displayHealth;
    const isShieldHeart   = sc > 0 && isFull && i >= displayHealth - sc;
    const isLastDisplayed = overflow && i === MAX_HEARTS * 2 - 1;
    return (
      <span key={i} className={[
        "heart",
        isFull ? (isShieldHeart ? "heart--shield" : "heart--full") : "heart--empty",
        anim && i === Math.ceil(displayHealth) - 1 ? "heart--loss" : "",
      ].filter(Boolean).join(" ")}>
        {isLastDisplayed ? "♥+" : "♥"}
      </span>
    );
  };

  const row2Count = Math.max(0, Math.min(displayHealth - MAX_HEARTS, MAX_HEARTS));
  if (!row2Count) {
    return <div className="hearts">{Array.from({ length: MAX_HEARTS }, (_, i) => renderHeart(i))}</div>;
  }
  return (
    <div className="hearts-stack">
      <div className="hearts">{Array.from({ length: MAX_HEARTS }, (_, i) => renderHeart(i))}</div>
      <div className="hearts hearts--row2">{Array.from({ length: row2Count }, (_, i) => renderHeart(MAX_HEARTS + i))}</div>
    </div>
  );
}

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

  // Re-render every 100ms so speed label stays current
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="hud">
        <div className="hud-card hud-card--score">
          <div className="hud-lbl">Score</div>
          <div className="hud-score-row">
            <div className="hud-val">{p1.score}</div>
            {p1.streak >= 3 && <div className="combo-wrap">×{p1.streak}</div>}
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
