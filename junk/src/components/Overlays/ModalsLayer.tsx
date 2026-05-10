import React from "react";

interface ModalsLayerProps {
  // Share modal
  showShare: boolean;
  shareUrl: string | null;
  shareMsg: string;
  onShareClose: () => void;
  onShareCopy: () => void;
  // Name change
  showNameChange: boolean;
  nameInput: string;
  setNameInput: (v: string) => void;
  onNameSave: () => void;
  onNameClose: () => void;
  // Energy popup
  showEnergyPopup: boolean;
  energyCount: number;
  dust: number;
  dustPerEnergy: number;
  maxEnergy: number;
  onEnergyRefill: () => void;
  onEnergyClose: () => void;
  // Install banner
  showInstallBanner: boolean;
  isIOS: boolean;
  onInstallClick: () => void;
  onInstallDismiss: () => void;
  // SW update toast
  showSwUpdate: boolean;
  onSwUpdate: () => void;
  onSwDismiss: () => void;
}

export function ModalsLayer({
  showShare, shareUrl, shareMsg, onShareClose, onShareCopy,
  showNameChange, nameInput, setNameInput, onNameSave, onNameClose,
  showEnergyPopup, energyCount, dust, dustPerEnergy, maxEnergy,
  onEnergyRefill, onEnergyClose,
  showInstallBanner, isIOS, onInstallClick, onInstallDismiss,
  showSwUpdate, onSwUpdate, onSwDismiss,
}: ModalsLayerProps) {
  return (
    <>
      {/* ── Share modal ── */}
      {showShare && shareUrl && (
        <div
          className="dtp-modal-backdrop"
          onClick={onShareClose}
          role="dialog"
          aria-modal="true"
          aria-label="Share your score"
        >
          <div className="dtp-modal dtp-share-modal" onClick={e => e.stopPropagation()}>
            <div className="share-title">🏆 Share Your Score</div>
            <p className="share-msg">{shareMsg}</p>
            <div className="share-actions">
              <button className="btn-primary" onClick={onShareCopy}>
                📋 Copy Link
              </button>
              {navigator.share && (
                <button
                  className="btn-ghost"
                  onClick={() =>
                    navigator.share({ title: "Don't Touch Purple", text: shareMsg, url: shareUrl })
                  }
                >
                  ↗ Share
                </button>
              )}
              <button className="btn-ghost" onClick={onShareClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Name change modal ── */}
      {showNameChange && (
        <div
          className="dtp-modal-backdrop"
          onClick={onNameClose}
          role="dialog"
          aria-modal="true"
          aria-label="Change your name"
        >
          <div className="dtp-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">✏️ Change Name</div>
            <input
              className="dtp-input"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") onNameSave(); }}
              maxLength={16}
              placeholder="Your name"
              autoFocus
              aria-label="Player name"
            />
            <div className="modal-actions">
              <button className="btn-primary" onClick={onNameSave}>
                Save
              </button>
              <button className="btn-ghost" onClick={onNameClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Energy refill popup ── */}
      {showEnergyPopup && (
        <div
          className="dtp-modal-backdrop"
          onClick={onEnergyClose}
          role="dialog"
          aria-modal="true"
          aria-label="Out of energy"
        >
          <div className="dtp-modal dtp-energy-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">⚡ Out of Energy</div>
            <p className="modal-body">
              You have {energyCount}/{maxEnergy} energy.
              Refill one charge for <strong>{dustPerEnergy} 💜 dust</strong>?
            </p>
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={onEnergyRefill}
                disabled={dust < dustPerEnergy}
              >
                Refill (💜 {dustPerEnergy})
              </button>
              <button className="btn-ghost" onClick={onEnergyClose}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PWA install banner ── */}
      {showInstallBanner && (
        <div className="dtp-install-banner" role="complementary" aria-label="Install app">
          <span className="install-icon">📲</span>
          <span className="install-text">
            {isIOS
              ? 'Tap Share → "Add to Home Screen"'
              : "Install Don't Touch Purple"}
          </span>
          {!isIOS && (
            <button className="btn-primary install-btn" onClick={onInstallClick}>
              Install
            </button>
          )}
          <button
            className="btn-icon install-dismiss"
            onClick={onInstallDismiss}
            aria-label="Dismiss install banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── SW update toast ── */}
      {showSwUpdate && (
        <div className="dtp-sw-toast" role="status">
          <span>🔄 Update available</span>
          <button className="btn-primary sw-update-btn" onClick={onSwUpdate}>
            Reload
          </button>
          <button className="btn-icon" onClick={onSwDismiss} aria-label="Dismiss update">
            ✕
          </button>
        </div>
      )}
    </>
  );
}
