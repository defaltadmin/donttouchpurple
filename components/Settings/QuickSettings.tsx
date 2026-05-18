import React from "react";
import { settingsManager } from "../../utils/settings";

interface QuickSettingsProps {
  showOffset: boolean;
  onToggleOffset: () => void;
  visualA11y: any;
  onClose: () => void;
}

export const QuickSettings = React.memo(function QuickSettings({
  showOffset, onToggleOffset, visualA11y, onClose,
}: QuickSettingsProps) {
  const settings = settingsManager.get();

  return (
    <div className="dtp-modal-backdrop" onClick={onClose} aria-hidden="true">
      <div className="dtp-modal" role="dialog" aria-modal="true" aria-label="Game Settings" onClick={e => e.stopPropagation()}>
        <h2>Settings</h2>
        <div className="dtp-setting-row">
          <label>Master Volume</label>
          <input type="range" min="0" max="1" step="0.1" value={settings.masterVolume}
                 onChange={e => settingsManager.set({ masterVolume: parseFloat(e.target.value) })} />
        </div>
        <div className="dtp-setting-row">
          <label>Haptics</label>
          <button onClick={() => settingsManager.set({ hapticsEnabled: !settings.hapticsEnabled })}
                  className={`dtp-toggle ${settings.hapticsEnabled ? 'on' : 'off'}`}>
            {settings.hapticsEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label>Show FPS</label>
          <button onClick={() => settingsManager.set({ showFps: !settings.showFps })}
                  className={`dtp-toggle ${settings.showFps ? 'on' : 'off'}`}>
            {settings.showFps ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label>Reduced Motion</label>
          <button onClick={() => settingsManager.set({ reducedMotion: !settings.reducedMotion })}
                  className={`dtp-toggle ${settings.reducedMotion ? 'on' : 'off'}`}>
            {settings.reducedMotion ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label>Offset Touch Cursor</label>
          <button onClick={onToggleOffset}
                  className={`dtp-toggle ${showOffset ? 'on' : 'off'}`}
                  aria-label="Toggle offset touch cursor for mobile visibility"
                  aria-pressed={showOffset}>
            {showOffset ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label><span className="dtp-text-label">{visualA11y.icons.colorblind} Colorblind Patterns</span></label>
          <button onClick={() => settingsManager.set({ colorblindMode: !settings.colorblindMode })}
                  className={`dtp-toggle ${settings.colorblindMode ? 'on' : 'off'}`}
                  data-icon={visualA11y.icons.colorblind}>
            {settings.colorblindMode ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label><span className="dtp-text-label">{visualA11y.icons.iconMode} Icon-Only UI</span></label>
          <button onClick={() => settingsManager.set({ iconOnlyMode: !settings.iconOnlyMode })}
                  className={`dtp-toggle ${settings.iconOnlyMode ? 'on' : 'off'}`}
                  data-icon={visualA11y.icons.iconMode}>
            {settings.iconOnlyMode ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="dtp-setting-row">
          <label><span className="dtp-text-label">{visualA11y.icons.lite} Lite Mode (Low-End)</span></label>
          <button onClick={() => settingsManager.set({ liteMode: !settings.liteMode })}
                  className={`dtp-toggle ${settings.liteMode ? 'on' : 'off'}`}
                  data-icon={visualA11y.icons.lite}>
            {settings.liteMode ? 'ON' : 'OFF'}
          </button>
        </div>
        <button className="dtp-btn dtp-btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
});
