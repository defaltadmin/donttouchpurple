# Contributing to Don't Touch Purple

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/defaltadmin/donttouchpurple.git
cd donttouchpurple

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite dev server |
| `pnpm typecheck` | Run TypeScript compiler checks |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm lint` | ESLint with auto-fix |
| `pnpm build` | Production build |
| `pnpm analyze` | Bundle size breakdown |

## Code Style

- **TypeScript** strict mode — no `any` types
- **React** functional components with hooks
- **CSS** variables for theming (MD3 tokens)
- **Engine** code must be pure logic — no React imports in `engine/`
- **Components** should not import from `engine/` directly — use hooks in `hooks/`

## Project Structure

```
engine/       Pure game logic (no React)
components/   React UI (screens, HUD, backgrounds)
hooks/        React <-> Engine bridge
config/       Game balance, difficulty, patterns
utils/        Audio, analytics, i18n, haptics
e2e/          Playwright E2E tests
__tests__/    Unit tests (Vitest)
```

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `pnpm typecheck && pnpm lint && pnpm test`
4. Ensure `pnpm build` succeeds
5. Open a PR with a clear description of what changed and why

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new power-up type
fix: resolve score sync race condition
refactor: extract cell lifecycle into subsystem
test: add unit tests for boss engine
docs: update architecture diagram
```

## Reporting Bugs

Use the [Bug Report](https://github.com/defaltadmin/donttouchpurple/issues/new?template=bug_report.md) template. Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/device info
- Screenshots if applicable

## Feature Requests

Use the [Feature Request](https://github.com/defaltadmin/donttouchpurple/issues/new?template=feature_request.md) template. Describe:
- The problem you're trying to solve
- Your proposed solution
- Alternatives considered
