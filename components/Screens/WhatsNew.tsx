import React from "react";

const VERSION = "5.3.1";
const LS_KEY = "dtp_last_version";

interface WhatsNewProps {
  onClose: () => void;
}

const CHANGES = [
  { emoji: "🎮", text: "Correct game logic: tap safe colors to score, tap purple to lose health" },
  { emoji: "🎉", text: "New Best! badge on game over when you beat your personal best" },
  { emoji: "💔", text: "Streak lost toast when you break a streak of 5+" },
  { emoji: "⚠️", text: "Rare mode turns-left indicator in the power bar" },
  { emoji: "🛡", text: "Shield, Freeze, and Energy drop animations now properly reset" },
  { emoji: "⚡", text: "Full energy refill button now works correctly" },
  { emoji: "🤖", text: "Bot assist feature in Evolve mode" },
  { emoji: "🌌", text: "Animated backgrounds: Void Tunnel, Star Warp, Grid Pulse" },
];

export function WhatsNew({ onClose }: WhatsNewProps) {
  return (
    <div className="whatsnew-overlay" onClick={onClose}>
      <div className="whatsnew-card" onClick={(e) => e.stopPropagation()}>
        <div className="whatsnew-header">
          <h2 className="whatsnew-title">What's New</h2>
          <span className="whatsnew-version">v{VERSION}</span>
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
    return last !== VERSION;
  } catch {
    return true;
  }
}

export function markWhatsNewSeen(): void {
  try { localStorage.setItem(LS_KEY, VERSION); } catch {}
}
