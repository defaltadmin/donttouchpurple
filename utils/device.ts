// Device fingerprinting utilities
export async function getDeviceId(): Promise<string> {
  // Simple device fingerprinting based on available browser APIs
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    !!window.indexedDB,
    navigator.hardwareConcurrency || 'unknown'
  ];

  const fingerprint = components.join('|');
  const hash = await simpleHash(fingerprint);
  return hash.toString(36);
}

async function simpleHash(str: string): Promise<number> {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}