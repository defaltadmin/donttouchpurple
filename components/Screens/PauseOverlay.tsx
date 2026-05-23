import React, { useState, useEffect } from "react";
import type { GameSnapshot } from "../../engine/types";
import { speedLabel } from "../../engine/DifficultyScaler";
import { useTranslation } from "../../hooks/useTranslation";

interface PauseOverlayProps {
  snapshot: GameSnapshot | null;
  is2P: boolean;
  muted: boolean;
  isFS: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  onToggleMute: () => void;
  onToggleFS: () => void;
  onOpenSettings: () => void;
  focusTrapRef: React.RefObject<HTMLDivElement>;
}

export const PauseOverlay = React.memo(function PauseOverlay({
  snapshot, is2P, muted, isFS,
  onResume, onRestart, onExit,
  onToggleMute, onToggleFS, onOpenSettings,
  focusTrapRef,
}: PauseOverlayProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pause-overlay" role="dialog" aria-modal="true" aria-label={t('pause.title')} ref={focusTrapRef} data-testid="pause-overlay">
      <div className="pause-card">
        <div className="pause-title">⏸ {t('pause.title')}</div>
        <div className="pause-hud-grid">
          <div className="pause-hud-item">
            <span className="pause-hud-label">{t('hud.score')}</span>
            <span className="pause-hud-value">{snapshot?.p1.score ?? 0}</span>
          </div>
          {is2P && (
            <div className="pause-hud-item">
              <span className="pause-hud-label">{t('hud.p2_score')}</span>
              <span className="pause-hud-value">{snapshot?.p2?.score ?? 0}</span>
            </div>
          )}
          <div className="pause-hud-item">
            <span className="pause-hud-label">{t('hud.stage')}</span>
            <span className="pause-hud-value">{(snapshot?.p1.gridStage ?? 0) + 1}</span>
          </div>
          <div className="pause-hud-item">
            <span className="pause-hud-label">{t('hud.streak')}</span>
            <span className="pause-hud-value pause-hud-streak">{(snapshot?.p1.streak ?? 0) > 0 ? `🔥 ${snapshot?.p1.streak}` : "—"}</span>
          </div>
          <div className="pause-hud-item">
            <span className="pause-hud-label">{t('hud.speed')}</span>
            <span className="pause-hud-value">{snapshot ? speedLabel(snapshot.tick, snapshot.p1.freezeEnd > now) : "1.0×"}</span>
          </div>
          {snapshot && snapshot.p1.freezeEnd > now && (
            <div className="pause-hud-item">
              <span className="pause-hud-label">{t('hud.freeze')}</span>
              <span className="pause-hud-value pause-hud-freeze">❄ {Math.ceil((snapshot.p1.freezeEnd - now) / 1000)}s</span>
            </div>
          )}
          {snapshot && snapshot.p1.multiplierEnd > now && (
            <div className="pause-hud-item">
              <span className="pause-hud-label">{t('hud.multiplier')}</span>
              <span className="pause-hud-value pause-hud-mult">⚡ {Math.ceil((snapshot.p1.multiplierEnd - now) / 1000)}s</span>
            </div>
          )}
          {snapshot && snapshot.p1.shieldCount > 0 && (
            <div className="pause-hud-item">
              <span className="pause-hud-label">{t('hud.shield')}</span>
              <span className="pause-hud-value pause-hud-shield">🛡 ×{snapshot.p1.shieldCount}</span>
            </div>
          )}
        </div>
        <button className="btn-play" onClick={onResume}>▶ {t('pause.resume')}</button>
        <button className="btn-ghost" style={{width:"100%",textAlign:"center"}} onClick={onRestart}>↺ {t('pause.restart')}</button>
        <div className="pause-settings-row">
          <button
            className={`pause-setting-btn${muted ? " pause-setting-btn--active-mute" : " pause-setting-btn--active-sound"}`}
            onClick={onToggleMute} title={t('pause.sound')}>
            {muted ? "🔇" : "🔊"}<span>{muted ? t('pause.muted') : t('pause.sound')}</span>
          </button>
          <button className="pause-setting-btn" onClick={onToggleFS} title={t('pause.fullscreen')}>
            {isFS ? "⊡" : "⊞"}<span>{isFS ? t('pause.exit_fs') : t('pause.full')}</span>
          </button>
          <button className="pause-setting-btn" onClick={onOpenSettings} title={t('pause.settings')}>
            ⚙️<span>{t('pause.settings')}</span>
          </button>
        </div>
          <button className="btn-ghost" style={{width:"100%",textAlign:"center"}} onClick={onExit}>🏠 {t('pause.exit')}</button>
        <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",fontFamily:"var(--font-ui)"}}>{t('pause.hint')}</div>
      </div>
    </div>
  );
});
