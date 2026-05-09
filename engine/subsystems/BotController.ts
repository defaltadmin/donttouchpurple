import { logger } from '../../utils/logger';

export interface BotConfig {
  getDust: () => number;
  spendDust: (amount: number) => void;
  getAccuracy: () => number;
}

export interface BotCallbacks {
  getDangerColor: () => string;
  isInverted: () => boolean;
  handleTap: (player: 1 | 2, idx: number) => void;
  emit: (event: { type: string; [k: string]: unknown }) => void;
  getActiveCells: (player: 1 | 2) => import('../types').ActiveCell[];
  isPlaying: () => boolean;
}

export class BotController {
  private _active: { 1: boolean; 2: boolean } = { 1: false, 2: false };
  private _intervalRef: ReturnType<typeof setInterval> | null = null;
  private _dustSpentTotal = 0;
  private _rng: (() => number) | null = null;

  constructor(private callbacks: BotCallbacks) {}

  setRng(rng: () => number) { this._rng = rng; }

  start(mode: string, config?: BotConfig): void {
    if (mode !== 'evolve') return;
    this._stop();

    const botCfg: BotConfig = config ?? {
      getDust: () => 9999,
      spendDust: () => {},
      getAccuracy: () => 1,
    };

    this._active[1] = true;
    this._dustSpentTotal = 0;

    this._intervalRef = setInterval(() => {
      if (!this._active[1] || !this.callbacks.isPlaying()) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      const dust = botCfg.getDust();
      if (dust < 30) {
        this._active[1] = false;
        this.callbacks.emit({ type: 'toast', message: '🤖 Bot off — low dust!' });
        return;
      }

      const delay = Math.max(80, 200 - this._dustSpentTotal * 0.5);
      const accuracy = botCfg.getAccuracy();
      const danger = this.callbacks.getDangerColor();
      const costPerTap = 3;
      const rng = this._rng ?? Math.random;

      for (const cell of this.callbacks.getActiveCells(1)) {
        if (cell.clicked) continue;
        if ((cell.type as string) === 'void') continue;
        if (cell.type === danger) continue;
        if (cell.type === 'hold' || cell.type === 'ice') continue;
        if (rng() > accuracy) continue;

        const dustNow = botCfg.getDust();
        if (dustNow < costPerTap) break;

        botCfg.spendDust(costPerTap);
        this._dustSpentTotal += costPerTap;
        this.callbacks.emit({ type: 'dustConsumed', amount: costPerTap });

        const idx = cell.idx;
        setTimeout(() => {
          if (!this._active[1] || !this.callbacks.isPlaying()) return;
          this.callbacks.handleTap(1, idx);
          this.callbacks.emit({ type: 'botTap', player: 1, idx, dustCost: costPerTap });
        }, delay);
      }
    }, 1000);
  }

  private _stop(): void {
    if (this._intervalRef) {
      clearInterval(this._intervalRef);
      this._intervalRef = null;
    }
  }

  stop(): void {
    this._active[1] = false;
    this._stop();
  }

  isActive(): boolean { return this._active[1]; }

  setAssist(player: 1 | 2, enabled: boolean): void {
    this._active[player] = enabled;
    if (player === 1) {
      if (enabled) logger.info('BotController: assist enabled for P1');
      else this.stop();
    }
  }

  getAssistState(): { 1: boolean; 2: boolean } {
    return { ...this._active };
  }

  dispose(): void { this._stop(); this._active = { 1: false, 2: false }; }
}
