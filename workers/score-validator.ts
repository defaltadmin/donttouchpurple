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
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

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
      const tokenInfo = await verifyRes.json<{ aud?: string; sub?: string; iss?: string }>();
      if (!tokenInfo.sub) {
        return new Response(JSON.stringify({ error: 'Invalid token claims' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      // SEC-015: Validate issuer to prevent cross-project token abuse
      const expectedIss = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`;
      if (!tokenInfo.iss || tokenInfo.iss !== expectedIss) {
        return new Response(JSON.stringify({ error: 'Invalid issuer' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      // Validate audience claim to prevent cross-project token abuse.
      // Missing aud is also rejected — a valid Google token always includes it.
      if (!tokenInfo.aud || tokenInfo.aud !== env.FIREBASE_PROJECT_ID) {
        return new Response(JSON.stringify({ error: 'Invalid audience' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Token verification failed' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
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
      const safeTick = Math.min(data.tick, 600); // ~10min at 60fps cap, matches Firestore rule
      if (data.score > Math.floor(safeTick * 8 * 1.5)) { // 8 pts/tick avg with 50% buffer
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
