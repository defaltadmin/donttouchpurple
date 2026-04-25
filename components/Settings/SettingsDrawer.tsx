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
          <PillRow<"on" | "off">
            options={[{ value: "on", label: "🔊 On" }, { value: "off", label: "🔇 Off" }]}
            value={muted ? "off" : "on"}
            onChange={(value) => setMuted(value === "off")}
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

        {onOpenBuildDeploy && (
          <div className="opt-section">
            <div className="opt-label">🔧 Balance & Deploy</div>
            <button
              className="btn-ghost"
              style={{ width: "100%", textAlign: "center" }}
              onClick={() => {
                onClose();
                setTimeout(onOpenBuildDeploy!, 150);
              }}
            >
              ⚙ Tune Difficulty Constants
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
