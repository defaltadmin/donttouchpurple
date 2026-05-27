# DTP Code Review — v7.5.4 (Big Pickle v2 Round 2)

**Project**: Don't Touch Purple — reflex-based grid-tapping game
**Stack**: React 18, TypeScript 5, Vite 7, Firebase, OGL/WebGL, Cloudflare Workers
**Date**: 2026-05-27
**Reviewer**: DeepSeek

## Build Status
- Typecheck: 0 errors
- Tests: 211/211 pass (20 files)
- Lint: 0 errors, 0 warnings
- Build: Clean

## Review Instructions

Focus on **security, correctness, and edge cases** in the code below. All relevant code is inline — no need to read any other files.

For each finding, provide:
```
### [ID] — Title
- **Severity**: Critical/High/Medium/Low/Info
- **Category**: Security/Stability/Performance/UX/Code Quality/Architecture
- **File + Line**: exact location
- **Description**: what's wrong
- **Impact**: what could happen
- **Fix**: specific code change
```

---

## Change 1: SEC-013 — Rate limiting on `/api/sign-challenge`

Previously the sign-challenge endpoint had no rate limiting while the score submission endpoint did (8 req/min per IP). An attacker could flood HMAC signing requests, burning CPU on the free-tier Worker.

### workers/score-validator.ts — FULL FILE (267 lines)

```typescript
import type { ExportedHandler, ExecutionContext, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  RATE_LIMIT_KV: KVNamespace;
  FIREBASE_PROJECT_ID: string;
  GCP_SERVICE_ACCOUNT_EMAIL: string;
  GCP_SERVICE_ACCOUNT_KEY_B64: string;
  CHALLENGE_HMAC_SECRET?: string;
}

interface ScorePayload {
  score: number;
  initials: string;
  mode: 'classic' | 'evolve';
  badge?: string;
  date?: string;
  tick: number;
  sessionId: string;
  practiceMode?: boolean;
  godMode?: boolean;
}

interface ChallengePayload {
  score: number;
  seed: string;
  hearts: number;
}

let _cachedToken: string | null = null;
let _tokenExpiry = 0;
let _refreshPromise: Promise<string> | null = null;

async function getFirebaseToken(env: Env): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const now = Math.floor(Date.now() / 1000);
    const toBase64Url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = toBase64Url(JSON.stringify({
      iss: env.GCP_SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }));

    const pemStr = atob(env.GCP_SERVICE_ACCOUNT_KEY_B64);
    const pemBody = pemStr.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const keyBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0)).buffer;

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8', keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign'],
    );
    const toSign = new TextEncoder().encode(`${header}.${claim}`);
    const sigBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, toSign);
    const sig = toBase64Url(String.fromCharCode(...new Uint8Array(sigBuffer)));
    const jwt = `${header}.${claim}.${sig}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    if (!res.ok) throw new Error(`OAuth token request failed: ${res.status}`);
    const json = await res.json<{ access_token?: string; expires_in?: number }>();
    if (!json.access_token || typeof json.expires_in !== 'number') throw new Error('OAuth response missing access_token');
    _cachedToken = json.access_token;
    _tokenExpiry = Date.now() + json.expires_in * 1000;
    return _cachedToken;
  })();

  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

async function signChallenge(score: number, seed: string, hearts: number, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const msg = new TextEncoder().encode(`${score}:${seed}:${hearts}`);
  const raw = await crypto.subtle.sign('HMAC', key, msg);
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    .slice(0, 16);
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const allowedOrigins = [
      'https://dont-touch-purple.web.app',
      'https://dont-touch-purple.firebaseapp.com',
      'https://game.mscarabia.com',
    ];
    if (request.method === 'OPTIONS') {
      const reqOrigin = request.headers.get('Origin') ?? '';
      const allowOrigin = allowedOrigins.includes(reqOrigin) ? reqOrigin : 'https://dont-touch-purple.web.app';
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    const origin = request.headers.get('Origin') ?? '';
    if (!origin || !allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': origin || 'https://dont-touch-purple.web.app',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const url = new URL(request.url);

    // SEC-010: Server-side HMAC signing for challenge links
    // SEC-013: Rate limit sign-challenge to prevent HMAC CPU abuse
    if (url.pathname === '/api/sign-challenge') {
      const signIp = request.headers.get('cf-connecting-ip') ?? 'unknown';
      const signRateKey = `sign-rate:${signIp}`;
      const signNow = Date.now();
      let signAttempts: number[] = (await env.RATE_LIMIT_KV.get(signRateKey, { type: 'json' })) ?? [];
      signAttempts = signAttempts.filter(ts => signNow - ts < 60_000);
      if (signAttempts.length >= 30) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      signAttempts.push(signNow);
      await env.RATE_LIMIT_KV.put(signRateKey, JSON.stringify(signAttempts), { expirationTtl: 90 });

      if (!env.CHALLENGE_HMAC_SECRET) {
        return new Response(JSON.stringify({ error: 'Challenge signing not configured' }), { status: 501, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      try {
        const body = await request.json<ChallengePayload>();
        if (typeof body.score !== 'number' || typeof body.seed !== 'string' || typeof body.hearts !== 'number') {
          return new Response(JSON.stringify({ error: 'Invalid challenge params' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        const sig = await signChallenge(body.score, body.seed, body.hearts, env.CHALLENGE_HMAC_SECRET);
        return new Response(JSON.stringify({ sig }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      } catch {
        return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    }

    // Verify Firebase ID token from client
    const authHeader = request.headers.get('Authorization') ?? '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    try {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!verifyRes.ok) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const tokenInfo = await verifyRes.json<{ aud?: string; sub?: string }>();
      if (!tokenInfo.sub) {
        return new Response(JSON.stringify({ error: 'Invalid token claims' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (!tokenInfo.aud || tokenInfo.aud !== env.FIREBASE_PROJECT_ID) {
        return new Response(JSON.stringify({ error: 'Invalid audience' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Token verification failed' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    try {
      const data = await request.json<ScorePayload>();
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

      const rateKey = `rate:${ip}`;
      const now = Date.now();
      let attempts: number[] = (await env.RATE_LIMIT_KV.get(rateKey, { type: 'json' })) ?? [];
      attempts = attempts.filter(ts => now - ts < 60_000);
      if (attempts.length >= 8) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      attempts.push(now);
      await env.RATE_LIMIT_KV.put(rateKey, JSON.stringify(attempts), { expirationTtl: 90 });

      if (typeof data.score !== 'number' || data.score < 0 || data.score > 9999) {
        return new Response(JSON.stringify({ error: 'Invalid score' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (!data.initials || typeof data.initials !== 'string' || data.initials.length > 8 || !/^[a-zA-Z0-9_ ]{1,8}$/.test(data.initials)) {
        return new Response(JSON.stringify({ error: 'Invalid initials' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (!data.mode || !['classic', 'evolve'].includes(data.mode)) {
        return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (typeof data.tick !== 'number' || data.tick < 0) {
        return new Response(JSON.stringify({ error: 'Missing tick' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const safeTick = Math.min(data.tick, 600);
      if (data.score > Math.floor(safeTick * 8 * 1.5)) {
        return new Response(JSON.stringify({ error: 'Impossible score' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (typeof data.sessionId !== 'string' || data.sessionId.length < 8) {
        return new Response(JSON.stringify({ error: 'Missing session' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (data.sessionId.length > 64) {
        return new Response(JSON.stringify({ error: 'Session too long' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      // SEC-011: Reject practice/god mode scores server-side
      if ((data as Record<string, unknown>).practiceMode === true || (data as Record<string, unknown>).godMode === true) {
        return new Response(JSON.stringify({ error: 'Practice scores not allowed' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (data.badge && (typeof data.badge !== 'string' || data.badge.length > 24 || !/^[a-zA-Z0-9_-]+$/.test(data.badge))) {
        return new Response(JSON.stringify({ error: 'Invalid badge' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const token = await getFirebaseToken(env);
      const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/lb_global`;

      const payload = {
        fields: {
          score: { integerValue: data.score.toString() },
          initials: { stringValue: data.initials },
          mode: { stringValue: data.mode },
          badge: { stringValue: data.badge ?? '' },
          date: { stringValue: data.date ?? new Date().toISOString().split('T')[0] },
          ts: { timestampValue: new Date().toISOString() },
          sessionId: { stringValue: data.sessionId },
          tick: { integerValue: safeTick.toString() },
        },
      };

      const fbRes = await fetch(`${firebaseUrl}?documentId=auto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!fbRes.ok) {
        return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      return new Response(JSON.stringify({ success: true, score: data.score }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
  },
} satisfies ExportedHandler<Env>;
```

---

## Change 2: STB-014 — Dead code removal from `useDevToolsState`

The hook had a `useCallback`-based `enableDevMode` that duplicated App.tsx's keyboard listener. It was never called — App.tsx owns the d->d->p key listener directly.

### hooks/useDevToolsState.ts — FULL FILE (20 lines)

```typescript
import { useState } from "react";

export function useDevToolsState() {
  const [devMode, setDevMode] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [devFreezeTime, setDevFreezeTime] = useState(false);
  const [devRotationSpeed, setDevRotationSpeed] = useState(1);
  const [devAutoPlay, setDevAutoPlay] = useState(false);
  const [devHeatmap, setDevHeatmap] = useState<Record<number, number>>({});

  return {
    devMode, setDevMode,
    godMode, setGodMode,
    devFreezeTime, setDevFreezeTime,
    devRotationSpeed, setDevRotationSpeed,
    devAutoPlay, setDevAutoPlay,
    devHeatmap, setDevHeatmap,
  };
}
```

### App.tsx — Caller change (line 206)

```typescript
// Before:
const { ... } = useDevToolsState(screen);

// After:
const { devMode, setDevMode, godMode, setGodMode, devFreezeTime, setDevFreezeTime, devRotationSpeed, setDevRotationSpeed, devAutoPlay, setDevAutoPlay, devHeatmap, setDevHeatmap } = useDevToolsState();
```

App.tsx's own keyboard listener (lines 395-410) is unchanged — it still handles d->d->p:

```typescript
const devKeyBuffer = useRef<string[]>([]);
useEffect(() => {
  if (!import.meta.env.DEV || devMode) return;
  const onKey = (e: KeyboardEvent) => {
    if (screen !== "menu") return;
    devKeyBuffer.current = [...devKeyBuffer.current.slice(-2), e.key.toLowerCase()];
    if (devKeyBuffer.current.join("") === "ddp") {
      setDevMode(true);
      devKeyBuffer.current = [];
      toast$("🔧 Dev mode");
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [screen, devMode, toast$, setDevMode]);
```

---

## Change 3: CQ-003 — Duplicate settingsManager subscription removed

Both App.tsx and `useThemeSettings` subscribed to `settingsManager`. The App.tsx subscription was unused.

### Removed from App.tsx (was at line 735-739):

```typescript
// REMOVED — duplicate, useThemeSettings already subscribes
const [, setSettings] = useState(settingsManager.get());
useEffect(() => {
  const unsub = settingsManager.subscribe(s => { setSettings(s); });
  return () => { unsub(); };
}, []);
```

### useThemeSettings retains the subscription (lines 17-22):

```typescript
const [, setSettings] = useState(settingsManager.get());
useEffect(() => {
  const unsub = settingsManager.subscribe(s => { setSettings(s); });
  return () => { unsub(); };
}, []);
```

`settingsManager` is still used in App.tsx at line 1650 (dev panel button), so the import stays.

---

## Change 4: ARC-005 — Tests for security-critical modules

### utils/state-guard.ts — FULL FILE (128 lines)

```typescript
import { logger } from './logger';

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

async function signData(data: string): Promise<string> {
  const key = await getSessionKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).slice(0, 16);
}

async function verifyData(data: string, sig: string): Promise<boolean> {
  const key = await getSessionKey();
  const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(expected))).slice(0, 16) === sig;
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
      if (val != null && typeof val !== typeof defaults[k]) {
        clean[k] = defaults[k];
      } else {
        clean[k] = val ?? defaults[k];
      }
    }
    return clean as T;
  },

  async signSession(data: string): Promise<string> {
    const sig = await signData(data);
    return JSON.stringify({ data, sig });
  },

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

  clearSessionNonce(): void {
    sessionStorage.removeItem(SESSION_NONCE_KEY);
    _sessionKey = null;
    _sessionKeyReady = null;
  },
};
```

### utils/challenge-link.ts — FULL FILE (102 lines)

```typescript
import { logger } from './logger';

const CHALLENGE_API = 'https://game.mscarabia.com/api/sign-challenge';
const IS_PROD = typeof window !== "undefined" && import.meta.env.PROD;

export const challengeLink = {
  async generate(score: number, seed: string, hearts: number): Promise<string> {
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      challenge: '1', seed, score: String(score), hearts: String(hearts),
      ref: navigator.language || 'global',
    });
    try {
      const res = await fetch(CHALLENGE_API, {
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
      if (IS_PROD) {
        logger.warn('Challenge URL missing signature in production — rejecting');
        return { isChallenge: true, valid: false };
      }
      return { isChallenge: true, valid: true, seed, score, hearts, ref };
    }

    try {
      const res = await fetch(CHALLENGE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, seed, hearts }),
      });
      if (res.ok) {
        const { sig: expected } = await res.json() as { sig: string };
        const valid = expected === sig;
        if (!valid) logger.warn('Challenge URL signature mismatch');
        return { isChallenge: true, valid, seed, score, hearts, ref };
      }
      logger.warn('Challenge verification server returned', res.status);
    } catch {
      logger.warn('Challenge verification request failed');
    }
    return { isChallenge: true, valid: false };
  },

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
```

### hooks/useThemeSettings.ts — FULL FILE (111 lines)

```typescript
import { useState, useEffect, useCallback } from "react";
import { settingsManager } from "../utils/settings";
import { SHOP_THEMES } from "../config/powerupWeights";
import type { ShopData } from "../utils/shop-storage";

export type ColorblindMode = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";

export function useThemeSettings(shopData: ShopData) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [colorblindMode, setColorblindMode] = useState<ColorblindMode>("none");
  const [isFS, setIsFS] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOffset, setShowOffset] = useState(() => settingsManager.get().offsetPointer ?? false);
  const [showFps, setShowFps] = useState(() => localStorage.getItem("showFps") === "true");
  const [fps, setFps] = useState(0);

  // Settings manager subscription
  const [, setSettings] = useState(settingsManager.get());
  useEffect(() => {
    const unsub = settingsManager.subscribe(s => { setSettings(s); });
    return () => { unsub(); };
  }, []);

  // Offset pointer persistence
  useEffect(() => { settingsManager.set({ offsetPointer: showOffset }); }, [showOffset]);

  // Theme class toggle + lazy CSS load
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
      import("../styles/light-theme.css");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme]);

  // Apply shop theme CSS variables
  useEffect(() => {
    const t = SHOP_THEMES.find(t => t.id === shopData.equippedTheme);
    if (!t || t.id === "default") {
      ["--theme-purple", "--theme-accent", "--theme-bg", "--theme-text", "--bg", "--purple", "--accent", "--text"]
        .forEach(p => document.documentElement.style.removeProperty(p));
      return;
    }
    document.documentElement.style.setProperty("--theme-purple", t.colors.purple);
    document.documentElement.style.setProperty("--theme-accent", t.colors.accent);
    document.documentElement.style.setProperty("--theme-bg", t.colors.bg);
    document.documentElement.style.setProperty("--theme-text", t.colors.text);
    document.documentElement.style.setProperty("--bg", t.colors.bg);
    document.documentElement.style.setProperty("--purple", t.colors.purple);
    document.documentElement.style.setProperty("--accent", t.colors.accent);
    document.documentElement.style.setProperty("--text", t.colors.text);
  }, [shopData.equippedTheme]);

  // FPS Monitor
  useEffect(() => {
    if (!showFps) return;
    let frameId = 0;
    let frameCount = 0;
    let lastTime = performance.now();
    const loop = () => {
      const now = performance.now();
      const delta = now - lastTime;
      if (delta >= 500) {
        setFps(Math.round(1000 / (delta / (frameCount || 1))));
        lastTime = now;
        frameCount = 0;
      }
      frameCount++;
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [showFps]);

  // F key → toggle FPS overlay
  useEffect(() => {
    const handleFpsKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        setShowFps(prev => {
          const next = !prev;
          localStorage.setItem("showFps", String(next));
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleFpsKey);
    return () => window.removeEventListener("keydown", handleFpsKey);
  }, []);

  // Fullscreen toggle
  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFS(true)).catch(() => setIsFS(f => !f));
    } else {
      document.exitFullscreen?.().then(() => setIsFS(false));
    }
  }, []);

  const equippedTheme = SHOP_THEMES.find(t => t.id === shopData.equippedTheme) || SHOP_THEMES[0];

  return {
    theme, setTheme,
    colorblindMode, setColorblindMode,
    isFS, toggleFS,
    settingsOpen, setSettingsOpen,
    showOffset, setShowOffset,
    showFps, setShowFps, fps,
    equippedTheme,
  };
}
```

### utils/score-sync.ts — FULL FILE (123 lines)

```typescript
import { logger } from './logger';
import { LS_KEYS } from '../config/difficulty';
import { idb } from './idb';

async function getAuthToken(): Promise<string | undefined> {
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    return await auth.currentUser?.getIdToken();
  } catch { return undefined; }
}

export const scoreSync = {
  _flushing: false,
  async queue(score: number, mode: 'classic' | 'evolve' = 'evolve', tick = 0, practiceMode = false, godMode = false) {
    let initials = 'ANON';
    try {
      const rawInitials = localStorage.getItem(LS_KEYS.PLAYER_NAME) || 'ANON';
      initials = rawInitials.replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON';
    } catch { /* storage denied */ }
    const pending = { score, initials, mode, tick, attempts: 0, nextRetry: Date.now(), sessionId: crypto.randomUUID?.() || `sess-${Date.now()}`, practiceMode, godMode };

    if (navigator.onLine) {
      const result = await this._submit(pending);
      if (result === 'success' || result === 'permanent') return;
    }

    try {
      await idb.enqueue(pending);
      logger.info('📦 Score queued offline', { score, initials });
    } catch (e) {
      logger.warn('Failed to queue score offline', e);
    }
  },

  async _submit(item: { score: number; initials: string; mode: string; tick?: number; attempts?: number; sessionId?: string; practiceMode?: boolean; godMode?: boolean }): Promise<'success' | 'permanent' | 'temporary'> {
    try {
      const token = await getAuthToken();
      const res = await fetch('https://game.mscarabia.com/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          score: Math.max(0, Math.min(9999, Math.floor(item.score || 0))),
          initials: String(item.initials || 'ANON').replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON',
          mode: ['classic', 'evolve'].includes(item.mode) ? item.mode : 'classic',
          tick: typeof item.tick === 'number' ? item.tick : 0,
          sessionId: item.sessionId || crypto.randomUUID?.() || `sess-${Date.now()}`,
          practiceMode: item.practiceMode || false,
          godMode: item.godMode || false,
        }),
      });
      if (!res.ok) {
        if (res.status >= 400 && res.status < 500) return 'permanent';
        throw new Error(`HTTP ${res.status}`);
      }
      return 'success';
    } catch {
      return 'temporary';
    }
  },

  async flush() {
    if (this._flushing || !navigator.onLine) return;
    this._flushing = true;
    try {
      const pending = await idb.peekAll();
      if (pending.length === 0) return;

      logger.info(`Flushing ${pending.length} offline scores`);

      const succeededIds: number[] = [];
      const failedIds: number[] = [];
      const permanentIds: number[] = [];
      const now = Date.now();
      for (const item of pending) {
        const nextRetry = item.nextRetry ?? 0;
        if (nextRetry > now) continue;

        const result = await this._submit(item);
        if (result === 'success') {
          if (item.id != null) succeededIds.push(item.id);
        } else if (result === 'permanent') {
          if (item.id != null) permanentIds.push(item.id);
        } else {
          if (item.id != null) failedIds.push(item.id);
        }
      }
      const toRemove = [...succeededIds, ...permanentIds];
      const updates = failedIds.map(id => {
        const item = pending.find(p => p.id === id);
        const safeAttempts = Math.max(0, Math.floor(Number(item?.attempts) || 0));
        const attempts = safeAttempts + 1;
        const backoffMs = Math.min(1000 * Math.pow(2, attempts), 30 * 60 * 1000);
        return { id, patch: { attempts, nextRetry: Date.now() + backoffMs } };
      });
      await idb.removeAndUpdate(toRemove, updates);
    } finally {
      this._flushing = false;
    }
  },

  _onlineHandler: (null as (() => void) | null),

  async init() {
    if (typeof window === 'undefined') return;
    if (this._onlineHandler) return;
    this._onlineHandler = () => this.flush();
    window.addEventListener('online', this._onlineHandler);
    await this.flush();
  },

  destroy() {
    if (this._onlineHandler) {
      window.removeEventListener('online', this._onlineHandler);
      this._onlineHandler = null;
    }
  },
};
```

### firestore.rules — FULL FILE (94 lines)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function validScore() {
      let s = request.resource.data.score;
      return s is int && s >= 0 && s <= 9999;
    }

    function validInitials() {
      let ini = request.resource.data.initials;
      return ini is string && ini.size() >= 1 && ini.size() <= 8 && ini.matches('^[a-zA-Z0-9_ ]+$');
    }

    function validBadge() {
      return !('badge' in request.resource.data) ||
             (request.resource.data.badge is string && request.resource.data.badge.size() <= 24 && request.resource.data.badge.matches('^[a-zA-Z0-9_-]*$'));
    }

    function validDate() {
      let d = request.resource.data.date;
      return d is string && d.size() == 10 && d.matches('^\\d{4}-\\d{2}-\\d{2}$');
    }

    function hasRequiredFields() {
      return request.resource.data.keys().hasAll(['score', 'initials', 'date', 'mode']);
    }

    function hasValidAppCheck() {
      return request.app != null;
    }

    match /lb_global/{docId} {
      allow read: if true;
      allow create: if
        request.auth != null &&
        hasRequiredFields() &&
        validScore() &&
        validInitials() &&
        validBadge() &&
        validDate() &&
        request.resource.data.mode in ['classic', 'evolve'] &&
        (!('tick' in request.resource.data) ||
          (request.resource.data.tick is int &&
           request.resource.data.tick >= 0 &&
           request.resource.data.tick <= 600 &&
           request.resource.data.score <= request.resource.data.tick * 12 + 300)) &&
        request.resource.data.keys().hasOnly(['score', 'initials', 'date', 'mode', 'badge', 'ts', 'tick', 'sessionId']);
      allow update, delete: if false;
    }

    match /dust_wallet/{docId} {
      allow read: if request.auth != null && (
        resource.data.uid == request.auth.uid ||
        request.auth.token.firebase.sign_in_provider == 'anonymous'
      );
      allow create: if
        request.auth != null &&
        request.resource.data.keys().hasOnly(['name', 'dust', 'ts', 'uid']) &&
        request.resource.data.name == docId &&
        request.resource.data.name is string &&
        request.resource.data.name.size() > 0 &&
        request.resource.data.name.size() <= 20 &&
        request.resource.data.uid == request.auth.uid &&
        request.resource.data.dust is int &&
        request.resource.data.dust >= 0 &&
        request.resource.data.dust < 10000000;
      allow update: if
        request.auth != null &&
        resource.data.uid == request.auth.uid &&
        request.resource.data.keys().hasOnly(['name', 'dust', 'ts', 'uid']) &&
        request.resource.data.name == docId &&
        request.resource.data.dust is int &&
        request.resource.data.dust >= 0 &&
        request.resource.data.dust < 10000000 &&
        request.resource.data.dust <= resource.data.dust + 10000;
      allow delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Test Files

### __tests__/state-guard.test.ts

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { stateGuard } from "../utils/state-guard";

describe("stateGuard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    stateGuard.clearSessionNonce();
  });

  describe("signSession / verifySession", () => {
    it("round-trips signed data correctly", async () => {
      const data = JSON.stringify({ score: 500, tick: 120 });
      const signed = await stateGuard.signSession(data);
      const result = await stateGuard.verifySession(signed, { score: 0, tick: 0 });
      expect(result).toEqual({ score: 500, tick: 120 });
    });

    it("rejects tampered signature", async () => {
      const data = JSON.stringify({ score: 500 });
      const signed = await stateGuard.signSession(data);
      const envelope = JSON.parse(signed);
      envelope.sig = "tampered12345678";
      const result = await stateGuard.verifySession(JSON.stringify(envelope), { score: 0 });
      expect(result).toEqual({ score: 0 });
    });

    it("rejects tampered data payload", async () => {
      const data = JSON.stringify({ score: 500 });
      const signed = await stateGuard.signSession(data);
      const envelope = JSON.parse(signed);
      envelope.data = JSON.stringify({ score: 9999 });
      const result = await stateGuard.verifySession(JSON.stringify(envelope), { score: 0 });
      expect(result).toEqual({ score: 0 });
    });

    it("returns fallback for malformed JSON", async () => {
      const result = await stateGuard.verifySession("not json", { score: 0 });
      expect(result).toEqual({ score: 0 });
    });

    it("returns fallback for envelope missing data or sig", async () => {
      const result1 = await stateGuard.verifySession(JSON.stringify({ sig: "abc" }), { score: 0 });
      expect(result1).toEqual({ score: 0 });
      const result2 = await stateGuard.verifySession(JSON.stringify({ data: "abc" }), { score: 0 });
      expect(result2).toEqual({ score: 0 });
    });

    it("nonce persists across calls within same session", async () => {
      const data = JSON.stringify({ score: 100 });
      const signed1 = await stateGuard.signSession(data);
      const signed2 = await stateGuard.signSession(data);
      const result = await stateGuard.verifySession(signed1, { score: 0 });
      expect(result).toEqual({ score: 100 });
      const result2 = await stateGuard.verifySession(signed2, { score: 0 });
      expect(result2).toEqual({ score: 100 });
    });

    it("clearSessionNonce invalidates old signatures", async () => {
      const data = JSON.stringify({ score: 100 });
      const signed = await stateGuard.signSession(data);
      stateGuard.clearSessionNonce();
      const result = await stateGuard.verifySession(signed, { score: 0 });
      expect(result).toEqual({ score: 0 });
    });

    it("applies validator on signed data", async () => {
      const data = JSON.stringify({ score: 500 });
      const signed = await stateGuard.signSession(data);
      const validator = (d: unknown) => typeof (d as { score: number }).score === "number";
      const result = await stateGuard.verifySession(signed, { score: 0 }, validator);
      expect(result).toEqual({ score: 500 });
    });

    it("rejects signed data that fails validator", async () => {
      const data = JSON.stringify({ score: "not-a-number" });
      const signed = await stateGuard.signSession(data);
      const validator = (d: unknown) => typeof (d as { score: number }).score === "number";
      const result = await stateGuard.verifySession(signed, { score: 0 }, validator);
      expect(result).toEqual({ score: 0 });
    });
  });

  describe("parse", () => {
    it("parses valid JSON", () => {
      expect(stateGuard.parse('{"score":100}', { score: 0 })).toEqual({ score: 100 });
    });
    it("returns fallback for null input", () => {
      expect(stateGuard.parse(null, { score: 0 })).toEqual({ score: 0 });
    });
    it("returns fallback for invalid JSON", () => {
      expect(stateGuard.parse("{bad", { score: 0 })).toEqual({ score: 0 });
    });
    it("returns fallback when validator rejects", () => {
      const validator = (d: unknown) => (d as { score: number }).score > 0;
      expect(stateGuard.parse('{"score":-1}', { score: 0 }, validator)).toEqual({ score: 0 });
    });
  });

  describe("sanitize", () => {
    it("returns defaults for null/undefined input", () => {
      const defaults = { score: 0, name: "Player" };
      expect(stateGuard.sanitize(null, defaults)).toEqual(defaults);
      expect(stateGuard.sanitize(undefined, defaults)).toEqual(defaults);
    });
    it("passes through matching types", () => {
      const defaults = { score: 0, name: "Player" };
      expect(stateGuard.sanitize({ score: 500, name: "Bob" }, defaults)).toEqual({ score: 500, name: "Bob" });
    });
    it("rejects mismatched types and uses default", () => {
      const defaults = { score: 0, name: "Player" };
      expect(stateGuard.sanitize({ score: "bad", name: "Bob" }, defaults)).toEqual({ score: 0, name: "Bob" });
    });
    it("uses default for missing keys", () => {
      const defaults = { score: 0, name: "Player", level: 1 };
      expect(stateGuard.sanitize({ score: 100 }, defaults)).toEqual({ score: 100, name: "Player", level: 1 });
    });
  });

  describe("safeStore", () => {
    it("stores data in localStorage", () => {
      stateGuard.safeStore("test-key", { score: 100 });
      expect(JSON.parse(localStorage.getItem("test-key")!)).toEqual({ score: 100 });
    });
    it("handles quota exceeded by clearing non-essential keys", () => {
      localStorage.setItem("dtp:errors", "x".repeat(1000));
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
      setItemSpy.mockImplementationOnce(() => { throw new DOMException("quota", "QuotaExceededError"); });
      setItemSpy.mockImplementationOnce(() => {});
      stateGuard.safeStore("test-key", { data: 1 });
      expect(localStorage.getItem("dtp:errors")).toBeNull();
    });
  });
});
```

### __tests__/challenge-link.test.ts

```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { challengeLink } from "../utils/challenge-link";

describe("challengeLink", () => {
  const originalLocation = window.location;

  beforeEach(() => { vi.restoreAllMocks(); });

  afterEach(() => {
    Object.defineProperty(window, "location", { value: originalLocation, writable: true });
  });

  function mockLocation(search: string) {
    const url = new URL(`https://game.mscarabia.com/${search}`);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: url.search, href: url.href, origin: url.origin, pathname: "/" },
      writable: true,
    });
  }

  describe("generate", () => {
    it("returns URL with challenge params and sig on success", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ sig: "abc123" }), { status: 200 })
      );
      const url = await challengeLink.generate(500, "seed123", 3);
      expect(url).toContain("challenge=1");
      expect(url).toContain("sig=abc123");
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://game.mscarabia.com/api/sign-challenge",
        expect.objectContaining({ method: "POST" })
      );
    });
    it("returns URL without sig when server fails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("error", { status: 500 }));
      const url = await challengeLink.generate(500, "seed123", 3);
      expect(url).not.toContain("sig=");
    });
    it("returns URL without sig when fetch throws", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));
      const url = await challengeLink.generate(500, "seed123", 3);
      expect(url).not.toContain("sig=");
    });
  });

  describe("parseAndVerify", () => {
    it("returns isChallenge=false for non-challenge URL", async () => {
      mockLocation("");
      const result = await challengeLink.parseAndVerify();
      expect(result).toEqual({ isChallenge: false, valid: false });
    });
    it("returns valid=true for matching sig", async () => {
      mockLocation("?challenge=1&seed=s1&score=500&hearts=3&sig=abc123");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ sig: "abc123" }), { status: 200 })
      );
      const result = await challengeLink.parseAndVerify();
      expect(result.valid).toBe(true);
    });
    it("returns valid=false for mismatched sig", async () => {
      mockLocation("?challenge=1&seed=s1&score=500&hearts=3&sig=wrong");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ sig: "abc123" }), { status: 200 })
      );
      const result = await challengeLink.parseAndVerify();
      expect(result.valid).toBe(false);
    });
    it("returns valid=false when server returns error", async () => {
      mockLocation("?challenge=1&seed=s1&score=500&hearts=3&sig=abc123");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("error", { status: 500 }));
      const result = await challengeLink.parseAndVerify();
      expect(result.valid).toBe(false);
    });
    it("returns valid=false when fetch throws", async () => {
      mockLocation("?challenge=1&seed=s1&score=500&hearts=3&sig=abc123");
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));
      const result = await challengeLink.parseAndVerify();
      expect(result.valid).toBe(false);
    });
  });

  describe("parseUnsafe", () => {
    it("parses challenge params from URL", () => {
      mockLocation("?challenge=1&seed=s1&score=500&hearts=3&ref=en-US");
      const result = challengeLink.parseUnsafe();
      expect(result.isChallenge).toBe(true);
      expect(result.seed).toBe("s1");
    });
    it("returns isChallenge=false for non-challenge URL", () => {
      mockLocation("");
      expect(challengeLink.parseUnsafe().isChallenge).toBe(false);
    });
  });
});
```

### __tests__/useThemeSettings.test.ts

```typescript
import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useThemeSettings } from "../hooks/useThemeSettings";
import type { ShopData } from "../utils/shop-storage";

const defaultShopData: ShopData = {
  equippedTheme: "default", equippedBackground: "default",
  unlockedThemes: [], unlockedBadges: [], unlockedSkins: [],
  unlockedBackgrounds: [], unlockedTrails: [],
  equippedBadge: "", equippedSkin: "", equippedTrail: "",
};

describe("useThemeSettings", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light-theme");
  });

  it("defaults to dark theme", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.theme).toBe("dark");
  });
  it("toggles to light theme and adds CSS class", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    act(() => { result.current.setTheme("light"); });
    expect(document.documentElement.classList.contains("light-theme")).toBe(true);
  });
  it("removes light-theme class when switching back to dark", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    act(() => { result.current.setTheme("light"); });
    act(() => { result.current.setTheme("dark"); });
    expect(document.documentElement.classList.contains("light-theme")).toBe(false);
  });
  it("changes colorblind mode", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    act(() => { result.current.setColorblindMode("deuteranopia"); });
    expect(result.current.colorblindMode).toBe("deuteranopia");
  });
  it("toggles FPS overlay with F key", () => {
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.showFps).toBe(false);
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "f" })); });
    expect(result.current.showFps).toBe(true);
    expect(localStorage.getItem("showFps")).toBe("true");
  });
  it("reads showFps from localStorage", () => {
    localStorage.setItem("showFps", "true");
    const { result } = renderHook(() => useThemeSettings(defaultShopData));
    expect(result.current.showFps).toBe(true);
  });
});
```

### __tests__/useDevToolsState.test.ts

```typescript
import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDevToolsState } from "../hooks/useDevToolsState";

describe("useDevToolsState", () => {
  it("initializes with correct defaults", () => {
    const { result } = renderHook(() => useDevToolsState());
    expect(result.current.devMode).toBe(false);
    expect(result.current.godMode).toBe(false);
    expect(result.current.devFreezeTime).toBe(false);
    expect(result.current.devRotationSpeed).toBe(1);
    expect(result.current.devAutoPlay).toBe(false);
    expect(result.current.devHeatmap).toEqual({});
  });
  it("toggles devMode", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevMode(true); });
    expect(result.current.devMode).toBe(true);
    act(() => { result.current.setDevMode(false); });
    expect(result.current.devMode).toBe(false);
  });
  it("toggles godMode", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setGodMode(true); });
    expect(result.current.godMode).toBe(true);
  });
  it("toggles devFreezeTime", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevFreezeTime(true); });
    expect(result.current.devFreezeTime).toBe(true);
  });
  it("sets devRotationSpeed", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevRotationSpeed(2.5); });
    expect(result.current.devRotationSpeed).toBe(2.5);
  });
  it("toggles devAutoPlay", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevAutoPlay(true); });
    expect(result.current.devAutoPlay).toBe(true);
  });
  it("sets devHeatmap", () => {
    const { result } = renderHook(() => useDevToolsState());
    act(() => { result.current.setDevHeatmap({ 0: 5, 1: 3 }); });
    expect(result.current.devHeatmap).toEqual({ 0: 5, 1: 3 });
  });
});
```

---

## End of Review Packet

All code above is the complete, current state of each file. Focus on security, correctness, and edge cases.
