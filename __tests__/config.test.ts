import { describe, it, expect, beforeEach } from 'vitest';
import { configManager } from '../utils/game-config';

describe('ConfigManager', () => {
  beforeEach(() => localStorage.clear());

  it('should load defaults when no storage exists', () => {
    const cfg = configManager.load();
    expect(cfg.difficulty.initialHearts).toBe(3);
    expect(cfg.version).toBe(1);
  });

  it('should merge partial updates with defaults', () => {
    configManager.load({ grid: { cols: 8 } } as any);
    const cfg = configManager.get();
    expect(cfg.grid.cols).toBe(8);
    expect(cfg.difficulty.baseTime).toBe(60);
  });
});
