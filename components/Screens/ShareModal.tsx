import React from "react";
import { useTranslation } from "../../hooks/useTranslation";

interface ShareModalProps {
  shareUrl: string;
  onClose: () => void;
}

export const ShareModal = React.memo(function ShareModal({ shareUrl, onClose }: ShareModalProps) {
  const { t } = useTranslation();
  return (
    <div className="dtp-modal-backdrop" onClick={onClose} aria-hidden="true">
      <div className="dtp-share-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>{t('share.title')}</h2>
        <img src={shareUrl} alt="Score card" className="dtp-share-preview" />
        <div className="dtp-share-actions">
          <button onClick={() => { navigator.clipboard?.writeText(window.location.href); }} className="dtp-btn dtp-btn-primary">{t('share.copy_link')}</button>
          <a href={shareUrl} download="donttouchpurple-score.png" className="dtp-btn dtp-btn-secondary">{t('share.download_png')}</a>
          <button onClick={onClose} className="dtp-btn dtp-btn-tertiary">{t('share.close')}</button>
        </div>
      </div>
    </div>
  );
});
