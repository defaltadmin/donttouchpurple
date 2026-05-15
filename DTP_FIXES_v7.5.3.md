# DTP v7.5.3 — Fix Plan
_Authored by Claude (architect). Implement with Gemini CLI / opencode._

---

## FIX 1 — `.github/workflows/bundle-size.yml` YAML syntax error (**CRITICAL — breaks CI on every push**)

**Root cause:** The `script: |` block contains `${{ github.repository }}` inside a JS template literal backtick string. GitHub Actions YAML parser chokes on this at line ~59 because backticks inside multi-line YAML scalars containing `${{` expressions are ambiguous.

**File:** `.github/workflows/bundle-size.yml`

**Fix:** Replace the inline `${{ github.repository }}` expression inside the JS script block with an environment variable passed via `env:`.

```yaml
      - name: Comment PR with bundle size
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v7
        env:
          REPO: ${{ github.repository }}
          RUN_ID: ${{ github.run_id }}
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('dist/bundle-size-report.json', 'utf8'));
            const formatFile = (file) => {
              const status = file.passed ? '✅' : '❌';
              const rating = file.rating === 'good' ? '🟢' : file.rating === 'needs-improvement' ? '🟡' : '🔴';
              return `${status} ${rating} **${file.name}**: ${file.sizeKB}KB (limit: ${file.limitKB}KB)`;
            };
            const recommendations = report.recommendations.length > 0
              ? '\n\n💡 **Recommendations:**\n' + report.recommendations.map(r => `• ${r}`).join('\n')
              : '';
            const body = `## 📊 Bundle Size Analysis
            **Status:** ${report.passed ? '✅ Passed' : '❌ Failed'}

            ### Files:
            ${report.files.map(formatFile).join('\n')}

            ### Totals:
            **JS:** ${Math.round(report.totals.js / 1024)}KB
            **CSS:** ${Math.round(report.totals.css / 1024)}KB
            **Total:** ${Math.round(report.totals.total / 1024)}KB (limit: ${Math.round(600)}KB)
            ${recommendations}

            [View detailed report](https://github.com/${process.env.REPO}/actions/runs/${process.env.RUN_ID})`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

**Key change:** `${{ github.repository }}` → `process.env.REPO` and `${{ github.run_id }}` → `process.env.RUN_ID`, with both passed via `env:` block above the `with:`.

---

## FIX 2 — `App.tsx`: Stale version hardcode in version sync check

**File:** `App.tsx` (~line 580 area, search for `"5.8.17"`)

**Root cause:** Version check hardcoded to `"5.8.17"` but app is now `7.5.2`. Fires a Sentry warning on every page load.

**Fix:** Remove the version mismatch useEffect entirely OR update it to compare against the actual `__APP_VERSION__` define:

```tsx
// DELETE the entire block:
useEffect(() => {
  const pkgVersion: string = (window as any).__APP_VERSION__ ?? "5.8.17";
  if (pkgVersion !== "5.8.17") {
    console.warn(`[DTP] Version mismatch: package=${pkgVersion}`);
    safeSentry.addBreadcrumb({ category: "deploy", message: "version_mismatch", data: { pkg: pkgVersion } });
  }
}, []);
```

This block is dead logic — `__APP_VERSION__` will never equal `"5.8.17"` again. Just delete it.

---

## FIX 3 — `App.tsx`: PWA install banner shown on first visit (no games played)

**File:** `App.tsx` (search for `setShowInstallBanner(true)`)

**Root cause:** The condition is:
```ts
if (!promptAlreadyShown && (gamesPlayed >= 3 || screen === "menu")) {
  setTimeout(() => setShowInstallBanner(true), 2200);
}
```
`screen === "menu"` is always true here (this runs in a `useEffect` with `[screen]` dep), so the banner fires immediately for brand-new users with 0 games.

**Fix:**
```ts
// CHANGE TO:
if (!promptAlreadyShown && gamesPlayed >= 3) {
  setTimeout(() => setShowInstallBanner(true), 2200);
}
```

Remove `|| screen === "menu"` entirely. PWA prompt should only appear after the player has actually played 3 games.

---

## FIX 4 — `App.tsx`: `scoreSubmittedRef` never reset between games

**File:** `App.tsx` (search for `scoreSubmittedRef`)

**Root cause:** `scoreSubmittedRef.current = true` is set at game over but never reset to `false` when a new game starts. If player plays game 2, score is silently dropped.

**Fix:** In the engine start handler or wherever `startEngine()` is called (look for `setScreen("playing")` or the play button handler), add:
```ts
scoreSubmittedRef.current = false;
```

Also add it at the top of `handleEngineGameOver` as a guard comment so future devs know it's intentional:
```ts
// Reset submission gate for next game (set back to false in startGame handler)
```

The actual reset should go in the function that calls `startEngine()` — search for `startEngine(` in App.tsx and add `scoreSubmittedRef.current = false;` immediately before or after the call.

---

## FIX 5 — `App.tsx`: Dead `toastTimer` ref — duplicate of `toastRef`

**File:** `App.tsx`

**Root cause:** Two refs created for toast timeouts:
```ts
const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);  // line ~280
const toastRef = useRef<ReturnType<typeof setTimeout>|null>(null);       // line ~700
```
`toast$` uses `toastRef`. `toastTimer` is never used in `toast$` — it's dead code that may have been an earlier version. If any code path sets `toastTimer` without clearing via `toastRef`, timers can stack.

**Fix:** Delete `toastTimer` ref entirely. Search for any remaining usages of `toastTimer` and replace with `toastRef`. There should be none remaining if it's fully unused, but verify.

```ts
// DELETE this line:
const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
```

---

## FIX 6 — `App.tsx`: Firebase `fbGetStreak` unhandled rejection chain

**File:** `App.tsx` (search for `fbGetStreak`)

**Root cause:**
```ts
getFirebase().then(fb =>
  fb.fbGetStreak({ clientDate: new Date().toISOString().split("T")[0] })
).then(streak => {
  setLoginStreakCount(streak);
  ...
}).catch(e => logger.warn('Firebase operation failed', e));
```

If `fbGetStreak` itself resolves but `setLoginStreakCount` or `localStorage.setItem` throws synchronously inside the `.then`, the `.catch` won't catch it in some environments (depends on microtask scheduling). More importantly, if `fbGetStreak` returns `undefined` or a non-number, `setLoginStreakCount(undefined)` breaks the streak UI.

**Fix:**
```ts
getFirebase().then(fb =>
  fb.fbGetStreak({ clientDate: new Date().toISOString().split("T")[0] })
).then(streak => {
  const safeStreak = typeof streak === 'number' && isFinite(streak) ? streak : 1;
  setLoginStreakCount(safeStreak);
  try {
    localStorage.setItem("dtp_login_streak", JSON.stringify({
      count: safeStreak,
      lastDate: new Date().toDateString()
    }));
  } catch {}
}).catch(e => logger.warn('Firebase streak fetch failed', e));
```

---

## FIX 7 — `App.tsx`: `snapshotRef` null-guard in `handleEngineGameOver`

**File:** `App.tsx` (inside `handleEngineGameOver`)

**Root cause:** Multiple `snapshotRef.current?.` usages but some without the optional chain:
- `snapshotRef.current?.tick ?? 0` — OK
- `snapshotRef.current?.gameSeed ?? 0` — OK
- `snapshotRef.current?.p1.score` — **NO optional chain on `.score`** — if `p1` is undefined this crashes

Search for `snapshotRef.current?.p1.score` and fix to `snapshotRef.current?.p1?.score`.

Also check: `snapshotRef.current?.p1.health` — same fix: `snapshotRef.current?.p1?.health`.

---

## FIX 8 — `App.tsx`: `handleEngineGameOver` missing deps in useCallback

**File:** `App.tsx`

The `useCallback` for `handleEngineGameOver` has an incomplete dependency array. Based on the visible code it uses: `numPlayers`, `playerName`, `toast$`, `best1`, `best2`, `gameMode`, `wins`, `deaths`, `gamesPlayed`, `machine`, `shopData`, `addDust`, `snapshotRef`, `bossCountersRef`, `peakStreakRef`, `scoreSubmittedRef`.

**Fix:** Ensure the dep array at the end of `handleEngineGameOver`'s `useCallback` includes all of these (refs don't need to be in deps, but state/callbacks do):

```ts
}, [numPlayers, playerName, toast$, best1, best2, gameMode, wins, deaths, gamesPlayed, machine, shopData, addDust]);
```

If `machine` causes re-renders, wrap `machine.updateProgress` in a stable callback via `useCallback` inside `useScreenStateMachine` or use a ref for it.

---

## BONUS IMPROVEMENT — `App.tsx`: Aggressive preload runs on every render cycle

**File:** `App.tsx` (search for "Aggressive preload")

```ts
useEffect(() => {
  if (screen === "menu") {
    import("./components/Shop/ShopPanel");
    import("./components/Backgrounds/PurpleRain");
  }
}, [screen]);
```

This re-fires every time `screen` changes back to "menu" (e.g. after game over → menu). Dynamic imports are cached by the module system so it's harmless but noisy. No fix needed, just leave as-is.

---

## IMPLEMENTATION ORDER

1. **FIX 1** — bundle-size.yml (5 min, high impact — stops CI red)
2. **FIX 2** — Remove stale version check (1 min)
3. **FIX 4** — scoreSubmittedRef reset (5 min, gameplay bug)
4. **FIX 3** — PWA banner gate (2 min, UX)
5. **FIX 7** — snapshotRef null guards (3 min, crash prevention)
6. **FIX 6** — fbGetStreak safety (3 min)
7. **FIX 5** — dead toastTimer ref (2 min, cleanup)
8. **FIX 8** — useCallback deps (5 min, stale closure prevention)

---

## GEMINI CLI COMMANDS

```bash
# After making all file edits:
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Build must pass before committing. Suggested commit message:
```
fix: resolve CI yaml error, score submission reset, snapshot null guards, stale version check
```
