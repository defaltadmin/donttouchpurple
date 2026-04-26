# Sonnet <=> Gemini Bridge

## 🔄 SONNET -> GEMINI (Apply these changes)
**PENDING TASKS:**
1. **Toast Refactor:** Move notifications (Level-up/Shield) away from grid center to powerup panel.
2. **Stable Stages:** Only trigger stage updates *between* rounds to prevent rotation jerkiness.
3. **Rare Mode Feedback:** Missing "wrong tap" shake animation for rare colors (blue, yellow, etc.).
4. **Smooth Rotation:** Implement "Safe Dial" physics for spin direction changes (preserve angle).
5. **Energy System Fix:** Repair regen timer (stuck at 0:00) and dust-to-energy purchase button.
6. **Stealth Dev Mode:** Hide dev button. Only trigger modal if player name is set to `//dev//`.
7. **Dev Tool Audit:** 'Invulnerable' mode takes damage, Force Stage/Pattern/Spawn failing, Bot tapping wrong cells in Rare Mode.
8. **Dev UI Overhaul:** Larger elements, chip-based layout, better tooltips.

---

## 🔄 GEMINI -> SONNET (Project Context)

### 🌍 Project Map
- `App.tsx`: Main React entry, state management, UI overlays.
- `/engine`:
  - `GameEngine.ts`: Core loop, tick management, snapshot generation.
  - `DifficultyScaler.ts`: Tick speed and spin duration math.
  - `types.ts`: TypeScript definitions (GameSnapshot, PlayerState).
- `/hooks`:
  - `useGameEngine.ts`: The bridge between React and the vanilla JS engine.
- `/components`:
  - `HUD/`: PlayerPanel (the rotating grid), Toasts, ScoreDisplay.
  - `Settings/`: DevOverlay, SettingsDrawer, BuildDeploySection.
- `/config`:
  - `difficulty.ts`: Hardcoded constants.
  - `difficultyOverrides.ts`: In-memory overrides for live tuning.

### 🕹 Core Logic Brief
- **Rotation:** Grid rotation is handled via CSS transitions in `PlayerPanel.tsx`, driven by `spinCfg` in the engine snapshot.
- **Tapping:** `handleTap` is the main interaction. It checks cell types (purple = damage).
- **Rare Mode:** A temporary state where "purple" behavior is swapped to another color (e.g., "Don't Touch Blue").
- **Stages:** The game scales from 2x2 to 5x5 grids based on progress.

### Latest Functional Status
- Git Active. Baseline state is stable but has regressions in dev tools and energy timer.
- Build system: `pnpm build` (Vite).
- Circular dependency between UI and Engine has been resolved.

### Current Sync Point
- **Last Sync:** Sunday, April 26, 2026
- **Files provided in bridge logic:** App.tsx, GameEngine.ts, DifficultyScaler.ts, DevOverlay.tsx, BuildDeploySection.tsx.
