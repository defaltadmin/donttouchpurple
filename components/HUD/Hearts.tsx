import React from "react";
import { GAME } from "../../config/difficulty";

const MAX_HEARTS = GAME.MAX_HEARTS;

interface HeartsProps {
  health: number;
  anim: boolean;
  shieldCount?: number;
}

export function Hearts({ health, anim, shieldCount }: HeartsProps) {
  const sc = shieldCount ?? 0;
  const actualHealth  = Math.max(0, health);
  const displayHealth = Math.min(actualHealth, MAX_HEARTS * 2);
  const overflow      = actualHealth > MAX_HEARTS * 2;

  const renderHeart = (i: number) => {
    const isFull         = i < displayHealth;
    const isShieldHeart  = sc > 0 && isFull && i >= displayHealth - sc;
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
