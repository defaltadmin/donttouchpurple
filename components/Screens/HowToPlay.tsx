import React from "react";

interface HowToPlayProps {
  onClose: () => void;
}

export function HowToPlay({ onClose: _onClose }: HowToPlayProps) {
  return (
    <div className="how-wrap screen-slide scrollable-screen">
      <h2 className="how-title">How to Play</h2>

      <div className="how-grid">
        <div className="how-row"><span className="how-icon" style={{ color: "#dde4ee" }}>⬜</span><div><b>Safe colors</b><br />Tap quickly for +1 point. Miss one = lose a heart</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#a855f7" }}>🟣</span><div><b>Purple = danger</b><br />Never tap purple — costs 1 heart</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#fcd34d" }}>♥</span><div><b>Medpack</b><br />Restores one heart</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#67e8f9" }}>◈</span><div><b>Shield</b><br />Absorbs the next hit</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#bfdbfe" }}>❄</span><div><b>Freeze</b><br />Slows tick speed 40% for 15s</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#fb923c" }}>⚡</span><div><b>Multiplier</b><br />Double points for 24s</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#ff4400" }}>💣</span><div><b>Bomb</b><br />Evolve only — tap before the ring drains or take damage</div></div>
      </div>

      <div className="how-modes">
        <div className="how-mode"><b>⊞ Classic</b> — Fixed 3×3 grid, pure speed. No bombs or boss events</div>
        <div className="how-mode"><b>∞ Evolve</b> — Grid grows 2×2 → 5×5. Boss events trigger every 500 points</div>
      </div>

      <div className="how-modes">
        <div className="how-mode"><b>⚡ Boss Events (Evolve only)</b></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#dc2626" }}>🌀</span><div><b>Storm</b> — Grid reshuffles every tick. Stay sharp</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#0ea5e9" }}>🔄</span><div><b>Inversion</b> — Purple is now SAFE! Non-purple cells become the danger</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#888" }}>⬛</span><div><b>Blackout</b> — Grid goes dark. Tap from memory</div></div>
      </div>

      <div className="how-modes">
        <div className="how-mode"><b>Keyboard Shortcuts</b></div>
        <div className="how-row"><span className="how-icon"><kbd>Esc</kbd></span><div>Pause / Resume</div></div>
        <div className="how-row"><span className="how-icon"><kbd>B</kbd></span><div>Toggle Bot Assist (Evolve, costs 30💜/tap)</div></div>
      </div>

      <p className="how-tip">⚡ Build streaks for combo bonuses · Earn dust to unlock skins &amp; powerups in the Shop</p>
    </div>
  );
}
