# Gemini CLI Audit Prompt — DTP State vs Changelog

Paste this entire prompt into Gemini CLI after running:
`gemini -p @GEMINI_AUDIT_PROMPT.md` from the project root.

---

## Your Task

You are auditing the "Don't Touch the Purple" browser game source code.
The team uses multiple AI agents and not all changelog entries were verified as actually implemented.
Your job is to cross-check each claimed change against the **actual code** and produce a TRUTH TABLE.

## Game Info

- Stack: React 18 + TypeScript + Vite + Firebase Firestore + InfinityFree/Cloudflare hosting
- Entry: `App.tsx` (root)
- Engine: `engine/GameEngine.ts`, `hooks/useGameEngine.ts`
- Version in `package.json` should be current

## Changelogs to Audit

Read both files:
1. `CHANGELOG.md` — full history through v5.5.0
2. `CHANGELOG_v5_6_1.md` — latest session claims (v5.6.0 + v5.6.1)

Then check the actual source for each item below.

---

## CHECK LIST — verify each item exists in code

### GROUP A — v5.6.1 "Completed" Claims

| # | Claim | How to verify | Status |
|---|-------|---------------|--------|
| A1 | GameAnalytics SDK integrated (`services/gameanalytics.ts` exists, imported in App.tsx) | `ls services/` + `grep -n "gameanalytics" App.tsx` | ? |
| A2 | Progression events: `Start`, `Complete`, `Fail` sent per game | `grep -n "Progression\|GAProgressionStatus" services/gameanalytics.ts` | ? |
| A3 | Economy events: Dust spending tracked | `grep -n "Economy\|GAResourceFlowType" services/gameanalytics.ts` | ? |
| A4 | `recapData` state and `RecapScreen` fully removed from `App.tsx` | `grep -n "recap" App.tsx` | ? |
| A5 | `getFirebase` removed from `useEffect` dep arrays | `grep -n "getFirebase\]" App.tsx` | ? |
| A6 | `dustAtStartRef` uses `dustRef.current` not stale `dust` | check `startGame` in `App.tsx` | ? |
| A7 | `peakStreakRef` updated via `Math.max()` not simple assignment | `grep -n "peakStreakRef" App.tsx` | ? |
| A8 | Daily objective progress bar restored in GameOver screen | `grep -rn "objective\|ObjectiveProgress" components/Screens/GameOver.tsx` | ? |
| A9 | Classic mode first-time players see tutorial | `grep -n "showTutorial\|classic.*tutorial" App.tsx` | ? |
| A10 | Tutorial/energy race condition fixed (energy checked before tutorial shown) | check `startGame` flow in `App.tsx` | ? |

### GROUP B — v5.6.0 CSS Enhancements

| # | Claim | How to verify | Status |
|---|-------|---------------|--------|
| B1 | `styles/enhancements.css` exists and is imported in `App.tsx` | `ls styles/` + `grep "enhancements" App.tsx` | ? |
| B2 | `PulseField.tsx` uses `className="background-canvas"` not inline style | `grep "className\|style=" components/Backgrounds/PulseField.tsx` | ? |
| B3 | `ParticleWeb.tsx` uses `className="background-canvas"` | same | ? |
| B4 | `Plasma.tsx` uses `className="background-canvas"` | same | ? |
| B5 | `GameOver.tsx` has `isNewBest` detection and `NewBestBanner` component | `grep -n "isNewBest\|NewBestBanner" components/Screens/GameOver.tsx` | ? |
| B6 | `go-dust-inline` class used in `GameOver.tsx` | `grep "go-dust-inline" components/Screens/GameOver.tsx` | ? |
| B7 | First duplicate `interface ShopData` removed from `ShopPanel.tsx` | `grep -n "interface ShopData" components/Shop/ShopPanel.tsx` | ? |

### GROUP C — Bug Fixes (this session)

| # | Claim | How to verify | Status |
|---|-------|---------------|--------|
| C1 | `scoreSubmittedRef.current = false` at start of `startGame` | `grep -n "scoreSubmittedRef.current = false" App.tsx` | ? |
| C2 | `gamesPlayed` incremented inside `startGame` (not only `handleTutorialClose`) | `grep -n "setGamesPlayed\|gamesPlayed + 1" App.tsx` | ? |
| C3 | `refillEnergy` uses `dustRef.current` not `dust` | `grep -A 10 "const refillEnergy" App.tsx` | ? |
| C4 | Energy popup "Refill to Full" uses `dustRef.current` | `grep -n "dustRef.current" App.tsx` | ? |
| C5 | `finalStreak = peakStreakRef.current` (not `snapshotRef.current?.p1.streak`) | `grep -n "finalStreak" App.tsx` | ? |
| C6 | `peakStreakRef.current` updated in snapshot `useEffect` | `grep -A 5 "snapshotRef.current = snapshot" App.tsx` | ? |
| C7 | `handleEngineGameOver` deps array does NOT include `dust` | `grep -n "handleEngineGameOver" App.tsx | tail -3` | ? |

### GROUP D — Earlier Features (sanity check a few)

| # | Claim | How to verify | Status |
|---|-------|---------------|--------|
| D1 | RewardsHub has 3 tabs (checkin/daily/weekly) | `grep -n "HubTab\|checkin\|daily\|weekly" components/Screens/RewardsHub.tsx` | ? |
| D2 | `countUnclaimedRewards` exported from `RewardsHub.tsx` | `grep -n "countUnclaimedRewards" components/Screens/RewardsHub.tsx` | ? |
| D3 | Leaderboard capped at top 10 | `grep -n "slice\|top.*10\|MAX.*LB" components/Leaderboard/LeaderboardPanel.tsx` | ? |
| D4 | Energy popup modal exists | `grep -n "showEnergyPopup" App.tsx` | ? |
| D5 | Grid slide mechanic `tryShuffleCells` in engine | `grep -n "tryShuffleCells\|slideAnim" engine/GameEngine.ts` | ? |
| D6 | `playSoundEffect("claim")` exported from `useGameEngine.ts` | `grep -n "playSoundEffect" hooks/useGameEngine.ts` | ? |
| D7 | Sentry integration present | `grep -n "Sentry\|sentry" App.tsx | head -3` | ? |

---

## Output Format

After checking each item, produce this exact output:

```
=== DTP AUDIT REPORT ===
Date: [today]
Checked by: Gemini CLI

IMPLEMENTED (confirmed in code):
- [list items with ✅]

NOT IMPLEMENTED (claimed but missing):
- [list items with ❌ + what's missing]

PARTIAL (exists but differs from claim):
- [list items with ⚠️ + what's different]

UNKNOWN (can't determine without running code):
- [list items with ❓]

CRITICAL ISSUES FOUND:
- [any bugs you notice while reading the code, not in the checklist]

RECOMMENDED NEXT ACTIONS (priority order):
1. [most urgent]
2. ...
```

## Important Notes for Gemini

- Do NOT make any code changes. Read-only audit.
- If a file doesn't exist, say so clearly — don't assume.
- If the code does something similar but not exactly what the changelog claims, mark as PARTIAL.
- Pay attention to: `App.tsx`, `services/`, `components/Screens/GameOver.tsx`, `components/Backgrounds/*.tsx`, `styles/`
- The `getFirebase` dep array issue: line 243 in App.tsx has `[getFirebase]` — this is a module-level stable function, so it's NOT a bug, despite what v5.6.1 claims. Mark A5 as PARTIAL/EXPLAIN.
