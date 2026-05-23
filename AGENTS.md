# Agent Instructions — Don't Touch Purple

Reflex-based grid-tapping game. React 19, TypeScript 5, Vite 7, Firebase, OGL/WebGL backgrounds.

## Quick Reference

| Area | Location | Key File |
|------|----------|----------|
| Game logic | `engine/` | `engine/GameEngine.ts` |
| Tick processing | `engine/subsystems/` | `TickProcessor.ts` |
| React UI | `components/` | `App.tsx` (main orchestrator) |
| HUD | `components/HUD/` | `PlayerPanel.tsx`, `GameArea.tsx` |
| Backgrounds | `components/Backgrounds/` | 12 OGL themes |
| Config | `src/config/` | `game.ts` (balance, difficulty) |
| Firebase | `services/` | `firebase.ts`, `firestoreService.ts` |
| Workers | `workers/` | `scoreWorker.ts` (Cloudflare) |
| E2E | `e2e/` | `smoke.spec.ts` (Playwright) |
| Design | `DESIGN.md` | MD3 tokens, dark-cyberpunk palette |

## Rules

1. **Pure game logic** in `engine/` — zero React imports
2. **Cell arrays replaced each tick** — never mutate in place
3. **sessionStorage** for game state (not localStorage)
4. **Generation counter** for callbacks referencing cell indices
5. **data-testid** on all key interactive elements
6. **CSS vars from DESIGN.md** — no hardcoded hex colors
7. **RAF idle skip** — check `document.hidden`, skip render when no active entities
8. **WebGL context loss handlers** on all OGL backgrounds
9. **React.memo** for external library components in expensive contexts
10. **safeSet** wrapper for localStorage writes that grow (quota handling)

## Commands

```bash
pnpm dev          # Dev server
pnpm typecheck    # TypeScript validation
pnpm test         # Unit tests (vitest)
pnpm test:e2e     # E2E tests (Playwright)
pnpm build        # Production build
pnpm lint         # ESLint fix
```

## Architecture

```
App.tsx (state machine)
  ├── engine/ (pure logic, no React)
  ├── components/ (React UI)
  ├── hooks/ (useGameEngine bridge)
  ├── services/ (Firebase, analytics)
  ├── workers/ (Cloudflare proxy)
  └── config/ (balance, patterns, difficulty)
```

## Full docs

- [llms.txt](llms.txt) — AI agent project overview
- [DESIGN.md](DESIGN.md) — Design tokens and palette
- [CLAUDE.md](CLAUDE.md) — Detailed project instructions
- [docs/agents/](docs/agents/) — Domain-specific agent definitions
