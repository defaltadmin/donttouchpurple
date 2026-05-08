import { logger } from './logger';
import { audioEngine } from './audio';
import { visualA11y } from './visual-a11y';

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  showFps: boolean;
  offsetPointer: boolean;
  colorblindMode: boolean;
  iconOnlyMode: boolean;
  liteMode: boolean;
  keybinds: Record<string, string>;
}

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8, sfxVolume: 0.7, musicVolume: 0.4,
  hapticsEnabled: true, reducedMotion: false, showFps: false,
  offsetPointer: false, colorblindMode: false, iconOnlyMode: false, liteMode: false,
  keybinds: { pause: 'Escape', retry: 'r', toggleFps: 'f' }
};

const STORAGE_KEY = 'dtp:settings';

class SettingsManager {
  private _settings: GameSettings;
  private _listeners: Set<(s: GameSettings) => void> = new Set();

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      this._settings = { ...DEFAULT_SETTINGS, ...saved };
    } catch { this._settings = { ...DEFAULT_SETTINGS }; }
    this.apply();
  }

  get() { return this._settings; }

  set(partial: Partial<GameSettings>) {
    Object.assign(this._settings, partial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
    this.apply();
    this._listeners.forEach(cb => cb({ ...this._settings }));
  }

  subscribe(cb: (s: GameSettings) => void) {
    this._listeners.add(cb);
    return () => { this._listeners.delete(cb); };
  }

  private apply() {
    const { masterVolume, reducedMotion, offsetPointer, colorblindMode, iconOnlyMode, liteMode } = this._settings;
    document.documentElement.style.setProperty('--master-volume', String(masterVolume));
    document.documentElement.style.setProperty('--motion-scale', reducedMotion ? '0' : '1');
    document.documentElement.style.setProperty('--particles-enabled', reducedMotion ? '0' : '1');
    document.documentElement.style.setProperty('--offset-pointer-enabled', offsetPointer ? '1' : '0');
    visualA11y.applyColorblind(colorblindMode);
    visualA11y.applyLiteMode(liteMode);
    document.documentElement.classList.toggle('icon-mode', iconOnlyMode);
    audioEngine.restoreVolumes();
    logger.debug('Settings applied', this._settings);
  }
}

export const settingsManager = new SettingsManager();
