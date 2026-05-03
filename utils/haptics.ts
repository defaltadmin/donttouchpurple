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
