# Don't Touch the Purple — v5.7.0 Changelog
# Boss Update + Share Card + Soft Launch Prep
# Session Date: 2026-05-07  |  Author: Claude Sonnet 4.6

---

## v5.7.0 — Boss Update, Objectives, Share Card, Soft Launch Prep

### ✅ P1 — Audio Audit (No Changes Required)
- Confirmed all 3 Phase M sounds fully wired to engine events:
  - `shuffle` → emitted from `GameEngine.tryShuffleCells` → `case "sound"` handler
  - `rareStart` → emitted from `GameEngine.processTick`
  - `claim` → exported `playSoundEffect("claim")` called manually from RewardsHub
- Zero bugs found. No files changed.

---

### ✅ P2 — Bomb Cell (💣) System

**`engine/types.ts`**
- Added `"bomb"` to `CellType` union
- Added `BombCell` type: `{ type: "bomb"; expiresAt: number }`
- Added `BossEventType = "storm" | "inversion" | "blackout"`
- Added `BossEvent` interface: `{ type: BossEventType; endsAt: number }`
- Added `bossEvent: BossEvent | null` and `activeBomb` to `GameSnapshot`
- Added `isInverted: boolean` and `isBlackout: boolean` to `GameSnapshot`
- Added events: `bossStart`, `bombSpawn`, `bombDefused`, `bombExplode`
- Added `"bomb"` and `"bossStart"` to sound event union

**`engine/GameEngine.ts`**
- `trySpawnBomb()` — 12% chance/tick after score 100; 2s fuse; auto-explodes for 1 heart damage; defusing gives +3 score
- `triggerBossEvent()` — rotates Storm → Inversion → Blackout every +500 score
  - Storm: 8s, triples shuffle rate
  - Inversion: 6s, swaps safe/danger color logic (purple becomes safe, safe colors damage)
  - Blackout: 5s, sets `isBlackout` flag (UI handles overlay)
- Both wired into `processTick` for Evolve mode
- Bomb tap handled in `_processTap` before danger-color branch
- `getSnapshot()` returns `bossEvent`, `activeBomb`, `isInverted`, `isBlackout`
- Bot assist respects inversion via `botInverted` flag
- Boss/bomb state reset to null on `start()`

**`hooks/useGameEngine.ts`**
- Added `"bomb"` sound: low square-wave warning pulse
- Added `"bossStart"` sound: descending sawtooth arpeggio
- Added `onBossEvent?(bossType: string)` and `onBombDefused?()` optional callbacks
- Hook fires callbacks from `case "bossStart"` and `case "bombDefused"` event handlers

**`components/Cell/index.tsx`**
- Added `BombTimer` sub-component: polls every 50ms, renders live countdown `1.8s`
- Bomb cell renders `💣` + `<BombTimer>` stacked vertically

**`styles/enhancements.css`**
- `.cell.bomb` — pulsing red radial gradient, `bombPulse` keyframe animation
- `.bomb-icon` / `.bomb-timer` — flex column layout for emoji + countdown
- `.boss-banner` + `.boss-banner--storm/inversion/blackout` — scrolling gradient top banner, per-type color schemes
- `.blackout-overlay` — `position: absolute; inset: 0; background: rgba(0,0,0,0.82); pointer-events: none`

**`App.tsx`**
- Boss banner injected above `showPrivacy`, shows for all 3 boss types
- Blackout overlay injected inside `game-area` div when `snapshot.isBlackout` is true
- `onBossEvent` and `onBombDefused` callbacks passed to `useGameEngine`

---

### ✅ P3 — Daily Objectives: Boss & Bomb Types

**`config/dailyObjective.ts`**
- `DailyObjective.type` expanded with: `'boss_survive'`, `'bomb_defuse'`, `'survive_inversion'`
- 6 new entries added to `OBJECTIVE_POOL`:
  - Survive a Boss Event (40 dust)
  - Survive 2 Boss Events in one game (55 dust)
  - Defuse a Bomb (30 dust)
  - Defuse 3 Bombs in one game (50 dust)
  - Survive an Inversion event (45 dust)
- `BossObjectiveCounters` interface exported: `{ bosssSurvived, bombsDefused, inversionssSurvived }`
- `checkObjective()` and `getObjectiveProgress()` accept optional `counters` arg — fully backwards-compatible

**`hooks/useGameEngine.ts`**
- `onBossEvent` and `onBombDefused` callbacks added to function signature

**`App.tsx`**
- `bossCounters` state + `bossCountersRef` added
- Counters reset to zero on every `startGame()`
- Callbacks increment correct counters (inversion counted as both `bosssSurvived` and `inversionssSurvived`)
- `checkObjective()` and `getObjectiveProgress()` receive `bossCountersRef.current` at game-over

---

### ✅ P4 — Share Card Upgrade

**`components/Screens/GameOver.tsx`**
- Fixed typo: "Coped!" → "Copied!"
- Canvas-generated 600×315 PNG score card renders on mount (dark gradient + purple glow + score + mode + URL)
- `imgUrl` state stores data URL; preview image shown above share buttons
- "🖼️ Save Card" button downloads `dtp-score-{score}.png`
- `useCallback` added for `copy` and `downloadImg` handlers

**`styles/enhancements.css`**
- Full base CSS added for share card (was entirely missing — only light-theme overrides existed):
  - `.share-card`, `.share-preview`, `.share-preview-img`
  - `.share-inner`, `.share-logo`, `.share-score`, `.share-mode`, `.share-invite`, `.share-url`
  - `.share-btns`, `.share-social`, `.share-social--x/wa/img/copy`

---

### ✅ P5 — Microsoft Clarity Analytics

- Firebase Analytics: already initialized in `firebase.ts` — confirmed, no change needed
- Clarity: 2-line script block documented in `SOFT_LAUNCH_PATCH.md` — apply to `index.html`

---

### 📋 Soft Launch Checklist (see SOFT_LAUNCH_PATCH.md)

- [ ] Apply OG/Twitter meta tags to `index.html`
- [ ] Generate and deploy `public/og-image.png` (1200×630)
- [ ] Fill in Microsoft Clarity project ID
- [ ] Confirm `VITE_FIREBASE_MEASUREMENT_ID` set in InfinityFree env
- [ ] Run Lighthouse — target PWA ≥ 90
- [ ] Verify WhatsApp/X share preview renders og-image correctly
- [ ] First real-player Clarity session confirmed

---

### Files Changed This Session

| File | Change |
|------|--------|
| `engine/types.ts` | BombCell, BossEvent, BossEventType, snapshot fields, events |
| `engine/GameEngine.ts` | trySpawnBomb, triggerBossEvent, inversion logic, bot assist |
| `hooks/useGameEngine.ts` | bomb/bossStart sounds, onBossEvent/onBombDefused callbacks |
| `components/Cell/index.tsx` | BombTimer component, bomb icon |
| `components/Screens/GameOver.tsx` | Canvas share card, typo fix, Save Card button |
| `config/dailyObjective.ts` | 3 new objective types, BossObjectiveCounters |
| `styles/enhancements.css` | Bomb CSS, boss banner, blackout overlay, share card CSS |
| `App.tsx` | Boss banner, blackout overlay, bossCounters, callbacks |
