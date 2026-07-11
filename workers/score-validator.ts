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
  /** Weekly ladder: ISO week id e.g. 2026-W28 */
  weekId?: string;
  ladderSeed?: number;
  ladder?: boolean;
}

/** Current ISO week id in UTC (must match client utils/weekly-ladder.ts). */
function getUtcWeekId(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function isValidWeekId(weekId: string): boolean {
  return /^[0-9]{4}-W[0-9]{2}$/.test(weekId);
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
    // base64url encoding (no padding, + → -, / → _)
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

function toBase64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signChallenge(score: number, seed: string, hearts: number, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const msg = new TextEncoder().encode(`${score}:${seed}:${hearts}`);
  const raw = await crypto.subtle.sign('HMAC', key, msg);
  return toBase64url(raw);
}

async function verifyChallenge(score: number, seed: string, hearts: number, sig: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const msg = new TextEncoder().encode(`${score}:${seed}:${hearts}`);
  const expected = await crypto.subtle.sign('HMAC', key, msg);
  const expectedStr = toBase64url(expected);
  // Constant-time compare via timing-safe byte-by-byte
  if (expectedStr.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedStr.length; i++) diff |= expectedStr.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

// Google's public key endpoint for Firebase ID tokens
const GOOGLE_PUBLIC_KEYS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let _cachedPublicKeys: Record<string, string> | null = null;
let _publicKeysExpiry = 0;

async function getGooglePublicKeys(): Promise<Record<string, string>> {
  if (_cachedPublicKeys && Date.now() < _publicKeysExpiry) return _cachedPublicKeys;
  const res = await fetch(GOOGLE_PUBLIC_KEYS_URL);
  if (!res.ok) throw new Error('Failed to fetch Google public keys');
  // Respect Cache-Control max-age for key rotation
  const cacheControl = res.headers.get('Cache-Control') ?? '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3_600_000;
  _cachedPublicKeys = await res.json<Record<string, string>>();
  _publicKeysExpiry = Date.now() + maxAge;
  return _cachedPublicKeys!;
}

function base64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(s.length + (4 - s.length % 4) % 4, '=');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function pemToCryptoKey(pem: string): Promise<CryptoKey> {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const der = Uint8Array.from(atob(body), c => c.charCodeAt(0)).buffer;
  return crypto.subtle.importKey('spki', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
}

/**
 * Verifies a Firebase ID token locally using Google's public keys.
 * Replaces the insecure tokeninfo endpoint approach (SSRF risk, token in URL).
 */
async function verifyFirebaseJwt(token: string, projectId: string): Promise<void> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');
  const [headerB64, claimB64, sigB64] = parts;

  let header: { kid?: string; alg?: string };
  let claims: { aud?: string; iss?: string; sub?: string; exp?: number; iat?: number };
  try {
    header = JSON.parse(new TextDecoder().decode(base64urlDecode(headerB64)));
    claims = JSON.parse(new TextDecoder().decode(base64urlDecode(claimB64)));
  } catch {
    throw new Error('Invalid JWT encoding');
  }

  if (header.alg !== 'RS256') throw new Error('Invalid algorithm');
  if (!header.kid) throw new Error('Missing kid');

  const now = Math.floor(Date.now() / 1000);
  if (!claims.exp || claims.exp < now) throw new Error('Token expired');
  if (!claims.iat || claims.iat > now + 300) throw new Error('Token issued in the future');
  if (claims.aud !== projectId) throw new Error('Invalid audience');
  if (claims.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Invalid issuer');
  if (!claims.sub) throw new Error('Missing subject');

  const keys = await getGooglePublicKeys();
  const pem = keys[header.kid];
  if (!pem) throw new Error('Unknown key id');

  const cryptoKey = await pemToCryptoKey(pem);
  const signingInput = new TextEncoder().encode(`${headerB64}.${claimB64}`);
  const signature = base64urlDecode(sigB64);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, signingInput);
  if (!valid) throw new Error('Invalid signature');
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight — reflect validated origin (don't hardcode)
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
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-AppCheck',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    // Origin validation (allowedOrigins declared above in CORS section)
    // Require a valid Origin header — requests without one (curl, scripts) are rejected.
    const origin = request.headers.get('Origin') ?? '';
    if (!origin || !allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': origin || 'https://dont-touch-purple.web.app',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-AppCheck',
      'Vary': 'Origin',
    };

    const contentType = request.headers.get('Content-Type') ?? '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), { status: 415, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const url = new URL(request.url);

    // SEC-010: Server-side HMAC signing for challenge links
    if (url.pathname === '/api/sign-challenge') {
      // SEC-013: Rate limit sign-challenge to prevent HMAC CPU abuse
      const signIp = request.headers.get('cf-connecting-ip');
      if (!signIp) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const signRateKey = `sign-rate:${signIp}`;
      const signNow = Date.now();
      let signAttempts: number[] = (await env.RATE_LIMIT_KV.get(signRateKey, { type: 'json' })) ?? [];
      signAttempts = signAttempts.filter(ts => signNow - ts < 60_000);
      if (signAttempts.length >= 30) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      signAttempts.push(signNow);
      await env.RATE_LIMIT_KV.put(signRateKey, JSON.stringify(signAttempts), { expirationTtl: 61 });

      if (!env.CHALLENGE_HMAC_SECRET) {
        return new Response(JSON.stringify({ error: 'Challenge signing not configured' }), { status: 501, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      try {
        const body = await request.json<ChallengePayload>();
        if (typeof body.score !== 'number' || typeof body.seed !== 'string' || typeof body.hearts !== 'number') {
          return new Response(JSON.stringify({ error: 'Invalid challenge params' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        // SEC-016: Limit seed length to prevent memory exhaustion
        if (body.seed.length > 256) {
          return new Response(JSON.stringify({ error: 'Seed too long' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        const sig = await signChallenge(body.score, body.seed, body.hearts, env.CHALLENGE_HMAC_SECRET);
        return new Response(JSON.stringify({ sig }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      } catch {
        return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    }

    // SEC-CL-01: Server-side HMAC verification for challenge links
    if (url.pathname === '/api/verify-challenge') {
      const verifyIp = request.headers.get('cf-connecting-ip');
      if (!verifyIp) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      // More permissive rate limit — verification is lighter than signing
      const verifyRateKey = `verify-rate:${verifyIp}`;
      const verifyNow = Date.now();
      let verifyAttempts: number[] = (await env.RATE_LIMIT_KV.get(verifyRateKey, { type: 'json' })) ?? [];
      verifyAttempts = verifyAttempts.filter(ts => verifyNow - ts < 60_000);
      if (verifyAttempts.length >= 60) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      verifyAttempts.push(verifyNow);
      await env.RATE_LIMIT_KV.put(verifyRateKey, JSON.stringify(verifyAttempts), { expirationTtl: 61 });

      if (!env.CHALLENGE_HMAC_SECRET) {
        return new Response(JSON.stringify({ error: 'Challenge verification not configured' }), { status: 501, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      try {
        const body = await request.json<ChallengePayload & { sig: string }>();
        if (typeof body.score !== 'number' || typeof body.seed !== 'string' || typeof body.hearts !== 'number' || typeof body.sig !== 'string') {
          return new Response(JSON.stringify({ error: 'Invalid params' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        if (body.seed.length > 256) {
          return new Response(JSON.stringify({ error: 'Seed too long' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        const valid = await verifyChallenge(body.score, body.seed, body.hearts, body.sig, env.CHALLENGE_HMAC_SECRET);
        return new Response(JSON.stringify({ valid }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
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
      await verifyFirebaseJwt(idToken, env.FIREBASE_PROJECT_ID);
    } catch {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    try {
      const data = await request.json<ScorePayload>();
      const ip = request.headers.get('cf-connecting-ip');
      if (!ip) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const rateKey = `rate:${ip}`;
      const now = Date.now();
      let attempts: number[] = (await env.RATE_LIMIT_KV.get(rateKey, { type: 'json' })) ?? [];
      attempts = attempts.filter(ts => now - ts < 60_000);
      if (attempts.length >= 8) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      attempts.push(now);
      await env.RATE_LIMIT_KV.put(rateKey, JSON.stringify(attempts), { expirationTtl: 61 });

      if (typeof data.score !== 'number' || !Number.isFinite(data.score) || data.score < 0) {
        return new Response(JSON.stringify({ error: 'Invalid score' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (!data.initials || typeof data.initials !== 'string' || data.initials.length > 8 || !/^[a-zA-Z0-9_ ]{1,8}$/.test(data.initials)) {
        return new Response(JSON.stringify({ error: 'Invalid initials' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (!data.mode || !['classic', 'evolve'].includes(data.mode)) {
        return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (typeof data.tick !== 'number' || !Number.isFinite(data.tick) || data.tick < 0) {
        return new Response(JSON.stringify({ error: 'Missing tick' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      // Single binding score cap: rate-based heuristic (25 pts/tick) with hard ceiling
      const HARD_MAX = 9999;
      const safeTick = Math.min(data.tick, 600); // ~10min at 60fps cap, matches Firestore rule
      const maxScore = Math.min(HARD_MAX, Math.floor(safeTick * 25));
      if (data.score > maxScore) {
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

      // Weekly ladder path: scores land in lb_weekly/{weekId}/entries
      const isLadder = data.ladder === true || (typeof data.weekId === 'string' && data.weekId.length > 0);
      let weekId: string | null = null;
      if (isLadder) {
        weekId = typeof data.weekId === 'string' ? data.weekId : getUtcWeekId();
        if (!isValidWeekId(weekId)) {
          return new Response(JSON.stringify({ error: 'Invalid weekId' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        // Reject stale/future week ids (only current UTC week accepted)
        if (weekId !== getUtcWeekId()) {
          return new Response(JSON.stringify({ error: 'Week closed' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
      }

      const token = await getFirebaseToken(env);
      const base = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
      const firebaseUrl = isLadder && weekId
        ? `${base}/lb_weekly/${encodeURIComponent(weekId)}/entries`
        : `${base}/lb_global`;

      const payload = {
        fields: {
          score: { integerValue: Math.floor(data.score).toString() },
          initials: { stringValue: data.initials },
          mode: { stringValue: data.mode },
          ...(data.badge ? { badge: { stringValue: data.badge } } : {}),
          date: { stringValue: new Date().toISOString().split('T')[0] },
          ts: { timestampValue: new Date().toISOString() },
          sessionId: { stringValue: data.sessionId },
          tick: { integerValue: Math.floor(safeTick).toString() },
          ...(isLadder && weekId ? {
            weekId: { stringValue: weekId },
            ladderSeed: { integerValue: String(Math.floor(Number(data.ladderSeed) || 0)) },
          } : {}),
        },
      };

      const fbRes = await fetch(firebaseUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!fbRes.ok) {
        return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      return new Response(JSON.stringify({
        success: true,
        score: data.score,
        ...(weekId ? { weekId, ladder: true } : {}),
      }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    } catch (err) {
      const msg = err instanceof Error ? err.message.replace(/[\r\n]/g, ' ') : 'unknown';
      console.error('score-validator failure:', msg);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
  },
} satisfies ExportedHandler<Env>;
