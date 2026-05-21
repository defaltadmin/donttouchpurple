import { logger } from './logger';

interface Asset { url: string; type: 'image' | 'audio' | 'font'; progress: number; }

export class Preloader {
  private queue: Asset[] = [];
  private loaded = 0;
  private timeoutMs = 8000;
  private onProgressCb?: (pct: number) => void;

  add(url: string, type: Asset['type'] = 'image') {
    this.queue.push({ url, type, progress: 0 });
  }

  setProgress(cb: (pct: number) => void) { this.onProgressCb = cb; }

  async loadAll(): Promise<void> {
    if (this.queue.length === 0) return;
    logger.info(`Preloading ${this.queue.length} assets...`);

    const tasks = this.queue.map(asset => this.loadAsset(asset));
    await Promise.allSettled(tasks);

    const success = this.loaded;
    logger.info(`Preload complete: ${success}/${this.queue.length} loaded`);
  }

  private async loadAsset(asset: Asset) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);

      // Just prime the browser cache — no need to read the response body
      const res = await fetch(asset.url, { signal: ctrl.signal, cache: 'force-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Consume body to free connection (but don't allocate arrayBuffer)
      await res.text().catch(() => {});

      clearTimeout(timer);
      asset.progress = 1;
      this.loaded++;
      this.onProgressCb?.(this.loaded / this.queue.length);
    } catch (e) {
      logger.warn(`Asset failed: ${asset.url}`, e);
      asset.progress = 0;
    }
  }
}
