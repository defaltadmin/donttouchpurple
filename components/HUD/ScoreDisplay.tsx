import React, { useRef, useState, useEffect } from "react";
import type { PlayerState } from "../../engine/types";
import { speedLabel, speedPct } from "../../engine/DifficultyScaler";
import { Hearts } from "./Hearts";
import { useTranslation } from "../../hooks/useTranslation";

// ─── Score Count-Up Animation ─────────────────────────────────────
function ScoreCountUp({ score }: { score: number }) {
  const [display, setDisplay] = useState(score);
  const [bump, setBump] = useState(false);
  const prevRef = useRef(score);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (score === prevRef.current) return;
    const from = prevRef.current;
    const to = score;
    prevRef.current = score;

    // Trigger scale bump
    setBump(true);
    const bumpTimer = setTimeout(() => setBump(false), 150);

    // Animate count-up over ~120ms with overshoot
    const start = performance.now();
    const duration = 120;
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // Overshoot curve: ease-out with slight bounce
      const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(to);
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(bumpTimer);
    };
  }, [score]);

  return (
    <div
      className={`hud-val${bump ? ' hud-val--bump' : ''}`}
      style={{ transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      {display}
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
  const { t } = useTranslation();
  const frozen = p1.freezeEnd > Date.now();

  return (
    <>
      <div className="hud">
        <div className="hud-card hud-card--score">
          <div className="hud-lbl">{t('hud.score')}</div>
          <div className="hud-score-row">
            <ScoreCountUp score={p1.score} />
            {p1.streak >= 3 && <div className="combo-wrap" data-streak={p1.streak >= 7 ? "high" : undefined}>×{p1.streak}</div>}
          </div>
        </div>
        <div className="hud-card">
          <div className="hud-lbl">{t('hud.best_label')}</div>
          <div className="hud-val">{best}</div>
        </div>
        <div className="hud-card">
          <div className="hud-lbl">{t('hud.speed_label')}</div>
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
