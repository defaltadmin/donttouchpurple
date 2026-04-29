import React from "react";

const VERSION = "2.5.0";
const LS_KEY = "dtp_last_version";

interface WhatsNewProps {
  onClose: () => void;
}

const CHANGES = [
  { emoji: "🎨", text: "Keyboard mode cells now have vibrant colors + bigger key labels" },
  { emoji: "⚡", text: "Powerup bars redesigned with darker colors and draining animation" },
  { emoji: "🔊", text: "Volume slider added — adjust sound from 0-100%" },
  { emoji: "📳", text: "Screen shake toggle in settings" },
  { emoji: "∞", text: "Practice Mode — unlimited energy, no damage" },
  { emoji: "🧬", text: "New player tutorial for Evolve mode" },
  { emoji: "🎯", text: "Shareable game seeds — challenge friends with your exact game" },
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
