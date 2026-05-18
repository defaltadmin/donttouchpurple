import React from "react";
import { motion } from "framer-motion";

interface HowToPlayProps {
  onClose: () => void;
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
} as const;

const row = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export function HowToPlay({ onClose: _onClose }: HowToPlayProps) {
  return (
    <div className="how-wrap screen-slide scrollable-screen">
      <motion.h2
        className="how-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >How to Play</motion.h2>

      <motion.div className="how-grid" initial="hidden" animate="visible" variants={container}>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#dde4ee" }}>⬜</span><div><b>Safe colors</b><br />Tap quickly for +1 point. Miss one = lose a heart</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#a855f7" }}>🟣</span><div><b>Purple = danger</b><br />Never tap purple — costs 1 heart</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#fcd34d" }}>♥</span><div><b>Medpack</b><br />Restores one heart</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#67e8f9" }}>◈</span><div><b>Shield</b><br />Absorbs the next hit</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#bfdbfe" }}>❄</span><div><b>Freeze</b><br />Slows tick speed 40% for 15s</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#fb923c" }}>⚡</span><div><b>Multiplier</b><br />Double points for 24s</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#ff4400" }}>💣</span><div><b>Bomb</b><br />Evolve only — tap before the ring drains or take damage</div></motion.div>
      </motion.div>

      <motion.div className="how-modes" initial="hidden" animate="visible" variants={container}>
        <motion.div className="how-mode" variants={row}><b>⊞ Classic</b> — Fixed 3×3 grid, pure speed. No bombs or boss events</motion.div>
        <motion.div className="how-mode" variants={row}><b>∞ Evolve</b> — Grid grows 2×2 → 5×5. Boss events trigger every 500 points</motion.div>
      </motion.div>

      <motion.div className="how-modes" initial="hidden" animate="visible" variants={container}>
        <motion.div className="how-mode" variants={row}><b>⚡ Boss Events (Evolve only)</b></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#dc2626" }}>🌀</span><div><b>Storm</b> — Grid reshuffles every tick. Stay sharp</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#0ea5e9" }}>🔄</span><div><b>Inversion</b> — Purple is now SAFE! Non-purple cells become the danger</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#888" }}>⬛</span><div><b>Blackout</b> — Grid goes dark. Tap from memory</div></motion.div>
      </motion.div>

      <motion.div className="how-modes" initial="hidden" animate="visible" variants={container}>
        <motion.div className="how-mode" variants={row}><b>Keyboard Shortcuts</b></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon"><kbd>Esc</kbd></span><div>Pause / Resume</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon"><kbd>B</kbd></span><div>Toggle Bot Assist (Evolve, costs 30💜/tap)</div></motion.div>
      </motion.div>

      <motion.p
        className="how-tip"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >⚡ Build streaks for combo bonuses · Earn dust to unlock skins &amp; powerups in the Shop</motion.p>
    </div>
  );
}
