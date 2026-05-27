import { logger } from './logger';

// SEC-012: Session integrity — key derived from sessionStorage nonce
// The nonce is written once when a game starts, survives page refresh,
// and ensures the same key is used for sign + verify across refreshes.
const SESSION_NONCE_KEY = 'dtp:session-nonce';

function getSessionNonce(): string {
  let nonce = sessionStorage.getItem(SESSION_NONCE_KEY);
  if (!nonce) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    nonce = btoa(String.fromCharCode(...arr));
    sessionStorage.setItem(SESSION_NONCE_KEY, nonce);
  }
  return nonce;
}

let _sessionKey: CryptoKey | null = null;
let _sessionKeyReady: Promise<CryptoKey> | null = null;

async function deriveKey(): Promise<CryptoKey> {
  const nonce = getSessionNonce();
  const nonceBytes = new TextEncoder().encode(nonce);
  const baseKey = await crypto.subtle.importKey(
    'raw', nonceBytes, { name: 'HKDF' }, false, ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('dtp-session-v1'), info: new Uint8Array(0) },
    baseKey,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign', 'verify'],
  );
  return key;
}

function getSessionKey(): Promise<CryptoKey> {
  if (_sessionKey) return Promise.resolve(_sessionKey);
  if (!_sessionKeyReady) {
    _sessionKeyReady = deriveKey().then(k => { _sessionKey = k; return k; });
  }
  return _sessionKeyReady;
}

function toBase64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signData(data: string): Promise<string> {
  const key = await getSessionKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return toBase64url(sig);
}

async function verifyData(data: string, sig: string): Promise<boolean> {
  const key = await getSessionKey();
  const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return toBase64url(expected) === sig;
}

export const stateGuard = {
  parse<T>(raw: string | null, fallback: T, validator?: (d: unknown) => boolean): T {
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (validator && !validator(parsed)) throw new Error('Schema mismatch');
      return parsed as T;
    } catch (e) {
      logger.warn('State corruption detected, applying fallback', (e as Error).message);
      return fallback;
    }
  },

  safeStore(key: string, data: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if ((e as Error).name === 'QuotaExceededError') {
        logger.error('Storage quota exceeded, clearing non-essential keys');
        // Only clear large/non-essential keys — preserve achievements, dust, settings
        const safeToClear = ['dtp:errors', 'dtp:perf'];
        safeToClear.forEach(k => localStorage.removeItem(k));
        try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* still full after cleanup */ }
      }
    }
  },

  sanitize<T extends Record<string, unknown>>(raw: unknown, defaults: T): T {
    if (!raw || typeof raw !== 'object') return defaults;
    const clean: Record<string, unknown> = {};
    for (const k of Object.keys(defaults)) {
      const val = (raw as Record<string, unknown>)[k];
      // Reject mismatched types — use default instead
      if (val != null && typeof val !== typeof defaults[k]) {
        clean[k] = defaults[k];
      } else {
        clean[k] = val ?? defaults[k];
      }
    }
    return clean as T;
  },

  /** SEC-012: Sign session data before writing to sessionStorage. */
  async signSession(data: string): Promise<string> {
    const sig = await signData(data);
    return JSON.stringify({ data, sig });
  },

  /** SEC-012: Verify and parse session data from sessionStorage. */
  async verifySession<T>(raw: string, fallback: T, validator?: (d: unknown) => boolean): Promise<T> {
    try {
      const envelope = JSON.parse(raw) as { data?: string; sig?: string };
      if (!envelope.data || !envelope.sig) return fallback;
      const valid = await verifyData(envelope.data, envelope.sig);
      if (!valid) {
        logger.warn('Session integrity check failed — rejecting tampered session');
        return fallback;
      }
      return stateGuard.parse<T>(envelope.data, fallback, validator);
    } catch {
      return fallback;
    }
  },

  /** SEC-012: Clear session nonce (call on game over / new game). */
  clearSessionNonce(): void {
    sessionStorage.removeItem(SESSION_NONCE_KEY);
    _sessionKey = null;
    _sessionKeyReady = null;
  },
};
