# Don't Touch Purple

![CI](https://github.com/defaltadmin/donttouchpurple/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-7.5.3-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg)

A reflex-based grid-tapping game built with React, TypeScript, and Vite. Tap cells to score — but never touch purple.

**[Play Now](https://defaltadmin.github.io/donttouchpurple)** &nbsp;|&nbsp; [How It Works](#architecture) &nbsp;|&nbsp; [Contribute](CONTRIBUTING.md)

---

## Features

- **Two game modes** — Classic (3×3 grid) and Evolve (progressive stages with boss events)
- **Special cells** — Shields, freeze, multiplier, medpack, ice, bomb
- **Boss events** — Storm (fast shuffle), Inversion (swapped danger), Blackout (blind play)
- **Rare color mode** — Periodic shifts requiring rapid adaptation
- **12 animated backgrounds** — Canvas-based GPU-accelerated effects
- **Bot Assist** — AI companion that taps safe cells using earned dust currency
- **Hyper-Juice UI** — Mouse-reactive spotlights, magnetic buttons, liquid trails
- **i18n** — English, Spanish, French, Japanese, Portuguese
- **PWA** — Installable, offline-capable, works on mobile

## Architecture

```
App.tsx (screen state machine, game lifecycle)
    |
    +-- engine/       Pure game logic, no React dependencies
    |   +-- GameEngine.ts        Main loop, player state, boss events
    |   +-- subsystems/          TickProcessor, CellLifecycle, BossEngine
    |
    +-- components/   React UI
    |   +-- Screens/             StartScreen, GameOver, HowToPlay, Shop
    |   +-- HUD/                 Score, Energy, Health, Combo badges
    |   +-- Backgrounds/         12 GPU-accelerated canvas themes
    |
    +-- hooks/        React <-> Engine bridge
    +-- config/       Game balance, difficulty curves, patterns
    +-- utils/        Audio, analytics, i18n, haptics, session
```

## Quick Start

```bash
pnpm install
pnpm dev          # Local dev server
pnpm typecheck    # TypeScript check
pnpm test         # Run tests
pnpm build        # Production build
```

## CI/CD

- **GitHub Actions** — Node 22/24 matrix, typecheck, lint, test (coverage), build
- **Auto-deploy** to GitHub Pages on main pushes
- **Release workflow** creates tagged GitHub Release with changelog

## Testing

| Command | What it runs |
|---|---|
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:coverage` | Unit tests with coverage report |
| `pnpm test:e2e` | E2E tests (Playwright) |
| `pnpm test:e2e:ui` | E2E tests with Playwright UI |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style, and PR process.

## License

[MIT](LICENSE)
