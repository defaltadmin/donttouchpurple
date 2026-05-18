// utils/challenge-link.ts
import { logger } from './logger';

// SECURITY: The HMAC secret MUST be moved server-side (Cloudflare Worker) before production.
// Client-side secrets are extractable from the JS bundle.
// For now, we use a dev-only placeholder that disables challenge signing in production
// unless a real secret is configured.
const HMAC_SECRET: string =
  (import.meta as any).env?.VITE_CHALLENGE_SECRET || '';

const SIGNING_ENABLED = !!HMAC_SECRET;
const IS_PROD = typeof window !== "undefined" && window.location.hostname === "game.mscarabia.com";

async function _importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(HMAC_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signPayload(score: number, seed: string, hearts: number): Promise<string> {
  const key = await _importKey();
  const msg = new TextEncoder().encode(`${score}:${seed}:${hearts}`);
  const raw = await crypto.subtle.sign('HMAC', key, msg);
  // URL-safe base64, first 16 chars (96-bit truncated HMAC)
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    .slice(0, 16);
}

async function verifyPayload(score: number, seed: string, hearts: number, sig: string): Promise<boolean> {
  try {
    const expected = await signPayload(score, seed, hearts);
    return expected === sig;
  } catch {
    return false;
  }
}

export const challengeLink = {
  async generate(score: number, seed: string, hearts: number): Promise<string> {
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      challenge: '1', seed, score: String(score), hearts: String(hearts),
      ref: navigator.language || 'global',
    });
    if (SIGNING_ENABLED) {
      params.set('sig', await signPayload(score, seed, hearts));
    } else {
      logger.warn('Challenge signing disabled — no HMAC secret configured');
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
      if (!SIGNING_ENABLED) {
        // Production without signing = reject all challenges
        if (IS_PROD) {
          logger.warn('Challenge signing not configured in production — rejecting');
          return { isChallenge: true, valid: false };
        }
        // Dev mode: accept unsigned challenges
        return { isChallenge: true, valid: true, seed, score, hearts, ref };
      }
      logger.warn('Challenge URL missing signature — treating as invalid');
      return { isChallenge: true, valid: false };
    }

    if (!SIGNING_ENABLED) {
      // Production without signing = reject all challenges
      if (IS_PROD) {
        logger.warn('Challenge has signature but no HMAC secret configured in production — rejecting');
        return { isChallenge: true, valid: false };
      }
      logger.warn('Challenge URL has signature but no HMAC secret configured — accepting');
      return { isChallenge: true, valid: true, seed, score, hearts, ref };
    }

    const valid = await verifyPayload(score, seed, hearts, sig);
    if (!valid) logger.warn('Challenge URL signature mismatch');

    return { isChallenge: true, valid, seed, score, hearts, ref };
  },

  /** Legacy sync parse — use only for non-competitive display (no integrity check). */
  parseUnsafe(): { isChallenge: boolean; seed?: string; score?: number; hearts?: number; ref?: string } {
    const p = new URLSearchParams(window.location.search);
    return {
      isChallenge: p.get('challenge') === '1',
      seed:   p.get('seed')   || undefined,
      score:  Number(p.get('score'))  || undefined,
      hearts: Number(p.get('hearts')) || undefined,
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
