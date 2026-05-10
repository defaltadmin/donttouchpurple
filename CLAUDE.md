# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Don't Touch Purple** - A reflex-based grid-tapping game built with React, TypeScript, and Vite. Players tap cells to score while avoiding purple - a reaction game with progressively harder stages, special cells, boss events, and rare color modes.

## Common Commands

```bash
pnpm dev          # Start dev server
pnpm typecheck    # TypeScript validation
pnpm test         # Run unit tests
pnpm test:e2e     # Run E2E tests with Playwright
pnpm build        # Production build
pnpm lint         # ESLint fix
pnpm release      # Create release (updates version, pushes tags)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                              │
│  (Main screen state machine, game lifecycle orchestration)│
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │Engine   │ │Components│ │ Services │
   │(game    │ │(React UI)│ │Firebase  │
   │ logic)  │ │         │ │Analytics │
   └──────────┘ └──────────┘ └──────────┘
        │             │
        ▼             ▼
   ┌─────────────────────────────────────────────────────────┐
   │ config/ — Game balance, difficulty, grid patterns      │
   └─────────────────────────────────────────────────────────┘
```

### Key Layers

- **`engine/`** - Pure game logic, no React dependencies
  - `GameEngine.ts` - Main game loop, player state, boss events
  - `subsystems/TickProcessor.ts` - Per-tick cell spawning, rare color, difficulty scaling
  - `subsystems/CellLifecycle.ts` - Cell click handling, special cell effects

- **`components/`** - React UI
  - `Screens/` - StartScreen, GameOver, HowToPlay, RewardsHub, Shop
  - `HUD/` - ScoreDisplay, EnergyBar, Health, Combo badges
  - `Backgrounds/` - Canvas GPU-accelerated effects (12 themes)

- **`hooks/`** - React ↔ Engine bridge
  - `useGameEngine.ts` - Wraps engine, provides snapshot to UI

- **`utils/`** - Audio, i18n, session, analytics, PWA service worker

- **`config/`** - Game balance constants, patterns, difficulty curves

## Game Modes

- **Classic**: 3×3 grid, fixed difficulty
- **Evolve**: Progressive grid stages (3→4→5→...), boss events, rare colors

## Special Cells

- 🔴 Red = danger (tap others, not red)
- 🟡 Shield =protects 1 hit
- ❄️ Freeze =pause for 1 sec
- ⚡ Multiplier =2x score
- ❤️ Medpack =+1 heart
- 🧊 Ice =stops cell for 2 sec
- 🔒 Hold =tap to release
- 💣 Bomb =removes 1 heart

## Release Process

```bash
pnpm release      # Runs semantic-release workflow
```

This creates a GitHub Release, updates CHANGELOG.md, and auto-deploys to Firebase Hosting.

## Testing Strategy

- Unit tests (`__tests__/`) - Engine logic, score calculations
- E2E tests (`e2e/`) - Playwright browser tests for critical flows
- Tests seed player name via localStorage for isolation