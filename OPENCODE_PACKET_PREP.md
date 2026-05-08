# OPENCODE TASK: Prepare Context Packet for Claude Session
# Run this from the project root (where App.tsx and package.json live)
# ─────────────────────────────────────────────────────────────────────

## YOUR JOB

Create a zip file called `dtp-claude-handoff.zip` containing the exact files
listed below — nothing else. No node_modules, no dist, no .env files.
Then print a confirmation of each file included and its size in bytes.

---

## Step 1 — Collect these files into a flat staging folder first

Create a temp folder: `_handoff/`

Copy with folder structure preserved:

### Core
- `package.json`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`

### App root
- `App.tsx`
- `main.tsx`

### Engine
- `engine/types.ts`
- `engine/GameEngine.ts`
- `engine/DifficultyScaler.ts`

### Hooks
- `hooks/useGameEngine.ts`
- `hooks/useInputHandler.ts`

### Config
- `config/difficulty.ts`
- `config/gridPatterns.ts`
- `config/powerupWeights.ts`
- `config/dailyObjective.ts`

### Services
- `services/firebase.ts`
- `services/clarity.ts`
- `services/gameanalytics.ts`

### Utils
- `utils/dustAnimation.ts`
- `utils/devLog.ts`
- `utils/pendingScoresDb.ts`

### Components — Screens
- `components/Screens/StartScreen.tsx`
- `components/Screens/GameOver.tsx`
- `components/Screens/HowToPlay.tsx`
- `components/Screens/WhatsNew.tsx`
- `components/Screens/RewardsHub.tsx`
- `components/Screens/LoginStreakPopup.tsx`

### Components — HUD
- `components/HUD/PlayerPanel.tsx`
- `components/HUD/PwrBar.tsx`
- `components/HUD/GridErrorBoundary.tsx`
- `components/Cell/index.tsx`

### Components — Shop & Leaderboard
- `components/Shop/ShopPanel.tsx`
- `components/Leaderboard/LeaderboardPanel.tsx`
- `components/Settings/SettingsDrawer.tsx`

### Styles
- `styles/game.css`
- `styles/enhancements.css`

### Public
- `public/sw.js`
- `public/manifest.json`

### Worker
- `worker/score-validator.js`

### Docs
- `CHANGELOG.md`

---

## Step 2 — Zip the staging folder

```bash
cd _handoff
zip -r ../dtp-claude-handoff.zip .
cd ..
```

---

## Step 3 — Verify and report

Print:
1. Total size of zip
2. File count
3. List of any files from Step 1 that were NOT FOUND in the project
   (do not fail — just note them as missing)

---

## Step 4 — Clean up staging folder

```bash
rm -rf _handoff
```

---

## IMPORTANT RULES

- Do NOT include: `.env`, `.env.local`, `.env.production`, `node_modules/`,
  `dist/`, `coverage/`, any `.zip` files in root, `__tests__/` (optional,
  include only if they exist and are small)
- Do NOT modify any source files
- Do NOT run the build
- Report missing files but do not error out

When done, print:
```
✅ dtp-claude-handoff.zip ready — X files, XXkb
Missing: [list any not found]
```
