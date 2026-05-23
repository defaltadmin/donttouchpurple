import type { ExportedHandler, ExecutionContext, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  RATE_LIMIT_KV: KVNamespace;
  FIREBASE_PROJECT_ID: string;
  GCP_SERVICE_ACCOUNT_EMAIL: string;
  GCP_SERVICE_ACCOUNT_KEY_B64: string;
}

interface ScorePayload {
  score: number;
  initials: string;
  mode: 'classic' | 'evolve';
  badge?: string;
  date?: string;
  tick: number;
  sessionId: string;
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
    const origin = request.headers.get('Origin') ?? '';
    // Allow same-origin requests (no Origin header) and whitelisted origins
    if (origin && !allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': origin || 'https://dont-touch-purple.web.app',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

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
      const safeTick = Math.min(data.tick, 1200); // ~20min at 60fps cap
      if (data.score > safeTick * 15 + 300) {
        return new Response(JSON.stringify({ error: 'Impossible score' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (typeof data.sessionId !== 'string' || data.sessionId.length < 8) {
        return new Response(JSON.stringify({ error: 'Missing session' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
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
          tick: { integerValue: (data.tick ?? 0).toString() },
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
