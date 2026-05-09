# Don't Touch Purple — v7.5.0 Bug Fix Session for Claude

## What you are reviewing

You are reviewing **Don't Touch Purple**, a fast-paced mobile-first arcade reaction game built with:
- **React 18 + TypeScript + Vite** (PWA)
- **Firebase** (Firestore leaderboard, Analytics, Cloud Functions)
- **Cloudflare Worker** (`workers/score-validator.ts`) for score validation
- **Sentry** for error monitoring
- **Vitest** for unit tests, **Playwright** for E2E

The game has three modes: **Classic** (3×3 grid, avoid purple), **Evolve** (progressive difficulty, boss events, power-ups, rare color modes), and **Duo** (local 2-player). Players tap safe-colored cells and avoid the danger color. The game has a dust economy (in-game currency), a shop, daily objectives, login streaks, and a global leaderboard.

---

## What is in the zip

The zip contains **126 source files** — every file needed to understand and fix the game. Specifically:

- `App.tsx` — main React component (~2500 lines), all game state, screen routing, UI
- `CHANGELOG.md` — full history of every change made, **read this first**
- `engine/GameEngine.ts` — core game loop, tap handling, boss/bomb/rare mode logic
- `engine/subsystems/TickProcessor.ts` — per-tick logic (rare mode, cell expiry, spawning, shuffle, boss)
- `engine/subsystems/BotController.ts` — bot assist logic
- `engine/types.ts` — all TypeScript types
- `engine/DifficultyScaler.ts` — speed/difficulty math
- `hooks/useGameEngine.ts` — React hook wrapping the engine
- `hooks/useScreenStateMachine.ts` — screen state machine (`loading → menu → playing → gameover`)
- `utils/featureGates.ts` — progressive feature unlocking (Evolve mode, leaderboard, etc.)
- `components/Screens/StartScreen.tsx` — main menu UI
- `components/HUD/PlayerPanel.tsx` — game grid + HUD
- `styles/game.css` + `styles/enhancements.css` — all CSS
- All other components, hooks, utils, services, tests, configs, locales

---

## Your persona

You are a **senior React/TypeScript game developer** doing a focused bug-fix pass. You are direct, practical, and specific. You fix root causes, not symptoms. You preserve the game's identity: fast, purple, arcade, competitive.

**Rules:**
- Read `CHANGELOG.md` first to understand what has already been done
- Do NOT remove existing features or tests
- Do NOT refactor things that are not broken
- Fix one bug at a time, verify it does not break others
- After all fixes: run `tsc --noEmit` (must be zero errors) and confirm all 83 unit tests still pass
- Keep the game playable — if a fix risks breaking gameplay, note it clearly

---

## Confirmed bugs to fix (in priority order)

### 🔴 BUG 1 — Settings during gameplay causes soft-lock (CRITICAL)

**File:** `App.tsx`

**What happens:** Tapping the ⚙️ Settings button in the header while a game is in progress opens `SettingsDrawer` WITHOUT pausing the engine. The game keeps ticking, the player loses health, and taps on the game grid are blocked by the settings overlay. When settings is closed, the game resumes mid-death.

**Root cause:** The header settings button calls `setShowSettings(s => !s)` with no `pauseEngine()` call. The `settingsFromPause` flag exists but is only set when opening from the pause overlay, not from the header.

**Fix needed:**
- When `screen === 'playing'` and settings is opened from the header, call `pauseEngine()` and `setPaused(true)` first
- When settings is closed and it was opened from gameplay (not from pause menu), call `resumeEngine()` and `setPaused(false)`
- The existing `settingsFromPause` boolean can be repurposed: set it `true` whenever settings is opened during active gameplay

---

### 🔴 BUG 2 — Evolve mode locked with no explanation (CRITICAL UX)

**Files:** `utils/featureGates.ts`, `components/Screens/StartScreen.tsx`

**What happens:** New players cannot select Evolve mode. The pill toggle is silently disabled with only a 🔒 icon. There is no tooltip, no hint text, no indication of what needs to be done. Players have no idea why it is locked or how to unlock it.

**Root cause:** `featureGates.ts` requires `bestScore >= 500` to unlock `evolve_mode`. `StartScreen.tsx` shows a 🔒 icon but no `unlockHint` text.

**Fix needed — use Option A:**
- **Option A (recommended):** Remove the score gate entirely — unlock all game modes for all players from the start. The game is more fun when accessible. Keep the feature gate system only for cosmetic/reward features (shop items, bot assist, etc.). In `featureGates.ts` set `evolve_mode` and `two_player` to always return `true` from `isUnlocked()`, or remove their `requirement` fields.

---

### 🔴 BUG 3 — Rare color event fires in Classic mode (CRITICAL GAMEPLAY)

**Files:** `engine/subsystems/TickProcessor.ts` or `engine/GameEngine.ts`

**What happens:** During Classic mode gameplay, a "Don't touch Blue!" (or other color) banner appears above the grid. This is the rare color mode (`rareSplash` overlay + `rareMode` state). Rare color mode is an Evolve-only feature — it should never trigger in Classic.

**Root cause:** The rare color trigger logic in `TickProcessor.ts` does not gate on `mode === 'evolve'`. Look for `RARE_TRIGGER_INTERVAL`, `lastRareTriggerScore`, `rareMode` assignment, or `tryTriggerRareMode`.

**Fix needed:** Find the rare mode trigger and wrap it with a mode guard:
```typescript
if (ctx.mode !== 'evolve') return; // or skip the rare mode block
```

---

### 🟡 BUG 4 — Combo badge overlaps game grid (HIGH)

**Files:** `App.tsx`, `styles/game.css`

**What happens:** When the player hits a streak, a combo badge showing `2x 1.2` renders on top of the game grid cells. Players cannot tap cells hidden under the badge. The badge also shows raw multiplier values (`2x 1.2`) which looks like a debug string.

**Root cause:** The `.dtp-combo-badge` is positioned absolutely and overlaps the `.game-area`. The display format uses raw `combo.count` and `combo.multiplier` values without formatting.

**Fix needed:**
1. Move the combo badge to the HUD area (above the grid, inside `.hud` or as a HUD card) so it never overlaps tappable cells. It must have `pointer-events: none` at minimum if it stays near the grid.
2. Fix the display format — show `🔥 {count}x COMBO` instead of `{count}x {multiplier}`. The multiplier decimal is confusing — hide it or round to a whole number.

---

### 🟡 BUG 5 — Language selector clutters the header (MEDIUM UX)

**Files:** `App.tsx`, `components/Settings/SettingsDrawer.tsx`

**What happens:** The `🌐 EN` language toggle sits in the main header next to the game logo, taking up prime real estate. It is rarely used and visually noisy on mobile.

**Fix needed:**
1. Remove the language selector JSX block from the header in `App.tsx` (the `dtp-locale-wrapper` div and related state: `showLangMenu`, `setShowLangMenu`)
2. Add a language selector row inside `SettingsDrawer.tsx` — there is already a section for display/accessibility settings where it belongs
3. The `i18n.set()`, `i18n.getAvailable()`, and locale state can be self-contained inside SettingsDrawer using local state

---

### 🟡 BUG 6 — WhatsNew shows before player has ever played (MEDIUM UX)

**Files:** `App.tsx`, `components/Screens/WhatsNew.tsx`

**What happens:** Brand new players see: name entry → WhatsNew popup → menu. They have not played a single game yet, so "What's New" is meaningless and confusing to a first-time user.

**Root cause:** `shouldShowWhatsNew()` only checks if the stored version differs from current. It does not check if the player has ever played.

**Fix needed:** In `App.tsx`, change the WhatsNew trigger:
```typescript
// Before:
if (shouldShowWhatsNew()) setShowWhatsNew(true);

// After:
const gamesEver = parseInt(localStorage.getItem('dtp-games-played') ?? '0', 10);
if (shouldShowWhatsNew() && gamesEver > 0) setShowWhatsNew(true);
```

---

### 🟡 BUG 7 — Pause state broken when opening settings from pause menu (MEDIUM)

**File:** `App.tsx`

**What happens:** Opening Settings from the pause overlay (⚙️ button inside the pause card) causes the settings drawer to open but the pause overlay disappears. When settings is closed, the game resumes immediately without showing the pause screen again.

**Root cause:** `setSettingsFromPause(true)` is set correctly, but `closeSettings()` does not re-show the pause overlay when `settingsFromPause` is true.

**Fix needed:** In `closeSettings()`:
```typescript
const closeSettings = useCallback(() => {
  setShowSettings(false);
  if (settingsFromPause) {
    setPaused(true); // restore pause state
    // do NOT call resumeEngine() here
  }
  setSettingsFromPause(false);
}, [settingsFromPause]);
```

---

### 🟢 BUG 8 — Screen never transitions to menu on first load (FIXED in v7.5 — verify)

**File:** `App.tsx`

**Status:** Fixed by adding a `useEffect` that calls `setScreen('menu')` when `appReady && screen === 'loading'`. Verify this fix is present. If the menu still does not show after name entry + WhatsNew, this fix may need adjustment.

---

## Additional issues to investigate

These were observed but root cause not fully confirmed — investigate and fix if found:

- **Taps not registering during gameplay in some states** — possibly related to the settings soft-lock (Bug 1) or the `inputBuffer` deduplication window being too aggressive
- **Health draining on menu screen** — if the engine is not properly stopped when transitioning to menu, `processTick` may still fire. Verify `stop()` is called in `goMenu()`
- **`evolveTutorialSeen` gate** — new players in Evolve mode (once unlocked per Bug 2 fix) may be blocked by the tutorial gate even after completing it. Verify `localStorage.getItem(EVOLVE_TUTORIAL_SEEN_KEY)` is checked correctly and the tutorial can be dismissed
- **Bot assist button visible in Classic mode** — the bot assist pill in the HUD should only show in Evolve mode. Verify the `gameMode === 'evolve'` guard is correct in the HUD JSX in `App.tsx`
- **`2x 1.2` combo text** — even if the badge is repositioned (Bug 4), the format string needs fixing. `combo.multiplier` is a float from `rhythmFeedback.state.multiplier` — it should be displayed as a rounded integer or hidden entirely

---

## What NOT to change

- Do not change the game engine tick logic, DDA system, or score calculation
- Do not change Firebase/Firestore rules or the Cloudflare Worker
- Do not remove any existing tests
- Do not change the dust economy, shop, or leaderboard logic
- Do not change the visual design — only fix layout/positioning bugs
- Do not upgrade any dependencies
- Do not touch `.env`, `.env.local`, or `.env.production`

---

## Verification checklist (run after all fixes)

```bash
npx tsc --noEmit          # Must output: zero errors
pnpm test                 # Must output: 83/83 tests passing
pnpm build                # Must complete without errors (CSS warnings are OK)
```

Then manually verify in browser (incognito, fresh localStorage):

1. Fresh load → name entry → menu shows with **all mode pills visible and tappable** (no locks)
2. Classic game starts → **no rare color events fire** during Classic
3. Evolve mode is **immediately accessible** to new players
4. Hitting a streak → combo badge appears **in HUD area, NOT over the grid**
5. Opening settings **during gameplay** → game **pauses**, settings opens, close → game **resumes**
6. Opening settings **from pause menu** → pause overlay **returns** when settings closed
7. Language selector is **in Settings drawer**, not in the header
8. New player (0 games played) → **WhatsNew does NOT show**
9. All 83 unit tests pass
10. `tsc --noEmit` reports zero errors

---

## Files to focus on first

| Priority | File | Bugs |
|----------|------|------|
| 1 | `App.tsx` | 1, 2, 4, 5, 6, 7, 8 |
| 2 | `engine/subsystems/TickProcessor.ts` | 3 |
| 3 | `utils/featureGates.ts` | 2 |
| 4 | `components/Screens/StartScreen.tsx` | 2 |
| 5 | `styles/game.css` | 4 |
| 6 | `components/Settings/SettingsDrawer.tsx` | 5 |

---

## Tech stack reference

```
React 18 + TypeScript 5 + Vite 5
Firebase 12 (Firestore, Analytics, Functions)
Sentry 10
Vitest 1.6 + Playwright 1.59
pnpm (use pnpm, not npm)
Node 18/20/22
```

## Run commands

```bash
pnpm dev          # start dev server at http://localhost:5173
pnpm test         # run all 83 unit tests
npx tsc --noEmit  # typecheck
pnpm build        # production build
pnpm preview      # preview production build at http://localhost:4173
```
