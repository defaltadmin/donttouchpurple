# OpenCode Implementation Instructions
## Project: Don't Touch the Purple — v4.1 Improvements
### Branch: `2-may-sonnet/`
### After all changes: update CHANGELOG.md, bump patch version in package.json, run `npm run build` and confirm zero errors.

---

## STABILITY RULES (read before touching anything)
- Never remove or rename exports from `types.ts`, `firebase.ts`, or `GameEngine.ts` without updating all importers.
- Every new component must have a defined fallback/null state — no unguarded `.map()` on potentially undefined arrays.
- All new `localStorage` keys must be prefixed `dtp-`.
- All new Firestore writes must go through existing `normalizeGlobalScoreEntry()` or equivalent clamp/validation.
- Do not change `firestore.rules` — already updated in this branch.
- Run `npm run build` after every file group below. Fix any TypeScript errors before moving to the next group.

---

## GROUP 1 — Haptic Feedback
**File:** `src/utils/haptics.ts` *(create new)*

```ts
// src/utils/haptics.ts
export function hapticTap() {
  try { navigator.vibrate?.(10); } catch {}
}
export function hapticDamage() {
  try { navigator.vibrate?.([30, 10, 30]); } catch {}
}
export function hapticLevelUp() {
  try { navigator.vibrate?.([10, 30, 10, 30, 10]); } catch {}
}
```

**File:** `src/engine/GameEngine.ts`

- Import `hapticTap`, `hapticDamage`, `hapticLevelUp` from `../utils/haptics`
- In `_processTap()`: call `hapticTap()` immediately after `this.emit({ type: "sound", name: "ok" })` on a safe cell tap
- In `_processTap()`: call `hapticDamage()` immediately after `this.emit({ type: "damage", player })` on danger-color tap
- In `processTick()` where `triggerGameOver` is called from the missed-cell loop: call `hapticDamage()` before `triggerGameOver`
- In `checkStageProgress()`: emit `hapticLevelUp()` when `pendingStageUpdate` is set to true

**Verify:** No new props, no interface changes. Haptics are fire-and-forget, never throw.

---

## GROUP 2 — Damage Vignette (red flash on miss)
**File:** `src/App.tsx` (or wherever the main game container div lives)

- Add a state: `const [damagePulse, setDamagePulse] = useState(false)`
- Subscribe to engine events. On `{ type: "damage" }` or `{ type: "shake" }`: set `damagePulse(true)`, then after 350ms set back to `false`
- Apply class `damage-pulse` to the outermost game container div when `damagePulse === true`

**File:** `src/styles/main.css` (or global CSS file — find it by searching for existing `.shake` class)

```css
.damage-pulse {
  animation: vignette-flash 0.35s ease-out forwards;
}
@keyframes vignette-flash {
  0%   { box-shadow: inset 0 0 0px 0px rgba(220, 38, 38, 0); }
  25%  { box-shadow: inset 0 0 60px 20px rgba(220, 38, 38, 0.55); }
  100% { box-shadow: inset 0 0 0px 0px rgba(220, 38, 38, 0); }
}
```

**Verify:** Class is added/removed correctly. No permanent style leak. Works in both Classic and Evolve.

---

## GROUP 3 — Rare Mode Active Badge
**File:** wherever the in-game HUD is rendered (search for `rareMode.active` usage in JSX)

- When `snapshot.rareMode.active === true`, render this badge in the HUD:

```tsx
{snapshot.rareMode.active && (
  <div className="rare-active-badge">
    ⚠️ Don't touch {snapshot.rareMode.color.toUpperCase()} — {snapshot.rareMode.turnsLeft} left
  </div>
)}
```

**File:** global CSS

```css
.rare-active-badge {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(220, 38, 38, 0.85);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 12px;
  border-radius: 20px;
  font-family: var(--font-ui);
  animation: badge-pulse 1s ease-in-out infinite alternate;
  z-index: 20;
  pointer-events: none;
  white-space: nowrap;
}
@keyframes badge-pulse {
  from { opacity: 0.85; }
  to   { opacity: 1; box-shadow: 0 0 12px rgba(220,38,38,0.6); }
}
```

**Verify:** Badge is absent when `rareMode.active === false`. Does not overlap game cells on small screens — check at 375px width.

---

## GROUP 4 — Session Recap Screen
**File:** `src/components/Screens/RecapScreen.tsx` *(create new)*

```tsx
// src/components/Screens/RecapScreen.tsx
import React from 'react';
import { DailyObjective } from '../../config/dailyObjective';

interface RecapProps {
  score: number;
  prevBest: number;
  peakStreak: number;
  ticksSurvived: number;
  dustEarned: number;
  objective: DailyObjective;
  objectiveProgress: number; // 0–100 percent toward target
  mode: 'classic' | 'evolve';
  onClose: () => void;
}

export default function RecapScreen({
  score, prevBest, peakStreak, ticksSurvived,
  dustEarned, objective, objectiveProgress, mode, onClose
}: RecapProps) {
  const isNewPB = score > prevBest;

  return (
    <div className="recap-overlay">
      <div className="recap-card screen-slide">
        <div className="recap-mode-chip">
          {mode === 'evolve' ? '∞ Evolve' : '⊞ Classic'}
        </div>

        {isNewPB && (
          <div className="recap-pb-banner">🏆 New Personal Best!</div>
        )}

        <div className="recap-score">{score}</div>
        {!isNewPB && <div className="recap-prev-best">Best: {prevBest}</div>}

        <div className="recap-stats">
          <div className="recap-stat">
            <span className="recap-stat-val">{peakStreak}</span>
            <span className="recap-stat-lbl">Peak Streak</span>
          </div>
          <div className="recap-stat">
            <span className="recap-stat-val">{ticksSurvived}</span>
            <span className="recap-stat-lbl">Ticks</span>
          </div>
          <div className="recap-stat">
            <span className="recap-stat-val">+{dustEarned} 💜</span>
            <span className="recap-stat-lbl">Dust Earned</span>
          </div>
        </div>

        <div className="recap-objective">
          <div className="recap-obj-label">
            {objective.completed ? '✅' : '🎯'} Daily: {objective.description}
          </div>
          <div className="recap-obj-bar">
            <div
              className="recap-obj-fill"
              style={{ width: `${Math.min(100, objectiveProgress)}%`,
                       background: objective.completed ? 'var(--accent)' : '#6366f1' }}
            />
          </div>
          {objective.completed && (
            <div className="recap-obj-reward">+{objective.reward} 💜 claimed!</div>
          )}
        </div>

        <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={onClose}>
          Play Again
        </button>
      </div>
    </div>
  );
}
```

**File:** global CSS — add styles for `.recap-overlay`, `.recap-card`, `.recap-pb-banner`, `.recap-score`, `.recap-prev-best`, `.recap-stats`, `.recap-stat`, `.recap-stat-val`, `.recap-stat-lbl`, `.recap-objective`, `.recap-obj-label`, `.recap-obj-bar`, `.recap-obj-fill`, `.recap-obj-reward`, `.recap-mode-chip`. Model them after existing `.lb-wrap` and `.lb-row` patterns in your CSS.

**File:** `src/App.tsx`

- Track `peakStreak` in a ref that updates each tick: `peakStreakRef.current = Math.max(peakStreakRef.current, snapshot.p1.streak)`
- Track `dustAtGameStart` in a ref set on game start; `dustEarned = currentDust - dustAtGameStart`
- Track `prevBest` by reading the existing classic/evolve leaderboard localStorage key before the game starts
- Compute `objectiveProgress`: `(currentValue / objective.target) * 100` where `currentValue` depends on `objective.type`
- On `{ type: "gameOver" }` event: set `showRecap = true` with all gathered values
- Render `<RecapScreen>` when `showRecap === true`; on `onClose`: set `showRecap = false` and call existing game-over flow

**Verify:** RecapScreen appears after every game over in both modes. "Play Again" dismisses it and shows the normal post-game screen (don't replace it — stack on top). peakStreak resets to 0 on each game start.

---

## GROUP 5 — Daily Objective Streak
**File:** `src/config/dailyObjective.ts`

Add these two functions at the bottom:

```ts
export function getObjectiveStreak(): number {
  try {
    const raw = localStorage.getItem('dtp-obj-streak');
    if (!raw) return 0;
    const { count, lastDate } = JSON.parse(raw);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    // Valid if last completion was today or yesterday
    if (lastDate === today || lastDate === yStr) return count ?? 0;
    return 0; // streak broken
  } catch { return 0; }
}

export function incrementObjectiveStreak(): void {
  const today = new Date().toISOString().slice(0, 10);
  const current = getObjectiveStreak();
  localStorage.setItem('dtp-obj-streak', JSON.stringify({ count: current + 1, lastDate: today }));
}
```

- Call `incrementObjectiveStreak()` inside `markObjectiveComplete()`, after the existing `localStorage.setItem` call.

**File:** Home/Menu screen (wherever the daily objective is displayed)

- Below the objective display, add:
```tsx
{objectiveStreak > 1 && (
  <div className="obj-streak-badge">🔥 {objectiveStreak} day streak</div>
)}
```
- Load `objectiveStreak` via `getObjectiveStreak()` on mount.

---

## GROUP 6 — Personal Best Delta Flash
**File:** `src/App.tsx`

- On game start, read and store `prevBestRef.current` from the relevant localStorage leaderboard key (same one used by RecapScreen).
- Each tick, check: if `snapshot.p1.score > prevBestRef.current && !pbFlashedRef.current`:
  - Set `pbFlashedRef.current = true`
  - Emit a local toast (use whatever toast mechanism is already in App.tsx): `🏆 +${snapshot.p1.score - prevBestRef.current} PB!`
- Reset `pbFlashedRef.current = false` on each game start.

**Verify:** Flash fires exactly once per game, only when score exceeds previous best. Does not fire if no previous best exists.

---

## GROUP 7 — fbSyncDust Debounce
**File:** `src/services/firebase.ts`

Replace the existing `fbSyncDust` with a debounced version:

```ts
let _dustDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function fbSyncDustDebounced(name: string, dust: number): void {
  if (_dustDebounceTimer) clearTimeout(_dustDebounceTimer);
  _dustDebounceTimer = setTimeout(() => {
    fbSyncDust(name, dust).catch(() => {});
    _dustDebounceTimer = null;
  }, 4000);
}
```

- In `App.tsx` (or wherever `fbSyncDust` is called on dust change): replace all `fbSyncDust(...)` calls with `fbSyncDustDebounced(...)`.
- Keep the original `fbSyncDust` export intact — it is still used for the final flush on game over.
- On game over / app unmount: call `fbSyncDust(name, dust)` directly (immediate, not debounced) to flush final value.

---

## GROUP 8 — Bot Visibility Guard
**File:** `src/engine/GameEngine.ts`

Inside `startBot()`, in the `setInterval` callback, add at the top of the callback body:

```ts
if (document.hidden) return; // don't run bot while tab is backgrounded
```

Place it as the very first line after `if (!this.botActive || this.phase !== "playing") return;`

---

## GROUP 9 — Firestore Score Cap Fix
**File:** `firestore.rules`

In the `validScore()` function, change the cap:

```js
// BEFORE:
return s is int && s >= 0 && s <= 999;
// AFTER:
return s is int && s >= 0 && s <= 9999;
```

Also update the score-per-tick ratio guard to use 9999 as the absolute ceiling:

```js
request.resource.data.score <= math.min(9999, request.resource.data.tick * 3 + 50)
```

---

## GROUP 10 — Shop Tab Persistence
**File:** `src/components/Shop/ShopPanel.tsx`

Replace:
```ts
const [tab, setTab] = useState<"themes" | "badges" | "powerups" | "skins" | "backgrounds">("themes");
```
With:
```ts
type ShopTab = "themes" | "badges" | "powerups" | "skins" | "backgrounds";
const [tab, setTab] = useState<ShopTab>(() => {
  try { return (sessionStorage.getItem('dtp-shop-tab') as ShopTab) ?? 'themes'; }
  catch { return 'themes'; }
});

// Wrap the setTab calls:
const switchTab = (t: ShopTab) => {
  setTab(t);
  try { sessionStorage.setItem('dtp-shop-tab', t); } catch {}
};
```
Replace all `setTab(...)` calls (in the tab button `onClick`s) with `switchTab(...)`.

---

## GROUP 11 — EvolveTutorial Step Persistence
**File:** `src/components/Screens/EvolveTutorial.tsx`

Replace:
```ts
const [step, setStep] = useState(currentStep);
```
With:
```ts
const TUTORIAL_STORAGE_KEY = 'dtp-tutorial-step';

const [step, setStep] = useState(() => {
  if (currentStep > 0) return currentStep;
  try {
    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  } catch { return 0; }
});

// After setStep calls, persist:
const advanceStep = (n: number) => {
  setStep(n);
  try { localStorage.setItem(TUTORIAL_STORAGE_KEY, String(n)); } catch {}
};
const completeTutorial = () => {
  try { localStorage.removeItem(TUTORIAL_STORAGE_KEY); } catch {}
  onClose();
};
```
- Replace `setStep(step + 1)` with `advanceStep(step + 1)`.
- Replace `onClose()` in the "Got it!" / last-step path with `completeTutorial()`.
- The `useEffect` that resets to step 0 on `isOpen` change: only reset if the tutorial was previously completed (key absent), not mid-progress.

---

## GROUP 12 — Leaderboard Mode Filter
**File:** `src/components/Leaderboard/LeaderboardPanel.tsx`

Add filter state and UI:

```tsx
const [modeFilter, setModeFilter] = useState<'all' | 'classic' | 'evolve'>('all');

const filteredEntries = modeFilter === 'all'
  ? entries
  : entries.filter(e => e.mode === modeFilter);
```

Replace `visibleEntries` and `entries` references in the list render with `filteredEntries`.

Add filter toggle above the list (below the header):
```tsx
<div className="lb-filter-row">
  {(['all', 'classic', 'evolve'] as const).map(f => (
    <button
      key={f}
      className={`lb-filter-btn${modeFilter === f ? ' lb-filter-btn--on' : ''}`}
      onClick={() => setModeFilter(f)}
    >
      {f === 'all' ? 'All' : f === 'classic' ? '⊞ Classic' : '∞ Evolve'}
    </button>
  ))}
</div>
```

Add CSS:
```css
.lb-filter-row { display: flex; gap: 6px; padding: 6px 0 10px; }
.lb-filter-btn { flex: 1; font-size: 11px; font-family: var(--font-ui); font-weight: 700;
  padding: 4px 0; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
  background: transparent; color: var(--muted); cursor: pointer; }
.lb-filter-btn--on { background: rgba(192,38,211,0.2); color: var(--accent); border-color: var(--accent); }
```

---

## GROUP 13 — What's New Tab Update
**File:** wherever the "What's New" / changelog modal content is defined (search for `whats-new` or `changelog` or `WHATS_NEW` or the version string in JSX — likely a config file or inline array in App.tsx or a dedicated component).

Add a new entry at the top of the changelog array (or however entries are structured):

```ts
{
  version: '4.1.0', // match whatever version you set in package.json
  date: '2025-05-02',
  title: 'Feel & Flow Update',
  items: [
    '📳 Haptic feedback on taps, damage, and level-ups (mobile)',
    '🔴 Red vignette flash when you take damage',
    '⚠️ Rare color countdown badge — always know how many ticks remain',
    '📊 Session recap screen after every game — score, streak, ticks, dust earned',
    '🎯 Daily objective progress shown in recap',
    '🔥 Consecutive daily objective streak tracker',
    '🏆 Personal best delta flash mid-game (+X PB!)',
    '🛒 Shop remembers your last open tab',
    '📖 Tutorial resumes from where you left off',
    '🏅 Leaderboard mode filter (All / Classic / Evolve)',
    '⚡ Dust sync now debounced — fewer Firestore writes',
    '🤖 Bot pauses automatically when tab is hidden',
  ],
}
```

---

## FINAL STEPS (run in order)

```bash
# 1. Bump version
npm version patch --no-git-tag-version

# 2. Build
npm run build

# 3. Confirm zero errors and zero warnings about missing exports
# If TypeScript errors: fix them before deploying

# 4. Update CHANGELOG.md — prepend a new section:
# ## [4.1.0] - 2025-05-02
# ### Added
# - Haptic feedback (tap / damage / level-up)
# - Damage vignette (red flash on miss)
# - Rare mode active countdown badge
# - Session recap screen post-game
# - Daily objective streak counter
# - Personal best delta flash mid-game
# - fbSyncDust debounced (4s) to reduce Firestore writes
# - Bot visibility guard (pauses when tab hidden)
# ### Changed
# - Firestore score cap raised to 9999
# - Shop tab persisted to sessionStorage
# - Tutorial step persisted to localStorage
# - Leaderboard mode filter (All / Classic / Evolve)
```

---

## Stability checklist before deploy
- [ ] `npm run build` exits 0
- [ ] Open game in browser, play Classic — damage vignette fires, haptics work on device
- [ ] Play Evolve — rare mode badge appears, countdown decrements each tick
- [ ] Finish a game — recap screen appears with correct values, Play Again works
- [ ] Open Shop — buy something — Sentry breadcrumb logged, tab persists on reopen
- [ ] Open Leaderboard — filter buttons switch correctly
- [ ] Check console — no uncaught errors, no "fbSyncDust called N times" bursts
- [ ] Daily objective streak increments on completion
