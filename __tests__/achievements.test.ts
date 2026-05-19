import { describe, it, expect, beforeEach } from 'vitest';
import { achievementSystem } from '../utils/achievements';

describe('achievementSystem', () => {
  beforeEach(() => {
    localStorage.clear();
    achievementSystem.unlocked.clear();
    achievementSystem.registry.clear();
  });

  describe('register', () => {
    it('registers an achievement', () => {
      achievementSystem.register({
        id: 'test-1', name: 'Test', desc: 'A test achievement', icon: '🏆', unlocked: false
      });
      expect(achievementSystem.registry.has('test-1')).toBe(true);
    });
  });

  describe('isUnlocked', () => {
    it('returns false for unregistered achievements', () => {
      expect(achievementSystem.isUnlocked('nonexistent')).toBe(false);
    });

    it('returns false for locked achievements', () => {
      achievementSystem.register({
        id: 'test-2', name: 'Test', desc: 'A test achievement', icon: '🏆', unlocked: false
      });
      expect(achievementSystem.isUnlocked('test-2')).toBe(false);
    });

    it('returns true after unlocking', () => {
      achievementSystem.register({
        id: 'test-3', name: 'Test', desc: 'A test achievement', icon: '🏆', unlocked: false
      });
      achievementSystem.unlock('test-3');
      expect(achievementSystem.isUnlocked('test-3')).toBe(true);
    });
  });

  describe('check', () => {
    it('unlocks when condition is met', () => {
      achievementSystem.register({
        id: 'test-4', name: 'Test', desc: 'A test achievement', icon: '🏆', unlocked: false
      });
      const result = achievementSystem.check('test-4', () => true);
      expect(result).toBe(true);
      expect(achievementSystem.isUnlocked('test-4')).toBe(true);
    });

    it('does not unlock when condition is not met', () => {
      achievementSystem.register({
        id: 'test-5', name: 'Test', desc: 'A test achievement', icon: '🏆', unlocked: false
      });
      const result = achievementSystem.check('test-5', () => false);
      expect(result).toBe(false);
      expect(achievementSystem.isUnlocked('test-5')).toBe(false);
    });

    it('does not unlock already unlocked achievement', () => {
      achievementSystem.register({
        id: 'test-6', name: 'Test', desc: 'A test achievement', icon: '🏆', unlocked: false
      });
      achievementSystem.unlock('test-6');
      const result = achievementSystem.check('test-6', () => true);
      expect(result).toBe(false); // already unlocked, check returns false
    });

    it('returns false for unregistered achievement', () => {
      const result = achievementSystem.check('nonexistent', () => true);
      expect(result).toBe(false);
    });
  });

  describe('unlock', () => {
    it('persists to localStorage', () => {
      achievementSystem.register({
        id: 'test-7', name: 'Test', desc: 'A test achievement', icon: '🏆', unlocked: false
      });
      achievementSystem.unlock('test-7');
      const saved = JSON.parse(localStorage.getItem('dtp:achievements') || '[]');
      expect(saved).toContain('test-7');
    });

    it('sets unlocked and date on registry entry', () => {
      achievementSystem.register({
        id: 'test-8', name: 'Test', desc: 'A test achievement', icon: '🏆', unlocked: false
      });
      achievementSystem.unlock('test-8');
      const ach = achievementSystem.registry.get('test-8');
      expect(ach?.unlocked).toBe(true);
      expect(ach?.date).toBeDefined();
    });
  });

  describe('load', () => {
    it('restores unlocked set from localStorage', () => {
      localStorage.setItem('dtp:achievements', JSON.stringify(['ach-1', 'ach-2']));
      achievementSystem.load();
      expect(achievementSystem.isUnlocked('ach-1')).toBe(true);
      expect(achievementSystem.isUnlocked('ach-2')).toBe(true);
    });

    it('syncs registry entries on load', () => {
      achievementSystem.register({
        id: 'ach-3', name: 'Test', desc: 'A test achievement', icon: '🏆', unlocked: false
      });
      localStorage.setItem('dtp:achievements', JSON.stringify(['ach-3']));
      achievementSystem.load();
      const ach = achievementSystem.registry.get('ach-3');
      expect(ach?.unlocked).toBe(true);
    });

    it('handles empty localStorage gracefully', () => {
      achievementSystem.load();
      expect(achievementSystem.unlocked.size).toBe(0);
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('dtp:achievements', 'not-json');
      achievementSystem.load();
      expect(achievementSystem.unlocked.size).toBe(0);
    });
  });

  describe('getProgress', () => {
    it('returns correct counts', () => {
      achievementSystem.register({
        id: 'p-1', name: 'Test', desc: 'A test', icon: '🏆', unlocked: false
      });
      achievementSystem.register({
        id: 'p-2', name: 'Test', desc: 'A test', icon: '🏆', unlocked: false
      });
      achievementSystem.unlock('p-1');
      const progress = achievementSystem.getProgress();
      expect(progress.total).toBe(2);
      expect(progress.unlocked).toBe(1);
    });
  });
});
