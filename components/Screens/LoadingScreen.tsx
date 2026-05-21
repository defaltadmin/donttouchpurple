import React, { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

interface LoadingScreenProps {
  progress: number;
  done: boolean;
  showNameEntry: boolean;
  onNameSubmit: (name: string) => void;
  sanitizeName: (name: string) => string;
}

export function LoadingScreen({
  progress,
  done,
  showNameEntry,
  onNameSubmit,
  sanitizeName,
}: LoadingScreenProps) {
  const { t } = useTranslation();
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");

  const handleSubmit = () => {
    const safe = sanitizeName(nameInput.trim() || t('loading.default_name'));
    if (safe === t('loading.default_name') && nameInput.trim().length > 0) {
      setNameError(t('loading.name_error'));
      return;
    }
    onNameSubmit(safe || t('loading.default_name'));
  };

  return (
    <div className={`loading-screen${done && !showNameEntry ? " loading-screen--out" : ""}`}>
      <div className="loading-orb loading-orb-1" />
      <div className="loading-orb loading-orb-2" />
      <div className="loading-orb loading-orb-3" />

      <div className="loading-logo">
        {t('loading.title')}
      </div>
      <div className="loading-sub">{t('loading.subtitle')}</div>

      {!done ? (
        <div className="loading-bar-section">
          <div className="loading-bar-track">
            <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="loading-pct">{Math.round(progress)}%</div>
        </div>
      ) : showNameEntry ? (
        <div className="loading-name-entry">
          <div className="loading-name-label">{t('loading.name_prompt')}</div>
          <input
            className="go-input loading-name-input"
            maxLength={8}
            placeholder={t('loading.name_placeholder')}
            value={nameInput}
            autoFocus
            onChange={(e) => {
              setNameInput(e.target.value.replace(/[^a-zA-Z0-9_ ]/g, "").slice(0, 8));
              setNameError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button className="btn-primary loading-name-submit" onClick={handleSubmit}>
            {t('loading.go')}
          </button>
          {nameError && <div className="loading-name-error">{nameError}</div>}
        </div>
      ) : (
        <div className="loading-bar-section">
          <div className="loading-bar-track">
            <div className="loading-bar-fill" style={{ width: "100%" }} />
          </div>
          <div className="loading-pct">100%</div>
        </div>
      )}
    </div>
  );
}
