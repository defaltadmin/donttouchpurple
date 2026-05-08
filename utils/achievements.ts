import { logger } from './logger';

export interface Achievement { id: string; name: string; desc: string; icon: string; unlocked: boolean; date?: string; }
const ACH_KEY = 'dtp:achievements';
const TOAST_KEY = 'dtp:achievement-toasts';

export const achievementSystem = {
  registry: new Map<string, Achievement>(),
  unlocked: new Set<string>(),

  register(ach: Achievement) { this.registry.set(ach.id, ach); },

  isUnlocked(id: string) { return this.unlocked.has(id); },

  check(id: string, condition: () => boolean): boolean {
    if (this.unlocked.has(id) || !this.registry.has(id)) return false;
    if (condition()) {
      this.unlock(id);
      return true;
    }
    return false;
  },

  unlock(id: string) {
    const ach = this.registry.get(id);
    if (!ach || this.unlocked.has(id)) return;
    ach.unlocked = true;
    ach.date = new Date().toISOString();
    this.unlocked.add(id);
    localStorage.setItem(ACH_KEY, JSON.stringify([...this.unlocked]));
    const queue = JSON.parse(localStorage.getItem(TOAST_KEY) || '[]');
    queue.push({ id, name: ach.name, icon: ach.icon, ts: Date.now() });
    localStorage.setItem(TOAST_KEY, JSON.stringify(queue.slice(-5)));
    logger.info('🏆 Achievement unlocked:', ach.name);
    window.dispatchEvent(new CustomEvent('dtp:achievement', { detail: ach }));
  },

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(ACH_KEY) || '[]');
      this.unlocked = new Set(saved);
    } catch {}
  },

  getProgress(): { total: number; unlocked: number; list: Achievement[] } {
    const list = [...this.registry.values()];
    return { total: list.length, unlocked: this.unlocked.size, list };
  }
};
