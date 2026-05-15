// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
   window.location.hostname === "dont-touch-purple.firebaseapp.com" ||
   window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1");

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
    score: Math.max(0, Math.min(99999, Math.floor(entry.score))),
    initials: entry.initials.replace(/[^a-zA-Z0-9_ ]/g, "").trim().slice(0, 8) || "Player",
    date,
    mode: entry.mode === "evolve" ? "evolve" : "classic",
  };
  if (entry.badge) safe.badge = entry.badge.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return safe;
}

export async function getDB(): Promise<unknown> {
  if (!IS_PROD) return null;
  return await ensureFirestore();
}

// Lazy Firebase initialization - only load when first Firebase operation is needed
let firebaseApp: unknown = null;
let firestoreDb: unknown = null;
let firebaseModules: Record<string, Function> | null = null;

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

async function ensureFirebaseModules(): Promise<Record<string, Function>> {
  if (firebaseModules) return firebaseModules;

  const [firestoreMod, analyticsMod] = await Promise.all([
    import("firebase/firestore"),
    import("firebase/analytics")
  ]);

  firebaseModules = {
    // Firestore
    collection: firestoreMod.collection,
    addDoc: firestoreMod.addDoc,
    serverTimestamp: firestoreMod.serverTimestamp,
    query: firestoreMod.query,
    orderBy: firestoreMod.orderBy,
    limit: firestoreMod.limit,
    getDocs: firestoreMod.getDocs,
    doc: firestoreMod.doc,
    setDoc: firestoreMod.setDoc,
    where: firestoreMod.where,

    // Analytics
    getAnalytics: analyticsMod.getAnalytics,
    isSupported: analyticsMod.isSupported,
    logEvent: analyticsMod.logEvent,
  };

  return firebaseModules;
}

export async function fbAddScoreGlobal(
  entry: GlobalScoreEntry,
): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const modules = await ensureFirebaseModules();
  await modules.addDoc(modules.collection(db, "lb_global"), { ...normalizeGlobalScoreEntry(entry), ts: modules.serverTimestamp() });
}

/** @deprecated Use scoreSync.queue() instead. */
export async function fbAddScoreViaWorker(score: number, mode: 'classic' | 'evolve' = 'evolve'): Promise<void> {
  const { scoreSync } = await import('../utils/score-sync');
  await scoreSync.queue(score, mode);
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
  } catch (_) {}
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
      score: data.score ?? 0,
      initials: data.initials ?? "???",
      date: data.date ?? "",
      mode: data.mode ?? "classic",
      badge: data.badge ?? "",
    };
  });
}

export async function fbSyncDust(name: string, dust: number): Promise<void> {
  const db = await getDB();
  const safeName = name.trim().slice(0, 20);
  if (!db || !safeName) return;
  const modules = await ensureFirebaseModules();
  await modules.setDoc(modules.doc(db, "dust_wallet", safeName), {
    name: safeName,
    dust: Math.max(0, Math.min(999999, Math.floor(dust))),
    ts: modules.serverTimestamp(),
  });
}

export async function fbCheckWeeklyBonus(name: string): Promise<number> {
  const db = await getDB();
  if (!db) return 0;
  // Sanitize name before any use — same rules as normalizeGlobalScoreEntry
  const safeName = name.replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8);
  if (!safeName) return 0;
  try {
    const { collection, query, where, orderBy, limit, getDocs } = await ensureFirebaseModules();
    // oneWeekAgo is a computed ISO date string — not user input
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const q = query(
      collection(db, "lb_global"),
      where("date", ">=", oneWeekAgo),
      orderBy("date", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    const entries = snap.docs.map((doc: { data: () => Record<string, unknown> }) => doc.data() as Record<string, unknown>);
    return entries.slice(0, 3).some((entry: Record<string, unknown>) => entry.initials === safeName) ? 500 : 0;
  } catch (_) {
    return 0;
  }
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
  } catch (_) {
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
