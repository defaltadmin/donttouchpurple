import React, { useState, useCallback } from "react";
import { PillRow } from "./PillRow";
import { ElasticSlider } from "./ElasticSlider";
import { i18n, type Locale } from "../../utils/i18n";
import { useTranslation } from "../../hooks/useTranslation";
import { useFocusTrap } from "../../hooks/useFocusTrap";

type ColorblindMode = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";

interface SettingsDrawerProps {
  colorblindMode: ColorblindMode;
  setColorblindMode: (mode: ColorblindMode) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  haptics: boolean;
  setHaptics: (enabled: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  screenShake: boolean;
  setScreenShake: (v: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  isFS: boolean;
  toggleFS: () => void;
  onClose: () => void;
  onNameChange?: () => void;
  playerName?: string;
  onOpenBuildDeploy?: () => void;
  customSeed?: string;
  onCustomSeedChange?: (v: string) => void;
  onPlayWithSeed?: () => void;
  currentLocale?: Locale;
  setCurrentLocale?: (locale: Locale) => void;
}

export function SettingsDrawer({
  colorblindMode,
  setColorblindMode,
  theme,
  setTheme,
  muted,
  setMuted,
  haptics,
  setHaptics,
  volume,
  setVolume,
  screenShake,
  setScreenShake,
  reducedMotion,
  setReducedMotion,
  isFS,
  toggleFS,
  onClose,
  onNameChange,
  playerName,
  onOpenBuildDeploy: _onOpenBuildDeploy,
  customSeed,
  onCustomSeedChange,
  onPlayWithSeed,
  currentLocale,
  setCurrentLocale,
}: SettingsDrawerProps) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap<HTMLDivElement>(true);
  const [localVolume, setLocalVolume] = useState(volume);
  const commitVolume = useCallback((v: number) => { setVolume(v); }, [setVolume]);
  const handleLocaleChange = (lang: Locale) => {
    i18n.set(lang);
    setCurrentLocale?.(lang);
  };
  return (
    <div className="drawer-overlay" role="dialog" aria-modal="true" aria-label={t('settings.title')} onClick={onClose} ref={trapRef}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">{t('settings.title')}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.appearance')}</div>
          <PillRow<"dark" | "light">
            options={[{ value: "dark", label: t('settings.dark') }, { value: "light", label: t('settings.light') }]}
            value={theme}
            onChange={setTheme}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.sound')}</div>
          <div className="vol-row">
            <button
              className={`vol-mute-btn${muted ? " vol-mute-btn--muted" : ""}`}
              onClick={() => setMuted(!muted)}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? "🔇" : volume < 0.4 ? "🔈" : volume < 0.7 ? "🔉" : "🔊"}
            </button>
            <div style={{ flex: 1 }}>
              <ElasticSlider
                value={muted ? 0 : Math.round(localVolume * 100)}
                onChange={(v) => {
                  const normalized = v / 100;
                  setLocalVolume(normalized);
                  commitVolume(normalized);
                }}
                min={0}
                max={100}
                step={5}
                disabled={muted}
                leftLabel="🔈"
                rightLabel="🔊"
              />
            </div>
            <span className="vol-pct">{muted ? t('settings.muted_label') : `${Math.round(volume * 100)}%`}</span>
          </div>
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.screen_shake')}</div>
          <PillRow<"on" | "off">
            options={[{ value: "on", label: t('settings.on') }, { value: "off", label: t('settings.off') }]}
            value={screenShake ? "on" : "off"}
            onChange={(v) => setScreenShake(v === "on")}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.haptics')}</div>
          <PillRow<"on" | "off">
            options={[{ value: "on", label: t('settings.on') }, { value: "off", label: t('settings.off') }]}
            value={haptics ? "on" : "off"}
            onChange={(v) => setHaptics(v === "on")}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.reduced_motion')}</div>
          <PillRow<"on" | "off">
            options={[{ value: "off", label: t('settings.arcade') }, { value: "on", label: t('settings.calm') }]}
            value={reducedMotion ? "on" : "off"}
            onChange={(v) => setReducedMotion(v === "on")}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.display')}</div>
          <PillRow<"window" | "full">
            options={[{ value: "window", label: t('settings.window') }, { value: "full", label: t('settings.fullscreen') }]}
            value={isFS ? "full" : "window"}
            onChange={() => toggleFS()}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.colorblind')}</div>
          <PillRow<ColorblindMode>
            options={[
              { value: "none", label: t('settings.none') },
              { value: "deuteranopia", label: t('settings.deuter') },
              { value: "protanopia", label: t('settings.protan') },
              { value: "tritanopia", label: t('settings.tritan') },
              { value: "monochrome", label: t('settings.mono') },
            ]}
            value={colorblindMode}
            onChange={setColorblindMode}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.language')}</div>
          <PillRow<Locale>
            options={i18n.getAvailable().map(lang => ({
              value: lang,
              label: lang === 'en' ? 'English' : lang === 'es' ? 'Español' : lang === 'ja' ? '日本語' : lang === 'pt' ? 'Português' : 'Français'
            }))}
            value={currentLocale ?? i18n.current}
            onChange={handleLocaleChange}
          />
        </div>

        {onNameChange && (
          <div className="opt-section">
            <div className="opt-label">{t('settings.player_name')}{playerName ? ` · ${playerName}` : ""}</div>
            <button
              className="btn-ghost"
              style={{ width: "100%", textAlign: "center", transition: "opacity 0.2s" }}
              onClick={() => { onClose(); setTimeout(onNameChange, 150); }}
            >
              {t('settings.change_name')}
            </button>
          </div>
        )}

        {onPlayWithSeed && (
          <div className="opt-section">
            <div className="opt-label">{t('settings.replay_seed')}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="name-input"
                style={{ flex: 1, minWidth: 0 }}
                placeholder={t('settings.enter_seed')}
                value={customSeed ?? ""}
                onChange={e => onCustomSeedChange?.(e.target.value.replace(/\D/g, ""))}
                maxLength={12}
              />
              <button
                className="btn-primary btn-sm"
                disabled={!customSeed}
                onClick={onPlayWithSeed}
              >▶</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
