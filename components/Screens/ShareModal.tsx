import React from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface ShareModalProps {
  shareUrl: string;
  onClose: () => void;
}

export const ShareModal = React.memo(function ShareModal({ shareUrl, onClose }: ShareModalProps) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap<HTMLDivElement>(true);
  return (
    <div
      className="dtp-modal-backdrop"
      onClick={onClose}
      onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
      role="presentation"
    >
      <div
        className="dtp-share-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('share.title')}
        onClick={e => e.stopPropagation()}
        ref={trapRef}
        tabIndex={-1}
      >
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
