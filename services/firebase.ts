const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let dbInstance: any = null;

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

export async function getDB(): Promise<any> {
  if (!IS_PROD) return null;
  if (dbInstance) return dbInstance;
  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getFirestore } = await import("firebase/firestore");
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (error) {
    console.warn("[DTP-Firebase] init failed:", error);
    // Try to report to Sentry if available
    try {
      const Sentry = await import("@sentry/react");
      Sentry.captureException(error, { tags: { component: "firebase-init" } });
    } catch {}
    return null;
  }
}

export async function fbAddScoreGlobal(
  entry: GlobalScoreEntry,
): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const { collection, addDoc, serverTimestamp } = await import(
    "firebase/firestore"
  );
  await addDoc(collection(db, "lb_global"), { ...normalizeGlobalScoreEntry(entry), ts: serverTimestamp() });
}

export async function fbLogEvent(name: string, params: Record<string, string | number | boolean | null | undefined> = {}): Promise<void> {
  if (!IS_PROD || typeof window === "undefined") return;
  try {
    const app = await getAppInstance();
    const analyticsMod = await import("firebase/analytics");
    if (!(await analyticsMod.isSupported())) return;
    const analytics = analyticsMod.getAnalytics(app);
    const safeParams = Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key.slice(0, 40), typeof value === "string" ? value.slice(0, 100) : value])
    );
    analyticsMod.logEvent(analytics, name.slice(0, 40), safeParams);
  } catch {}
}

export async function fbFetchTop20Global(): Promise<GlobalLeaderboardEntry[]> {
  const db = await getDB();
  if (!db) throw new Error("no db");
  const { collection, query, orderBy, limit, getDocs } = await import(
    "firebase/firestore"
  );
  const q = query(collection(db, "lb_global"), orderBy("score", "desc"), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map((doc: any) => {
    const data = doc.data();
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
  const { doc, setDoc, serverTimestamp } = await import(
    "firebase/firestore"
  );
  await setDoc(doc(db, "dust_wallet", safeName), {
    name: safeName,
    dust: Math.max(0, Math.min(999999, Math.floor(dust))),
    ts: serverTimestamp(),
  });
}

export async function fbCheckWeeklyBonus(name: string): Promise<number> {
  const db = await getDB();
  if (!db) return 0;
  try {
    const { collection, query, where, orderBy, limit, getDocs } = await import(
      "firebase/firestore"
    );
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const q = query(
      collection(db, "lb_global"),
      where("date", ">=", oneWeekAgo),
      orderBy("date", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    // Server-side where() already filters by date, no client filter needed
    const entries = snap.docs.map((doc: any) => doc.data());
    return entries.slice(0, 3).some((entry: any) => entry.initials === name) ? 500 : 0;
  } catch {
    return 0;
  }
}

let appInstance: any = null;

async function getAppInstance(): Promise<any> {
  if (appInstance) return appInstance;
  const { getApps, initializeApp } = await import("firebase/app");
  if (getApps().length) { appInstance = getApps()[0]; return appInstance; }
  appInstance = initializeApp(FIREBASE_CONFIG);
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
    return (result.data as any).streak;
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
