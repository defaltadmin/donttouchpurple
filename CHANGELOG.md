# Don't Touch Purple — Changelog

## v5.1.0 — 2026-04-29

### Bug Fixes

- **Pause menu settings no longer unpauses game**
  - Added `settingsFromPause` state; when Settings is opened from Pause, closing it keeps the game paused
  - `App.tsx` line ~342

- **Themes apply instantly after equipping from shop**
  - Added `useEffect` to apply shop theme CSS variables to `document.documentElement` on equip
  - `App.tsx`

- **Practice mode no longer loses health (keys + duo mode)**
  - `GameEngine` accepts `godMode` from config; practice mode initializes with `godMode: true`
  - `engine/GameEngine.ts` — `makePS()` and engine config; `App.tsx` config setup

- **Keyboard mode key badge covers cell colors**
  - Key badge (`.kbadge`) made smaller, semi-transparent white with `backdrop-filter: blur(4px)`, positioned top-right
  - `styles/game.css` ~line 1203

- **Powerup status bar clipping**
  - `.pwr-bar` z-index raised to 20, padding adjusted
  - `styles/game.css` ~line 266

- **Rare color mode — tapping wrong color caused damage**
  - Fixed `_processTap` — was `if (cell.type === danger || (cell.type === "purple" && danger !== "purple"))`, now `if (cell.type === danger)` — only the active danger color causes damage on tap
  - `engine/GameEngine.ts` line 435

- **Rare color mode — safe cells were incorrectly marked as dangerous on timeout**
  - Fixed tick damage check — was `if ((c.type !== dangerColor && c.type !== "purple") && !isPwr)` (inverted logic), now `if (c.type === dangerColor && !isPwr)` — only the danger color cell causes timeout damage
  - `engine/GameEngine.ts` line 349

- **God mode blocked medpack powerups even when eligible**
  - In `spawnActive`, god mode filters out `medpack` from the powerup table so no hearts spawn when invincible
  - `engine/GameEngine.ts` line 97

- **Practice mode hearts replaced with ∞ infinity symbol**
  - `Hearts.tsx` renders pulsing ∞ icon when practice mode detected

### New Features

- **Sound slider chime**
  - `playVolumeChime()` plays a pleasant sine wave chime when volume is adjusted
  - `hooks/useGameEngine.ts` — new function; `App.tsx` — called in `setVolume` callback

- **Triangle shape spawn rate doubled**
  - Now appears in 2 of 8 cycles instead of 1 of 6
  - `engine/GameEngine.ts` — `randCell` / `pickCellShape` logic

- **Tutorial fully visual with navigation**
  - `EvolveTutorial.tsx` rewritten with grid previews, shape demos, color stages, powerup icons, hazard examples
  - Back/forward buttons and clickable dot navigation
  - `styles/game.css` — tutorial-specific styles added

### Visual Improvements

- **Powerup drop animations**
  - New `pwrDrop` keyframe: scale overshoot (1.3x), brightness flash (2→1), smooth settle
  - Applied to medpack/shield/freeze/multiplier cells on spawn via `pwr-drop` animation class
  - `styles/game.css` lines 991-1000; `engine/GameEngine.ts` lines 378-384

- **Score UI redesign**
  - Reduced pulsating glow intensity: scale 1.18→1.12, brightness 1.4→1.2, duration 0.2s→0.25s
  - Refined gradient (dark theme: `#f5f5f5 → #e879f9 → #c026d3 → #a21caf`; light theme: `#1a0a2e → #7c3aed → #a855f7 → #c026d3`)
  - Added `drop-shadow` for depth
  - `styles/game.css` lines 642-646, 62-65, 1949-1957

- **Pause menu HUD redesign**
  - Replaced single-line score display with 2-column grid showing:
    - Score / P2 Score
    - Stage number
    - Streak count (with 🔥)
    - Speed multiplier
    - Active powerup timers (Freeze ❄ / Multiplier ⚡ / Shield 🛡) with color-coded labels
  - `App.tsx` lines 675-748; `styles/game.css` lines 485-514 (new `.pause-hud-*` classes)

### Test Updates

- Updated "damages the player when safe cells are missed" test to correctly verify danger cell timeout damage behavior
  - `__tests__/GameEngine.test.ts`

### File Cleanup

- Moved obsolete/garbage files to `junk/` directory
