# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Don't Touch Purple** — a reflex-based grid-tapping game. Tap every non-purple cell, survive, climb the leaderboard. Two modes (Classic + Evolve), 50+ achievements, daily objectives, dust economy, global leaderboard (Cloudflare Worker + Firebase), 12 OGL/WebGL backgrounds, bot assist AI, PWA, 5-language i18n.

- Live: https://game.mscarabia.com (Firebase Hosting)
- Repo: https://github.com/defaltadmin/donttouchpurple
- **This directory is the GAME** — `MSCArabia.com/` is a separate sibling repo (corporate site, do not mix).

## Commands

```bash
pnpm dev              # Vite dev server (localhost:5173)
pnpm build            # tsc + vite build → dist/
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest (run once, ~230 tests)
pnpm test:coverage    # Vitest + v8 coverage
pnpm test:e2e         # Playwright E2E
pnpm test:e2e:ui      # Playwright UI mode
pnpm lint             # ESLint --fix
pnpm analyze          # Bundle visualizer (dist/stats.html)
pnpm check:bundle     # Bundle size budget check
pnpm release          # semantic-release via scripts/release-v7.sh
```

Run a single test file: `pnpm test -- __tests__/GameEngine.test.ts`.

Post-session audit (required after 5+ file changes): `pnpm typecheck && pnpm test && pnpm build && pnpm lint --max-warnings=0`. For full multi-AI review, run `/multi-ai-audit` (opencode + gemini, **batched per-module** — never full codebase, causes heap OOM).

## Architecture

Flat layout — no `src/`. Source at repo root. Entry: `App.tsx` (screen state machine) → `main.tsx` (React root, Sentry, service worker).

```
App.tsx (screen state machine + 16 custom hooks)
  ├── engine/         Pure game logic — ZERO React imports
  │   ├── GameEngine.ts           main loop, RNG, player state, boss events
  │   ├── DifficultyScaler.ts     score→speed curves, grid expansion
  │   ├── types.ts                PlayerState, ActiveCell, CellType, GameState
  │   └── subsystems/             TickProcessor, CellLifecycle, ScoreTracker,
  │                               EventOrchestrator, BotController
  ├── components/     React UI only
  │   ├── Screens/                Start, GameOver, Pause, HowToPlay, RewardsHub, Shop
  │   ├── HUD/                    PlayerPanel, GameArea, ScoreDisplay, EnergyBar
  │   ├── Backgrounds/            12 OGL/WebGL themes (Galaxy, Aurora, StarWarp...)
  │   ├── Landing/                Single-page landing (LeftPanel/RightPanel/LearnMore)
  │   ├── Settings/               SettingsDrawer, DevOverlay
  │   ├── Cell/                   Cell rendering, click handling, spark canvas
  │   └── UI/                     LottiePlayer, Icon, MagneticButton
  ├── hooks/          React ↔ engine bridge (useGameEngine, useThemeSettings, etc.)
  ├── services/       firebase, firestore, sentry, gameanalytics, web-vitals, boss-engine
  ├── workers/        Cloudflare Worker (score-validator, /api/sign-challenge, /api/verify-challenge)
  ├── functions/      Firebase Cloud Functions (streak update with timezone handling)
  ├── config/         gameBalance, difficulty, gridPatterns, powerupWeights, keybindings
  ├── utils/          score-sync, state-guard (HMAC sessions), idb queue, achievements
  ├── contexts/       GameContext, DustContext
  ├── styles/         game.css, enhancements.css, performance.css
  ├── locales/        en, es, fr, ja, pt — only English loaded eagerly, rest lazy
  ├── types/          Shared TS declarations
  ├── __tests__/      Vitest unit tests
  ├── e2e/            Playwright tests
  └── test/           Test setup, fixtures
```

### Game modes
- **Classic**: fixed 3×3 grid. **Evolve**: progressive stages (3→4→5→...), boss events (Storm, Inversion, Blackout), rare colors, powerups.

### Cells
- 13 colors (avoid purple); powerups (medpack, shield, freeze, multiplier); specials (ice = multi-tap, hold = sustained tap, bomb = -1 heart).

## Critical Rules

1. **Pure logic in `engine/`** — never import React, Firebase, or DOM APIs there.
2. **Cell arrays are REPLACED each tick** — never mutate in place. Callbacks referencing cell indices need a **generation counter** to detect staleness.
3. **sessionStorage for game state** (GameEngine reads it). localStorage only for non-game progress/settings.
4. **data-testid** on all key interactive elements (E2E relies on this).
5. **CSS vars from DESIGN.md** — never hardcode hex in TSX. Use `var(--token, fallback)`. Canvas/WebGL backgrounds (no DOM) are the only exception.
6. **RAF idle skip** — check `document.hidden` in all RAF loops, skip render (keep scheduling) when no active entities.
7. **WebGL context loss handlers** (webglcontextlost/restored) on all OGL backgrounds, with `ctxVersion` state for GPU driver reset recovery.
8. **React.memo** for external library components in expensive contexts (every Cell component defeats it — Cell arrays are replaced each tick; use a custom comparator or a version counter).
9. **safeSet** wrapper for localStorage writes that grow (scores, progress, modes) — handles QuotaExceededError.
10. **VITE_\* env vars** for DSNs/API keys. Never hardcode. Sanitize before logging.
11. **UTC for weekly/reset boundaries** — getUTCDay/getUTCDate, never local.
12. **Pure functions outside component body** to avoid recreation on every render.
13. **Refs over closures** for rapid interaction sequences (avoid stale closures).
14. **Idempotent singletons** — module singletons (bossEngine, achievements, BotController) need reset on game start + timer cleanup on dispose.
15. **TypeScript strict** — no `any`, type all engine state against defaults template (state-guard.ts sanitize()).
16. **Commit messages**: Conventional Commits (semantic-release reads them).
17. **Linter reverts on merge AND mid-session** — re-read files after edits; diff HEAD~1 after merge.

## Domain Agents

See `docs/agents/` for 8 specialist agent prompts (game-engine, ui-components, firebase-services, config-balance, security-audit, performance, hooks-state, infrastructure-deploy). Each is a subagent brief tailored to a layer.

## Post-Session Audit (REQUIRED)

After any session with 5+ file changes:
1. `pnpm typecheck && pnpm test && pnpm build && pnpm lint --max-warnings=0`
2. If green → commit. If not → fix first.
3. For full multi-AI audit: `/multi-ai-audit` (opencode + gemini per module, batched per module, save to `.review-packet/`, triage, fix).
4. **NEVER run a full-codebase audit in one call** — 200+ files cause heap OOM. Always batch per-module.
5. Max 3-4 parallel agents per batch to avoid context bloat.

## Related Files

| File | Purpose |
|------|---------|
| `HANDOFF.md` | Master handoff — read FIRST in any new session |
| `AGENTS.md` | Universal AI tool instructions + agent principles |
| `DESIGN.md` | MD3 tokens, Dark-Cyberpunk Synthwave palette |
| `llms.txt` / `llms-full.txt` | AI agent project overview + full reference |
| `firebase.json` / `firestore.rules` | Hosting + security rules (read before Firestore changes) |
| `vite.config.ts` | Vite + plugins + compression + code splitting |
| `workers/wrangler.toml` | Cloudflare Worker config (auth expires silently — `wrangler login` first) |
| `.github/copilot-instructions.md` | Sibling instruction set for Copilot |
