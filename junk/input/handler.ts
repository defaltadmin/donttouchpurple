// Unified input handler - manages all input sources and provides clean API
import { InputNormalizer } from './normalizer';
import type { InputEvent, InputConfig } from './types';

export class UnifiedInputHandler {
  private normalizer = InputNormalizer.getInstance();
  private listeners = new Set<(event: InputEvent) => void>();
  private config: InputConfig;
  private boundHandlers: Record<string, (event: Event) => void> = {};
  private repeatTimers = new Map<string, NodeJS.Timeout>();
  private gamepadPolling?: number;

  constructor(config: Partial<InputConfig> = {}) {
    this.config = {
      deadzone: 0.1,
      repeatDelay: 500,
      repeatRate: 50,
      hapticFeedback: true,
      ...config
    };
  }

  // Subscribe to input events
  subscribe(callback: (event: InputEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Emit event to all listeners
  private emit(event: InputEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[InputHandler] Listener error:', error);
      }
    });
  }

  // Start listening for all input types
  start(): void {
    this.setupKeyboard();
    this.setupGamepad();
    this.setupTouch();
    this.setupMouse();
  }

  // Stop listening
  stop(): void {
    window.removeEventListener('keydown', this.boundHandlers.keydown);
    window.removeEventListener('keyup', this.boundHandlers.keyup);
    window.removeEventListener('touchstart', this.boundHandlers.touchstart);
    window.removeEventListener('touchmove', this.boundHandlers.touchmove);
    window.removeEventListener('touchend', this.boundHandlers.touchend);
    window.removeEventListener('mousedown', this.boundHandlers.mousedown);
    window.removeEventListener('mouseup', this.boundHandlers.mouseup);
    window.removeEventListener('mousemove', this.boundHandlers.mousemove);
    this.listeners.clear();
    if (this.gamepadPolling) {
      cancelAnimationFrame(this.gamepadPolling);
      this.gamepadPolling = undefined;
    }
    this.repeatTimers.forEach(clearTimeout);
    this.repeatTimers.clear();
  }

  private setupKeyboard(): void {
    const handleKey = (event: KeyboardEvent, state: 'down' | 'up') => {
      const inputEvent = this.normalizer.normalizeKeyboard(event, state);
      this.emit(inputEvent);

      // Handle key repeat for held keys
      if (state === 'down' && !event.repeat) {
        this.startKeyRepeat(inputEvent);
      } else if (state === 'up') {
        this.stopKeyRepeat(inputEvent.code);
      }
    };

    this.boundHandlers.keydown = (e: KeyboardEvent) => handleKey(e, 'down');
    this.boundHandlers.keyup = (e: KeyboardEvent) => handleKey(e, 'up');

    window.addEventListener('keydown', this.boundHandlers.keydown);
    window.addEventListener('keyup', this.boundHandlers.keyup);
  }

  private setupGamepad(): void {
    const pollGamepads = () => {
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (gamepad) {
          const previousState = this.normalizer.getGamepadState(i);
          const events = this.normalizer.normalizeGamepad(gamepad, previousState);
          events.forEach(event => this.emit(event));
          this.normalizer.updateGamepadState(gamepad);
        }
      }
      this.gamepadPolling = requestAnimationFrame(pollGamepads);
    };

    // Start polling
    this.gamepadPolling = requestAnimationFrame(pollGamepads);
  }

  private setupTouch(): void {
    const handleTouch = (event: TouchEvent, state: 'start' | 'move' | 'end') => {
      const inputEvents = this.normalizer.normalizeTouch(event, state);
      inputEvents.forEach(inputEvent => this.emit(inputEvent));
    };

    this.boundHandlers.touchstart = (e: TouchEvent) => handleTouch(e, 'start');
    this.boundHandlers.touchmove = (e: TouchEvent) => handleTouch(e, 'move');
    this.boundHandlers.touchend = (e: TouchEvent) => handleTouch(e, 'end');

    window.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: false });
    window.addEventListener('touchmove', this.boundHandlers.touchmove, { passive: false });
    window.addEventListener('touchend', this.boundHandlers.touchend, { passive: false });
  }

  private setupMouse(): void {
    const handleMouse = (event: MouseEvent, state: 'down' | 'up' | 'move') => {
      const inputEvent = this.normalizer.normalizeMouse(event, state);
      this.emit(inputEvent);
    };

    this.boundHandlers.mousedown = (e: MouseEvent) => handleMouse(e, 'down');
    this.boundHandlers.mouseup = (e: MouseEvent) => handleMouse(e, 'up');
    this.boundHandlers.mousemove = (e: MouseEvent) => handleMouse(e, 'move');

    window.addEventListener('mousedown', this.boundHandlers.mousedown);
    window.addEventListener('mouseup', this.boundHandlers.mouseup);
    window.addEventListener('mousemove', this.boundHandlers.mousemove);
  }

  private startKeyRepeat(event: InputEvent): void {
    if (event.type !== 'key') return;

    const key = event.code;
    this.repeatTimers.set(key, setTimeout(() => {
      this.emitKeyRepeat(event);
    }, this.config.repeatDelay));
  }

  private stopKeyRepeat(key: string): void {
    const timer = this.repeatTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.repeatTimers.delete(key);
    }
  }

  private emitKeyRepeat(originalEvent: InputEvent): void {
    if (originalEvent.type !== 'key') return;

    const repeatEvent: InputEvent = {
      ...originalEvent,
      timestamp: Date.now(),
      repeat: true
    };

    this.emit(repeatEvent);

    // Schedule next repeat
    this.repeatTimers.set(originalEvent.code, setTimeout(() => {
      this.emitKeyRepeat(originalEvent);
    }, this.config.repeatRate));
  }
}