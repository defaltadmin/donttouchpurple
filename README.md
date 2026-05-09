# Don't Touch Purple

A reflex-based grid-tapping game built with React, TypeScript, and Vite.

## Architecture

- **Engine layer** (`engine/`): Game loop, tick processor, bot controller, cell lifecycle, score tracking
- **Config layer** (`config/`): Game balance, difficulty, grid patterns, keybindings, powerup weights
- **UI layer** (`components/`): React components for HUD, screens, backgrounds, settings, shop
- **Hooks layer** (`hooks/`): `useGameEngine` (engine bridge), `useInputHandler`, `useBackground`
- **Utils layer** (`utils/`): Audio, analytics, i18n, haptics, session management, service worker

## Features

- **Two game modes**: Classic (3×3 grid) and Evolve (progressive grid stages)
- **Bot Assist**: AI companion that taps safe cells using earned dust currency
- **Special Cells**: Shields, freeze, multiplier, medpack, ice, hold, bomb
- **Boss Events**: Storm (fast shuffle), Inversion (swapped danger), Blackout (blind play)
- **Rare Mode**: Periodic color shifts requiring rapid adaptation
- **12 Animated Backgrounds**: Canvas-based GPU-accelerated effects
- **i18n**: English, Spanish, French, Japanese, Portuguese
- **Leaderboard**: Global + weekly, offline score queue via Service Worker
- **Colorblind Mode**: Deuteranopia, protanopia, tritanopia, monochrome filters
- **PWA**: Installable, offline-capable with background sync

## Quick Start

```bash
pnpm install
pnpm dev          # Local dev server
pnpm typecheck    # TypeScript check
pnpm test         # Run tests
pnpm build        # Production build
pnpm analyze      # Bundle size breakdown
pnpm release      # Tag + push v7.0.0
```

## CI/CD

- GitHub Actions: Node 18/20/22 matrix, typecheck, lint, test (coverage), build
- Auto-deploys to GitHub Pages on main pushes
- Release workflow creates tagged GitHub Release with changelog

v7.0.0 — See [CHANGELOG.md](CHANGELOG.md) for full release notes.
