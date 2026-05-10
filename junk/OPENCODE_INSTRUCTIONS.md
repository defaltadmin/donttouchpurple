# DTP v7.6.2 Refactor — opencode Instructions

## Context
App.tsx was split from 2579 lines into 12 focused files.
All files are in the zip: `dtp-refactor-v7.6.2.zip`
Do NOT modify any file content. Place them exactly as described below.

---

## Step 1 — Unzip

```bash
unzip dtp-refactor-v7.6.2.zip -d /tmp/dtp-patch
```

---

## Step 2 — Place files

Run each command exactly. Paths are relative to the repo root.

### App.tsx (replaces existing)
```bash
cp /tmp/dtp-patch/App.tsx src/App.tsx
```

### New hooks (new files — create if folder doesn't exist)
```bash
cp /tmp/dtp-patch/useGameSettings.ts    src/hooks/useGameSettings.ts
cp /tmp/dtp-patch/useGameProgress.ts    src/hooks/useGameProgress.ts
cp /tmp/dtp-patch/useEngineEvents.ts    src/hooks/useEngineEvents.ts
cp /tmp/dtp-patch/useDailyChallenges.ts src/hooks/useDailyChallenges.ts
cp /tmp/dtp-patch/useWeeklyTasks.ts     src/hooks/useWeeklyTasks.ts
cp /tmp/dtp-patch/useGameOver.ts        src/hooks/useGameOver.ts
cp /tmp/dtp-patch/usePWA.ts             src/hooks/usePWA.ts
```

### New HUD components (alongside existing HUD files)
```bash
cp /tmp/dtp-patch/GameHeader.tsx src/components/HUD/GameHeader.tsx
cp /tmp/dtp-patch/HudRow.tsx     src/components/HUD/HudRow.tsx
```

### New Overlays components (new folder)
```bash
mkdir -p src/components/Overlays
cp /tmp/dtp-patch/PauseOverlay.tsx src/components/Overlays/PauseOverlay.tsx
cp /tmp/dtp-patch/BossUI.tsx       src/components/Overlays/BossUI.tsx
cp /tmp/dtp-patch/ModalsLayer.tsx  src/components/Overlays/ModalsLayer.tsx
```

### Updated existing files (replaces existing)
```bash
cp /tmp/dtp-patch/featureGates.ts   src/utils/featureGates.ts
cp /tmp/dtp-patch/StartScreen.tsx   src/components/Screens/StartScreen.tsx
cp /tmp/dtp-patch/SettingsDrawer.tsx src/components/Settings/SettingsDrawer.tsx
cp /tmp/dtp-patch/game.css          src/styles/game.css
```

---

## Step 3 — Verify file placement

```bash
# Should print 17 — one line per file
ls src/App.tsx \
   src/hooks/useGameSettings.ts \
   src/hooks/useGameProgress.ts \
   src/hooks/useEngineEvents.ts \
   src/hooks/useDailyChallenges.ts \
   src/hooks/useWeeklyTasks.ts \
   src/hooks/useGameOver.ts \
   src/hooks/usePWA.ts \
   src/components/HUD/GameHeader.tsx \
   src/components/HUD/HudRow.tsx \
   src/components/Overlays/PauseOverlay.tsx \
   src/components/Overlays/BossUI.tsx \
   src/components/Overlays/ModalsLayer.tsx \
   src/utils/featureGates.ts \
   src/components/Screens/StartScreen.tsx \
   src/components/Settings/SettingsDrawer.tsx \
   src/styles/game.css | wc -l
```

Expected output: `17`

---

## Step 4 — TypeScript check

```bash
npx tsc --noEmit 2>&1
```

**Expected:** zero errors.

If you see errors, report the exact error lines back to Claude. Do not attempt to fix them yourself — the errors will be import path mismatches or missing type exports that Claude will patch.

Common expected errors and what they mean:
- `Cannot find module '../services/firebase'` → the import path in a hook doesn't match your actual firebase service file location. Report the hook filename and your actual path.
- `Property 'X' does not exist on type 'Y'` → a prop was renamed between versions. Report the component and prop name.
- `Module has no exported member 'X'` → a named export moved files. Report which file and export.

---

## Step 5 — Run unit tests

```bash
pnpm test 2>&1
```

**Expected:** 83/83 tests passing.

If any tests fail, report the test name and error message back to Claude.

---

## Step 6 — Production build

```bash
pnpm build 2>&1
```

**Expected:** completes without errors. CSS warnings are OK.

---

## Step 7 — Manual smoke test in browser

```bash
pnpm dev
```

Open `http://localhost:5173` in an **incognito window** with localStorage cleared (`F12 → Application → Storage → Clear site data`).

Run through this checklist in order and report any item that fails:

| # | Test | Expected |
|---|------|----------|
| 1 | Fresh load | Name entry screen shows |
| 2 | Enter name, press Save | Menu shows with Classic selected |
| 3 | Check mode pills | Evolve shows 🔒 Evolve, hint text: "Play 5 Classic games to unlock Evolve Mode" |
| 4 | Check Duo pill | Shows 🔒 Duo, hint text: "Win 1 Classic game to unlock Duo Mode" |
| 5 | Tap Evolve pill | Nothing happens (locked) |
| 6 | Start Classic game | Game starts, no rare color banner fires |
| 7 | During gameplay, tap ⚙ Settings | Game pauses, settings drawer opens |
| 8 | Close settings | Game resumes automatically |
| 9 | During gameplay, tap ⏸ Pause | Pause overlay appears |
| 10 | In pause overlay, tap ⚙ Settings | Settings opens |
| 11 | Close settings from pause | Pause overlay returns, game does NOT resume |
| 12 | Hit a 2x+ streak | Combo card appears in HUD row, not over the grid |
| 13 | Combo card format | Shows "🔥 2x" — no decimal multiplier |
| 14 | Language selector | NOT in header. Open Settings → language grid visible inside drawer |
| 15 | Play 5 Classic games | Evolve pill unlocks: shows "∞ Evolve", hint text disappears |
| 16 | Win 1 Classic game | Duo pill unlocks: shows "Duo", hint text disappears |
| 17 | Game over screen | Combo badge does NOT appear |
| 18 | New incognito session | WhatsNew popup does NOT show (0 games played) |
| 19 | After 1+ game, reload | WhatsNew shows if version changed |
| 20 | `pnpm test` | 83/83 pass |

---

## If something breaks

Do not edit files manually. Report back to Claude with:
1. Which checklist item failed
2. Console errors (F12 → Console tab, paste any red errors)
3. The TypeScript error output if `tsc --noEmit` failed

Claude will issue a targeted patch for that specific file only.

---

## File map (for reference)

```
src/
├── App.tsx                                  ← REPLACED (2579 → 1126 lines)
├── hooks/
│   ├── useGameSettings.ts                   ← NEW
│   ├── useGameProgress.ts                   ← NEW
│   ├── useEngineEvents.ts                   ← NEW
│   ├── useDailyChallenges.ts                ← NEW
│   ├── useWeeklyTasks.ts                    ← NEW
│   ├── useGameOver.ts                       ← NEW
│   ├── usePWA.ts                            ← NEW
│   └── (existing hooks unchanged)
├── components/
│   ├── HUD/
│   │   ├── GameHeader.tsx                   ← NEW
│   │   ├── HudRow.tsx                       ← NEW
│   │   └── (existing HUD components unchanged)
│   ├── Overlays/                            ← NEW FOLDER
│   │   ├── PauseOverlay.tsx                 ← NEW
│   │   ├── BossUI.tsx                       ← NEW
│   │   └── ModalsLayer.tsx                  ← NEW
│   ├── Screens/
│   │   └── StartScreen.tsx                  ← REPLACED
│   └── Settings/
│       └── SettingsDrawer.tsx               ← REPLACED
├── utils/
│   └── featureGates.ts                      ← REPLACED
└── styles/
    └── game.css                             ← REPLACED
```
