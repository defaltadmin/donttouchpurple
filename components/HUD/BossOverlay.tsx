import React from "react";
import { motion } from "framer-motion";
import type { GameSnapshot } from "../../engine/types";
import { useTranslation } from "../../hooks/useTranslation";

interface BossOverlayProps {
  snapshot: GameSnapshot | null;
  screen: string;
  bossUi: { active: boolean; phase: number; shieldHits: number; maxShield: number };
  comboPop: boolean;
  rareSplash: { color: string; cssColor: string } | null;
  reducedMotion: boolean;
}

export const BossOverlay = React.memo(function BossOverlay({
  snapshot, screen, bossUi, comboPop, rareSplash, reducedMotion,
}: BossOverlayProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* Boss Banner */}
      {snapshot?.bossEvent && screen === "playing" && (
        <div className={`boss-banner boss-banner--${snapshot.bossEvent.type}`}>
          {snapshot.bossEvent.type === "storm"     && `⚡ ${t('boss.storm')} ⚡`}
          {snapshot.bossEvent.type === "inversion" && `🔄 ${t('boss.inversion')} 🔄`}
          {snapshot.bossEvent.type === "blackout"  && `🌑 ${t('boss.blackout')} 🌑`}
        </div>
      )}

      {/* Shield Boss UI */}
      {bossUi.active && (
        <motion.div
          className="dtp-boss-bar"
          aria-label="Boss Shield Health"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="dtp-boss-label">⚔️ {t('boss.phase_label', { n: bossUi.phase })}</div>
          <div className="dtp-boss-track">
            <motion.div
              className="dtp-boss-fill"
              style={{ width: `${(bossUi.shieldHits / bossUi.maxShield) * 100}%` }}
              animate={{ width: `${(bossUi.shieldHits / bossUi.maxShield) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
          </div>
          <div className="dtp-boss-hp">{bossUi.shieldHits}/{bossUi.maxShield}</div>
        </motion.div>
      )}
      {comboPop && <motion.div
        className="dtp-combo-popup"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
      >⚡ {t('boss.combo')} ⚡</motion.div>}

      {/* Rare Splash */}
      {rareSplash && (
        <div className="rare-splash">
          <span className="rare-splash-text" style={{ color: rareSplash.cssColor, textShadow: `0 0 60px ${rareSplash.cssColor}, 0 0 120px ${rareSplash.cssColor}66` }}>
            {t('boss.dont_touch', { color: rareSplash.color.toUpperCase() })}
          </span>
        </div>
      )}

      {/* Rare Grid Ring */}
      {screen === "playing" && snapshot?.rareMode.active && (
        <div
          className="rare-grid-ring"
          style={{ "--rare-color": snapshot.rareMode.cssColor, ...(reducedMotion ? { animation: 'none' } : {}) } as React.CSSProperties}
        >
          <div className="rare-pip-row">
            {Array.from({ length: snapshot.rareMode.turnsLeft }).map((_, i) => (
              <span key={i} className="rare-pip" style={{ background: snapshot?.rareMode.cssColor ?? '' }} />
            ))}
          </div>
        </div>
      )}
    </>
  );
});
