# Agent Instructions — Don't Touch Purple

Reflex-based grid-tapping game. React 18, TypeScript 5, Vite 7, Firebase, OGL/WebGL backgrounds.

## Repos

| Repo | URL | Deploy |
|------|-----|--------|
| Game (this repo) | `https://github.com/defaltadmin/donttouchpurple` | Firebase (game.mscarabia.com) |
| Corpo site | `https://github.com/defaltadmin/mscarabia` | Cloudflare Pages (mscarabia.com) |

Commits to this repo go to **donttouchpurple** (the game). Corpo site changes go to the **mscarabia** repo — separate clone, separate remote.

## Quick Reference

| Area | Location | Key File |
|------|----------|----------|
| Game logic | `engine/` | `engine/GameEngine.ts` |
| Tick processing | `engine/subsystems/` | `TickProcessor.ts` |
| React UI | `components/` | `App.tsx` (main orchestrator) |
| HUD | `components/HUD/` | `PlayerPanel.tsx`, `GameArea.tsx` |
| Backgrounds | `components/Backgrounds/` | 22 OGL themes |
| Config | `config/` | `gameBalance.ts`, `difficulty.ts` |
| Firebase | `services/` | `firebase.ts`, `firestoreService.ts` |
| Workers | `workers/` | `score-validator.ts` (Cloudflare) |
| E2E | `e2e/` | `smoke.spec.ts` (Playwright) |
| Design | `DESIGN.md` | MD3 tokens, dark-cyberpunk palette |

## Rules

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
11. **VITE_\* env vars** for DSNs/API keys. Never hardcode. Sanitize before logging.
12. **UTC for weekly/reset boundaries** — `getUTCDay`/`getUTCDate`, never local.
13. **Pure functions outside component body** to avoid recreation on every render.
14. **Refs over closures** for rapid interaction sequences (avoid stale closures).
15. **Idempotent singletons** — module singletons (bossEngine, achievements, BotController) need reset on game start + timer cleanup on dispose.
16. **TypeScript strict** — no `any`, type all engine state against defaults template (state-guard.ts `sanitize()`).
17. **Commit messages**: Conventional Commits (semantic-release reads them).
18. **Linter reverts on merge AND mid-session** — re-read files after edits; diff HEAD~1 after merge.

## Commands

```bash
pnpm dev          # Dev server
pnpm typecheck    # TypeScript validation
pnpm test         # Unit tests (vitest)
pnpm test:e2e     # E2E tests (Playwright)
pnpm build        # Production build
pnpm lint         # ESLint fix
```

Run a single test file: `pnpm test -- __tests__/GameEngine.test.ts`

## Architecture

Flat layout — no `src/`. Source at repo root. Entry: `App.tsx` (screen state machine) → `main.tsx` (React root, Sentry, service worker).

```
App.tsx (state machine)
  ├── engine/ (pure logic, no React)
  │   ├── GameEngine.ts — main loop, RNG, player state, boss events
  │   ├── DifficultyScaler.ts — score→speed curves, grid expansion
  │   ├── types.ts — PlayerState, ActiveCell, CellType, GameState
  │   └── subsystems/ — TickProcessor, CellLifecycle, ScoreTracker, EventOrchestrator, BotController
  ├── components/ (React UI)
  │   ├── Screens/ — StartScreen, GameOver, PauseOverlay, RewardsHub, Shop
  │   ├── HUD/ — PlayerPanel, GameArea, ScoreDisplay, EnergyBar
  │   ├── Backgrounds/ — 22 OGL/WebGL themes
  │   ├── Cell/ — cell rendering, click handling, spark canvas
  │   ├── Settings/ — SettingsDrawer, DevOverlay
  │   └── UI/ — LottiePlayer, Icon, MagneticButton
  ├── hooks/ (16 custom hooks — useGameEngine bridge, useThemeSettings, etc.)
  ├── services/ — firebase, firestore, sentry, gameanalytics, web-vitals, boss-engine
  ├── workers/ — Cloudflare Worker (score-validator, /api/sign-challenge, /api/verify-challenge)
  ├── functions/ — Firebase Cloud Functions (streak update with timezone handling)
  ├── config/ — gameBalance, difficulty, gridPatterns, powerupWeights, keybindings
  ├── utils/ — score-sync, state-guard (HMAC sessions), idb queue, achievements
  ├── contexts/ — GameContext, DustContext
  ├── styles/ — game.css, enhancements.css, performance.css
  └── locales/ — en, es, fr, ja, pt (only English loaded eagerly, rest lazy)
```

## Domain-Specific Agents

| Agent | Scope | Model |
|-------|-------|-------|
| [game-engine](docs/agents/game-engine.md) | GameEngine, TickProcessor, CellLifecycle, boss events, RNG | sonnet |
| [ui-components](docs/agents/ui-components.md) | React UI, screens, HUD, backgrounds, cells | sonnet |
| [firebase-services](docs/agents/firebase-services.md) | Firestore, Auth, Analytics, App Check, Hosting | sonnet |
| [config-balance](docs/agents/config-balance.md) | Game balance, difficulty scaling, grid patterns, powerup weights | sonnet |
| [security-audit](docs/agents/security-audit.md) | Firebase rules, CSP, XSS, state tampering, input validation | sonnet |
| [performance](docs/agents/performance.md) | Core Web Vitals, bundle size, GPU, memory leaks, render perf | sonnet |
| [hooks-state](docs/agents/hooks-state.md) | useGameEngine bridge, custom hooks, contexts, state machines | sonnet |
| [infrastructure-deploy](docs/agents/infrastructure-deploy.md) | Vite config, Firebase Hosting, Cloudflare Workers, CI/CD | sonnet |

## Agent Design Principles (from 12-factor-agents)

These principles guide how DTP's 8 domain agents and multi-AI workflows are structured:

1. **Own your prompts** — don't delegate to framework abstractions; each agent has explicit instructions
2. **Own your context window** — use codegraph_explore for structural context, not blind grep+read loops
3. **Tools are just structured outputs** — MCP servers (codegraph, agentmemory) expose structured queries
4. **Unify execution state and business state** — GameEngine holds both in a single state machine
5. **Make your agent a stateless reducer** — cell arrays replaced each tick, no in-place mutation
6. **Small, focused agents** — 8 domain agents, not one monolithic one
7. **Compact errors into context** — AI review triage (valid/overstated/over-engineering) before fixing
8. **Contact humans with tool calls** — AskUserQuestion for blockers, not silent assumptions

## MCP Servers

| Server | Package | Purpose |
|--------|---------|---------|
| codegraph | colbymchenry/codegraph | Structural code intelligence (callers, callees, impact) |
| agentmemory | @agentmemory/agentmemory | Persistent memory across sessions (53 tools, hybrid search) |

## Post-Session Audit (REQUIRED after major sessions)

After any session with 5+ file changes, run `/multi-ai-audit` or the manual checklist:

1. `pnpm typecheck && pnpm test && pnpm build && pnpm lint --max-warnings=0`
2. If green → commit. If not → fix first.
3. For full multi-AI audit: run `opencode` + `gemini` per module (engine/, components/, services/, config/, utils/, hooks/), save to `.review-packet/`, triage, fix.
4. **NEVER run full-codebase audit in one call** — 208 files causes heap OOM. Always batch per-module.
5. Max 3-4 parallel agents per batch to avoid context bloat.

## Full docs

- **[HANDOFF.md](HANDOFF.md)** — **READ THIS FIRST** in any new session. Master handoff with full project state, what's done, and what's next.
- [llms.txt](llms.txt) — AI agent project overview
- [DESIGN.md](DESIGN.md) — Design tokens and palette
- [CLAUDE.md](CLAUDE.md) — Detailed project instructions
- [docs/agents/](docs/agents/) — Domain-specific agent definitions
