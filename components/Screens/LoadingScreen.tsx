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
    <div
      className={`loading-screen${done && !showNameEntry ? " loading-screen--out" : ""}`}
      style={{
        background: "linear-gradient(145deg,#151028,#1a0a3e)",
        fontFamily: "'Fredoka One',system-ui,sans-serif",
      }}
    >
      <div className="loading-orb loading-orb-1" />
      <div className="loading-orb loading-orb-2" />
      <div className="loading-orb loading-orb-3" />

      <div className="loading-logo" style={{ textShadow: "0 0 40px rgba(192,38,211,0.8)" }}>
        {t('loading.title')}
      </div>
      <div className="loading-sub">{t('loading.subtitle')}</div>

      {!done ? (
        <div style={{ width: "min(280px, 80vw)", marginTop: 20 }}>
          <div className="loading-bar-track">
            <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="loading-pct" style={{ marginTop: 8 }}>{Math.round(progress)}%</div>
        </div>
      ) : showNameEntry ? (
        <div
          className="loading-name-entry"
          style={{
            background: "rgba(255,255,255,0.05)",
            padding: "24px",
            borderRadius: "24px",
            border: "1px solid rgba(192,38,211,0.3)",
            backdropFilter: "blur(10px)",
            marginTop: 20,
            width: "min(320px, 90vw)",
          }}
        >
          <div className="loading-name-label" style={{ marginBottom: 12 }}>{t('loading.name_prompt')}</div>
          <input
            className="go-input"
            maxLength={8}
            placeholder={t('loading.name_placeholder')}
            value={nameInput}
            autoFocus
            style={{ width: "100%", marginBottom: 12 }}
            onChange={(e) => {
              setNameInput(e.target.value.replace(/[^a-zA-Z0-9_ ]/g, "").slice(0, 8));
              setNameError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button className="btn-primary" style={{ width: "100%", padding: "12px" }} onClick={handleSubmit}>
            {t('loading.go')}
          </button>
          {nameError && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8, fontFamily: "var(--font-ui)" }}>{nameError}</div>}
        </div>
      ) : (
        <div style={{ width: "min(280px, 80vw)", marginTop: 20 }}>
          <div className="loading-bar-track">
            <div className="loading-bar-fill" style={{ width: "100%" }} />
          </div>
          <div className="loading-pct" style={{ marginTop: 8 }}>100%</div>
        </div>
      )}
    </div>
  );
}
