interface ComboState { count: number; lastTap: number; multiplier: number; }
const COMBO_WINDOW = 1200;
const MULTIPLIER_STEPS = [1, 1.2, 1.5, 2.0, 2.5];

export const rhythmFeedback = {
  state: { count: 0, lastTap: 0, multiplier: 1 } as ComboState,
  _shakeTimer: null as ReturnType<typeof setTimeout> | null,

  recordTap() {
    const now = performance.now();
    if (now - this.state.lastTap > COMBO_WINDOW) this.reset();
    this.state.lastTap = now;
    this.state.count++;
    const idx = Math.min(this.state.count - 1, MULTIPLIER_STEPS.length - 1);
    this.state.multiplier = MULTIPLIER_STEPS[idx];
    this._dispatch();
    return this.state.multiplier;
  },

  reset() {
    if (this._shakeTimer) { clearTimeout(this._shakeTimer); this._shakeTimer = null; }
    this.state = { count: 0, lastTap: 0, multiplier: 1 };
    this._dispatch();
  },

  _dispatch() {
    window.dispatchEvent(new CustomEvent('dtp:combo', { detail: { ...this.state } }));
    if (this.state.count > 0 && this.state.count % 5 === 0) {
      if (this._shakeTimer) clearTimeout(this._shakeTimer);
      document.documentElement.style.setProperty('--shake-intensity', '1');
      this._shakeTimer = setTimeout(() => {
        document.documentElement.style.setProperty('--shake-intensity', '0');
        this._shakeTimer = null;
      }, 150);
    }
  }
};
