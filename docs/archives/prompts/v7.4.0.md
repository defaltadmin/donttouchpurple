# Claude Code — DTP v7.4.0 Remaining Fixes
# Paste this entire file as your prompt in the CLI session.
# Run from the repo root (deploy-ready/).

---

You are working on the "Don't Touch Purple" React/TypeScript browser game (v7.4.0).
The following build errors and issues have already been fixed externally and are NOT your task:
- GameEngine.ts TS2740/TS2345 (stateGuard.sanitize casts)
- firebase.ts TS2322 (GlobalLeaderboardEntry field guards)
- App.tsx no-explicit-any in setScreen
- App.tsx no-empty on localStorage catch blocks

Your job is to apply the 7 remaining fixes below IN ORDER. After all edits, run
`pnpm typecheck && pnpm lint` and confirm zero errors. Do not touch any other files.

---

## Fix 1 — Remove deprecated @sentry/tracing dependency

In `package.json`, delete the line:
```
"@sentry/tracing": "^7.120.4",
```
Then run:
```
pnpm remove @sentry/tracing
```
Search the entire codebase for any `import ... from '@sentry/tracing'` and delete those imports.
Sentry tracing is already included in @sentry/react v10 — no replacement import needed.

---

## Fix 2 — useEnergyStore.ts: fix stale closure in spendEnergy

File: `hooks/useEnergyStore.ts` (or wherever the file lives)

Find this function:
```ts
const spendEnergy = useCallback(() => {
  if (energyData.count <= 0) return false;
  setEnergyData(prev => {
    const newEd = { ...prev, count: prev.count - 1 };
    localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
    return newEd;
  });
  return true;
}, []);
```

Replace with:
```ts
const spendEnergy = useCallback(() => {
  if (energyDataRef.current.count <= 0) return false;
  setEnergyData(prev => {
    const newEd = { ...prev, count: prev.count - 1 };
    localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
    return newEd;
  });
  return true;
}, []);
```

The `energyDataRef` is already maintained in the file (`energyDataRef.current = energyData` on every render). Using it for the guard avoids reading stale closure state on rapid calls.

---

## Fix 3 — vite.config.ts: remove duplicate manualChunks block

File: `vite.config.ts`

Inside the `manualChunks(id)` function there are two identical consecutive blocks. The second copy starts with a second `if (id.includes('node_modules'))` check (approximately line 60) and ends with a second `if (id.includes('utils/')) return 'game-utils';` (approximately line 70).

Delete the entire duplicate block. The final `manualChunks` function should have each condition appearing exactly once, in this order:
1. gameanalytics → 'analytics'
2. node_modules → react-vendor / ui-icons / utils-vendor / vendor
3. engine/ or subsystems/ → 'game-engine'
4. utils/ → 'game-utils'
5. Backgrounds/ → 'bg-effects'
6. Shop/ or Leaderboard/ → 'heavy-panels'
7. Settings/ → 'settings-panel'
8. components/ or hooks/ → 'ui-layer'
9. services/ → 'services-monitoring' or 'services-core'

---

## Fix 4 — useScreenStateMachine.ts: remove unused payload parameter

File: `hooks/useScreenStateMachine.ts` (or `src/hooks/...`)

Step A — In the `ScreenState` interface, change:
```ts
transition: (to: Screen, payload?: unknown) => void;
```
to:
```ts
transition: (to: Screen) => void;
```

Step B — In the `transition` useCallback, change:
```ts
const transition = useCallback((to: Screen, payload?: unknown) => {
```
to:
```ts
const transition = useCallback((to: Screen) => {
```

Do not change anything else in the function body. The `payload` was accepted but never read.

---

## Fix 5 — GameEngine.ts: replace as any in session restore for bossEvent and activeBomb

File: `engine/GameEngine.ts`

Find the session restore block with these two lines (approximately line 909 and 913):
```ts
this.bossEvent = data.bossEvent ? { type: (data.bossEvent as any).type, endsAt: (data.bossEvent as any).endsAt } : null;
```
```ts
this.activeBomb = data.activeBomb ? { idx: (data.activeBomb as any).idx, expiresAt: (data.activeBomb as any).expiresAt, player: (data.activeBomb as any).player } : null;
```

Replace with:
```ts
if (data.bossEvent) {
  const be = data.bossEvent as Record<string, unknown>;
  this.bossEvent = { type: be.type as BossEventType, endsAt: be.endsAt as number };
} else {
  this.bossEvent = null;
}
if (data.activeBomb) {
  const ab = data.activeBomb as Record<string, unknown>;
  this.activeBomb = { idx: ab.idx as number, expiresAt: ab.expiresAt as number, player: ab.player as 1 | 2 };
} else {
  this.activeBomb = null;
}
```

`BossEventType` is already imported in this file. Do not add new imports.

---

## Fix 6 — bundle-size.yml: update Node.js version from 18 to 20

File: `.github/workflows/bundle-size.yml`

Find:
```yaml
        node-version: '18'
```
Replace with:
```yaml
        node-version: '20'
```

---

## Fix 7 — tsconfig.json: add services/ and utils/ to include

File: `tsconfig.json`

Find the `"include"` array and add `"services/**/*.ts"` and `"utils/**/*.ts"`:
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

Adjust paths to match the actual directory structure if the project uses `src/services/` etc.

---

## Final Step — Verify

Run:
```
pnpm typecheck
pnpm lint
```

Expected: zero errors, zero warnings on the files touched above.
If `pnpm lint` auto-fixes anything, commit those changes too.

Then bump the version:
```
npm version minor
```
(This moves `7.4.0` → `7.5.0`)

Update `CHANGELOG.md` by prepending the following entry at the top (after the `# Changelog` heading):

```markdown
## [7.5.0] — 2026-05-16

### Fixed
- **Build:** `GameEngine.ts` — TS2740/TS2345 in `stateGuard.sanitize` session restore; bridged
  `RareColorMode` ↔ `Record<string,unknown>` with `as unknown as` casts on both arguments.
- **Build:** `firebase.ts` — TS2322 in `fbFetchTop20Global`; replaced `?? 0` on `unknown` fields
  with `typeof` guards; `mode` now validates the `"classic" | "evolve"` union.
- **Lint:** `App.tsx` — `setScreen` typed `(s: string)` requiring `s as any`; parameter now typed
  directly as `Screen`.
- **Lint:** `App.tsx` — Empty `catch {}` on `localStorage.setItem` calls suppressed inline
  (`// eslint-disable-line no-empty`); intentional silent guard for private-mode / QuotaExceeded.
- **Bug:** `useEnergyStore` — `spendEnergy` guard read stale `energyData.count` from outer
  closure; now reads `energyDataRef.current.count` consistent with the regen timer.
- **Bug:** `GameEngine.ts` — `as any` on `bossEvent`/`activeBomb` sub-fields in session restore
  replaced with `Record<string,unknown>` intermediary + typed property access.

### Changed
- `useScreenStateMachine` — Removed unused `payload` parameter from `transition()` and the
  `ScreenState` interface.

### Removed
- `@sentry/tracing` v7 package removed; it was a deprecated re-export that conflicted with
  `@sentry/react` v10 already in use. Tracing is included in v10 automatically.

### Chore
- `vite.config.ts` — Removed duplicate `manualChunks` block (second copy was dead code; Rollup
  matches only the first branch per module ID).
- `tsconfig.json` — Added `services/**/*.ts` and `utils/**/*.ts` to `include` for explicit
  directory coverage.
- `bundle-size.yml` — Updated `node-version` from `'18'` (EOL April 2025) to `'20'`.
```
