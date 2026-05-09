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

async function getFirebaseToken(env: Env): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;

  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = btoa(JSON.stringify({
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
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
  const jwt = `${header}.${claim}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const json = await res.json<{ access_token: string; expires_in: number }>();
  _cachedToken = json.access_token;
  _tokenExpiry = Date.now() + json.expires_in * 1000;
  return _cachedToken;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
      const data = await request.json<ScorePayload>();
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

      const rateKey = `rate:${ip}:${(data.initials ?? 'anon').toLowerCase()}`;
      const now = Date.now();
      let attempts: number[] = (await env.RATE_LIMIT_KV.get(rateKey, { type: 'json' })) ?? [];
      attempts = attempts.filter(ts => now - ts < 60_000);
      if (attempts.length >= 8) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
      }
      attempts.push(now);
      await env.RATE_LIMIT_KV.put(rateKey, JSON.stringify(attempts), { expirationTtl: 90 });

      if (typeof data.score !== 'number' || data.score < 0 || data.score > 9999) {
        return new Response(JSON.stringify({ error: 'Invalid score' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      if (!data.initials || typeof data.initials !== 'string' || data.initials.length > 8) {
        return new Response(JSON.stringify({ error: 'Invalid initials' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      if (!data.mode || !['classic', 'evolve'].includes(data.mode)) {
        return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      if (typeof data.tick !== 'number' || data.tick < 0) {
        return new Response(JSON.stringify({ error: 'Missing tick' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      if (data.score > data.tick * 15 + 300) {
        return new Response(JSON.stringify({ error: 'Impossible score' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      if (typeof data.sessionId !== 'string' || data.sessionId.length < 8) {
        return new Response(JSON.stringify({ error: 'Missing session' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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
        },
      };

      const fbRes = await fetch(`${firebaseUrl}?documentId=auto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!fbRes.ok) {
        return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ success: true, score: data.score }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  },
} satisfies ExportedHandler<Env>;
