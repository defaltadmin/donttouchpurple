# Don't Touch Purple — Consolidated Roadmap
_Compiled: 19 May 2025 | Updated: post-mimo audit_
_Sources: DTP-AUDIT-FINDINGS.md, DTP_FIXES_v7.5.3.md, AI Full-Scan, Lint Report, Post-Fix Verification_

---

## Current Baseline (post-mimo)

| Check | Status |
|---|---|
| `pnpm typecheck` | ✅ 0 errors |
| `pnpm lint` (errors only) | ✅ 0 errors |
| `pnpm lint --max-warnings=0` | ❌ FAILS — 312 warnings |
| `pnpm test` | ✅ 134/134 pass |

**The 9 original hard lint errors are gone. The remaining 312 are all warnings — no runtime crashes — but a strict CI gate (`--max-warnings=0`) still fails.**

---

## ✅ CONFIRMED FIXED (verified by code inspection)

| ID | Item | How verified |
|---|---|---|
| R01 | `Hearts.tsx` conditional hooks | All hooks at top level; early return is after all hook calls |
| R02 | `bundle-size.yml` YAML syntax | `env: REPO/RUN_ID` + `process.env.*` pattern confirmed |
| R03 | Node 18 → 20 in `bundle-size.yml` | `node-version: '20'` confirmed |
| R04 | `scoreSubmittedRef` reset in `handleTutorialClose` | Reset at line 1276 confirmed |
| R05 | Double `fbLogEvent("game_over")` | Only one call remains (inside `getFirebase().then`) |
| R12 | p2 session restore bounds-clamping | Full `Math.max/Math.min` on all p2 fields, matches p1 |
| R16 | Duplicate `manualChunks` block | Only one `manualChunks(id)` block in `vite.config.ts` |
| R18 | `as any` on bossEvent/activeBomb restore | Now uses `Record<string, unknown>` intermediate casts |
| R29 | `@sentry/tracing` removed | Only `@sentry/react` remains in `package.json` |

---

## ❌ STILL OPEN — Bugs / Logic

### R13 — `App.tsx`: `snapshotRef.current?.p1.score` missing optional chain
**File:** `App.tsx` inside `handleEngineGameOver`
`snapshotRef.current?.p1.score` — optional chain stops at `p1` but `.score` is not guarded. If `p1` is undefined this crashes silently.
**Fix:** Change all occurrences to `snapshotRef.current?.p1?.score` and `snapshotRef.current?.p1?.health`.

---

### R14 — `App.tsx`: `fbGetStreak` can set state with non-number
**File:** `App.tsx`
If `fbGetStreak` resolves with `undefined` or non-number, `setLoginStreakCount(undefined)` breaks streak UI. The `safeStreak` guard is present in the current code but needs confirmation it covers the full chain.
**Fix:** Confirm the guard `typeof streak === 'number' && isFinite(streak) ? streak : 1` wraps the `.then()` result before any `setState` call.

---

### R15 — `GameEngine.ts`: `devSpawnSpecialCell` guard uses `devMode` which is always `false`
**File:** `engine/GameEngine.ts`
`devSpawnSpecialCell`, `devTriggerBotTap`, `devToggleBotAssist` guard with `if (!this.devMode) return` but `devMode` defaults `false` and is never set `true` by the constructor. These are permanently no-ops.
**Fix:** Remove the `devMode` guard — these methods are only called from `DevOverlay` which is already DEV-only gated.

---

### R17 — `useScreenStateMachine.ts`: `payload` param defined but never used
**File:** `hooks/useScreenStateMachine.ts`
`transition(to, payload?)` accepts a `payload` but never reads or forwards it. Dead interface surface.
**Fix:** Remove the parameter from both the interface and the implementation.

---

### R22 — `App.tsx`: Stale version hardcode `"5.8.17"` in version check
**File:** `App.tsx`
A `useEffect` compares `__APP_VERSION__` against `"5.8.17"`. App is now v7.5.3 — this fires a Sentry breadcrumb on every single page load.
**Fix:** Delete the entire version-mismatch `useEffect` block entirely.

---

### R23 — `App.tsx`: PWA install banner shown on first visit (0 games played)
**File:** `App.tsx`
Condition `gamesPlayed >= 3 || screen === "menu"` fires immediately for new users because `screen === "menu"` is always true in that effect.
**Fix:**
```ts
if (!promptAlreadyShown && gamesPlayed >= 3) {
  setTimeout(() => setShowInstallBanner(true), 2200);
}
```

---

## ❌ STILL OPEN — Lint / Code Quality

### R37 — `App.tsx`: Massive unused imports (30+ warnings)
**File:** `App.tsx`
**Source:** `pnpm lint` output
The following are imported but never used in the current render tree. Each is a warning that counts toward the 312 total:
- `motion` (framer-motion)
- `sessionManager`, `analytics`, `LazyHydrate`, `achievementSystem`
- `getSentry`, `ErrorBoundary`
- `STAGES`, `EVOLVE_PATTERNS`
- `saveKeys`, `toLabel`, `playVolumeChime`
- `GameSnapshot`, `StoredPowerups`
- `Toast`, `RareSplash`, `GridErrorBoundary`, `PwrBar`, `PlayerPanel`
- `ShieldDrop`, `FreezeDrop`, `EnergyDrop`
- `GameOver` (component)
- `fbLogEvent` (direct import — now only used via `getFirebase()`)
- `logDesignEvent`, `logResourceEvent`, `logErrorEvent`
- `featureGates`, `KeyBinder`, `useBackgroundController`, `MAX_TUTORIAL_GAMES`

**Fix:** Remove all unused import lines. If any are needed for future features, move them to a `// TODO:` comment block rather than live imports.

---

### R38 — `App.tsx`: Unused state variables and destructured values
**File:** `App.tsx`
**Source:** `pnpm lint` output — lines 147, 157, 158, 172, 174, 278, 321, 328, 348, 349, 402, 403, 484, 550, 657–664, 750
Unused destructured values include:
- `showLangMenu`, `setShowLangMenu`
- `showLoginStreak` (destructured but `showLoginStreak` is never rendered)
- `showDailyChallenges`, `setShowDailyChallenges`
- `dailyComplete`, `combo`
- `getLifetimeDustSpent`
- `backgroundFPS`
- `queueOfflineScore`
- `initialsEntered`, `prevBest`
- `fpsFrameRef`, `lastFpsTimeRef`
- `setP1Keys`, `setP2Keys`
- `newDust` (result of `addDust` call discarded)
- `startBot`, `stopBot`, `lastGameScore`, `submitScoreToLeaderboard`, `restoreSession`, `generateChallengeUrl`
- `settings` (subscribed but never read)
- `submitScore` (defined but never called)

**Fix:** Prefix with `_` if intentionally unused (e.g. `_setShowLangMenu`), or remove the destructuring entirely if the value is truly dead.

---

### R39 — `App.tsx`: `react-hooks/exhaustive-deps` warnings (15+ instances)
**File:** `App.tsx`
**Source:** `pnpm lint` output
Missing or incorrect hook dependencies across multiple `useEffect` / `useCallback` calls:

| Line | Hook | Missing dep |
|---|---|---|
| 249 | `useEffect` | `setShowWhatsNew` |
| 333 | `useEffect` | `setDust` |
| 400 | `useCallback` | `setShowNameEntry` |
| 454 | `useMemo` | `dustRef` |
| 603 | `useCallback` | `updateChallengeProgress` |
| 613 | `useEffect` | `setShowRewardsHub` |
| 623 | `useEffect` | `setShowRewardsHub` |
| 728 | `useCallback` | `dustRef` |
| 829 | `useCallback` | `setScreen` |
| 923 | `useCallback` | `setSettingsFromPause`, `setShowSettings` |
| 939 | `useEffect` | `setShowDevPanel` |
| 1121 | `useEffect` | `setShowNameEntry` |
| 1128 | `useEffect` | `setScreen` |
| 1237 | `useCallback` | `setShareUrl`, `setShowShare` |
| 1249 | `useEffect` | `setShowRotatePrompt` |
| 1306 | `useCallback` | `dustRef`, `setShowTutorial` |
| 1415 | `useCallback` | unnecessary deps: `addDust`, `buildDailyChallenges`, `buildWeeklyTasks` |

**Fix strategy:** Most of these are stable setter functions from `useState` — React guarantees setter identity is stable, so they can safely be added to dep arrays without causing re-renders. Add them. For `dustRef` (a ref), refs don't need to be in dep arrays — suppress with `// eslint-disable-next-line react-hooks/exhaustive-deps` with a comment explaining why.

---

### R40 — `App.tsx`: `no-explicit-any` warnings (6 instances)
**File:** `App.tsx` — lines 294, 299, 556, 710, 734
**Fix:** Replace `any` with proper types:
- Line 294: `queueOfflineScore` param — type as `ScoreEntry` or inline object type
- Line 299: `(reg as any).sync` — type as `ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }`
- Line 556: same `sync` pattern
- Lines 710, 734: `(e as CustomEvent).detail` — type as `CustomEvent<ComboState>` etc.

---

### R41 — React components: unused props / `no-explicit-any` warnings
**Source:** `pnpm lint` output
Multiple components have props destructured but never used. These generate `no-unused-vars` warnings:

| File | Unused props |
|---|---|
| `components/HUD/GameArea.tsx` | `isPlaying`, `devHeatmap`, `onRestart` |
| `components/HUD/PlayerPanel.tsx` | `anim`, `cellShape`, `onPause`, `isFS`, `levelUpBadge`, `pwrToast`, `storedFreezeCharges`, `storedShieldCharges`, `onActivateFreeze`, `onActivateShield`, `showStoredPwr`, `onStartBot`, `onStopBot` |
| `components/HUD/ScoreFloat.tsx` | `player` |
| `components/Screens/StartScreen.tsx` | `onGameMaster`, `rewardsBadgeCount`, `dustWidget`, `dailyObjectives` |
| `components/Settings/SettingsDrawer.tsx` | `onOpenBuildDeploy` |
| `components/Settings/DevOverlay.tsx` | `CellType` (type import), `dust` |
| `components/Backgrounds/AuroraBorealis.tsx` | `reducedMotion` |
| `components/Backgrounds/DigitalRain.tsx` | `reducedMotion`, `tick` |
| `components/Backgrounds/Nebula.tsx` | `reducedMotion` |

**Fix:** Prefix unused destructured props with `_` (e.g. `_onRestart`) to satisfy the lint rule while keeping the prop in the interface for future use. For truly dead props, remove from both the interface and all call sites.

---

### R42 — Background components: unnecessary `active` in `useEffect` deps
**Source:** `pnpm lint` output
`AuroraBorealis.tsx:124`, `DigitalRain.tsx:83`, `Nebula.tsx:105` all have `active` as a `useEffect` dependency but `active` is a mutable ref/variable — mutating it doesn't trigger re-renders, so it's an invalid dep.
**Fix:** Remove `active` from the dependency arrays in all three files.

---

### R43 — `hooks/useGameEngine.ts`: ref cleanup warning + missing deps
**File:** `hooks/useGameEngine.ts`
**Source:** `pnpm lint` output — lines 307, 323
- Line 307: `rafIdRef.current` captured in cleanup — React warns the ref value may have changed by cleanup time. Copy to a local variable inside the effect.
- Line 323: `useEffect` missing deps: `config`, `dustCallbacks`, `onBombDefused`, `onBossEvent`, `onDamage`, `toast$`

**Fix for line 307:**
```ts
useEffect(() => {
  const rafId = rafIdRef.current; // capture at effect time
  return () => { if (rafId) cancelAnimationFrame(rafId); };
}, [...]);
```
**Fix for line 323:** Add missing deps or wrap the callbacks in `useCallback` at the call site in `App.tsx` so their identity is stable.

---

### R44 — `hooks/useInputHandler.ts`: ref cleanup warnings
**File:** `hooks/useInputHandler.ts` — lines 44, 45
`pressP1TimersRef.current` and `pressP2TimersRef.current` captured in cleanup functions. Same pattern as R43.
**Fix:** Copy ref values to local variables inside the effect before the return cleanup.

---

### R45 — Services / utils: pervasive `no-explicit-any` warnings
**Source:** `pnpm lint` output
Files with the most `any` warnings that should be typed properly:

| File | Count | Notes |
|---|---|---|
| `services/errorLogger.ts` | 8 | Error handler params — use `unknown` + type narrowing |
| `services/leaderboard.ts` | 8 | Firestore doc data — use typed interfaces |
| `services/metrics.ts` | 5 | Event payload — use `Record<string, unknown>` |
| `services/sentry.ts` | 5 | Sentry context — use Sentry's own types |
| `engine/GameEngine.ts` | 8 | `devSpawnSpecialCell` cell mutation — use `ActiveCell` union |
| `hooks/useGameStartActions.ts` | 4 | Event params — type properly |
| `hooks/useInputHandler.ts` | 2 | Key event handling |
| `components/HUD/GameArea.tsx` | 4 | Prop types |
| `utils/web-vitals.ts` | 5 | Web Vitals API — use `web-vitals` package types |

**Fix strategy:** Replace `any` with `unknown` where the type is truly unknown, then narrow with `typeof`/`instanceof`. For Firestore data use typed interfaces. For unavoidable cases (e.g. legacy APIs), use targeted `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a comment.

---

### R46 — Various files: minor unused vars (scattered warnings)
**Source:** `pnpm lint` output
Small isolated unused variable warnings across the codebase:

| File | Unused |
|---|---|
| `engine/subsystems/ScoreTracker.ts` | `rhythmFeedback`, `bossEngine` imports |
| `engine/subsystems/TickProcessor.ts` | `STAGES`, `analytics`, `calculateStreakBonus` imports |
| `components/Animations/EnergyDrop.tsx` | `GAME`, `onComplete` |
| `components/Animations/FreezeDrop.tsx` | `GAME`, `onComplete` |
| `components/LazyPanels.tsx` | `Suspense`, `Fallback` |
| `components/UI/ScrambleText.tsx` | `scrambling` |
| `components/Cell/index.tsx` | `e` in catch block |
| `config/keybindings.ts` | `_` (×2) |
| `utils/audio.ts` | `_gain` |
| `utils/feedback-rhythm.ts` | `logger` |
| `utils/state-guard.ts` | `SafeParseResult` type |
| `input/normalizer.ts` | `InputEvent` type |
| `services/firebase.ts` | `e` in catch, `any` cast |
| `services/gameanalytics.ts` | `tick`, `_` (×4) |
| `functions/src/index.ts` | `context` |

**Fix:** Remove unused imports. Prefix unused catch params with `_` (e.g. `catch (_e)`). Remove unused type imports.

---

## ❌ STILL OPEN — Architecture / QOL

### R19 — `App.tsx`: God component — 1100+ lines, 50+ state vars
**File:** `App.tsx`
Single biggest maintainability risk. `handleEngineGameOver` alone is ~100 lines. Score submission, daily objective logic, and challenge progress tracking are all inline.
**Recommendation:** Extract into:
- `useScoreSubmission` hook (auto-submit + offline queue logic)
- `useDailyProgress` hook (objective checking + challenge progress)
- Keep `App.tsx` as orchestrator only

---

### R20 — `App.tsx`: `handleTutorialClose` duplicates `startGame` logic
**File:** `App.tsx`
~30 lines of identical game-start logic duplicated between `startGame` and `handleTutorialClose`.
**Fix:** After setting the tutorial flag, call `startGame()` internally from `handleTutorialClose`.

---

### R21 — `App.tsx`: `toastTimer` / `toastRef` naming confusion
**File:** `App.tsx`
Two refs for toast timeouts with confusing names. `toastTimer` is used for achievement toasts, `toastRef` for regular toasts.
**Fix:** Rename `toastTimer` → `achievementToastTimer`.

---

### R24 — `App.tsx`: `_abTestVariant` computed but never used
**File:** `App.tsx`
A/B test variant stored in state and localStorage but never passed anywhere. Pure dead code.
**Fix:** Remove entirely until the A/B test is actually implemented.

---

### R25 — `App.tsx`: `pressing1`/`pressing2` memoization is ineffective
**File:** `App.tsx`
`new Set(pressP1)` inside `useMemo` with `[pressP1]` dep — arrays never have referential equality so the memo fires every render.
**Fix:** Pass `pressP1` directly or use a stable ref-based approach.

---

### R26 — `App.tsx`: `assetGateRef` is a permanent no-op stub
**File:** `App.tsx`
`assetGateRef` is `{ setProgress: () => {}, loadAll: () => Promise.resolve() }`. All `h.add(...)` calls are commented out. The entire tiered asset loading system does nothing.
**Fix:** Remove `AssetHydrator` import and `assetGateRef` entirely, or implement the asset list.

---

### R27 — `firebase.ts`: `IS_PROD` check is hostname-only
**File:** `services/firebase.ts`
Any hostname not in the hardcoded list silently disables all Firebase writes with no warning.
**Fix:** Add `VITE_ENABLE_FIREBASE` env flag as override, or log a `console.warn` when `IS_PROD` is false.

---

### R28 — `App.tsx`: `handleEngineGameOver` useCallback deps incomplete
**File:** `App.tsx`
Stale closures on `wins`, `deaths`, `gamesPlayed`, `machine` can cause incorrect progress tracking.
**Fix:** Ensure dep array includes: `[numPlayers, playerName, toast$, best1, best2, gameMode, wins, deaths, gamesPlayed, machine, shopData, addDust]`

---

## ❌ STILL OPEN — Dependencies / Config

### R30 — `package.json` version vs README mismatch
**File:** `package.json` / `README.md`
`package.json` is now `7.5.3` (bumped by mimo). README still says `v7.5.2`. CHANGELOG should also be updated.
**Fix:** Update README version badge and CHANGELOG header to `7.5.3`.

---

### R31 — `tsconfig.json`: `services/` and `utils/` not in `include`
**File:** `tsconfig.json`
**Fix:**
```json
"include": [
  "main.tsx", "App.tsx", "vite.config.ts",
  "config/**/*.ts", "engine/**/*.ts", "hooks/**/*.ts",
  "services/**/*.ts", "utils/**/*.ts",
  "__tests__/**/*.ts", "test/**/*.ts", "*.d.ts"
]
```

---

### R32 — `.env.local` / `.env.production` should be gitignored
**File:** `.gitignore`
Both files exist in the working tree and likely contain Firebase API keys.
**Fix:** Add to `.gitignore`. Rotate any keys that may have been committed.

---

## ❌ STILL OPEN — Repo Hygiene

### R33 — `junk/` directory committed to repo
Contains old zips, coverage reports, old source files, AI prompt archives, `.aider` history.
**Fix:** Add `junk/` to `.gitignore` or delete it.

---

### R34 — Duplicate files at repo root
`newfiles_App_tar`, `opengraph.jpg`, `favicon.svg`, `errorlog16-5.md`, `AUTONOMOUS-RUN.md`, `CLAUDE-CODE-PROMPT-v7.5.3.md` exist at root AND inside `junk/`.
**Fix:** Delete root-level copies.

---

### R35 — `workers/score-validator.ts` is unreferenced dead code
**Fix:** Wire into Cloudflare Worker deployment or delete.

---

### R36 — `fbAddScoreViaWorker` marked `@deprecated` but still exported
**File:** `services/firebase.ts`
**Fix:** Remove the export if no callers remain.

---

## Implementation Order for Next Session

### Batch 1 — Lint zero (quickest path to `--max-warnings=0`) ~2–3 hrs

| Priority | ID | Item | Effort |
|---|---|---|---|
| 1 | R37 | Remove 30+ unused imports in `App.tsx` | 20 min |
| 2 | R38 | Prefix/remove unused state vars in `App.tsx` | 20 min |
| 3 | R39 | Fix `exhaustive-deps` warnings in `App.tsx` | 30 min |
| 4 | R40 | Replace `any` in `App.tsx` | 15 min |
| 5 | R41 | Prefix unused props in components with `_` | 20 min |
| 6 | R42 | Remove `active` from background `useEffect` deps | 5 min |
| 7 | R43 | Fix ref cleanup + missing deps in `useGameEngine` | 15 min |
| 8 | R44 | Fix ref cleanup in `useInputHandler` | 5 min |
| 9 | R46 | Remove scattered unused vars across utils/services | 20 min |
| 10 | R45 | Replace `any` in services/utils (worst offenders first) | 45 min |

### Batch 2 — Logic fixes ~1 hr

| Priority | ID | Item | Effort |
|---|---|---|---|
| 11 | R13 | Fix `snapshotRef.current?.p1?.score` optional chain | 5 min |
| 12 | R15 | Remove `devMode` guard from dev engine functions | 5 min |
| 13 | R17 | Remove unused `payload` param from `transition` | 5 min |
| 14 | R22 | Delete stale `"5.8.17"` version-check `useEffect` | 2 min |
| 15 | R23 | Fix PWA banner gate condition | 2 min |
| 16 | R14 | Confirm `fbGetStreak` non-number guard | 5 min |

### Batch 3 — Config / hygiene ~30 min

| Priority | ID | Item | Effort |
|---|---|---|---|
| 17 | R30 | Sync README/CHANGELOG to `7.5.3` | 5 min |
| 18 | R31 | Expand `tsconfig.json` include | 5 min |
| 19 | R32 | Gitignore `.env.local` / `.env.production` | 5 min |
| 20 | R33–R34 | Clean `junk/` and root artifacts | 20 min |
| 21 | R35–R36 | Remove dead worker + deprecated export | 10 min |

### Batch 4 — Architecture (larger refactors) ~3–5 hrs

| Priority | ID | Item | Effort |
|---|---|---|---|
| 22 | R24–R26 | Dead code cleanup (A/B test, assetGate, pressing memo) | 30 min |
| 23 | R27 | Add `IS_PROD` override / warning | 15 min |
| 24 | R28 | Fix `handleEngineGameOver` useCallback deps | 10 min |
| 25 | R20–R21 | Dedup `handleTutorialClose`, rename `toastTimer` | 20 min |
| 26 | R19 | Extract `useScoreSubmission` + `useDailyProgress` hooks | 2–4 hrs |

---

## Validation Checklist

```bash
pnpm typecheck              # must be 0 errors
pnpm lint                   # must be 0 errors
pnpm lint --max-warnings=0  # target: 0 warnings (currently 312)
pnpm test                   # must be 134/134 pass
pnpm build                  # must complete clean
```

_Baseline after mimo: 134/134 tests ✅ | 0 type errors ✅ | 0 lint errors ✅ | 312 lint warnings ❌_
