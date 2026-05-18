import React from "react";

interface ShareModalProps {
  shareUrl: string;
  onClose: () => void;
}

export const ShareModal = React.memo(function ShareModal({ shareUrl, onClose }: ShareModalProps) {
  return (
    <div className="dtp-modal-backdrop" onClick={onClose} aria-hidden="true">
      <div className="dtp-share-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>Share Score</h2>
        <img src={shareUrl} alt="Score card" className="dtp-share-preview" />
        <div className="dtp-share-actions">
          <button onClick={() => { navigator.clipboard?.writeText(window.location.href); }} className="dtp-btn dtp-btn-primary">Copy Link</button>
          <a href={shareUrl} download="donttouchpurple-score.png" className="dtp-btn dtp-btn-secondary">Download PNG</a>
          <button onClick={onClose} className="dtp-btn dtp-btn-tertiary">Close</button>
        </div>
      </div>
    </div>
  );
});
