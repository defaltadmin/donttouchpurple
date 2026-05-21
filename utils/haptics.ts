let _enabled = true;

export function setHapticsEnabledForEngine(enabled: boolean): void {
  _enabled = enabled;
}

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

function vibrate(pattern: number | number[]): void {
  if (!_enabled || !canVibrate()) return;
  try { navigator.vibrate(pattern); } catch { /* vibrate blocked or unsupported */ }
}

// For Capacitor: use @capacitor/haptics Haptics.vibrate() instead of navigator.vibrate
// when running in a native container. The web fallback above handles PWA/browser.

export const haptics = {
  tap: () => vibrate(8),
  success: () => vibrate([12, 8, 8]),
  damage: () => vibrate([20, 30, 20]),
  bomb: () => vibrate([40, 20, 60, 20, 40]),
  /** Shield activation — firm double-tap */
  shield: () => vibrate([15, 40, 15]),
  /** Freeze — staccato shiver */
  freeze: () => vibrate([6, 8, 6, 8, 6]),
  /** Multiplier pickup — rising buzz */
  multiplier: () => vibrate([8, 6, 12, 6, 18]),
  /** Combo streak — escalating intensity */
  combo: (streak: number) => {
    const intensity = Math.min(streak * 3, 30);
    vibrate([intensity, 10, intensity]);
  },
  /** Level up — celebratory burst */
  levelUp: () => vibrate([10, 15, 10, 15, 30]),
  /** Medpack heal — gentle pulse */
  medpack: () => vibrate([12, 20, 12]),
};
