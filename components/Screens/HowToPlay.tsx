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

const BOSS_EVENTS = [
  { icon: "\u26A1", name: "Storm", desc: "Cells shuffle at lightning speed. Your muscle memory betrays you." },
  { icon: "\uD83D\uDD04", name: "Inversion", desc: "Safe and danger colors swap. Everything you learned is now wrong." },
  { icon: "\uD83C\uDF11", name: "Blackout", desc: "The grid goes completely dark. You tap from memory alone." },
];

const FEATURES = [
  { icon: "\uD83C\uDFAE", title: "Two Game Modes", desc: "Classic for quick reflex training. Evolve for progressive difficulty." },
  { icon: "\uD83C\uDFC6", title: "37 Achievements", desc: "Unlock badges and earn dust currency as you master challenges." },
  { icon: "\u2728", title: "12 Backgrounds", desc: "GPU-accelerated WebGL effects \u2014 nebula, aurora, digital rain, and more." },
  { icon: "\uD83E\uDD16", title: "AI Bot Assist", desc: "Activate a companion bot that costs dust to help you survive." },
  { icon: "\uD83D\uDCC5", title: "Daily Challenges", desc: "New objectives every day. Compete on the global leaderboard." },
  { icon: "\uD83D\uDCF1", title: "Installable PWA", desc: "Works on any device. Install as an app. Gamepad support included." },
];

const GITHUB_URL = "https://github.com/defaltadmin/donttouchpurple";

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

      {/* ── Boss Events Detail ── */}
      <motion.div className="how-section" initial="hidden" animate="visible" variants={container}>
        <motion.h3 className="how-section-title" variants={row}>Boss Events</motion.h3>
        {BOSS_EVENTS.map((boss) => (
          <motion.div key={boss.name} className="how-row" variants={row}>
            <span className="how-icon" style={{ fontSize: "1.5rem" }}>{boss.icon}</span>
            <div><b>{boss.name}</b> — {boss.desc}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Features ── */}
      <motion.div className="how-section" initial="hidden" animate="visible" variants={container}>
        <motion.h3 className="how-section-title" variants={row}>Everything You Get</motion.h3>
        {FEATURES.map((f) => (
          <motion.div key={f.title} className="how-row" variants={row}>
            <span className="how-icon" style={{ fontSize: "1.3rem" }}>{f.icon}</span>
            <div><b>{f.title}</b> — {f.desc}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Open Source ── */}
      <motion.div className="how-section" initial="hidden" animate="visible" variants={container}>
        <motion.h3 className="how-section-title" variants={row}>Open Source</motion.h3>
        <motion.div className="how-tech-badges" variants={row}>
          <span className="how-badge">React 19</span>
          <span className="how-badge">TypeScript</span>
          <span className="how-badge">Vite</span>
          <span className="how-badge">WebGL</span>
          <span className="how-badge">Firebase</span>
        </motion.div>
        <motion.div className="how-stats" variants={row}>
          <span><b>232</b> Tests</span>
          <span><b>MIT</b> License</span>
          <span><b>5</b> Languages</span>
        </motion.div>
        <motion.a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="how-github-link" variants={row}>
          View on GitHub
        </motion.a>
      </motion.div>
    </div>
  );
}
