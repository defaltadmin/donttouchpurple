import { logger } from './logger';

type SoundType = 'sfx' | 'music' | 'ambient';
interface AudioOptions { volume?: number; loop?: boolean; pitch?: number; }

class AudioEngine {
  private ctx: AudioContext | null = null;
  private gainNodes: Record<SoundType, GainNode> = { sfx: null!, music: null!, ambient: null! };
  private buffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private _initialized = false;

  async init(): Promise<void> {
    if (this._initialized) return;
    try {
      const WebAudioContext = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!WebAudioContext) { logger.warn('Web Audio not supported'); return; }
      this.ctx = new WebAudioContext();

      (['sfx', 'music', 'ambient'] as SoundType[]).forEach(type => {
        this.gainNodes[type] = this.ctx!.createGain();
        this.gainNodes[type].connect(this.ctx!.destination);
        this.gainNodes[type].gain.value = type === 'music' ? 0.4 : 0.7;
      });
      this._initialized = true;
      logger.info('Audio engine initialized');
    } catch (e) {
      logger.error('Audio init failed', e);
    }
  }

  async load(id: string, url: string): Promise<void> {
    if (!this.ctx || !this._initialized) await this.init();
    if (!this.ctx || this.buffers.has(id)) return;
    // Only allow same-origin or relative URLs to prevent SSRF
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        logger.warn('Audio load blocked: cross-origin URL rejected');
        return;
      }
    } catch {
      logger.warn('Audio load blocked: invalid URL');
      return;
    }
    try {
      const res = await fetch(url);
      const arrBuf = await res.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arrBuf);
      this.buffers.set(id, buffer);
    } catch (e) { logger.warn(`Failed to load audio: ${id}`, e); }
  }

  play(id: string, opts: AudioOptions = {}): string | null {
    if (!this.ctx || !this.buffers.has(id)) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers.get(id)!;
    source.playbackRate.value = opts.pitch ?? 1;
    source.loop = opts.loop ?? false;

    const type = id.includes('music') || id.includes('bgm') ? 'music' : 'sfx';
    const _gain = opts.volume ?? (type === 'music' ? 0.4 : 0.7);

    source.connect(this.gainNodes[type]);
    source.start();

    const cleanId = `${id}_${Date.now()}`;
    this.activeSources.set(cleanId, source);
    source.onended = () => this.activeSources.delete(cleanId);
    return cleanId;
  }

  stop(id: string): void {
    const source = this.activeSources.get(id);
    if (source) { source.onended = null; source.stop(); this.activeSources.delete(id); }
  }

  stopAll(): void { Array.from(this.activeSources.keys()).forEach(k => this.stop(k)); }

  setVolume(type: SoundType, level: number): void {
    const clamped = Math.max(0, Math.min(1, level));
    if (this.gainNodes[type]) {
      this.gainNodes[type].gain.setTargetAtTime(clamped, this.ctx!.currentTime, 0.05);
      localStorage.setItem(`dtp:vol:${type}`, String(clamped));
    }
  }

  restoreVolumes(): void {
    (['sfx', 'music', 'ambient'] as SoundType[]).forEach(type => {
      const saved = parseFloat(localStorage.getItem(`dtp:vol:${type}`) || '1');
      this.setVolume(type, isNaN(saved) ? 0.7 : saved);
    });
  }

  get initialized(): boolean { return this._initialized; }
}

export const audioEngine = new AudioEngine();
