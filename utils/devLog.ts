export function logError(...args: Parameters<typeof console.error>) {
  if (import.meta.env.DEV) {
    console.error('[DTP]', ...args);
  }
}
