import { logger } from './logger';

type AssetTier = 'critical' | 'deferred' | 'background';
interface Asset { id: string; url: string; type: 'audio' | 'image' | 'json'; tier: AssetTier; loaded: boolean; }

export class AssetHydrator {
  private queue: Asset[] = [];
  private progressCb?: (pct: number, tier: AssetTier) => void;
  private audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

  add(url: string, tier: AssetTier, type: Asset['type'] = 'image', id?: string) {
    this.queue.push({ id: id || url, url, type, tier, loaded: false });
  }

  setProgress(cb: (pct: number, tier: AssetTier) => void) { this.progressCb = cb; }

  async hydrateAll(): Promise<void> {
    const critical = this.queue.filter(a => a.tier === 'critical');
    const deferred = this.queue.filter(a => a.tier === 'deferred');
    const background = this.queue.filter(a => a.tier === 'background');

    await this._loadTier(critical, 'critical');
    await this._loadTier(deferred, 'deferred');
    // Load background assets non-blocking after 1s idle
    setTimeout(() => this._loadTier(background, 'background'), 1000);
  }

  private async _loadTier(assets: Asset[], tier: AssetTier) {
    if (assets.length === 0) return;
    let loaded = 0;
    const tasks = assets.map(async (a) => {
      try {
        const res = await fetch(a.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (a.type === 'audio') await this.audioCtx.decodeAudioData(await res.arrayBuffer());
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
}
