# Don't Touch Purple

![CI](https://github.com/defaltadmin/donttouchpurple/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-7.5.3-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg)
![Tests](https://img.shields.io/badge/tests-162%20passed-brightgreen.svg)

> **A reflex game where you must never touch purple.**

**[PLAY NOW](https://defaltadmin.github.io/donttouchpurple)** — No download. No signup. Just play.

---

## What is this?

A fast-paced browser game that tests your reflexes. Tap colored cells to score points — but if you touch a purple cell, it's over. Simple to learn. Brutal to master.

The game gets harder the longer you survive. Grids expand. Boss events shake things up. Rare color modes force you to relearn what's safe. And just when you think you've got it figured out, the **Blackout** hits and you can't see anything at all.

---

## Game Modes

### Classic
Pure reflex training. 3x3 grid. How long can you survive?

### Evolve
Progressive difficulty. Grids expand from 3x3 to 7x7+. Boss events, rare colors, and special cells keep you guessing.

**Boss Events:**
- **Storm** — Cells shuffle at lightning speed
- **Inversion** — Safe and danger colors swap
- **Blackout** — The grid goes dark. Tap by memory.

**Special Cells:**
- Shield — Blocks one mistake
- Freeze — Pauses the game for 1 second
- Multiplier — Double points for a limited time
- Medpack — Restores a heart
- Ice — Freezes a cell in place
- Bomb — Removes a heart. Don't tap it.

---

## Features

- **37 achievements** to unlock
- **Dust economy** — Earn currency to unlock backgrounds and power-ups
- **Bot Assist** — AI companion that taps safe cells for you (costs dust)
- **12 animated backgrounds** — GPU-accelerated canvas effects (Galaxy, Silk, Hyperspeed, Aurora, and more)
- **Hyper-Juice UI** — Mouse-reactive spotlights, magnetic buttons, liquid trails
- **Lottie animations** — Animated achievement toasts and boss intros
- **5 languages** — English, Spanish, French, Japanese, Portuguese
- **PWA** — Install on any device, works offline
- **Gamepad support** — Play with a controller
- **Leaderboard** — Global high scores via Firebase

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript 5, Vite 6 |
| Animation | GSAP, Framer Motion, CSS keyframes, dotlottie-web, OGL (WebGL) |
| Backend | Firebase (Firestore, Analytics, Auth, App Check) |
| Testing | Vitest (162 unit tests), Playwright (E2E) |
| CI/CD | GitHub Actions → GitHub Pages auto-deploy |
| Security | CSP headers, score validation worker, rate limiting |

---

## Quick Start

```bash
pnpm install
pnpm dev          # Start dev server
pnpm typecheck    # TypeScript check
pnpm test         # Run unit tests
pnpm build        # Production build
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style, and PR process.

---

## License

[MIT](LICENSE) — Free to play, free to fork, free to learn from.

---

**Built with React, TypeScript, and a stubborn refusal to touch purple.**
