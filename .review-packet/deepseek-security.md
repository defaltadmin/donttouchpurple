# DTP Security Source — For DeepSeek Review

Security-critical files: Firebase, Firestore rules, Cloudflare Worker, challenge links, score sync.


---
## `services/firebase.ts`
---

 
type FirebaseAppInstance = { name: string; options: Record<string, unknown>; automaticDataCollectionEnabled: boolean };

const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};



const IS_PROD =
  typeof window !== "undefined" &&
  (window.location.hostname === "game.mscarabia.com" ||
   window.location.hostname === "dont-touch-purple.web.app" ||
   window.location.hostname === "dont-touch-purple.firebaseapp.com");

export interface GlobalLeaderboardEntry {
  score: number;
  initials: string;
  date: string;
  mode: "classic" | "evolve";
  badge?: string;
}

export function todayISODate(now = new Date()): string {
  return now.toISOString().split("T")[0];
}

export function normalizeGlobalScoreEntry(entry: GlobalLeaderboardEntry): GlobalLeaderboardEntry {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(entry.date) ? entry.date : todayISODate();
  const safe: GlobalLeaderboardEntry = {
    score: Math.max(0, Math.min(9999, Math.floor(entry.score))),
    initials: entry.initials.replace(/[^a-zA-Z0-9_ ]/g, "").trim().slice(0, 8) || "Player",
    date,
    mode: entry.mode === "evolve" ? "evolve" : "classic",
  };
  if (entry.badge) safe.badge = entry.badge.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return safe;
}

export async function getDB(): Promise<unknown> {
  if (!IS_PROD) return null;
  await ensureAuth(); // Sign in anonymously before any Firestore operations
  return await ensureFirestore();
}

// Lazy Firebase initialization - only load when first Firebase operation is needed
let firebaseApp: unknown = null;
let firestoreDb: unknown = null;
let authReady: Promise<void> | null = null;

/** Sign in anonymously so Firestore rules can verify request.auth != null */
async function ensureAuth(): Promise<void> {
  if (authReady) return authReady;
  authReady = (async () => {
    try {
      const app = await ensureFirebaseApp();
      const { getAuth, signInAnonymously } = await import("firebase/auth");
      const auth = getAuth(app as FirebaseAppInstance);
      if (auth.currentUser) return; // Already signed in
      await signInAnonymously(auth);
    } catch (err) {
      // Auth failure is non-fatal — Firestore rules will reject unauthenticated writes
      console.warn('[firebase] Auth failed, Firestore ops will be unauthenticated:', err);
      authReady = null; // Allow retry
    }
  })();
  return authReady;
}

type FirebaseModuleFunctions = {
  collection: (db: unknown, path: string) => unknown;
  addDoc: (ref: unknown, data: Record<string, unknown>) => Promise<void>;
  serverTimestamp: () => Record<string, unknown>;
  query: (...args: unknown[]) => unknown;
  orderBy: (field: string, direction: string) => unknown;
  limit: (n: number) => unknown;
  getDocs: (query: unknown) => Promise<{ docs: Array<{ data: () => Record<string, unknown> }> }>;
  doc: (db: unknown, collection: string, id: string) => unknown;
  setDoc: (ref: unknown, data: Record<string, unknown>) => Promise<void>;
  where: (field: string, op: string, value: unknown) => unknown;
  getAnalytics: (app: unknown) => unknown;
  isSupported: () => Promise<boolean>;
  logEvent: (analytics: unknown, name: string, data: Record<string, unknown>) => void;
};

let firebaseModules: FirebaseModuleFunctions | null = null;

async function ensureFirebaseApp(): Promise<unknown> {
  if (firebaseApp) return firebaseApp;

  const { initializeApp, getApps } = await import("firebase/app");
  firebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);

  // Initialize App Check in production to prevent programmatic abuse
  if (IS_PROD) {
    try {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import("firebase/app-check");
      const siteKey = import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY;
      if (siteKey) {
        initializeAppCheck(firebaseApp as Parameters<typeof initializeAppCheck>[0], {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
      }
    } catch {
      // App Check optional — fails gracefully if not configured
    }
  }

  return firebaseApp;
}

async function ensureFirestore(): Promise<unknown> {
  if (firestoreDb) return firestoreDb;

  const app = await ensureFirebaseApp();
  const { getFirestore } = await import("firebase/firestore");
  firestoreDb = getFirestore(app);
  return firestoreDb;
}

async function ensureFirebaseModules(): Promise<FirebaseModuleFunctions> {
  if (firebaseModules) return firebaseModules;

  const [firestoreMod, analyticsMod] = await Promise.all([
    import("firebase/firestore"),
    import("firebase/analytics")
  ]);

  firebaseModules = {
    // Firestore
    collection: (firestoreMod as { collection: unknown }).collection as FirebaseModuleFunctions['collection'],
    addDoc: (firestoreMod as { addDoc: unknown }).addDoc as FirebaseModuleFunctions['addDoc'],
    serverTimestamp: (firestoreMod as { serverTimestamp: unknown }).serverTimestamp as FirebaseModuleFunctions['serverTimestamp'],
    query: (firestoreMod as { query: unknown }).query as FirebaseModuleFunctions['query'],
    orderBy: (firestoreMod as { orderBy: unknown }).orderBy as FirebaseModuleFunctions['orderBy'],
    limit: (firestoreMod as { limit: unknown }).limit as FirebaseModuleFunctions['limit'],
    getDocs: (firestoreMod as { getDocs: unknown }).getDocs as FirebaseModuleFunctions['getDocs'],
    doc: (firestoreMod as { doc: unknown }).doc as FirebaseModuleFunctions['doc'],
    setDoc: (firestoreMod as { setDoc: unknown }).setDoc as FirebaseModuleFunctions['setDoc'],
    where: (firestoreMod as { where: unknown }).where as FirebaseModuleFunctions['where'],

    // Analytics
    getAnalytics: (analyticsMod as { getAnalytics: unknown }).getAnalytics as FirebaseModuleFunctions['getAnalytics'],
    isSupported: (analyticsMod as { isSupported: unknown }).isSupported as FirebaseModuleFunctions['isSupported'],
    logEvent: (analyticsMod as { logEvent: unknown }).logEvent as FirebaseModuleFunctions['logEvent'],
  };

  return firebaseModules;
}

export async function fbLogEvent(name: string, params: Record<string, string | number | boolean | null | undefined> = {}): Promise<void> {
  if (!IS_PROD || typeof window === "undefined") return;
  try {
    const app = await getAppInstance();
    const modules = await ensureFirebaseModules();
    if (!(await modules.isSupported())) return;
    const analytics = modules.getAnalytics(app);
    const safeParams = Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key.slice(0, 40), typeof value === "string" ? value.slice(0, 100) : value])
    );
    modules.logEvent(analytics, name.slice(0, 40), safeParams);
  } catch {
    // Silently fail if logging fails
  }
}

export async function fbFetchTop20Global(): Promise<GlobalLeaderboardEntry[]> {
  const db = await getDB();
  if (!db) return [];
  const modules = await ensureFirebaseModules();
  const q = modules.query(modules.collection(db, "lb_global"), modules.orderBy("score", "desc"), modules.limit(20));
  const snap = await modules.getDocs(q);
  return snap.docs.map((doc: { data: () => Record<string, unknown> }) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      score: typeof data.score === "number" ? data.score : 0,
      initials: typeof data.initials === "string" ? data.initials : "???",
      date: typeof data.date === "string" ? data.date : "",
      mode: (data.mode === "evolve" ? "evolve" : "classic") as GlobalLeaderboardEntry["mode"],
      badge: typeof data.badge === "string" ? data.badge : "",
    };
  });
}

export async function fbSyncDust(name: string, dust: number): Promise<void> {
  const db = await getDB();
  const safeName = name.trim().slice(0, 20);
  if (!db || !safeName) return;
  const modules = await ensureFirebaseModules();
  const { getAuth } = await import("firebase/auth");
  const app = await ensureFirebaseApp();
  const auth = getAuth(app as FirebaseAppInstance);
  if (!auth.currentUser) return;
  // Match client-side max from useDustEconomy (9,999,999)
  const cappedDust = Math.max(0, Math.min(9_999_999, Math.floor(dust)));
  await modules.setDoc(modules.doc(db, "dust_wallet", auth.currentUser.uid), {
    name: safeName,
    dust: cappedDust,
    uid: auth.currentUser.uid,
    ts: modules.serverTimestamp(),
  });
}

async function getAppInstance(): Promise<FirebaseAppInstance> {
  return ensureFirebaseApp() as Promise<FirebaseAppInstance>;
}

function randomId(): string {
  try {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function getDeviceId(): string {
  try {
    // Only persist device ID if telemetry consent is granted
    if (localStorage.getItem('dtp:telemetry-consent') !== 'true') {
      return crypto.randomUUID?.() ?? randomId();
    }
    const key = "dtp-device-id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID?.() ?? randomId();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return crypto.randomUUID?.() ?? randomId();
  }
}

export async function fbGetStreak(opts?: { clientDate?: string }): Promise<number> {
  try {
    if (!IS_PROD) return getLocalStreakFallback();
    await ensureAuth();
    const app = await getAppInstance();
    const { getFunctions, httpsCallable } = await import("firebase/functions");
    const func = httpsCallable(getFunctions(app), "updateStreak");
    const result = await func({ clientDate: opts?.clientDate, deviceId: getDeviceId() });
    const s = (result.data as { streak?: unknown }).streak;
    return typeof s === 'number' && isFinite(s) ? Math.max(0, Math.min(999, Math.floor(s))) : getLocalStreakFallback();
  } catch {
    return getLocalStreakFallback();
  }
}

function getLocalStreakFallback(): number {
  try {
    const raw = localStorage.getItem("dtp_login_streak");
    if (!raw) return 1;
    const c = JSON.parse(raw).count;
    return typeof c === 'number' && isFinite(c) ? Math.max(0, Math.min(999, Math.floor(c))) : 1;
  } catch { return 1; }
}


---
## `firestore.rules`
---

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

    // Leaderboard — requires authentication, write-once
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

    // Dust wallet — requires authentication, UID-bound writes
    // docId = player name, uid field must match authenticated user
    match /dust_wallet/{docId} {
      allow read: if true;
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
        request.resource.data.dust < 10000000;
      allow delete: if false;
    }

    // Catch-all — deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}


---
## `workers/score-validator.ts`
---

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
      // Validate audience claim to prevent cross-project token abuse
      if (tokenInfo.aud && tokenInfo.aud !== env.FIREBASE_PROJECT_ID) {
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


---
## `utils/challenge-link.ts`
---

// utils/challenge-link.ts
import { logger } from './logger';

// SECURITY: The HMAC secret MUST be moved server-side (Cloudflare Worker) before production.
// Client-side secrets are extractable from the JS bundle.
// For now, we use a dev-only placeholder that disables challenge signing in production
// unless a real secret is configured.
const HMAC_SECRET: string =
  (import.meta as { env?: Record<string, string> }).env?.VITE_CHALLENGE_SECRET || '';

const SIGNING_ENABLED = !!HMAC_SECRET;
const IS_PROD = typeof window !== "undefined" && import.meta.env.PROD;

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


---
## `utils/score-sync.ts`
---

// utils/score-sync.ts
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
  async queue(score: number, mode: 'classic' | 'evolve' = 'evolve', tick = 0) {
    let initials = 'ANON';
    try {
      const rawInitials = localStorage.getItem(LS_KEYS.PLAYER_NAME) || 'ANON';
      initials = rawInitials.replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON';
    } catch { /* storage denied */ }
    const pending = { score, initials, mode, tick, attempts: 0, nextRetry: Date.now(), sessionId: crypto.randomUUID?.() || `sess-${Date.now()}` };

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

  async _submit(item: { score: number; initials: string; mode: string; tick?: number; attempts?: number; sessionId?: string }): Promise<'success' | 'permanent' | 'temporary'> {
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
        }),
      });
      if (!res.ok) {
        // 4xx = permanent error (bad payload, auth failure) — don't retry
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
        // Exponential backoff: skip items not yet due for retry
        const nextRetry = item.nextRetry ?? 0;
        if (nextRetry > now) continue;

        const result = await this._submit(item);
        if (result === 'success') {
          if (item.id != null) succeededIds.push(item.id);
        } else if (result === 'permanent') {
          // 4xx error — drop from queue permanently
          if (item.id != null) permanentIds.push(item.id);
        } else {
          if (item.id != null) failedIds.push(item.id);
        }
      }
      // Atomic: delete succeeded+permanent, update failed in-place (prevents data loss on page close)
      const toRemove = [...succeededIds, ...permanentIds];
      const updates = failedIds.map(id => {
        const item = pending.find(p => p.id === id);
        const attempts = (item?.attempts || 0) + 1;
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
    if (this._onlineHandler) return; // prevent double-registration
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


---
## `utils/privacy.ts`
---

import { logger } from './logger';
import { LS_KEYS } from '../config/difficulty';

const DTP_KEYS = [
  'dtp:session', 'dtp:settings', 'dtp:events', 'dtp:errors',
  'dtp:locale', 'dtp:config', 'dtp:achievements', 'dtp:achievement-toasts',
  'dtp:daily', 'dtp:perf', 'dtp:vol:sfx', 'dtp:vol:music', 'dtp:vol:ambient',
  'dtp:telemetry-consent', 'dtp:wins', 'dtp:deaths', 'dtp:feature-unlocks',
  'dtp-lifetime-dust', 'dtp-device-id', 'dtp_ab_variant',
  'dtp_muted', 'dtp_volume', 'dtp_haptics', 'dtp_screen_shake', 'dtp_reduced_motion',
  'dtp-best-classic', 'dtp-best-evolve', 'dtp-daily-completed', 'dtp-obj-streak',
  'dtp-games-played', 'dtp-challenge-progress', 'dtp:daily-complete', 'dtp_login_streak',
  // Derived from LS_KEYS — covers GDPR personal data
  LS_KEYS.PLAYER_NAME, LS_KEYS.DUST, LS_KEYS.ENERGY, LS_KEYS.SHOP,
  LS_KEYS.STORED_PWR, LS_KEYS.WEEKLY_BONUS, LS_KEYS.LB_CLASSIC, LS_KEYS.LB_EVOLVE,
  LS_KEYS.PRIVACY_OK, LS_KEYS.ONBOARD_SEEN, LS_KEYS.P1_KEYS, LS_KEYS.P2_KEYS,
];

export const privacyManager = {
  getAllData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    DTP_KEYS.forEach(k => {
      try { data[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch { data[k] = localStorage.getItem(k); }
    });
    return { ...data, exportedAt: new Date().toISOString() };
  },

  deleteAll(excludeSettings = false) {
    DTP_KEYS.forEach(k => {
      if (excludeSettings && k === 'dtp:settings') return;
      localStorage.removeItem(k);
    });
    sessionStorage.removeItem('dtp:session');
    logger.info('🗑️ User data deleted');
  },

  getConsent(): boolean {
    return localStorage.getItem('dtp:telemetry-consent') === 'true';
  },

  setConsent(granted: boolean) {
    localStorage.setItem('dtp:telemetry-consent', String(granted));
    if (!granted) {
      ['dtp:events', 'dtp:errors'].forEach(k => localStorage.removeItem(k));
      logger.info('🚫 Telemetry consent revoked');
    }
  }
};


---
## `utils/session.ts`
---

// utils/session.ts
// KEY CHANGE: 'dtp:session-ui' (was 'dtp:session') to prevent collision with
// GameEngine's full crash-recovery snapshot that also uses 'dtp:session'.
// The light UI snapshot (hearts/score/timeLeft) is only used by the
// resume-banner logic; the full snapshot owns the 'dtp:session' key exclusively.
import { logger } from './logger';

export interface GameSession {
  version: 1;
  timestamp: number;
  state: Record<string, unknown>;
  engineSnapshot: { hearts: number; score: number; timeLeft: number; isPaused: boolean };
}

export const sessionManager = {
  KEY: 'dtp:session-ui',          // ← was 'dtp:session' — collision fixed

  save(snapshot: GameSession['engineSnapshot'], extraState: Record<string, unknown> = {}) {
    try {
      const data: GameSession = {
        version: 1,
        timestamp: Date.now(),
        state: extraState,
        engineSnapshot: snapshot,
      };
      sessionStorage.setItem(this.KEY, JSON.stringify(data));
      logger.debug('Session saved', { ts: data.timestamp });
    } catch (e) {
      logger.warn('Failed to save session', e);
    }
  },

  load(): GameSession | null {
    try {
      const raw = sessionStorage.getItem(this.KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as GameSession;
      // Validate JSON shape — reject malformed data
      if (!data || typeof data !== 'object' || !data.engineSnapshot) return null;
      if (typeof data.engineSnapshot.hearts !== 'number' || typeof data.engineSnapshot.score !== 'number') return null;
      // Expire after 12 hours or reject future timestamps (clock skew)
      if (Date.now() - data.timestamp > 4.32e7 || data.timestamp > Date.now() + 60_000) {
        this.clear();
        return null;
      }
      return data;
    } catch {
      this.clear();
      return null;
    }
  },

  clear() { sessionStorage.removeItem(this.KEY); },
};


---
## `firebase.json`
---

{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
          { "key": "X-XSS-Protection", "value": "0" },
          { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
          { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://browser.sentry-cdn.com https://js.sentry-cdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.sentry.io https://www.google-analytics.com https://analytics.google.com https://game.mscarabia.com; frame-src 'self' https://dont-touch-purple.web.app; worker-src 'self' blob:; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;" }
        ]
      }
    ]
  }
}
