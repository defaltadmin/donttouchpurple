import { logger } from './logger';

type GamepadButton = 'dpad_up' | 'dpad_down' | 'dpad_left' | 'dpad_right' | 'a' | 'b' | 'start';
const BUTTON_MAP: Record<number, GamepadButton> = { 0: 'a', 1: 'b', 9: 'start', 12: 'dpad_up', 13: 'dpad_down', 14: 'dpad_left', 15: 'dpad_right' };

export const gamepadManager = {
  connected: false,
  activeId: null as number | null,
  listeners: new Set<(btn: GamepadButton, state: 'press' | 'release') => void>(),
  _initialized: false,

  init() {
    if (this._initialized) return;
    this._initialized = true;
    window.addEventListener('gamepadconnected', (e) => {
      this.connected = true;
      this.activeId = e.gamepad.index;
      logger.info('Gamepad connected', e.gamepad.id);
      this.startPolling();
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.connected = false;
      this.activeId = null;
      logger.info('Gamepad disconnected');
    });
  },

  startPolling() {
    const poll = () => {
      if (!this.connected) return;
      const pad = navigator.getGamepads()[this.activeId!];
      if (!pad) { requestAnimationFrame(poll); return; }

      pad.buttons.forEach((b, i) => {
        const name = BUTTON_MAP[i];
        if (!name) return;
        if (b.pressed) this._trigger(name, 'press');
        else this._trigger(name, 'release');
      });

      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  },

  on(cb: (btn: GamepadButton, state: 'press' | 'release') => void) {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  },

  _trigger(btn: GamepadButton, state: 'press' | 'release') {
    if (state === 'press') this.listeners.forEach(cb => cb(btn, state));
  }
};
