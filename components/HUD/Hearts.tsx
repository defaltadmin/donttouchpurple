import React, { useRef, useState, useEffect } from "react";
import { GAME } from "../../config/difficulty";

const MAX_HEARTS = GAME.MAX_HEARTS;
const MAX_DISPLAY = MAX_HEARTS + 2; // 5 base + 2 bonus

interface HeartsProps {
  health: number;
  anim: boolean;
  shieldCount?: number;
  practiceMode?: boolean;
}

export function Hearts({ health, anim: _anim, shieldCount, practiceMode }: HeartsProps) {
  const sc = shieldCount ?? 0;
  const actualHealth  = Math.max(0, health);
  const displayHealth = Math.min(actualHealth, MAX_DISPLAY);
  const overflow      = actualHealth > MAX_DISPLAY;

  // Track health gain for animation
  const prevHealth = useRef(actualHealth);
  const [gainIdx, setGainIdx] = useState<number | null>(null);
  const [lossIdx, setLossIdx] = useState<number | null>(null);
  useEffect(() => {
    if (actualHealth > prevHealth.current) {
      setGainIdx(actualHealth - 1);
      const t = setTimeout(() => setGainIdx(null), 500);
      prevHealth.current = actualHealth;
      return () => clearTimeout(t);
    }
    if (actualHealth < prevHealth.current) {
      setLossIdx(prevHealth.current - 1);
      const t = setTimeout(() => setLossIdx(null), 500);
      prevHealth.current = actualHealth;
      return () => clearTimeout(t);
    }
    prevHealth.current = actualHealth;
  }, [actualHealth]);

  if (practiceMode) {
    return (
      <div className="hearts hearts--practice" role="status" aria-label="Practice mode - unlimited health">
        <span className="hearts-infinity">∞</span>
      </div>
    );
  }

  const healthLabel = `Health: ${actualHealth}${overflow ? '+' : ''} hearts${sc > 0 ? `, ${sc} shielded` : ''}`;

  const renderHeart = (i: number) => {
    const isFull         = i < displayHealth;
    const isShieldHeart  = sc > 0 && isFull && i >= displayHealth - sc;
    const isLastDisplayed = overflow && i === MAX_DISPLAY - 1;
    return (
      <span key={i} className={[
        "heart",
        isFull ? (isShieldHeart ? "heart--shield" : "heart--full") : "heart--empty",
        lossIdx === i ? "heart--loss" : "",
        gainIdx === i ? "heart--gain" : "",
      ].filter(Boolean).join(" ")}
      aria-hidden="true">
        {isLastDisplayed ? "♥+" : "♥"}
      </span>
    );
  };

  const row2Count = Math.max(0, Math.min(displayHealth - MAX_HEARTS, 2));

  const heartsElement = row2Count === 0 ? (
    <div className="hearts" role="status" aria-label={healthLabel}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => renderHeart(i))}
    </div>
  ) : (
    <div className="hearts-stack" role="status" aria-label={healthLabel}>
      <div className="hearts">{Array.from({ length: MAX_HEARTS }, (_, i) => renderHeart(i))}</div>
      <div className="hearts hearts--row2">{Array.from({ length: row2Count }, (_, i) => renderHeart(MAX_HEARTS + i))}</div>
    </div>
  );

  return heartsElement;
}
