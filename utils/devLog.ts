export function logError(...args: Parameters<typeof console.error>) {
  if (import.meta.env.DEV) {
    console.error('[DTP]', ...args);
  }
}

export function logWarn(...args: Parameters<typeof console.warn>) {
  if (import.meta.env.DEV) {
    console.warn('[DTP]', ...args);
  }
}
