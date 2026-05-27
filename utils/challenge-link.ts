// utils/challenge-link.ts
import { logger } from './logger';

const SIGN_API = 'https://game.mscarabia.com/api/sign-challenge';
const VERIFY_API = 'https://game.mscarabia.com/api/verify-challenge';
const IS_PROD = typeof window !== "undefined" && import.meta.env.PROD;

export const challengeLink = {
  async generate(score: number, seed: string, hearts: number): Promise<string> {
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      challenge: '1', seed, score: String(score), hearts: String(hearts),
      ref: navigator.language || 'global',
    });
    try {
      const res = await fetch(SIGN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, seed, hearts }),
      });
      if (res.ok) {
        const { sig } = await res.json() as { sig: string };
        if (sig) params.set('sig', sig);
      } else {
        logger.warn('Challenge signing server returned', res.status);
      }
    } catch {
      logger.warn('Challenge signing request failed');
    }
    return `${base}?${params.toString()}`;
  },

  /** Returns `valid: false` for any tampered or unsigned URL. */
  async parseAndVerify(): Promise<{
    isChallenge: boolean;
    valid: boolean;
    seed?: string;
    score?: number;
    hearts?: number;
    ref?: string;
  }> {
    const p = new URLSearchParams(window.location.search);
    const isChallenge = p.get('challenge') === '1';
    if (!isChallenge) return { isChallenge: false, valid: false };

    const score  = Number(p.get('score'))  || 0;
    const hearts = Number(p.get('hearts')) || 3;
    const seed   = p.get('seed')  || '';
    const sig    = p.get('sig')   || '';
    const ref    = p.get('ref')   || 'global';

    if (!sig) {
      // No signature — reject in production, accept in dev
      if (IS_PROD) {
        logger.warn('Challenge URL missing signature in production — rejecting');
        return { isChallenge: true, valid: false };
      }
      return { isChallenge: true, valid: true, seed, score, hearts, ref };
    }

    // SEC-CL-01: Verify signature server-side (constant-time compare, no re-signing)
    try {
      const res = await fetch(VERIFY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, seed, hearts, sig }),
      });
      if (res.ok) {
        const { valid } = await res.json() as { valid: boolean };
        if (!valid) logger.warn('Challenge URL signature mismatch');
        return { isChallenge: true, valid, seed, score, hearts, ref };
      }
      logger.warn('Challenge verification server returned', res.status);
    } catch {
      logger.warn('Challenge verification request failed');
    }
    return { isChallenge: true, valid: false };
  },

  /** Legacy sync parse — use only for non-competitive display (no integrity check). */
  parseUnsafe(): { isChallenge: boolean; seed?: string; score?: number; hearts?: number; ref?: string } {
    const p = new URLSearchParams(window.location.search);
    return {
      isChallenge: p.get('challenge') === '1',
      seed:   p.get('seed')   || undefined,
      score:  p.get('score') != null ? Number(p.get('score')) : undefined,
      hearts: p.get('hearts') != null ? Number(p.get('hearts')) : undefined,
      ref:    p.get('ref')    || 'global',
    };
  },

  async copyToClipboard(score: number, seed: string, hearts: number): Promise<boolean> {
    const url = await this.generate(score, seed, hearts);
    try {
      await navigator.clipboard.writeText(`Try my score: ${score}! Beat me here ${url}`);
      return true;
    } catch {
      logger.warn('Clipboard write failed');
      return false;
    }
  },
};
