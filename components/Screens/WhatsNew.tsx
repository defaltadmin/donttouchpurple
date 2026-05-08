import React from "react";

// Injected at build time via vite.config.ts define
declare const __APP_VERSION__: string;
const WHATS_NEW_VERSION = __APP_VERSION__;
const LS_KEY = "dtp_last_version";

interface WhatsNewProps {
  onClose: () => void;
}

const CHANGES = [
  { emoji: "💣", text: "Bomb cells now show a circular SVG countdown ring — tap before it drains!" },
  { emoji: "🔄", text: "Inversion boss event fully fixed — purple is safe to tap, safe colors are the threat" },
  { emoji: "🌀", text: "Storm boss event RNG fixed — seeded replays stay accurate through storms" },
  { emoji: "🎯", text: "Score display upgraded — smooth glow bloom per point, streak-heat color ramp" },
  { emoji: "🤖", text: "Bot assist button moved into HUD row — never overlaps the grid" },
  { emoji: "🎁", text: "Daily check-in panel animates closed after claiming dust" },
  { emoji: "🖼️", text: "Animated backgrounds now only show during gameplay — Shop and Menu stay clean" },
  { emoji: "💣", text: "Bombs now spawn in 2-player Evolve mode for both players" },
  { emoji: "∞",  text: "Evolve mode: grid grows 2×2 → 5×5 with named shape stages" },
  { emoji: "⚡", text: "Boss events: Storm, Inversion, Blackout — every 500 points in Evolve" },
  { emoji: "🏆", text: "Global leaderboard, daily streaks, dust economy, and cosmetic shop" },
];

export function WhatsNew({ onClose }: WhatsNewProps) {
  const isNewVersion = (() => {
    try {
      const last = localStorage.getItem(LS_KEY);
      return last !== WHATS_NEW_VERSION;
    } catch { return false; }
  })();

  return (
    <div className="whatsnew-overlay" onClick={onClose}>
      <div className="whatsnew-card" onClick={(e) => e.stopPropagation()}>
        <div className="whatsnew-header">
          <h2 className="whatsnew-title">What's New</h2>
          <span className="whatsnew-version">v{WHATS_NEW_VERSION}</span>
          {isNewVersion && <span className="whatsnew-badge">New!</span>}
          <button className="whatsnew-close" onClick={onClose}>✕</button>
        </div>
        <div className="whatsnew-list">
          {CHANGES.map((c, i) => (
            <div key={i} className="whatsnew-item">
              <span className="whatsnew-emoji">{c.emoji}</span>
              <span className="whatsnew-text">{c.text}</span>
            </div>
          ))}
        </div>
        <button className="btn-play whatsnew-ok" onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
}

export function shouldShowWhatsNew(): boolean {
  try {
    const last = localStorage.getItem(LS_KEY);
    return last !== WHATS_NEW_VERSION;
  } catch {
    return true;
  }
}

export function markWhatsNewSeen(): void {
  try {
    localStorage.setItem(LS_KEY, WHATS_NEW_VERSION);
  } catch { /* ignore */ }
}
