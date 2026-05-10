import React from "react";

interface PauseOverlayProps {
  paused: boolean;
  onResume: () => void;
  onSettings: () => void;
  onExit: () => void;
  onExitConfirm: () => void;
  showExitConfirm: boolean;
  setShowExitConfirm: (v: boolean) => void;
  dust: number;
  gameMode: string;
  score: number;
  level?: number;
}

export const PauseOverlay = React.memo(function PauseOverlay({
  paused,
  onResume,
  onSettings,
  onExit,
  onExitConfirm,
  showExitConfirm,
  setShowExitConfirm,
  dust,
  gameMode,
  score,
  level,
}: PauseOverlayProps) {
  if (!paused) return null;

  return (
    <div className="pause-overlay" role="dialog" aria-modal="true" aria-label="Game paused">
      <div className="pause-card">
        <div className="pause-title">⏸ Paused</div>

        <div className="pause-stats">
          <div className="pause-stat">
            <span className="pause-stat-lbl">Score</span>
            <span className="pause-stat-val">{score}</span>
          </div>
          {gameMode === "evolve" && level !== undefined && (
            <div className="pause-stat">
              <span className="pause-stat-lbl">Level</span>
              <span className="pause-stat-val">{level}</span>
            </div>
          )}
          <div className="pause-stat">
            <span className="pause-stat-lbl">Dust</span>
            <span className="pause-stat-val">💜 {dust}</span>
          </div>
        </div>

        <div className="pause-actions">
          <button className="btn-primary pause-resume-btn" onClick={onResume}>
            ▶ Resume
          </button>

          <div className="pause-settings-row">
            <button
              className="pause-setting-btn"
              onClick={onSettings}
              title="Settings"
              aria-label="Open settings"
            >
              ⚙ Settings
            </button>
          </div>

          {!showExitConfirm ? (
            <button
              className="btn-ghost pause-exit-btn"
              onClick={() => setShowExitConfirm(true)}
            >
              ✕ Exit Game
            </button>
          ) : (
            <div className="pause-exit-confirm">
              <p className="pause-exit-msg">Score will be lost. Exit?</p>
              <div className="pause-exit-btns">
                <button
                  className="btn-ghost"
                  onClick={() => setShowExitConfirm(false)}
                >
                  Cancel
                </button>
                <button className="btn-danger" onClick={onExitConfirm}>
                  Exit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
