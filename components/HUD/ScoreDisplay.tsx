import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import type { PlayerState } from "../../engine/types";
import { speedLabel, speedPct } from "../../engine/DifficultyScaler";
import { Hearts } from "./Hearts";
import { useTranslation } from "../../hooks/useTranslation";

// ─── Score Count-Up Animation ─────────────────────────────────────
function ScoreCountUp({ score }: { score: number }) {
  const [display, setDisplay] = useState(score);
  const elRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef(score);
  const objRef = useRef({ val: 0 });

  useEffect(() => {
    if (score === prevRef.current) return;
    const from = prevRef.current;
    const to = score;
    prevRef.current = score;
    objRef.current.val = from;

    // Single GSAP tween: count-up + scale bump
    const ctx = gsap.context(() => {
      gsap.to(objRef.current, {
        val: to,
        duration: 0.12,
        ease: "power3.out",
        snap: { val: 1 },
        onUpdate: () => setDisplay(Math.round(objRef.current.val)),
      });
      // Scale bump with overshoot
      gsap.fromTo(elRef.current,
        { scale: 1.15 },
        { scale: 1, duration: 0.25, ease: "back.out(2)" }
      );
    });

    return () => ctx.revert();
  }, [score]);

  return (
    <div ref={elRef} className="hud-val">
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
  const now = Date.now();
  const frozen = p1.freezeEnd > now;

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
