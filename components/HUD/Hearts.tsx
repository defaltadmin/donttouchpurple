import React from "react";
import { GAME } from "../../config/difficulty";

const MAX_HEARTS = GAME.MAX_HEARTS;
const MAX_DISPLAY = MAX_HEARTS + 2; // 5 base + 2 bonus

interface HeartsProps {
  health: number;
  anim: boolean;
  shieldCount?: number;
  practiceMode?: boolean;
}

export function Hearts({ health, anim, shieldCount, practiceMode }: HeartsProps) {
  if (practiceMode) {
    return (
      <div className="hearts hearts--practice">
        <span className="hearts-infinity">∞</span>
      </div>
    );
  }

  const sc = shieldCount ?? 0;
  const actualHealth  = Math.max(0, health);
const displayHealth = Math.min(actualHealth, MAX_DISPLAY);
const overflow      = actualHealth > MAX_DISPLAY;

  const renderHeart = (i: number) => {
    const isFull         = i < displayHealth;
    const isShieldHeart  = sc > 0 && isFull && i >= displayHealth - sc;
    const isLastDisplayed = overflow && i === MAX_DISPLAY - 1;
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

const row2Count = Math.max(0, Math.min(displayHealth - MAX_HEARTS, 2));
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
