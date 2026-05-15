export const haptics = {
  tap: () => { try { navigator.vibrate?.(8); } catch (_) { /* vibrate unsupported */ } },
  success: () => { try { navigator.vibrate?.([12, 8, 8]); } catch (_) { /* vibrate unsupported */ } },
  damage: () => { try { navigator.vibrate?.([20, 30, 20]); } catch (_) { /* vibrate unsupported */ } },
  ice: () => { try { navigator.vibrate?.([8, 12, 6, 15, 6]); } catch (_) { /* vibrate unsupported */ } },
  bomb: () => { try { navigator.vibrate?.([40, 20, 60, 20, 40]); } catch (_) { /* vibrate unsupported */ } },
  heavy: () => { try { navigator.vibrate?.(50); } catch (_) { /* vibrate unsupported */ } },
  disable: () => { try { navigator.vibrate?.(0); } catch (_) { /* vibrate unsupported */ } },
};
