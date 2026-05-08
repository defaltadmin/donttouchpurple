import { logger } from './logger';

export const challengeLink = {
  generate(score: number, seed: string, hearts: number): string {
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      challenge: '1', seed, score: String(score), hearts: String(hearts), ref: navigator.language || 'global',
    });
    return `${base}?${params.toString()}`;
  },

  parse(): { isChallenge: boolean; seed?: string; score?: number; hearts?: number; ref?: string } {
    const p = new URLSearchParams(window.location.search);
    return {
      isChallenge: p.get('challenge') === '1',
      seed: p.get('seed') || undefined,
      score: Number(p.get('score')) || undefined,
      hearts: Number(p.get('hearts')) || undefined,
      ref: p.get('ref') || 'global',
    };
  },

  async copyToClipboard(score: number, seed: string, hearts: number): Promise<boolean> {
    const url = this.generate(score, seed, hearts);
    try {
      await navigator.clipboard.writeText(`Try my score: ${score}! Beat me here ${url}`);
      return true;
    } catch {
      logger.warn('Clipboard write failed');
      return false;
    }
  },
};
