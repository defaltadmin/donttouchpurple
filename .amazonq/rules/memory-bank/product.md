# Don't Touch Purple — Product Overview

## Purpose
Fast-paced reflex grid-tapping browser game. Players tap every colored cell except purple (or the current "danger" color). The goal is to survive as long as possible, score as high as possible, and unlock achievements.

Live at: https://dont-touch-purple.web.app  
Version: 7.5.3

## Game Modes
- **Classic** — Race the clock. Tap every non-purple cell before time runs out. Missing cells bleeds time.
- **Evolve** — Endless survival. Grid evolves, speeds up, and introduces new mechanics (boss events, rare colors, grid patterns).

## Key Features
- 50+ achievements across 8 categories (casual → speedrun-tier)
- Daily objectives with streak tracking and rotating challenge seed
- Global leaderboard via Cloudflare Workers + Firebase
- Bot assist mode — AI can control any player (costs dust currency)
- 19 WebGL/OGL animated backgrounds (Nebula, Aurora, StarWarp, VoidTunnel, DigitalRain, Lightning, etc.)
- Shop and dust economy — earn dust, unlock backgrounds, badges, themes, mouse trails
- Challenge links — share seeded games via URL
- PWA installable — offline-capable, native feel on mobile and desktop
- Accessibility — reduced motion, colorblind-safe palette, haptics toggle, screen shake control
- Sentry + GameAnalytics — real-time error tracking and player analytics
- 2-player local co-op support
- Gamepad support
- i18n — English, Spanish, French, Japanese, Portuguese

## Target Users
- Casual mobile/desktop players looking for quick reflex sessions
- Competitive players chasing leaderboard rankings and achievements
- Developers/agents working on the codebase (see AGENTS.md, llms.txt)

## Value Proposition
A polished, production-grade browser game with deep progression systems (achievements, shop, daily objectives, leaderboard), high visual quality (WebGL backgrounds, GSAP animations), and strong accessibility/performance standards — all in a single-page React PWA.
