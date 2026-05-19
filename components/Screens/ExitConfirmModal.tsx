import React from "react";
import { useTranslation } from "../../hooks/useTranslation";

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitConfirmModal({ onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">🏠 {t('pause.exit_confirm_title')}</span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0 16px" }}>{t('pause.exit_confirm_desc')}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onCancel}>{t('ui.cancel')}</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onConfirm}>{t('pause.exit')}</button>
        </div>
      </div>
    </div>
  );
}
