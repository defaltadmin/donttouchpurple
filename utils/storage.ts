export function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* quota or private mode */ }
}
export function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}
export function safeGetJSON<T>(key: string, fallback: T): T {
  const raw = safeGet(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
