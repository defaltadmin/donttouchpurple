# Don't Touch Purple — Master Handoff

> **This is the single entry point for any new AI session.** Read this file first before doing anything else. It contains the full project state, what's been done, and what's next.

## Project Identity

- **Game**: Don't Touch Purple — reflex-based grid-tapping game
- **Stack**: React 19, TypeScript 5, Vite 7, Firebase, OGL/WebGL, GSAP, framer-motion
- **Version**: 7.5.3 (as of 2026-05-23)
- **Live**: https://defaltadmin.github.io/donttouchpurple
- **GitHub**: https://github.com/defaltadmin/donttouchpurple
- **Branch**: main (all work merged)

## Current Build Status

| Check | Status |
|-------|--------|
| Typecheck | 0 errors |
| Tests | 161/161 pass (16 files) |
| Build | Clean |
| Lint | 0 errors, 0 warnings (note: .agent/skills/ has pre-existing errors from autoskills, not DTP code) |
| Audit | 0 vulnerabilities (ws CVE-2026-45736 fixed via pnpm.overrides) |

## Architecture Quick Reference

```
App.tsx (state machine)
  ├── engine/ (pure logic, no React)
  │   ├── GameEngine.ts — main loop, player state, boss events
  │   ├── subsystems/TickProcessor.ts — cell spawning, difficulty scaling
  │   ├── subsystems/CellLifecycle.ts — click handling, special cell effects
  │   ├── subsystems/BossEngine.ts — boss event logic
  │   ├── subsystems/ScoreSync.ts — score queue and persistence
  │   └── botController.ts — bot assist AI
  ├── components/ (React UI)
  │   ├── Screens/ — StartScreen, GameOver, PauseOverlay, RewardsHub, Shop, HowToPlay
  │   ├── HUD/ — ScoreDisplay, EnergyBar, Hearts, PlayerPanel, GameArea, BossOverlay
  │   ├── Backgrounds/ — 15 OGL/WebGL themes (Galaxy, Hyperspeed, Silk, Lightning, etc.)
  │   ├── Cell/ — cell rendering, click handling, inline spark canvas
  │   ├── Settings/ — SettingsDrawer, DevOverlay, QuickSettings, ElasticSlider
  │   ├── Shop/ — ShopPanel, SpotlightCard
  │   └── Layout/ — BackgroundController, ParticleLayer
  ├── hooks/ (14 custom hooks — useGameEngine bridge, useDustEconomy, etc.)
  ├── services/ (firebase.ts, firestoreService.ts, scoreSync.ts, web-vitals.ts)
  ├── workers/ (scoreWorker.ts — Cloudflare Worker for score proxy)
  ├── config/ (gameBalance.ts, difficulty.ts, gridPatterns.ts, powerupWeights.ts, dailyObjective.ts)
  ├── utils/ (achievements.ts, boss-engine.ts, dda.ts, haptics.ts, rewards.ts, state-guard.ts, etc.)
  └── styles/ (game.css, dtp-components.css, enhancements.css, fx-enhancements.css, performance.css)
```

## Domain Agents (docs/agents/)

| Agent | Scope | When to Use |
|-------|-------|-------------|
| `game-engine` | GameEngine, TickProcessor, CellLifecycle, boss events, RNG | Pure logic changes |
| `ui-components` | React UI, screens, HUD, backgrounds, cells | Visual/component work |
| `firebase-services` | Firestore, Auth, Analytics, App Check, Hosting | Backend integration |
| `config-balance` | Game balance, difficulty, grid patterns, powerup weights | Tuning and economy |
| `security-audit` | Firebase rules, CSP, XSS, state tampering | Security hardening |
| `performance` | CWV, bundle size, GPU, memory, render perf | Optimization |
| `hooks-state` | useGameEngine bridge, custom hooks, contexts, state machines | Hooks layer |
| `infrastructure-deploy` | Vite config, Firebase Hosting, Cloudflare Workers, CI/CD | Build pipeline |

## Key Files to Read First

| File | Purpose |
|------|---------|
| `DESIGN.md` | Design tokens, dark-cyberpunk palette (MD3 tokens) |
| `AGENTS.md` | Universal AI tool instructions |
| `llms.txt` | AI agent project overview |
| `config/gameBalance.ts` | All balance constants |
| `config/difficulty.ts` | Difficulty curve definitions |

## CSS Variable System

```css
:root {
  --bg: #151028;           /* Deepest background */
  --bg2: rgba(255,255,255,0.06);  /* Subtle glass */
  --bg3: #1e1838;          /* Elevated surface (tightened from #36314b) */
  --glass: #231d3a;        /* Card surface */
  --glass-border: rgba(200,180,255,0.15);  /* Translucent purple-tinted hairline */
  --text: #e7deff;         /* Primary text (tinted white) */
  --muted: #9f8a9d;        /* Secondary text */
  --purple: #c026d3;       /* Primary accent */
  --accent: #fda9ff;       /* Highlight accent */
  --gold: #f9bd22;         /* Secondary action / warning */
  --shadow-elevated: 0 8px 24px rgba(0,0,0,0.5);   /* Overlays, modals */
  --shadow-card: 0 4px 12px rgba(0,0,0,0.16);       /* Pressed/lifted cards */
  --r: 14px;               /* Default border radius */
  --panel-blur: 18px;      /* Backdrop filter blur */
  --font-game: 'Fredoka One', 'Nunito', system-ui, sans-serif;
  --font-ui: 'Nunito', system-ui, sans-serif;
  --motion-scale: 1;       /* Respects prefers-reduced-motion */
}
```

**Dark UI patterns applied (2026-05-23):**
- Surface hierarchy tightened (PS/Spotify pattern): tight color steps between bg layers
- Translucent borders instead of opaque (PlayStation hairline pattern)
- Heavy shadows for elevated elements (Spotify 0.5 opacity pattern)
- Pill buttons (9999px) + uppercase + letter-spacing 1.4px (Spotify CTA pattern)
- btn-ghost: transparent bg + hairline border (clean secondary style)

## Installed Tools & Skills

| Tool | Location | Purpose |
|------|----------|---------|
| GSAP | npm + 8 skills in ~/.openclaude/skills/gsap-* | Animation (5 migrations done) |
| React Bits | 8 components integrated | Animated UI components |
| dotlottie-web | npm (27KB brotli chunk) | Lottie animations for achievements/boss/loading |
| prompt-master | ~/.openclaude/skills/prompt-master/ | 30+ AI tool prompts |
| marketingskills | ~/.openclaude/skills/marketingskills/ | 40+ marketing skills (ASO, SEO, launch) |
| CodeGraph | .codegraph/ (185 files indexed) | Sub-ms symbol/edge queries |
| autoskills | 27 stack-matched skills | Auto-loaded skill recommendations |

## Commands

```bash
pnpm dev          # Dev server
pnpm typecheck    # TypeScript validation
pnpm test         # Unit tests (vitest, 162 tests)
pnpm test:e2e     # E2E tests (Playwright)
pnpm build        # Production build
pnpm lint         # ESLint fix
pnpm audit        # Dependency vulnerability check
```

## Session History (Chronological)

### 2026-05-17/18/19 — Full Overhaul
- 21-phase code review with 7 AI reviewers (Amazon Q dominated)
- 100+ critical bugs fixed (Firestore ts==request.time, CSP, security)
- i18n (5 locales, 100+ keys), achievement system (3→22), dead CSS cleaned
- 130 tests passing, merged to main

### 2026-05-20 — Design System + Phase 20
- MD3 token system wired to CSS vars from DESIGN.md
- Death vignette, haptics toggle, touch targets (48dp minimum)
- 127 tests, 0 lint warnings

### 2026-05-21 — Stitch + 117 Stability Fixes
- 8 Stitch components (NeonText, FilterTabs, GlassCard, etc.) + 75 SVGs
- AAA Phases 1-3 (Android, Core Feel, Retention)
- 117 stability/QOL/infrastructure fixes across 17 batches
- 5 GSAP migrations (SlidingCell, GameOver, cell stagger, MouseFollower, ScoreDisplay)
- 162 tests, all checks passing

### 2026-05-21/22 — React Bits Integration
- 8 React Bits components: Galaxy, Hyperspeed, Silk, Lightning, Magnet, ElasticSlider, SpotlightCard, BounceCards
- 3 backgrounds adapted from three.js to OGL/raw WebGL
- 4 post-verification fixes (dead code, WebGL cleanup, overflow decay, duplicate name)
- CI fix: Node.js 20 removed, rng override order fixed

### 2026-05-22 — Security Audit + AI Review
- Full 3-agent security audit, 8 commits
- Firebase App Check code added (ReCaptchaV3Provider)
- All AI review items resolved (7 AIs, no accepted limitations)
- R19 hooks extracted (useScoreSubmission, useDailyProgress)
- safeSet migration for localStorage writes

### 2026-05-23 — Repo Knowledge Implementation
- 18 repos analyzed across 4 batches
- dotlottie-web integration (7 JSON animations)
- DESIGN.md enriched (9-section structure from awesome-design-md)
- GameMaster multi-provider failover (Gemini → Groq chain)
- llms.txt, AGENTS.md, wiki pages, LAUNCH.md content kit
- 6 domain-specific agents in docs/agents/
- SSH + Tailscale remote access hardened

### 2026-05-23 (session 2) — Polish & Hardening
- ws vulnerability fixed (CVE-2026-45736, pnpm.overrides)
- 3 new agents: config-balance, security-audit, performance
- Supply-chain verification script (SHA-256 asset integrity)
- Dark UI polish: tight surfaces, translucent borders, heavy shadows, pill buttons
- PlayStation/Spotify design patterns applied to CSS

### 2026-05-23 (session 3) — Deep Audit (24 bugs fixed, 8 agents)
- **Hooks audit** (9 fixes): useOffsetCursor RAF restart, useScoreSubmission functional updates + type interface, useEnergyStore safeSet x3, useDustEconomy try-catch, useGameEngine death-flash timeout tracking + useEffect deps, useDailyProgress dead code removal + todayStr dedup
- **Utils audit** (8 fixes): analytics.ts safeSet x2, error-tracker.ts try-catch + safeSet, achievements.ts try-catch, featureGates.ts safeSet, game-config.ts safeSet, settings.ts volume clamping + quota safety, challenge-link.ts import.meta.env.PROD, idb.ts remove dead dequeueAll
- **Performance audit** (3 fixes): PurpleRain double RAF, MouseTrail double RAF, PulseField per-frame canvas resize
- **Config audit** (3 fixes): DifficultyScaler live overrides (was frozen at module load), removed dead BALANCE.survival.startTick/maxScoreCap, namespaced bombPulse keyframes
- **Score-sync** (1 fix): delete failed items before re-enqueueing to prevent unbounded queue growth
- hooks-state agent + infrastructure-deploy agent created (8 total agents)

## What's Pending / Next Steps

### High Priority
1. **AI Review Round 2** — Prompts ready in `.review-packet/`. Send to Codex + Sonnet (zip) and DeepSeek (markdown). Collect, triage, fix, verify.
2. **Gameplay trailer** (15-30s) — needs screen recording
3. **Screenshots** (5-6 key moments) — needs screen capture
4. **App Check enforcement** — code complete, needs deploy + monitoring mode verification + enforcement toggle in Firebase Console

### Medium Priority
5. **Game portals** — submit to itch.io, CrazyGames, Poki, Newgrounds (content ready in `.github/LAUNCH.md`)
6. **Product Hunt** — listing content ready in `.github/LAUNCH.md`
7. **FreeLLMAPI setup** — self-hostable multi-provider review endpoint; needs user to configure API keys

### Lower Priority
8. **CocoIndex Code** — semantic code search alongside CodeGraph (pip install cocoindex)
9. **prompts.chat MCP** — prompt library server

### Retention/Polish Backlog
- Feature gate progress bar on menu
- Daily systems consolidation into single "Daily Hub"
- Prestige/season system
- GameMaster suggested prompts
- WhatsNew i18n
- Leaderboard Classic/Evolve mode filter
- Shop swatches (canvas previews)
- Shop tabs overflow on small screens
- Leaderboard 60-second cache

## Critical Rules (Read Before Modifying)

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
11. **VITE_* env vars** for DSNs and API keys (not hardcoded)
12. **getSentry()** must be called after Sentry.init()
13. **mix-blend-mode: screen** (not mix-blend-screen) — PostCSS rejects shorthand
14. **GameEngine.start() resets rng** — test overrides must be set AFTER start()
15. **UTC for weekly tasks** — getUTCDay/getUTCDate, not local time
16. **Don't put PC to sleep** unless user explicitly says to
17. **Move unused files to junk/**, don't delete
18. **Implement ALL AI review suggestions** (features + improvements), not just bug fixes
19. **Never accept limitations** — try everything, don't skip

## AI Review Quality Ranking (Historical)

| AI | Accuracy | Notes |
|----|----------|-------|
| Amazon Q | Highest | 40+ bugs across 14 rounds, dominant |
| Codex | 100% (Round 1) | 18 issues, 9 fixed, 0 wrong |
| Claude Sonnet | 60% (Round 1) | Found CSP issue; 3/8 claims wrong |
| DeepSeek | Best security | Found critical ts==request.time bug when given pasted code |
| Kimi/Qwen/Grok | Low | Dropped after Round 1 |

## Remote Access

- **Tailscale**: PC at 100.115.4.2, mesh VPN
- **SSH**: Key-only auth (Ed25519), Tailscale-only listener, no passwords
- **Termius**: iPhone → SSH from anywhere on mobile data

## Session Management

- **Context limits**: "API error: terminated" = session too big. Start new chat.
- **Max agents per batch**: 3-4 (write results to disk immediately, don't hoard in context)
- **Auto-remind**: Suggest new chat when session gets long
- **This file**: Always read HANDOFF.md first in any new session for this directory
