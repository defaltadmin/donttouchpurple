/**
 * FPS cap utility for battery-aware and background-aware frame throttling.
 * Used by canvas backgrounds to reduce GPU load on mobile devices.
 */

let _lowBattery = false;
let _isCharging = true;
let _batteryLevel = 1;

// Battery API (not available in all browsers)
interface BatteryManager {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: () => void): void;
}

if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
  (navigator as unknown as { getBattery(): Promise<BatteryManager> }).getBattery().then((battery: BatteryManager) => {
    _batteryLevel = battery.level;
    _isCharging = battery.charging;
    _lowBattery = _batteryLevel < 0.2 && !_isCharging;

    battery.addEventListener('levelchange', () => {
      _batteryLevel = battery.level;
      _lowBattery = _batteryLevel < 0.2 && !_isCharging;
    });
    battery.addEventListener('chargingchange', () => {
      _isCharging = battery.charging;
      _lowBattery = _batteryLevel < 0.2 && !_isCharging;
    });
  }).catch(() => { /* Battery API unavailable */ });
}

/**
 * Should skip this frame? Returns true to skip.
 * @param frameCount - Current frame counter
 * @param reducedMotion - Whether reduced motion is preferred
 */
export function shouldSkipFrame(frameCount: number, reducedMotion: boolean): boolean {
  // Skip every other frame when reduced motion preferred (30fps cap)
  if (reducedMotion && frameCount % 2 !== 0) return true;

  // Skip every other frame on low battery (30fps cap)
  if (_lowBattery && frameCount % 2 !== 0) return true;

  // Skip 3 of 4 frames when page is hidden (15fps cap)
  if (typeof document !== 'undefined' && document.hidden && frameCount % 4 !== 0) return true;

  return false;
}

