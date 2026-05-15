# 🔮 Don't Touch Purple - System Architecture Map (v7.4.0)
*Use this guide to brief any AI assistant on the game's current status and file roles.*

## 🏗️ Core Engine (The "Brain")
- **`engine/GameEngine.ts`**: The primary state machine. Manages the game loop, ticking, and collision/tap logic. **Review this for stability and core rules.**
- **`engine/types.ts`**: Strict TypeScript definitions for the entire game state, snapshots, and events.
- **`engine/subsystems/TickProcessor.ts`**: Handles the math of "what happens on every frame" (speed scaling, cell spawning).
- **`engine/subsystems/BotController.ts`**: Logic for the AI bot assistant.
- **`engine/DifficultyScaler.ts`**: Algorithms that compute how fast the game gets based on your score/time.

## ⚛️ UI & React Layer (The "Body")
- **`App.tsx`**: The root orchestrator. Manages screen switching, global state, and connects the Engine to the UI.
- **`hooks/useGameEngine.ts`**: The bridge hook. Translates Engine events into React state for rendering. **Review this for memory leaks/lifecycle bugs.**
- **`hooks/useEnergyStore.ts`**: Dedicated hook for the persistent energy/stamina system.
- **`components/Backgrounds/`**: Performance-heavy canvas effects (ParticleWeb, MouseTrail, GridPulse). **Review for FPS optimization.**
- **`components/Screens/`**: Logic for Main Menu, Game Over, Shop, and HUD.

## 🛠️ Utilities & Services (The "Tools")
- **`services/firebase.ts`**: Leaderboard sync and authentication logic.
- **`utils/dda.ts`**: Dynamic Difficulty Adjustment logic.
- **`utils/analytics.ts`**: Tracking for game events and user behavior.
- **`utils/audio.ts`**: The global sound manager.
- **`styles/game.css`**: The entire visual language (Glassmorphism, Shaders, Animations).

---

## 🔍 Audit & Improvement Guide for other AIs:

### For Stability & Bug Fixes:
> *"Please review `engine/GameEngine.ts` and `hooks/useGameEngine.ts`. We recently fixed RAF leaks and uninitialized guards. Look for any remaining race conditions between the requestAnimationFrame loop and React's lifecycle."*

### For Performance Optimizations:
> *"Review the canvas components in `components/Backgrounds/`. We are using object pooling for particles in `MouseTrail.tsx`, but check if `ParticleWeb.tsx` or `GridPulse.tsx` could benefit from similar memory optimizations."*

### For Gameplay & "Juice" Suggestions:
> *"Look at `styles/game.css` and `engine/GameEngine.ts`. Suggest ways to add more haptic or visual feedback (juice) using CSS variables or unique cell types (e.g., gravity cells, teleporting cells)."*

---

## 📂 Full Directory Overview:
- `config/`: JSON-like TypeScript files defining balance, patterns, and keybindings.
- `contexts/`: React Contexts for cross-cutting state (Dust, UI, Game).
- `locales/`: i18n translation files (en, es, ja, etc.).
- `junk/`: Stale/deprecated files kept for reference but not used in build.
- `public/`: Static assets, manifest, and the Service Worker.
- `__tests__/`: Comprehensive test suites for engine and config integrity.
