# Don't Touch Purple — Full Audit Report
## Base: v7.4.0 → Target: v7.5.0

---

## ✅ Already Fixed (this session)

| # | File | Issue | Fix Applied |
|---|------|-------|-------------|
| 1 | `GameEngine.ts:906` | TS2740/TS2345 — `stateGuard.sanitize` arg types incompatible with `RareColorMode` | Double-cast both args via `as unknown as` |
| 2 | `firebase.ts:169` | TS2322 — `?? 0` on `unknown` fields doesn't narrow type | Replaced with `typeof` guards per field; `mode` validates the union |
| 3 | `App.tsx:284` | `@typescript-eslint/no-explicit-any` — `s as any` in `setScreen` | Typed param as `Screen` directly, cast removed |
| 4 | `App.tsx:381,387,393,399,404` (+ 3 more) | `no-empty` — silent `localStorage` catch blocks | Added `// eslint-disable-line no-empty` inline |

---

## 🔴 Additional Bugs Found

### B1 — `useEnergyStore.ts:44` — Stale closure in `spendEnergy`
**Severity:** Medium — causes silent failure in low-energy guard  
`spendEnergy` reads `energyData.count` from the outer closure (stale after rapid calls) but updates via functional `setEnergyData`. The guard `if (energyData.count <= 0) return false` can pass when energy is actually 0 if state hasn't re-rendered.

**Fix:**
```ts
// Before
const spendEnergy = useCallback(() => {
  if (energyData.count <= 0) return false;   // ← stale closure
  setEnergyData(prev => { ... });
  return true;
}, []);

// After
const spendEnergy = useCallback(() => {
  const current = energyDataRef.current;      // ← use the ref (already maintained)
  if (current.count <= 0) return false;
  setEnergyData(prev => { ... });
  return true;
}, []);
```

---

### B2 — `vite.config.ts:49–70` — Duplicate `manualChunks` block
**Severity:** Low-Medium — dead code, causes confusion and risk of divergence  
The `node_modules` → `react-vendor` / `ui-icons` / `utils-vendor` block and the `engine/` / `utils/` block each appear **twice** in `manualChunks`. Rollup processes only the first match per ID, so the second copy is completely dead. If someone edits only one copy, the blocks silently diverge.

**Fix:** Delete lines 60–70 (the duplicate block).

---

### B3 — `useScreenStateMachine.ts:75` — `payload` parameter defined but never used
**Severity:** Low — dead interface surface, misleads callers  
`transition(to, payload?)` accepts a `payload` but never reads or forwards it. The `ScreenState` interface exposes this as a public contract that does nothing.

**Fix:** Either remove the parameter entirely, or wire it to a `payloadRef` if future screens will need it. For now: remove from both the interface and the implementation.

---

### B4 — `GameEngine.ts:909,913` — Unnecessary `as any` casts on session restore
**Severity:** Low — bypasses type safety unnecessarily  
`data.bossEvent` and `data.activeBomb` are already typed as `Record<string, unknown>` after the outer `data` cast. Accessing `.type`, `.endsAt`, `.idx`, `.expiresAt`, `.player` should use `as unknown as X` or property-level `typeof` guards, not `as any`.

```ts
// Before
this.bossEvent = data.bossEvent
  ? { type: (data.bossEvent as any).type, endsAt: (data.bossEvent as any).endsAt }
  : null;

// After
const be = data.bossEvent as Record<string, unknown>;
this.bossEvent = be
  ? { type: be.type as BossEventType, endsAt: be.endsAt as number }
  : null;
```

---

## 🟡 Configuration Issues

### C1 — `bundle-size.yml` — Node.js 18 (EOL since April 2025)
**File:** `.github/workflows/bundle-size.yml:13`  
`ci.yml` correctly uses Node 20/22/24. `bundle-size.yml` still specifies `node-version: '18'`. Node 18 reached end-of-life on 30 April 2025. GitHub Actions runners will warn; this will eventually break.

**Fix:**
```yaml
node-version: '20'
```

---

### C2 — `tsconfig.json` — Missing `services/` and `utils/` in `include`
**File:** `tsconfig.json`  
`include` lists `engine/**/*.ts`, `hooks/**/*.ts`, `config/**/*.ts` — but the source tree also has `services/` (firebase.ts, analytics, etc.) and `utils/` (stateGuard, logger, etc.) directories that are heavily imported. These are being compiled transitively via imports from included files, but they're not explicitly listed. This means:
- IDE path resolution can behave inconsistently
- Future `tsc --diagnostics` output may be confusing
- Path-based tools (coverage, bundle analysis) may miss them

**Fix:**
```json
"include": [
  "main.tsx",
  "App.tsx",
  "vite.config.ts",
  "config/**/*.ts",
  "engine/**/*.ts",
  "hooks/**/*.ts",
  "services/**/*.ts",
  "utils/**/*.ts",
  "__tests__/**/*.ts",
  "test/**/*.ts",
  "*.d.ts"
]
```

---

### C3 — `package.json` — `@sentry/tracing` is a deprecated dead dependency
**File:** `package.json`  
`@sentry/tracing` has been fully merged into `@sentry/react` and `@sentry/browser` since v7. The standalone package is deprecated and only re-exports from the main SDK. The version listed (`^7.120.4`) is the legacy v7 tracing package while `@sentry/react` is on `^10.51.0` (v10), creating a **major version mismatch** — v7 and v10 Sentry packages should not coexist.

**Fix:**
```json
// Remove entirely:
"@sentry/tracing": "^7.120.4"
```
Run `pnpm remove @sentry/tracing` and verify no import of `@sentry/tracing` exists in source.

---

## 📋 Changelog Entry

```markdown
## [7.5.0] — 2026-05-16

### Fixed
- **Build:** `GameEngine.ts` — TS2740/TS2345 errors in `stateGuard.sanitize` call during session
  restore; `RareColorMode` and `Record<string,unknown>` are now bridged with explicit
  `as unknown as` casts on both arguments.
- **Build:** `firebase.ts` — TS2322 in `fbFetchTop20Global`; `?? 0` on `unknown`-typed Firestore
  fields does not narrow the type. Replaced with `typeof` guards per field; `mode` now validates
  the `"classic" | "evolve"` union rather than blindly casting.
- **Lint:** `App.tsx` — `setScreen` callback typed as `(s: string)` requiring `s as any` to pass
  to `machine.transition`; parameter is now correctly typed as `Screen`.
- **Lint:** `App.tsx` — Empty `catch {}` blocks on `localStorage.setItem` calls flagged by
  `no-empty`; suppressed inline with `// eslint-disable-line no-empty` (intentionally silent —
  private-mode / QuotaExceeded guard).
- **Bug:** `useEnergyStore` — `spendEnergy` read `energyData.count` from a stale outer closure;
  now reads from `energyDataRef.current` to match the ref already maintained for the regen timer.
- **Bug:** `GameEngine.ts` — Session restore used `as any` on `bossEvent` and `activeBomb`
  sub-fields; replaced with `Record<string, unknown>` intermediate casts and typed property access.

### Changed
- `useScreenStateMachine` — Removed unused `payload` parameter from `transition` and the
  `ScreenState` interface; it was accepted but never read or forwarded.

### Removed
- `@sentry/tracing` dependency removed; it was a deprecated v7 re-export package that conflicted
  with `@sentry/react` v10 already in the project.

### Chore
- `vite.config.ts` — Removed duplicate `manualChunks` block (lines 60–70 were an exact copy
  of lines 49–59; Rollup only matches the first branch per module ID).
- `tsconfig.json` — Added `services/**/*.ts` and `utils/**/*.ts` to `include` for explicit
  coverage of those directories.
- `.github/workflows/bundle-size.yml` — Updated `node-version` from `'18'` (EOL April 2025)
  to `'20'`.
```

---

## Priority Order for Claude Code Execution

1. **C3** — Remove `@sentry/tracing` (risk of runtime conflict)
2. **B1** — Fix `spendEnergy` stale closure (silent logic bug)
3. **B2** — Remove duplicate `manualChunks` block
4. **B3** — Remove unused `payload` param
5. **B4** — Replace `as any` with typed casts in session restore
6. **C1** — Update bundle-size.yml Node version
7. **C2** — Expand `tsconfig.json` include list
