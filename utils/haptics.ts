// utils/haptics.ts
export function hapticTap() {
  try { navigator.vibrate?.(10); } catch {}
}

export function hapticDamage() {
  try { navigator.vibrate?.([30, 10, 30]); } catch {}
}

export function hapticLevelUp() {
  try { navigator.vibrate?.([10, 30, 10, 30, 10]); } catch {}
}

export const haptics = {
  tap: () => { try { navigator.vibrate?.(10); } catch {} },
  damage: () => { try { navigator.vibrate?.([30, 20, 30]); } catch {} },
  success: () => { try { navigator.vibrate?.([15, 10]); } catch {} },
  disable: () => { try { navigator.vibrate?.(0); } catch {} },
};
