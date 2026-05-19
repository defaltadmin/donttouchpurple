// Unified input event types for all input sources
export type InputSource = 'keyboard' | 'gamepad' | 'touch' | 'mouse';

export interface BaseInputEvent {
  source: InputSource;
  timestamp: number;
  preventDefault?: boolean;
}

export interface KeyInputEvent extends BaseInputEvent {
  type: 'key';
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  state: 'down' | 'up';
}

export interface GamepadInputEvent extends BaseInputEvent {
  type: 'gamepad';
  button?: number;
  axis?: number;
  value: number;
  state: 'pressed' | 'released' | 'axis';
  gamepadIndex: number;
}

export interface TouchInputEvent extends BaseInputEvent {
  type: 'touch';
  x: number;
  y: number;
  force?: number;
  state: 'start' | 'move' | 'end';
  identifier: number;
}

export interface MouseInputEvent extends BaseInputEvent {
  type: 'mouse';
  x: number;
  y: number;
  button: number;
  state: 'down' | 'up' | 'move';
}

export type InputEvent =
  | KeyInputEvent
  | GamepadInputEvent
  | TouchInputEvent
  | MouseInputEvent;

export interface InputConfig {
  deadzone: number;
  repeatDelay: number;
  repeatRate: number;
  hapticFeedback: boolean;
}