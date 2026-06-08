# Don't Touch Purple — Copilot Instructions

## Project Identity
- **Game**: Don't Touch Purple — reflex-based grid-tapping game
- **Stack**: React 18, TypeScript 5, Vite 7, Firebase (Auth, Firestore, Analytics, App Check), OGL/WebGL, GSAP, framer-motion
- **Testing**: Vitest 4 (230 tests), Playwright (E2E)
- **Workers**: Cloudflare Worker (score validation, leaderboard proxy)
- **Live**: https://game.mscarabia.com (Firebase Hosting)
- **Repo**: https://github.com/defaltadmin/donttouchpurple

## Commands
- `pnpm dev` — Dev server with HMR
- `pnpm typecheck` — TypeScript validation
- `pnpm test` — Unit tests (Vitest, 230 tests)
- `pnpm test:e2e` — E2E tests (Playwright)
- `pnpm build` — Production build
- `pnpm lint` — ESLint with auto-fix

## Architecture
```
App.tsx (state machine, ~1878 lines)
  ├── engine/ (pure logic, no React imports ever)
  │   ├── GameEngine.ts — main loop, player state, boss events
  │   ├── subsystems/TickProcessor.ts — cell spawning, difficulty
  │   ├── subsystems/CellLifecycle.ts — click handling, special cells
  │   ├── subsystems/BotController.ts — bot assist AI
  │   ├── subsystems/EventOrchestrator.ts — event coordination
  │   ├── subsystems/ScoreTracker.ts — score calculation
  │   └── DifficultyScaler.ts — difficulty curve
  ├── components/ (React UI)
  │   ├── Screens/ — StartScreen, GameOver, PauseOverlay, RewardsHub, Shop
  │   ├── HUD/ — ScoreDisplay, EnergyBar, Hearts, PlayerPanel, GameArea
  │   ├── Backgrounds/ — 15 OGL/WebGL + Canvas themes
  │   ├── Cell/ — cell rendering, click handling, inline spark canvas
  │   ├── Settings/ — SettingsDrawer, DevOverlay, QuickSettings
  │   └── UI/ — LottiePlayer, Icon, MagneticButton
  ├── hooks/ (16 custom hooks — useGameEngine bridge, useThemeSettings, etc.)
  ├── services/ (firebase.ts, firestoreService.ts, sentry.ts, monitoring.ts, web-vitals.ts)
  ├── workers/ (score-validator.ts — Cloudflare Worker)
  ├── config/ (gameBalance.ts, difficulty.ts, keybindings.ts, achievementDefs.ts)
  ├── utils/ (achievements.ts, challenge-link.ts, score-sync.ts, state-guard.ts)
  ├── contexts/ (GameContext.tsx, DustContext.tsx)
  └── styles/ (game.css, enhancements.css, fx-enhancements.css, performance.css)
```

## Key Files
| File | Purpose |
|------|---------|
| `engine/GameEngine.ts` | Core game state machine — RAF loop, scoring, boss events |
| `components/App.tsx` | Main React orchestrator — screen routing, engine bridge |
| `hooks/useGameEngine.ts` | React ↔ Engine bridge (snapshot sync, event wiring) |
| `config/gameBalance.ts` | All balance constants |
| `services/firestoreService.ts` | Firestore read/write (leaderboard, dust, streaks) |
| `workers/score-validator.ts` | Cloudflare Worker — HMAC signing, JWT verify, rate limiting |

## Conventions
1. **Pure game logic** in `engine/` — zero React imports, no DOM access
2. **Cell arrays replaced each tick** — never mutate in place
3. **sessionStorage** for game state (not localStorage)
4. **Generation counter** for callbacks referencing cell indices
5. **data-testid** on all key interactive elements
6. **CSS vars from DESIGN.md** — no hardcoded hex colors
7. **RAF idle skip** — check `document.hidden`, skip render when no active entities
8. **WebGL context loss handlers** on all OGL backgrounds
9. **React.memo** for external library components in expensive contexts
10. **safeSet** wrapper for localStorage writes that grow (quota handling)
11. **VITE_* env vars** for DSNs and API keys (not hardcoded)
12. **UTC for weekly tasks** — `getUTCDay`/`getUTCDate`, not local time

## 33 Achievements
Registered from `config/achievementDefs.ts` array (not 33 register() calls). Categories: score, taps, time, streaks, boss, powerup, special, social.

## Design Tokens (DESIGN.md)
Dark cyberpunk: `--bg-deep: #0a0a0f`, `--accent: #a855f7`, `--neon-glow: #d946ef`, `--text: #e2e8f0`. Full palette in `DESIGN.md`.

## Important
- Game repo has a sibling project at `MSCArabia.com/` (separate git repo, separate remote `defaltadmin/mscarabia`). Do NOT commit corpo changes to the game repo.
- AGENTS.md has full agent instructions and domain-specific agent definitions.
- HANDOFF.md has the complete session history and project state.
