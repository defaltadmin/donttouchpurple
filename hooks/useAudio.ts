// hooks/useAudio.ts
// Extracted from useGameEngine.ts — all Web Audio API logic lives here.
// React-free: safe to import from engine layer or any hook.

type SoundType = "ok" | "bad" | "tick" | "powerup" | "levelup" | "shuffle" | "rareStart" | "claim" | "bomb" | "bossStart";

let _actx: AudioContext | null = null;
let _masterGain: GainNode | null = null;
let _muted = false;
let _volume = 0.7;
let _haptics = true;

export function setAudioMuted(muted: boolean): void { _muted = muted; }
export function setHapticsEnabled(enabled: boolean): void { _haptics = enabled; }
export function setAudioVolume(v: number): void {
  _volume = Math.max(0, Math.min(1, v));
  if (_masterGain) _masterGain.gain.setValueAtTime(_volume, _masterGain.context.currentTime);
}

export function playVolumeChime(): void {
  if (_muted) return;
  try {
    const ctx = getACtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(_masterGain!);
    const t = ctx.currentTime;
    o.type = "sine";
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(1100, t + 0.08);
    g.gain.setValueAtTime(_volume * 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.start(); o.stop(t + 0.15);
  } catch {}
}

// M3: Export for use in RewardsHub dust claim
export function playSoundEffect(name: "shuffle" | "rareStart" | "claim" | "bomb" | "bossStart"): void {
  playSound(name);
}

export function playSound(type: SoundType, pitchMult: number = 1): void {
  try {
    if (_haptics && navigator.vibrate) {
      if (type === "bad") navigator.vibrate(50);
      else if (type === "powerup" || type === "levelup") navigator.vibrate([30, 20, 30]);
      else navigator.vibrate(15);
    }
  } catch {}
  if (_muted) return;
  try {
    const ctx = getACtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(_masterGain!);
    const t = ctx.currentTime;
    if (type === "ok") {
      const baseFreq = 880 * pitchMult;
      const endFreq = 1320 * pitchMult;
      o.type = "sine"; o.frequency.setValueAtTime(baseFreq, t); o.frequency.exponentialRampToValueAtTime(endFreq, t + 0.08);
      g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.start(); o.stop(t + 0.12);
    } else if (type === "bad") {
      o.type = "sawtooth"; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.25);
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.start(); o.stop(t + 0.28);
    } else if (type === "powerup") {
      o.type = "sine"; o.frequency.setValueAtTime(660, t); o.frequency.exponentialRampToValueAtTime(1320, t + 0.15);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(); o.stop(t + 0.2);
    } else if (type === "levelup") {
      o.type = "triangle";
      o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(660, t + 0.1); o.frequency.setValueAtTime(880, t + 0.2);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.start(); o.stop(t + 0.35);
    } else if (type === "shuffle") {
      // M1: short descending swoosh
      o.type = "sine"; o.frequency.setValueAtTime(600, t); o.frequency.exponentialRampToValueAtTime(200, t + 0.14);
      g.gain.setValueAtTime(0.09, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.start(); o.stop(t + 0.14);
    } else if (type === "rareStart") {
      // M2: rising stinger — triangle wave arp
      o.type = "triangle"; o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(660, t + 0.06); o.frequency.setValueAtTime(990, t + 0.12);
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(); o.stop(t + 0.22);
    } else if (type === "claim") {
      // M3: satisfying chime — two-note chord
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.connect(g2); g2.connect(_masterGain!);
      o.type = "sine"; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1100, t + 0.18);
      g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(); o.stop(t + 0.22);
      o2.type = "sine"; o2.frequency.setValueAtTime(1320, t); o2.frequency.exponentialRampToValueAtTime(1760, t + 0.18);
      g2.gain.setValueAtTime(0.1, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o2.start(); o2.stop(t + 0.22);
    } else if (type === "bomb") {
      o.type = "square"; o.frequency.setValueAtTime(120, t); o.frequency.setValueAtTime(80, t + 0.08);
      g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.start(); o.stop(t + 0.18);
    } else if (type === "bossStart") {
      o.type = "sawtooth"; o.frequency.setValueAtTime(880, t); o.frequency.setValueAtTime(660, t + 0.08); o.frequency.setValueAtTime(440, t + 0.16);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(); o.stop(t + 0.3);
    } else {
      o.type = "square"; o.frequency.setValueAtTime(330, t);
      g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      o.start(); o.stop(t + 0.04);
    }
  } catch { /* ignore */ }
}

function getACtx(): AudioContext {
  if (!_actx) {
    _actx = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    _masterGain = _actx.createGain();
    _masterGain.gain.setValueAtTime(_volume, _actx.currentTime);
    _masterGain.connect(_actx.destination);
  }
  return _actx;
}
