import type * as SentryType from "@sentry/react";

// Lazy-loaded Sentry (~50-80KB savings from main bundle)
let _sentry: typeof SentryType | null = null;
export async function getSentry() {
  if (!_sentry) _sentry = await import("@sentry/react");
  return _sentry;
}

// Safe Sentry wrapper (deferred load + ad-blocker safe)
export const safeSentry = {
  addBreadcrumb: (...args: unknown[]) => { try { _sentry?.addBreadcrumb(...args as [Record<string, unknown>]); } catch { /* Sentry unavailable */ } },
  captureException: (...args: unknown[]) => { try { _sentry?.captureException(...args as [unknown]); } catch { /* Sentry unavailable */ } },
  setTags: (...args: unknown[]) => { try { _sentry?.setTags(...args as [Record<string, string | number | boolean>]); } catch { /* Sentry unavailable */ } },
  setContext: (...args: unknown[]) => { try { _sentry?.setContext(...args as [string, Record<string, unknown> | null]); } catch { /* Sentry unavailable */ } },
};
