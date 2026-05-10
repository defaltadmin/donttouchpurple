const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDGUxT4nhAPYsxzmOAESKsFgkd4jhUif4o",
  authDomain: "dont-touch-purple.firebaseapp.com",
  projectId: "dont-touch-purple",
  storageBucket: "dont-touch-purple.firebasestorage.app",
  messagingSenderId: "46782482111",
  appId: "1:46782482111:web:a47a1b9afc5feba4eaa80a",
  measurementId: "G-QVXYQ7C2WN",
};

let dbInstance: any = null;

const IS_PROD =
  typeof window !== "undefined" &&
  window.location.hostname === "game.mscarabia.com";

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
  await addDoc(collection(db, "lb_global"), { ...entry, ts: serverTimestamp() });
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
  if (!db) return;
  const { doc, setDoc, serverTimestamp } = await import(
    "firebase/firestore"
  );
  await setDoc(doc(db, "dust_wallet", name), { name, dust, ts: serverTimestamp() });
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
    const entries = snap.docs.map((doc: any) => doc.data());
    const weekly = entries.filter((entry: any) => entry.date >= oneWeekAgo);
    return weekly.slice(0, 3).some((entry: any) => entry.initials === name) ? 500 : 0;
  } catch {
    return 0;
  }
}

import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp, getApps } from "firebase/app";

let appInstance: any = null;

async function getAppInstance(): Promise<any> {
  if (appInstance) return appInstance;
  if (getApps().length) { appInstance = getApps()[0]; return appInstance; }
  const { initializeApp } = await import("firebase/app");
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
    const func = httpsCallable(getFunctions(app), "updateStreak");
    const result = await func({ clientDate: opts?.clientDate });
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
