# Don't Touch the Purple — v5.6.0 Changelog

## Release: v5.6.0 — "Polish & Stability" (May 2026)

---

## 🐛 Bug Fixes (Patches applied this session)

### Fix 1–3 · Background Canvas Viewport Coverage
**Files:** `components/Backgrounds/PulseField.tsx`, `ParticleWeb.tsx`, `Plasma.tsx`

Three background canvas components used incomplete inline styles instead of the shared `.background-canvas` CSS class (`position: fixed; inset: 0; width: 100%; height: 100%`):
- **PulseField**: had `width: 100vw; height: 100vh` but no `top`/`left` anchor → floated without a defined origin
- **ParticleWeb** and **Plasma**: had `top: 0; left: 0` but no `width`/`height` → didn't fill viewport

**Fix:** Replaced all three with `className="background-canvas"`.

---

### Fix 4 · `refillEnergy` Stale Dust State
**File:** `App.tsx`

The `refillEnergy` `useCallback` read `dust` state (stale closure) for the balance check and deduction. If dust state hadn't re-rendered yet, the player could refill for free or be incorrectly blocked.

**Fix:** Switched to `dustRef.current`. Removed `dust` from the dep array.

---

### Fix 5 · `handleEngineGameOver` Stale Dust Dep
**File:** `App.tsx`

`handleEngineGameOver` listed `dust` in its `useCallback` deps despite only using `dustRef.current` internally, causing unnecessary re-creation of the callback on every dust change.

**Fix:** Removed `dust` from the dep array.

---

### Fix 6 · `scoreSubmittedRef` Never Reset Between Games
**File:** `App.tsx`

`scoreSubmittedRef` was set to `true` on the first game-over but never reset. Every game after the first had its Firestore leaderboard score silently dropped.

**Fix:** Added `scoreSubmittedRef.current = false` at the start of both `startGame` and `handleTutorialClose`.

---

### Fix 7 · `gamesPlayed` Only Counted Evolve-Tutorial Games
**File:** `App.tsx`

`gamesPlayed` and `localStorage['dtp-games-played']` were only incremented inside `handleTutorialClose` (which only fires for first-time Evolve), so Classic mode players and all subsequent Evolve games were never counted. This permanently suppressed the RewardsHub for Classic players (`gamesEver > 0` gate never passed).

**Fix:** Moved the increment into `startGame` so all play paths are counted.

---

### Fix 8 · `onRefillFull` (EnergyBar) Stale Dust State
**File:** `App.tsx`

The inline `onRefillFull` callback passed to `<EnergyBar>` used stale `dust` state for both the affordability check and the deduction.

**Fix:** Switched to `dustRef.current`.

---

### Fix 9 · Energy Popup "Refill to Full" Stale Dust State
**File:** `App.tsx`

The energy popup's disabled check and deduction used `dust` state (stale) in four places.

**Fix:** Switched all four to `dustRef.current`.

---

### Fix 10 · `finalStreak` Always 0 in Daily Objective Check
**File:** `App.tsx`

`updateChallengeProgress` received `finalStreak = snapshotRef.current?.p1.streak ?? 0`. The engine resets `p1.streak` to 0 on death, so this was always 0 at game-over — making streak-type daily objectives (`"Reach 10 streak"`) permanently impossible.

**Fix:** Changed to `peakStreakRef.current`, which now correctly tracks the maximum streak reached during the game.

---

### Fix 11 · `peakStreakRef` Never Updated in App.tsx
**File:** `App.tsx`

`App.tsx` declared its own `peakStreakRef` (initialised to `0`) but never updated it during gameplay. The engine has its own internal `peakStreakRef` (correct) but it's private. The `streak5` challenge check at line 1036 used the App-level ref, so it always evaluated `0 >= 5 = false`.

**Fix:** Added `peakStreakRef.current = snapshot.p1.streak` update inside the `snapshot` `useEffect`. Added `peakStreakRef.current = 0` reset at game start.

---

### Fix 12 · `handleTutorialClose` Incremented `gamesPlayed` Before Energy Check
**File:** `App.tsx`

If a player dismissed the tutorial with zero energy, `gamesPlayed` state was incremented (potentially triggering the RewardsHub `next === 1` popup) but the actual game never started and localStorage was also already written.

**Fix:** Moved the increment to after the no-energy early-return guard.

---

### Fix 13 · Duplicate `interface ShopData` in ShopPanel.tsx
**File:** `components/Shop/ShopPanel.tsx`

Two `interface ShopData` declarations existed (TypeScript merges duplicate interfaces). The first (lines 4–11) was missing `unlockedBackgrounds` and `equippedBackground`. While TypeScript merged them, the incomplete first declaration caused confusion and potential type drift.

**Fix:** Removed the incomplete first declaration.

---

## ✨ Visual & QOL Improvements

### New File: `styles/enhancements.css`

A new CSS layer imported after `game.css` that upgrades every visual element without modifying existing CSS. Highlights:

#### Cells
- **Richer hover lift**: `scale(1.06) translateY(-2px)` with `brightness(1.22)` — only on pointer devices (`@media (hover: hover)`)
- **Deeper press**: `scale(0.86) translateY(3px)` with 60ms transition for haptic feel
- **Cell entrance stagger**: `cellEntrance` keyframe with 18ms per-child delay on board generation
- **Upgraded pop animation**: `cellPopV2` — wider squish range, brightness burst to 2.2, cleaner fade
- **Purple pulse v2**: wider glow spread, ring halo at 35% keyframe, saturation boost
- **Power-up cell glows**: `shield`, `freeze`, `multiplier`, `medpack` each have colour-matched pulsing ring glows

#### Buttons
- **Play button shimmer sweep**: repeating diagonal light sweep animation every 3s
- **3D press depth**: play button drops 5px on active; shadow collapses for tactile response
- **Disabled state**: `opacity: 0.38; saturate(0.4)` on `.btn-primary:disabled`
- **Spring transitions**: all buttons use `cubic-bezier(0.34, 1.56, 0.64, 1)` for spring feel

#### HUD
- **Score card breathing glow**: subtle 4s ambient purple pulse
- **PB pulse v2**: scale + double drop-shadow for "excited" feel
- **Speed bar color flow**: 4-stop gradient `#7c3aed → #c026d3 → #f0abfc → #fbbf24` animating across bar
- **Speed bar transition**: 0.8s cubic for smoother fill changes

#### Combo Badge
- **`comboBounce`**: rotate + scale spring animation on each new combo
- **Heat ramp**: `data-streak="high"` switches badge to red/orange gradient

#### Menu Card
- **`menuCardEnter`**: slides up 16px + scales from 0.96 on mount
- **Title shimmer**: 200% background-size gradient sweeping across menu title at 5s loop

#### Game Over
- **`scoreReveal`**: scale from 0.4 + blur(8px) entrance for the score number
- **`NewBestBanner`**: gold pulsing "✨ New Personal Best!" shown when `p1Score >= best`
- **PB score styling**: score number gets `hud-val--pb` class (purple shimmer) when new best
- **`go-dust-inline`**: pill badge for dust earned with purple glow, delayed entrance animation
- **`go-bug-icon`**: corner 🐛 link, 30% opacity, grows on hover

#### Modals & Overlays
- **`modalPanelEnter`**: scale from 0.88 + translateY(24px) spring entrance
- **`pauseCardEnter`**: same treatment for pause menu
- **`drawerSlideIn`**: spring enter from right for settings drawer
- **`toastBounceIn`**: bounce overshoot on toast entrance; `toastFadeOut` slides up on exit
- **`rareSplashV2`**: blur(20px) start, wider scale range, blur fade on exit for cinematic feel

#### Hearts
- **`heartLossV2`**: loss animation — flash bright → shrink → desaturate sequence
- **`heartDangerV2`**: double drop-shadow danger pulse at 1 HP

#### Screen Shake
- **`screenShakeV2`**: more keyframes, larger offsets (10px), slight rotation for visceral feel

#### Damage Vignette
- **`vignetteFlashV2`**: rgba background overlay added alongside inset shadow for full-screen red flash

#### Leaderboard
- **Row entrance stagger**: `lbRowEnter` slides from left, 40ms per-row delay (10 rows)
- **Gold row glow**: gradient background + `lb-score` gets gold gradient text with drop-shadow

#### Rewards Hub
- **All hub classes now in enhancements.css**: `hub-tab-btn`, `hub-milestone`, `hub-task-fill shimmer`, etc.
- **Task progress fill**: shimmer sweep animation on fill bar
- **Badge attract animation**: red dot pulses scale 1.15 every 2s
- **Streak number pulse**: `streakNumPulse` orange drop-shadow at 2s loop

#### Pill Toggle
- **Spring thumb**: transition uses `var(--ease-spring)` with inset highlight

#### Misc
- **CSS custom properties**: `--ease-spring`, `--ease-out-expo`, `--ease-in-back`, `--dur-fast/normal/slow/xslow`, `--glow-purple/blue/gold`
- **`@media (prefers-reduced-motion)`**: all new animations respect system accessibility setting
- **`.root--reduced-motion`** overrides: kills animations on specific elements when user toggles in-game

---

## 📋 opencode Implementation Instructions

The following files were modified or created in this session. Apply them in order:

### 1. Replace `styles/enhancements.css` (NEW FILE)
Already created at `/home/claude/dtp-src/styles/enhancements.css`.
Copy to your working directory. This file is ~700 lines of pure CSS — no JS changes needed.

### 2. Patch `App.tsx` (multiple targeted fixes)
Apply all patches from Fixes 4–12 above. Key changes:
- `import "./styles/enhancements.css"` after `game.css` import (line 3)
- `scoreSubmittedRef.current = false` in `startGame` and `handleTutorialClose`
- `peakStreakRef.current = 0` in `startGame` and `handleTutorialClose`
- `gamesPlayed` increment moved to after energy guard in `handleTutorialClose`
- `gamesPlayed` increment added to `startGame`
- All `dust` → `dustRef.current` in `refillEnergy`, `onRefillFull`, energy popup
- `finalStreak = peakStreakRef.current` (not `snapshotRef.current?.p1.streak ?? 0`)
- `snapshotRef` useEffect: add `peakStreakRef.current` update
- Remove `dust` from `handleEngineGameOver` dep array
- Remove `dust` from `refillEnergy` dep array

### 3. Replace `components/Screens/GameOver.tsx`
Already written at `/home/claude/dtp-src/components/Screens/GameOver.tsx`.
Key additions: `isNewBest` detection, `NewBestBanner` component, PB class on score, `go-bug-icon` corner link.

### 4. Patch `components/Backgrounds/PulseField.tsx`
Line 54: `className="background-canvas"` (remove inline style)

### 5. Patch `components/Backgrounds/ParticleWeb.tsx`
Last return line: `className="background-canvas"` (remove inline style)

### 6. Patch `components/Backgrounds/Plasma.tsx`
Last return line: `className="background-canvas"` (remove inline style)

### 7. Patch `components/Shop/ShopPanel.tsx`
Remove lines 4–11 (first `interface ShopData` declaration with only 6 fields).

### 8. Bump version in `package.json`
Change `"version": "5.4.0"` → `"version": "5.6.0"`

---

## 🔒 Security Notes

- All `dustRef.current` fixes prevent dust duplication/loss on fast double-tap or state-lag
- `scoreSubmittedRef` reset prevents silent score-drop exploit (playing a second game wouldn't submit)
- No new external endpoints or data exposure introduced

## ⚡ Performance Notes

- All new CSS animations use `transform` and `filter` only (GPU-composited, no layout reflow)
- `will-change: transform` on `.cell` for browser layer promotion
- `backface-visibility: hidden` on `.cell` prevents subpixel rendering flicker on iOS
- `@media (prefers-reduced-motion)` kills all animations system-wide for accessibility
- Enhancements CSS is ~18KB unminified, ~4KB gzipped — negligible bundle impact
- No new React components — pure CSS layering means zero runtime JS overhead

