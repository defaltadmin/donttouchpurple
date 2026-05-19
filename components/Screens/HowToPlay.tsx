import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "../../hooks/useTranslation";

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
  const { t } = useTranslation();

  return (
    <div className="how-wrap screen-slide scrollable-screen">
      <motion.h2
        className="how-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >{t('how.title')}</motion.h2>

      <motion.div className="how-grid" initial="hidden" animate="visible" variants={container}>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#dde4ee" }}>⬜</span><div><b>{t('how.safe_cells')}</b><br />{t('how.safe_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#a855f7" }}>🟣</span><div><b>{t('how.danger')}</b><br />{t('how.danger_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#fcd34d" }}>♥</span><div><b>{t('how.medpack')}</b><br />{t('how.medpack_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#67e8f9" }}>◈</span><div><b>{t('how.shield')}</b><br />{t('how.shield_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#bfdbfe" }}>❄</span><div><b>{t('how.freeze')}</b><br />{t('how.freeze_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#fb923c" }}>⚡</span><div><b>{t('how.multiplier')}</b><br />{t('how.multiplier_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#ff4400" }}>💣</span><div><b>{t('how.bomb')}</b><br />{t('how.bomb_desc')}</div></motion.div>
      </motion.div>

      <motion.div className="how-modes" initial="hidden" animate="visible" variants={container}>
        <motion.div className="how-mode" variants={row}><b>⊞ {t('how.classic')}</b> — {t('how.classic_desc')}</motion.div>
        <motion.div className="how-mode" variants={row}><b>∞ {t('how.evolve')}</b> — {t('how.evolve_desc')}</motion.div>
      </motion.div>

      <motion.div className="how-modes" initial="hidden" animate="visible" variants={container}>
        <motion.div className="how-mode" variants={row}><b>⚡ {t('how.boss_events')}</b></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#0ea5e9" }}>🔄</span><div><b>{t('how.inversion')}</b> — {t('how.inversion_desc')}</div></motion.div>
      </motion.div>

      <motion.div className="how-modes" initial="hidden" animate="visible" variants={container}>
        <motion.div className="how-mode" variants={row}><b>{t('how.keyboard')}</b></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon"><kbd>Esc</kbd></span><div>{t('how.pause_key')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon"><kbd>B</kbd></span><div>{t('how.bot_key')}</div></motion.div>
      </motion.div>

      <motion.p
        className="how-tip"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >⚡ {t('how.tip')}</motion.p>
    </div>
  );
}
