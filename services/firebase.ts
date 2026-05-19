 
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

export interface GlobalScoreEntry {
  score: number;
  initials: string;
  date: string;
  mode: "classic" | "evolve";
  badge?: string;
}

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

export function normalizeGlobalScoreEntry(entry: GlobalScoreEntry): GlobalScoreEntry {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(entry.date) ? entry.date : todayISODate();
  const safe: GlobalScoreEntry = {
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
    } catch {
      // Auth failure is non-fatal — Firestore rules will reject unauthenticated writes
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
  if (!db) throw new Error("no db");
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
  // Cap dust to prevent client-side manipulation — max realistic lifetime dust is ~50000
  const cappedDust = Math.max(0, Math.min(50000, Math.floor(dust)));
  await modules.setDoc(modules.doc(db, "dust_wallet", safeName), {
    name: safeName,
    dust: cappedDust,
    ts: modules.serverTimestamp(),
  });
}

let appInstance: FirebaseAppInstance | null = null;

async function getAppInstance(): Promise<FirebaseAppInstance> {
  if (appInstance) return appInstance;
  const { getApps, initializeApp } = await import("firebase/app");
  if (getApps().length) { appInstance = getApps()[0] as FirebaseAppInstance; return appInstance; }
  appInstance = initializeApp(FIREBASE_CONFIG) as unknown as FirebaseAppInstance;
  return appInstance;
}

export function getDeviceId(): string {
  try {
    const key = "dtp-device-id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export async function fbGetStreak(opts?: { clientDate?: string }): Promise<number> {
  try {
    if (!IS_PROD) return getLocalStreakFallback();
    const app = await getAppInstance();
    const { getFunctions, httpsCallable } = await import("firebase/functions");
    const func = httpsCallable(getFunctions(app), "updateStreak");
    const result = await func({ clientDate: opts?.clientDate, deviceId: getDeviceId() });
    return (result.data as { streak: number }).streak;
  } catch {
    return getLocalStreakFallback();
  }
}

function getLocalStreakFallback(): number {
  try {
    const raw = localStorage.getItem("dtp_login_streak");
    if (!raw) return 1;
    return JSON.parse(raw).count ?? 1;
  } catch { return 1; }
}
