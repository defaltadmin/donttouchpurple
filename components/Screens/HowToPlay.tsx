import React from "react";

interface HowToPlayProps {
  onClose: () => void;
}

export function HowToPlay({ onClose: _onClose }: HowToPlayProps) {
  return (
    <div className="how-wrap screen-slide scrollable-screen">
      <h2 className="how-title">How to Play</h2>
      <div className="how-grid">
        <div className="how-row"><span className="how-icon" style={{ color: "#dde4ee" }}>⬜</span><div><b>Safe colors</b><br />Tap as fast as you can for +1 point</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#a855f7" }}>🟣</span><div><b>Purple = danger</b><br />Never tap purple — you lose a heart</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#fcd34d" }}>♥</span><div><b>Medpack</b><br />Restores one heart</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#67e8f9" }}>◈</span><div><b>Shield</b><br />Blocks the next damage</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#bfdbfe" }}>❄</span><div><b>Freeze</b><br />Slows time by 40% for 5 seconds</div></div>
        <div className="how-row"><span className="how-icon" style={{ color: "#fb923c" }}>⚡</span><div><b>Multiplier</b><br />Double points for 8 seconds</div></div>
      </div>
      <div className="how-modes">
        <div className="how-mode"><b>⊞ Classic</b> — Fixed 3×3 grid, pure speed challenge</div>
        <div className="how-mode"><b>∞ Evolve Mode</b> — Grid grows from 2×2 to 5×5 as you improve</div>
      </div>
      <p className="how-tip">⚡ Miss a safe cell = lose a heart · Tap purple = lose a heart · Survive = glory</p>
    </div>
  );
}
