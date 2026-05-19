import { logger } from './logger';

interface Asset { id: string; url: string; type: 'image' | 'audio' | 'critical'; }

export class AssetGate {
  private queue: Asset[] = [];
  private loaded = 0;
  private onProgress?: (pct: number) => void;

  add(url: string, type: Asset['type'] = 'critical', id?: string) {
    this.queue.push({ id: id || url, url, type });
  }

  setProgress(cb: (pct: number) => void) { this.onProgress = cb; }

  async loadAll(): Promise<void> {
    if (this.queue.length === 0) return;
    const audioCtx = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const tasks = this.queue.map(a => this.decodeOrFetch(a, audioCtx));
    await Promise.allSettled(tasks);
    logger.info('Asset gate cleared');
  }

  private async decodeOrFetch(asset: Asset, audioCtx: AudioContext): Promise<void> {
    try {
      const res = await fetch(asset.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      if (asset.type === 'audio') {
        await audioCtx.decodeAudioData(await res.arrayBuffer());
      }
      this.loaded++;
      this.onProgress?.(this.loaded / this.queue.length);
    } catch (e) {
      logger.warn(`Asset failed: ${asset.id}`, e);
    }
  }
}
