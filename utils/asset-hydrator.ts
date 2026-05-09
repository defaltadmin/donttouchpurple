// utils/asset-hydrator.ts
import { logger } from './logger';

type AssetTier = 'critical' | 'deferred' | 'background';
interface Asset { id: string; url: string; type: 'audio' | 'image' | 'json'; tier: AssetTier; loaded: boolean; }

export class AssetHydrator {
  private queue: Asset[] = [];
  private progressCb?: (pct: number, tier: AssetTier) => void;
  private _audioCtx: AudioContext | null = null;
  private decodedBuffers = new Map<string, AudioBuffer>();

  /** Lazy — only created after a user gesture, never on class instantiation. */
  private get audioCtx(): AudioContext {
    if (!this._audioCtx) {
      this._audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return this._audioCtx;
  }

  add(url: string, tier: AssetTier, type: Asset['type'] = 'image', id?: string) {
    this.queue.push({ id: id || url, url, type, tier, loaded: false });
  }

  setProgress(cb: (pct: number, tier: AssetTier) => void) { this.progressCb = cb; }

  getBuffer(id: string): AudioBuffer | undefined {
    return this.decodedBuffers.get(id);
  }

  async hydrateAll(): Promise<void> {
    const critical   = this.queue.filter(a => a.tier === 'critical');
    const deferred   = this.queue.filter(a => a.tier === 'deferred');
    const background = this.queue.filter(a => a.tier === 'background');

    await this._loadTier(critical, 'critical');
    await this._loadTier(deferred, 'deferred');
    // Non-blocking: background assets after 1 s idle
    setTimeout(() => this._loadTier(background, 'background'), 1000);
  }

  private async _loadTier(assets: Asset[], tier: AssetTier) {
    if (assets.length === 0) return;
    let loaded = 0;
    const tasks = assets.map(async (a) => {
      try {
        const res = await fetch(a.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (a.type === 'audio') {
          const buf = await this.audioCtx.decodeAudioData(await res.arrayBuffer());
          this.decodedBuffers.set(a.id, buf);   // store — don't throw away
        }
        a.loaded = true;
        loaded++;
        this.progressCb?.(loaded / assets.length, tier);
      } catch (e) {
        logger.warn(`Hydration failed [${tier}]: ${a.id}`, e);
        loaded++;
      }
    });
    await Promise.allSettled(tasks);
    logger.info(`✅ Hydration complete: ${tier} (${loaded}/${assets.length})`);
  }

  getProgress(tier: AssetTier): number {
    const assets = this.queue.filter(a => a.tier === tier);
    if (assets.length === 0) return 1;
    return assets.filter(a => a.loaded).length / assets.length;
  }

  /** Call during App unmount / safeReset to release OS audio resources. */
  async dispose(): Promise<void> {
    if (this._audioCtx) {
      await this._audioCtx.close();
      this._audioCtx = null;
    }
    this.decodedBuffers.clear();
  }
}
