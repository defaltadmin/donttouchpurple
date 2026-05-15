# DTP Stability Patch — OpenCode Drop Instructions

## What this is
A fully reviewed and fixed set of source files for "Don't Touch Purple".
Drop each file into the path shown. No other files need to change for the
fixes to take effect — **except one manual wiring step in App.tsx** (see below).

---

## Step 1 — Drop files (exact target paths)

| File in this zip | Drop to (relative to project root) |
|---|---|
| `src/engine/GameEngine.ts` | `src/engine/GameEngine.ts` |
| `src/engine/subsystems/TickProcessor.ts` | `src/engine/subsystems/TickProcessor.ts` |
| `src/hooks/useGameEngine.ts` | `src/hooks/useGameEngine.ts` |
| `src/hooks/useAudio.ts` | `src/hooks/useAudio.ts` ← **NEW FILE** |
| `src/utils/score-sync.ts` | `src/utils/score-sync.ts` |
| `src/input/handler.ts` | `src/input/handler.ts` |
| `src/contexts/GameContext.tsx` | `src/contexts/GameContext.tsx` ← **NEW FILE** |
| `src/contexts/DustContext.tsx` | `src/contexts/DustContext.tsx` ← **NEW FILE** |
| `src/contexts/UIContext.tsx` | `src/contexts/UIContext.tsx` ← **NEW FILE** |

---

## Step 2 — Manual wiring in App.tsx

The three new context providers must wrap the App render tree.
Find the root return in `App.tsx` and wrap like this:

```tsx
// Add these imports at the top of App.tsx:
import { GameProvider } from "./contexts/GameContext";
import { DustProvider } from "./contexts/DustContext";
import { UIProvider } from "./contexts/UIContext";

// Wrap root JSX (outermost element in App return):
return (
  <GameProvider>
    <DustProvider
      initialDust={dust}
      initialEnergy={energyData}
      initialShop={shopData}
      initialPlayerName={playerName}
    >
      <UIProvider>
        {/* existing App JSX unchanged */}
      </UIProvider>
    </DustProvider>
  </GameProvider>
);
```

Then replace each matching `useState` in App.tsx with the context hook:

```tsx
// Add at top of App function body:
const {
  snapshot, setSnapshot,
  winner, setWinner,
  lastGameScore, setLastGameScore,
  paused, setPaused,
  gameMode, setGameMode,
  numPlayers, setNumPlayers,
  inputMode, setInputMode,
  speedMult, setSpeedMult,
  practiceMode, setPracticeMode,
  godMode, setGodMode,
  gameSeedState, setGameSeedState,
} = useGameContext();

const {
  dust, setDust, addDust, spendDust,
  energyData, setEnergyData,
  shopData, setShopData,
  playerName, setPlayerName,
} = useDustContext();

const {
  showSettings, setShowSettings,
  settingsFromPause, setSettingsFromPause,
  showTutorial, setShowTutorial,
  showWhatsNew, setShowWhatsNew,
  showPrivacy, setShowPrivacy,
  showLoginStreak, setShowLoginStreak,
  showDailyChallenges, setShowDailyChallenges,
  showRewardsHub, setShowRewardsHub,
  showDevPanel, setShowDevPanel,
  showBuildDeploy, setShowBuildDeploy,
  showExitConfirm, setShowExitConfirm,
  showEnergyPopup, setShowEnergyPopup,
  showShare, setShowShare,
  showNameEntry, setShowNameEntry,
  showInstallBanner, setShowInstallBanner,
  showDevUnlock, setShowDevUnlock,
  showRotatePrompt, setShowRotatePrompt,
  settingsOpen, setSettingsOpen,
  shareToast, setShareToast,
  showLangMenu, setShowLangMenu,
} = useUIContext();
```

Delete the corresponding `useState(...)` lines for each of the above.

**Note:** `addDust` and `spendDust` from DustContext replace any inline dust
mutation logic in App. Where App currently does `setDust(prev => prev + n)`,
replace with `addDust(n)`. Where it does `setDust(prev => prev - n)` with a
guard, replace with `spendDust(n)` which returns `false` if dust is insufficient.

---

## Step 3 — Verify score-sync destroy() is called on app teardown

In `main.tsx` or wherever `scoreSync.init()` is called, add the corresponding
`destroy()` call:

```ts
// main.tsx (or wherever scoreSync.init() is called)
scoreSync.init();

// On HMR teardown / app unmount (dev only needed, but good hygiene):
if (import.meta.hot) {
  import.meta.hot.dispose(() => scoreSync.destroy());
}
```

---

## Step 4 — TypeScript check

```bash
pnpm typecheck
```

Expected: 0 errors. If you see errors about `GameMode`, `NumPlayers`, or
`InputMode`, import them from `./contexts/GameContext` instead of `./App`.

---

## What was fixed (summary)

| # | Severity | File | Fix |
|---|---|---|---|
| 1 | 🔴 CRITICAL | `src/input/handler.ts` | `stop()` was a stub — now actually removes all 8 window listeners |
| 2 | 🔴 CRITICAL | `src/engine/GameEngine.ts` | `destroy()` now clears `_pauseListeners` and `_resumeListeners` |
| 3 | 🟠 HIGH | `src/utils/score-sync.ts` | `online` handler stored by ref, double-registration guarded, `destroy()` added |
| 4 | 🟠 HIGH | `src/engine/GameEngine.ts` | `getSnapshot()` — mask array cached by ref, `spinCfg` memoized by level+seed+speed |
| 5 | 🟠 HIGH | `src/engine/GameEngine.ts` | `spinCfg` cache key now includes `devRotationSpeed` (stale duration bug) |
| 6 | 🟠 HIGH | `src/engine/GameEngine.ts` | `_cachedSpinSeed` now reset when `spinLevel` drops below 3 |
| 7 | 🟠 HIGH | `src/engine/GameEngine.ts` | `SESSION_SNAPSHOT_VERSION = 2` constant; restore rejects older versions |
| 8 | 🟠 HIGH | `src/engine/subsystems/TickProcessor.ts` | `pwr-drop` anim cleanup uses `ctx.scheduleTimeout` (was naked `setTimeout`) |
| 9 | 🟠 HIGH | `src/engine/subsystems/TickProcessor.ts` | Boss event expiry uses `ctx.scheduleTimeout` (was naked `setTimeout`) |
| 10 | 🟡 MEDIUM | `src/utils/score-sync.ts` | Exponential backoff in `flush()` — failed scores wait `2^attempts` seconds (cap 30 min) |
| 11 | 🟡 MEDIUM | `src/hooks/useGameEngine.ts` | Audio module (~120 lines) extracted to `useAudio.ts` |
| 12 | 🟡 MEDIUM | `src/contexts/` | `GameContext`, `DustContext`, `UIContext` — isolate 99-useState App monolith |
