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
  captureMessage: (...args: unknown[]) => { try { _sentry?.captureMessage(...args as [string, SentryType.SeverityLevel?]); } catch { /* Sentry unavailable */ } },
  setTags: (...args: unknown[]) => { try { _sentry?.setTags(...args as [Record<string, string | number | boolean>]); } catch { /* Sentry unavailable */ } },
  setTag: (...args: unknown[]) => { try { _sentry?.setTag(...args as [string, string]); } catch { /* Sentry unavailable */ } },
  setContext: (...args: unknown[]) => { try { _sentry?.setContext(...args as [string, Record<string, unknown> | null]); } catch { /* Sentry unavailable */ } },
  setUser: (...args: unknown[]) => { try { _sentry?.setUser(...args as [SentryType.User | null]); } catch { /* Sentry unavailable */ } },
  withScope: (...args: unknown[]) => { try { _sentry?.withScope(...args as [(scope: SentryType.Scope) => void]); } catch { /* Sentry unavailable */ } },
  flush: async (timeout?: number) => { try { return await _sentry?.flush(timeout) ?? false; } catch { return false; } },
};
