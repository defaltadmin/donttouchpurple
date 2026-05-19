// Input normalizer - converts platform-specific events to unified InputEvent format
import type { KeyInputEvent, GamepadInputEvent, TouchInputEvent, MouseInputEvent } from './types';

export class InputNormalizer {
  private static instance: InputNormalizer;
  private gamepadStates = new Map<number, Gamepad>();

  static getInstance(): InputNormalizer {
    if (!InputNormalizer.instance) {
      InputNormalizer.instance = new InputNormalizer();
    }
    return InputNormalizer.instance;
  }

  // Keyboard events
  normalizeKeyboard(event: KeyboardEvent, state: 'down' | 'up'): KeyInputEvent {
    return {
      type: 'key',
      source: 'keyboard',
      timestamp: Date.now(),
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
      state,
      preventDefault: false
    };
  }

  // Gamepad events
  normalizeGamepad(gamepad: Gamepad, previousState?: Gamepad): GamepadInputEvent[] {
    const events: GamepadInputEvent[] = [];
    const now = Date.now();

    // Check buttons
    gamepad.buttons.forEach((button, index) => {
      const prevPressed = previousState?.buttons[index]?.pressed ?? false;
      if (button.pressed !== prevPressed) {
        events.push({
          type: 'gamepad',
          source: 'gamepad',
          timestamp: now,
          button: index,
          value: button.value,
          state: button.pressed ? 'pressed' : 'released',
          gamepadIndex: gamepad.index
        });
      }
    });

    // Check axes (with deadzone)
    const deadzone = 0.1;
    gamepad.axes.forEach((axis, index) => {
      const prevAxis = previousState?.axes[index] ?? 0;
      const absAxis = Math.abs(axis);
      const absPrev = Math.abs(prevAxis);

      // Only emit if crossing deadzone threshold
      if ((absAxis > deadzone) !== (absPrev > deadzone) || Math.abs(axis - prevAxis) > 0.05) {
        events.push({
          type: 'gamepad',
          source: 'gamepad',
          timestamp: now,
          axis: index,
          value: axis,
          state: 'axis',
          gamepadIndex: gamepad.index
        });
      }
    });

    return events;
  }

  // Touch events
  normalizeTouch(event: TouchEvent, state: 'start' | 'move' | 'end'): TouchInputEvent[] {
    return Array.from(event.changedTouches).map(touch => ({
      type: 'touch',
      source: 'touch',
      timestamp: Date.now(),
      x: touch.clientX,
      y: touch.clientY,
      force: touch.force,
      state,
      identifier: touch.identifier
    }));
  }

  // Mouse events
  normalizeMouse(event: MouseEvent, state: 'down' | 'up' | 'move'): MouseInputEvent {
    return {
      type: 'mouse',
      source: 'mouse',
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      state
    };
  }

  // Update gamepad state for comparison
  updateGamepadState(gamepad: Gamepad): void {
    this.gamepadStates.set(gamepad.index, { ...gamepad });
  }

  getGamepadState(index: number): Gamepad | undefined {
    return this.gamepadStates.get(index);
  }
}