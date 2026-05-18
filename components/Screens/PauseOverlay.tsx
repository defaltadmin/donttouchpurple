import React from "react";
import { motion } from "framer-motion";
import type { GameSnapshot } from "../../engine/types";
import { speedLabel } from "../../engine/DifficultyScaler";

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
  focusTrapRef: any;
}

export const PauseOverlay = React.memo(function PauseOverlay({
  snapshot, is2P, muted, isFS,
  onResume, onRestart, onExit,
  onToggleMute, onToggleFS, onOpenSettings,
  focusTrapRef,
}: PauseOverlayProps) {
  return (
    <div className="pause-overlay" ref={focusTrapRef}>
      <div className="pause-card">
        <div className="pause-title">⏸ PAUSED</div>
        <div className="pause-hud-grid">
          <div className="pause-hud-item">
            <span className="pause-hud-label">Score</span>
            <span className="pause-hud-value">{snapshot?.p1.score ?? 0}</span>
          </div>
          {is2P && (
            <div className="pause-hud-item">
              <span className="pause-hud-label">P2 Score</span>
              <span className="pause-hud-value">{snapshot?.p2?.score ?? 0}</span>
            </div>
          )}
          <div className="pause-hud-item">
            <span className="pause-hud-label">Stage</span>
            <span className="pause-hud-value">{(snapshot?.p1.gridStage ?? 0) + 1}</span>
          </div>
          <div className="pause-hud-item">
            <span className="pause-hud-label">Streak</span>
            <span className="pause-hud-value pause-hud-streak">{(snapshot?.p1.streak ?? 0) > 0 ? `🔥 ${snapshot?.p1.streak}` : "—"}</span>
          </div>
          <div className="pause-hud-item">
            <span className="pause-hud-label">Speed</span>
            <span className="pause-hud-value">{snapshot ? speedLabel(snapshot.tick, snapshot.p1.freezeEnd > Date.now()) : "1.0×"}</span>
          </div>
          {snapshot && snapshot.p1.freezeEnd > Date.now() && (
            <div className="pause-hud-item">
              <span className="pause-hud-label">Freeze</span>
              <span className="pause-hud-value pause-hud-freeze">❄ {Math.ceil((snapshot.p1.freezeEnd - Date.now()) / 1000)}s</span>
            </div>
          )}
          {snapshot && snapshot.p1.multiplierEnd > Date.now() && (
            <div className="pause-hud-item">
              <span className="pause-hud-label">Multiplier</span>
              <span className="pause-hud-value pause-hud-mult">⚡ {Math.ceil((snapshot.p1.multiplierEnd - Date.now()) / 1000)}s</span>
            </div>
          )}
          {snapshot && snapshot.p1.shieldCount > 0 && (
            <div className="pause-hud-item">
              <span className="pause-hud-label">Shield</span>
              <span className="pause-hud-value pause-hud-shield">🛡 ×{snapshot.p1.shieldCount}</span>
            </div>
          )}
        </div>
        <button className="btn-play" onClick={onResume}>▶ RESUME</button>
        <button className="btn-ghost" style={{width:"100%",textAlign:"center"}} onClick={onRestart}>↺ Restart</button>
        <div className="pause-settings-row">
          <button
            className={`pause-setting-btn${muted ? " pause-setting-btn--active-mute" : " pause-setting-btn--active-sound"}`}
            onClick={onToggleMute} title="Sound">
            {muted ? "🔇" : "🔊"}<span>{muted ? "Muted" : "Sound"}</span>
          </button>
          <button className="pause-setting-btn" onClick={onToggleFS} title="Fullscreen">
            {isFS ? "⊡" : "⊞"}<span>{isFS ? "Exit FS" : "Full"}</span>
          </button>
          <button className="pause-setting-btn" onClick={onOpenSettings} title="Settings">
            ⚙️<span>Settings</span>
          </button>
        </div>
          <button className="btn-ghost" style={{width:"100%",textAlign:"center"}} onClick={onExit}>🏠 Exit to Menu</button>
        <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",fontFamily:"var(--font-ui)"}}>Esc to resume · Exiting ends your game</div>
      </div>
    </div>
  );
});
