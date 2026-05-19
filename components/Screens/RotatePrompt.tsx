import React from "react";
import { useTranslation } from "../../hooks/useTranslation";

export function RotatePrompt() {
  const { t } = useTranslation();
  return (
    <div className="dtp-rotate-overlay" role="alert" aria-live="polite">
      <div className="dtp-rotate-card">
        <span className="dtp-rotate-icon">📱↔️📱</span>
        <h3>{t('ui.rotate_device')}</h3>
        <p>{t('ui.rotate_hint')}</p>
      </div>
    </div>
  );
}
