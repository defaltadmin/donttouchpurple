import { logger } from './logger';

interface BossState { active: boolean; shieldHits: number; maxShield: number; phase: number; }
interface ComboState { count: number; windowStart: number; multiplier: number; }

export const bossEngine = {
  state: { active: false, shieldHits: 0, maxShield: 5, phase: 1 } as BossState,
  combo: { count: 0, windowStart: 0, multiplier: 1 } as ComboState,
  _comboTimer: null as ReturnType<typeof setTimeout> | null,
  COMBO_WINDOW_MS: 400,
  COMBO_THRESHOLD: 3,

  activate(maxHits = 5) {
    this.state.active = true;
    this.state.shieldHits = 0;
    this.state.maxShield = maxHits;
    this.state.phase = 1;
    this.resetCombo();
    window.dispatchEvent(new CustomEvent('dtp:boss:activate', { detail: this.state }));
    logger.info('Boss activated', this.state);
  },

  onSafeTap() {
    if (!this.state.active) return;
    this._checkCombo();
    this._applyMultiplier();
    this._dispatchBossUpdate();
  },

  _checkCombo() {
    const now = performance.now();
    if (now - this.combo.windowStart > this.COMBO_WINDOW_MS) {
      this.combo.count = 0;
      this.combo.windowStart = now;
    }
    this.combo.count++;
    if (this.combo.count >= this.COMBO_THRESHOLD) {
      this.combo.multiplier = 2;
      window.dispatchEvent(new CustomEvent('dtp:combo:kill', { detail: { x: 2, duration: 3000 } }));
      this.combo.count = 0;
      if (this._comboTimer) clearTimeout(this._comboTimer);
      this._comboTimer = setTimeout(() => {
        this.combo.multiplier = 1;
        this._comboTimer = null;
        window.dispatchEvent(new CustomEvent('dtp:combo:reset'));
      }, 3000);
    }
  },

  _applyMultiplier() {
    const dmg = this.combo.multiplier;
    this.state.shieldHits = Math.min(this.state.maxShield, this.state.shieldHits + dmg);
    if (this.state.shieldHits >= this.state.maxShield) {
      this._defeatPhase();
    }
  },

  _defeatPhase() {
    window.dispatchEvent(new CustomEvent('dtp:boss:shield-break', { detail: { phase: this.state.phase } }));
    this.state.phase++;
    this.state.shieldHits = 0;
    this.state.maxShield = Math.floor(this.state.maxShield * 1.5);
    this.combo.multiplier = 1;

    if (this.state.phase <= 3) {
      window.dispatchEvent(new CustomEvent('dtp:boss:shuffle-grid', { detail: {} }));
      this.resetCombo();
    } else {
      this.deactivate();
    }
  },

  deactivate() {
    if (!this.state.active) return;
    this.state.active = false;
    this.resetCombo();
    window.dispatchEvent(new CustomEvent('dtp:boss:complete', { detail: {} }));
    logger.info('Boss defeated');
  },

  resetCombo() {
    if (this._comboTimer) { clearTimeout(this._comboTimer); this._comboTimer = null; }
    this.combo = { count: 0, windowStart: 0, multiplier: 1 };
  },

  _dispatchBossUpdate() {
    window.dispatchEvent(new CustomEvent('dtp:boss:update', { detail: { ...this.state } }));
  }
};
