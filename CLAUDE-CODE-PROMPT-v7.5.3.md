# Claude Code — DTP v7.5.3
# Run from repo root.
# Two files touched: engine/GameEngine.ts, App.tsx

---

## Pre-flight

```bash
git pull origin main
```

---

## Fix 1 — engine/GameEngine.ts: RNG call-count tracking for session restore (Issue #16)

**Problem:** `restoreSessionSnapshot` re-seeds `mulberry32(gameSeed)` from scratch but
restores `tickCount` to an advanced value (e.g. 200). The PRNG is at call 0 while the
game thinks it's mid-run. Cell spawn patterns diverge immediately after a refresh.

**Approach:** Wrap `this.rng` in a counter proxy once after seeding. Store the call count
in the session snapshot. Fast-forward on restore by consuming that many values.

### Step A — Add private field

In `GameEngine.ts`, find the private field declarations block near the top of the class
(around where `private rng` is declared). Add immediately after it:

```ts
private _rngCallCount = 0;
```

### Step B — Wrap rng after seeding in `start()`

Find in `start()`:
```ts
this.rng        = mulberry32(this.gameSeed);
this._bot.setRng(this.rng);
```

Replace with:
```ts
const _rawRng   = mulberry32(this.gameSeed);
this._rngCallCount = 0;
this.rng        = () => { this._rngCallCount++; return _rawRng(); };
this._bot.setRng(this.rng);
```

### Step C — Save call count in `getSessionSnapshot()`

Find in `getSessionSnapshot()`:
```ts
    gameSeed: this.gameSeed,
    tickCount: this.tickCount,
```

Add `rngCallCount` on the next line:
```ts
    gameSeed: this.gameSeed,
    tickCount: this.tickCount,
    rngCallCount: this._rngCallCount,
```

### Step D — Restore and fast-forward in `restoreSessionSnapshot()`

Find:
```ts
      this.gameSeed = data.gameSeed as number;
      this.rng = mulberry32(this.gameSeed);
```

Replace with:
```ts
      this.gameSeed = data.gameSeed as number;
      const _rawRng = mulberry32(this.gameSeed);
      this._rngCallCount = 0;
      this.rng = () => { this._rngCallCount++; return _rawRng(); };
      const callsToReplay = typeof data.rngCallCount === 'number' ? data.rngCallCount : 0;
      for (let i = 0; i < callsToReplay; i++) this.rng();
```

### Step E — Bump SESSION_SNAPSHOT_VERSION

Find:
```ts
  private static readonly SESSION_SNAPSHOT_VERSION = 2;
```

Replace with:
```ts
  private static readonly SESSION_SNAPSHOT_VERSION = 3;
```

This discards any v2 snapshots in sessionStorage — correct behaviour since old snapshots
have no `rngCallCount` and would fast-forward 0 calls (silent wrong state). The version
bump forces a clean start instead.

---

## Fix 2 — App.tsx: Remove unused imports (v7.5.1 cleanup)

**File:** `App.tsx`

### Step A — Line 61: Remove component imports, keep type

Find:
```ts
import LoginStreakPopup, { getStreakReward } from "./components/Screens/LoginStreakPopup";
```

`getStreakReward` IS used at L572. `LoginStreakPopup` component is NOT used in JSX.

Replace with:
```ts
import { getStreakReward } from "./components/Screens/LoginStreakPopup";
```

### Step B — Line 62: Keep type import only

Find:
```ts
import DailyChallengesPopup, { type DailyChallenge } from "./components/Screens/DailyChallengesPopup";
```

`DailyChallenge` type IS used in state (`useState<DailyChallenge[]>`). `DailyChallengesPopup`
component is NOT used in JSX.

Replace with:
```ts
import { type DailyChallenge } from "./components/Screens/DailyChallengesPopup";
```

---

## Fix 3 — App.tsx: Add logProgressionEvent to handleEngineGameOver dep array

**File:** `App.tsx`

`logProgressionEvent` is called inside `handleEngineGameOver` at L745 but is not in the
dependency array. It's imported from `./services/gameanalytics` — a module-level stable
function, so in practice it never changes, but ESLint will warn and it's correct hygiene.

Find the dependency array at the end of `handleEngineGameOver` (currently L848):
```ts
}, [numPlayers, playerName, toast$, best1, best2, gameMode, wins, deaths, gamesPlayed, machine, shopData, addDust]);
```

Replace with:
```ts
}, [numPlayers, playerName, toast$, best1, best2, gameMode, wins, deaths, gamesPlayed, machine, shopData, addDust, logProgressionEvent]);
```

---

## Verification

```bash
pnpm typecheck   # zero errors
pnpm lint        # zero new errors
pnpm build       # must succeed
```

**Manual test for Fix 1:**
1. Start an Evolve game, play for ~30 seconds (score > 100)
2. Refresh the browser mid-game
3. Click "Resume" on the menu
4. Verify: cell patterns continue naturally (no sudden all-purple grid, no pattern reset)
5. Verify: dust is not double-spent when bot assist is active

---

## Version + Changelog

```bash
npm version patch   # 7.5.2 → 7.5.3
```

Prepend to `CHANGELOG.md`:

```markdown
## [7.5.3] — 2026-05-16

### Fixed
- **HIGH — `engine/GameEngine.ts`:** RNG desync after session restore (Issue #16). The
  PRNG was re-seeded from scratch on restore but `tickCount` was already advanced,
  causing cell spawn patterns to diverge after a browser refresh. Fixed by wrapping `rng`
  in a call-count proxy, persisting `rngCallCount` in the session snapshot, and
  fast-forwarding the PRNG on restore. `SESSION_SNAPSHOT_VERSION` bumped 2 → 3 to
  discard incompatible old snapshots.
- **Lint — `App.tsx`:** Removed unused `LoginStreakPopup` and `DailyChallengesPopup`
  component imports (superseded by `RewardsHub`). Kept `getStreakReward` and
  `type DailyChallenge` which are still in use.
- **Lint — `App.tsx`:** Added `logProgressionEvent` to `handleEngineGameOver` dependency
  array.
```

---

## Error log final status after v7.5.3

All 72 issues from errorlog16-5.md are now resolved or classified:

| Tier | Count | Status |
|------|-------|--------|
| Tier 1 Critical | 5 | ✅ All resolved (v7.5.0–v7.5.3) |
| Tier 2 High | 15 | ✅ All resolved or confirmed false positives |
| Tier 3 Tech Debt | 30 | 🟡 App.tsx monolith deferred by design |
| False Positives | 22 | ✅ Documented, no action needed |
| **Remaining real work** | **1** | App.tsx refactor (#40) — future milestone |
