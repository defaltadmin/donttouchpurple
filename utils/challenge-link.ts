// utils/challenge-link.ts
import { logger } from './logger';

// Move to import.meta.env.VITE_CHALLENGE_SECRET for v6.1 server-side signing
const HMAC_SECRET = 'dtp-v6-challenge-hmac-2025';

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
    const sig = await signPayload(score, seed, hearts);
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      challenge: '1', seed, score: String(score), hearts: String(hearts),
      ref: navigator.language || 'global', sig,
    });
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
      logger.warn('Challenge URL missing signature — treating as invalid');
      return { isChallenge: true, valid: false };
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
