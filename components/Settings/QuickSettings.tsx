import React from "react";
import { settingsManager } from "../../utils/settings";
import { useTranslation } from "../../hooks/useTranslation";

interface QuickSettingsProps {
  showOffset: boolean;
  onToggleOffset: () => void;
  visualA11y: { icons: Record<string, string> };
  onClose: () => void;
}

export const QuickSettings = React.memo(function QuickSettings({
  showOffset, onToggleOffset, visualA11y, onClose,
}: QuickSettingsProps) {
  const { t } = useTranslation();
  const settings = settingsManager.get();

  return (
    <div className="dtp-modal-backdrop" onClick={onClose} aria-hidden="true">
      <div className="dtp-modal" role="dialog" aria-modal="true" aria-label={t('menu.settings')} onClick={e => e.stopPropagation()}>
        <h2>{t('menu.settings')}</h2>
        <div className="dtp-setting-row">
          <label>{t('ui.master_volume')}</label>
          <input type="range" min="0" max="1" step="0.1" value={settings.masterVolume}
                 onChange={e => settingsManager.set({ masterVolume: parseFloat(e.target.value) })} />
        </div>
        <div className="dtp-setting-row">
          <label>{t('ui.haptics')}</label>
          <button onClick={() => settingsManager.set({ hapticsEnabled: !settings.hapticsEnabled })}
                  className={`dtp-toggle ${settings.hapticsEnabled ? 'on' : 'off'}`}>
            {settings.hapticsEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label>{t('ui.show_fps')}</label>
          <button onClick={() => settingsManager.set({ showFps: !settings.showFps })}
                  className={`dtp-toggle ${settings.showFps ? 'on' : 'off'}`}>
            {settings.showFps ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label>{t('ui.reduced_motion')}</label>
          <button onClick={() => settingsManager.set({ reducedMotion: !settings.reducedMotion })}
                  className={`dtp-toggle ${settings.reducedMotion ? 'on' : 'off'}`}>
            {settings.reducedMotion ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label>{t('ui.offset_cursor')}</label>
          <button onClick={onToggleOffset}
                  className={`dtp-toggle ${showOffset ? 'on' : 'off'}`}
                  aria-label={t('ui.offset_cursor')}
                  aria-pressed={showOffset}>
            {showOffset ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label><span className="dtp-text-label">{visualA11y.icons.colorblind} {t('ui.colorblind')}</span></label>
          <button onClick={() => settingsManager.set({ colorblindMode: !settings.colorblindMode })}
                  className={`dtp-toggle ${settings.colorblindMode ? 'on' : 'off'}`}
                  data-icon={visualA11y.icons.colorblind}>
            {settings.colorblindMode ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label><span className="dtp-text-label">{visualA11y.icons.iconMode} {t('ui.icon_mode')}</span></label>
          <button onClick={() => settingsManager.set({ iconOnlyMode: !settings.iconOnlyMode })}
                  className={`dtp-toggle ${settings.iconOnlyMode ? 'on' : 'off'}`}
                  data-icon={visualA11y.icons.iconMode}>
            {settings.iconOnlyMode ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label><span className="dtp-text-label">{visualA11y.icons.lite} {t('ui.lite_mode')}</span></label>
          <button onClick={() => settingsManager.set({ liteMode: !settings.liteMode })}
                  className={`dtp-toggle ${settings.liteMode ? 'on' : 'off'}`}
                  data-icon={visualA11y.icons.lite}>
            {settings.liteMode ? 'ON' : 'OFF'}
          </button>
        </div>
        <button className="dtp-btn dtp-btn-secondary" onClick={onClose}>{t('ui.close')}</button>
      </div>
    </div>
  );
});
