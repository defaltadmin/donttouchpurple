export const haptics = {
  tap: () => { try { navigator.vibrate?.(8); } catch {} },
  success: () => { try { navigator.vibrate?.([12, 8, 8]); } catch {} },
  damage: () => { try { navigator.vibrate?.([20, 30, 20]); } catch {} },
  ice: () => { try { navigator.vibrate?.([8, 12, 6, 15, 6]); } catch {} },
  bomb: () => { try { navigator.vibrate?.([40, 20, 60, 20, 40]); } catch {} },
  heavy: () => { try { navigator.vibrate?.(50); } catch {} },
  disable: () => { try { navigator.vibrate?.(0); } catch {} },
};
