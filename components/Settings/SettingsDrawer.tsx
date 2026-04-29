import React from "react";
import { PillRow } from "./PillRow";

type ColorblindMode = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";

interface SettingsDrawerProps {
  colorblindMode: ColorblindMode;
  setColorblindMode: (mode: ColorblindMode) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  screenShake: boolean;
  setScreenShake: (v: boolean) => void;
  isFS: boolean;
  toggleFS: () => void;
  onClose: () => void;
  onNameChange?: () => void;
  playerName?: string;
  onOpenBuildDeploy?: () => void;
}

export function SettingsDrawer({
  colorblindMode,
  setColorblindMode,
  theme,
  setTheme,
  muted,
  setMuted,
  volume,
  setVolume,
  screenShake,
  setScreenShake,
  isFS,
  toggleFS,
  onClose,
  onNameChange,
  playerName,
  onOpenBuildDeploy,
}: SettingsDrawerProps) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">⚙ Settings</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="opt-section">
          <div className="opt-label">🌙 Appearance</div>
          <PillRow<"dark" | "light">
            options={[{ value: "dark", label: "🌑 Dark" }, { value: "light", label: "☀️ Light" }]}
            value={theme}
            onChange={setTheme}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">🔊 Sound</div>
          <div className="vol-row">
            <button
              className={`vol-mute-btn${muted ? " vol-mute-btn--muted" : ""}`}
              onClick={() => setMuted(!muted)}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? "🔇" : volume < 0.4 ? "🔈" : volume < 0.7 ? "🔉" : "🔊"}
            </button>
            <input
              type="range"
              className="vol-slider"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              disabled={muted}
            />
            <span className="vol-pct">{muted ? "Muted" : `${Math.round(volume * 100)}%`}</span>
          </div>
        </div>

        <div className="opt-section">
          <div className="opt-label">📳 Screen Shake</div>
          <PillRow<"on" | "off">
            options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]}
            value={screenShake ? "on" : "off"}
            onChange={(v) => setScreenShake(v === "on")}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">⊞ Display</div>
          <PillRow<"window" | "full">
            options={[{ value: "window", label: "⊟ Window" }, { value: "full", label: "⊞ Fullscreen" }]}
            value={isFS ? "full" : "window"}
            onChange={() => toggleFS()}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">👁 Colorblind Mode</div>
          <PillRow<ColorblindMode>
            options={[
              { value: "none", label: "None" },
              { value: "deuteranopia", label: "Deuter" },
              { value: "protanopia", label: "Protan" },
              { value: "tritanopia", label: "Tritan" },
              { value: "monochrome", label: "Mono" },
            ]}
            value={colorblindMode}
            onChange={setColorblindMode}
          />
        </div>

        {onNameChange && (
          <div className="opt-section">
            <div className="opt-label">✏️ Player Name{playerName ? ` · ${playerName}` : ""}</div>
            <button
              className="btn-ghost"
              style={{ width: "100%", textAlign: "center", transition: "opacity 0.2s" }}
              onClick={() => { onClose(); setTimeout(onNameChange, 150); }}
            >
              ✏️ Change Name
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
