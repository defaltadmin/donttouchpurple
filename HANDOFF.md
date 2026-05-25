# Don't Touch Purple — Master Handoff

> **This is the single entry point for any new AI session.** Read this file first before doing anything else. It contains the full project state, what's been done, and what's next.

## Project Identity

- **Game**: Don't Touch Purple — reflex-based grid-tapping game
- **Stack**: React 18, TypeScript 5, Vite 7, Firebase, OGL/WebGL, GSAP, framer-motion
- **Version**: 7.5.3
- **Live**: https://game.mscarabia.com (Firebase Hosting, auto-deployed)
- **GitHub**: https://github.com/defaltadmin/donttouchpurple
- **Branch**: main (all work merged)

## Current Build Status

| Check | Status |
|-------|--------|
| Typecheck | 0 errors |
| Tests | 164/164 pass (16 files) |
| Build | Clean (0 circular warnings) |
| Lint | 0 errors, 0 warnings |
| Vulnerabilities | 0 (root + website) |
| Lighthouse | Perf 80, A11y 87, BP 96, SEO 92 |

## Architecture Quick Reference

```
App.tsx (state machine)
  ├── engine/ (pure logic, no React)
  │   ├── GameEngine.ts — main loop, player state, boss events
  │   ├── subsystems/TickProcessor.ts — cell spawning, difficulty scaling
  │   ├── subsystems/CellLifecycle.ts — click handling, special cell effects
  │   ├── subsystems/BotController.ts — bot assist AI (single path)
  │   └── DifficultyScaler.ts — difficulty curve
  ├── components/ (React UI)
  │   ├── Screens/ — StartScreen, GameOver, PauseOverlay, RewardsHub, Shop
  │   ├── HUD/ — ScoreDisplay, EnergyBar, Hearts, PlayerPanel, GameArea
  │   ├── Backgrounds/ — 15 OGL/WebGL themes
  │   ├── Cell/ — cell rendering, click handling, inline spark canvas
  │   ├── Settings/ — SettingsDrawer, DevOverlay, QuickSettings
  │   └── UI/ — LottiePlayer, Icon, MagneticButton
  ├── hooks/ (14 custom hooks — useGameEngine bridge, useDustEconomy, etc.)
  ├── services/ (firebase.ts, firestoreService.ts, errorLogger.ts)
  ├── workers/ (score-validator.ts — Cloudflare Worker for score validation)
  ├── config/ (gameBalance.ts, difficulty.ts, keybindings.ts)
  ├── utils/ (achievements.ts, challenge-link.ts, score-sync.ts, state-guard.ts)
  ├── contexts/ (GameContext.tsx, DustContext.tsx)
  └── styles/ (game.css, enhancements.css, fx-enhancements.css, performance.css)
```

## Key Files to Read First

| File | Purpose |
|------|---------|
| `AGENTS.md` | Universal AI tool instructions |
| `DESIGN.md` | Design tokens, dark-cyberpunk palette (MD3 tokens) |
| `llms.txt` | AI agent project overview |
| `config/gameBalance.ts` | All balance constants |
| `DTP_DEEP_ANALYSIS_REPORT.md` | Combined 4-AI analysis (44 findings) |
| `DTP_DEEP_ANALYSIS_PROMPT.md` | Reusable analysis prompt for any AI |

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

## Commands

```bash
pnpm dev          # Dev server
pnpm typecheck    # TypeScript validation
pnpm test         # Unit tests (vitest, 164 tests)
pnpm test:e2e     # E2E tests (Playwright)
pnpm build        # Production build
pnpm lint         # ESLint fix
firebase deploy --only hosting  # Deploy to game.mscarabia.com
```

## Recent Session (2026-05-25/26)

### Game Over Screen Rework (6 visual bugs fixed)
- Removed stray Share/Challenge buttons from GameArea
- Added .go-actions/.go-small-actions CSS for button layout
- Made overlay fully opaque (dead panel no longer bleeds through)
- Fixed progress label ("Score" → "Daily")
- Added .btn-large CSS, fixed .dtp-icon-btn

### Dependabot Vulnerabilities (19 resolved)
- Root: protobufjs override (critical+high+medium)
- Website: undici, esbuild, postcss, ws, cookie overrides
- 0 vulnerabilities on both projects

### Lint Cleanup (10 issues fixed)
- Removed dead handleShareScore/handleCopyChallenge + ShareModal
- Fixed idb.ts no-unused-expressions, removed unused imports
- Fixed implicit any in test, removed unnecessary dep

### Amazon Q Deep Analysis (13 findings triaged)
- 6 already fixed, 4 fixed this session, 3 deferred
- BUG-006: inversion+rareMode danger color (fixed)
- PERF-001: devHeatmap gate behind devMode (fixed)
- SEC-001: cell type whitelist on session restore (fixed)

### Security Hardening (8 items)
- SEC-007: Block practice/godMode scores from leaderboard
- SEC-008: Validate Firebase token `aud` claim in Worker
- SEC-002: Add character set regex to validBadge() Firestore rule
- SEC-005: Align Firestore tick formula with Worker (15→12)
- SEC-004: Use crypto.getRandomValues() in getDeviceId fallback

### Code Quality (5 items)
- ARCH-010: Add .agent/ to .gitignore
- ARCH-013/015: Delete unused useScoreSubmission.ts (167 lines)
- Removed phantom deps (intlayer, @aejkatappaja/phantom-ui)
- Fixed circular chunk warnings (merged into game-core)
- Removed hardcoded account_id from wrangler.toml

### Lighthouse Fixes
- Removed user-scalable=no from viewport meta
- Added robots.txt
- Added try-catch to LottiePlayer (corrupted S3 lottie files)

### UI Fixes
- Added root--${screen} class for CSS screen targeting
- Defensive CSS: .root--playing .menu-card { display: none !important }
- Enhanced menu-card glass effect + btn-play glow
- Added title + tagline to StartScreen

### MiniMax Review (4 fixes)
- _isDisposed guards on pause(), resume(), safeReset()
- BotController.stop() now stops P2

### Build Infrastructure
- GitHub Codespaces .devcontainer configured (60 hrs/month free)
- website/public/play/ gitignored (14MB build artifacts removed from git)
- React version corrected: badge/docs said 19, actual dep is 18

## What's Pending / Next Steps

### Immediate Priority
1. **Deploy verification** — verify game.mscarabia.com has all latest changes
2. **Lighthouse re-run** — verify scores improved after viewport/robots fixes

### High Priority
3. **Gameplay trailer** (15-30s) — needs screen recording
4. **Screenshots** (5-6 key moments) — needs screen capture
5. **App Check enforcement** — code complete, needs Firebase Console toggle

### Medium Priority
6. **Game portals** — submit to itch.io, CrazyGames, Poki, Newgrounds
7. **Product Hunt** — listing content ready in .github/LAUNCH.md
8. **Multiplayer prototype** — Cloudflare Durable Objects + WebSockets

### From Deep Analysis Report (DTP_DEEP_ANALYSIS_REPORT.md)
- STAB-001: Track gameover timeout ref, clear on unmount
- SEC-006: dust_wallet monotonic check in Firestore rule
- SEC-003: Move challenge HMAC to Worker
- SEC-013: Add HMAC to session snapshot
- ARCH-001: App.tsx hook extraction (4-6 hrs)
- QOL-001: Bomb countdown ring on cells
- QOL-002: Boss event timer in HUD

## Critical Rules

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
12. **UTC for weekly tasks** — getUTCDay/getUTCDate, not local time
13. **Don't put PC to sleep** unless user explicitly says to
14. **Move unused files to junk/**, don't delete
15. **Implement ALL AI review suggestions**, not just bug fixes

## Remote Access

- **GitHub Codespaces**: 60 hrs/month free, .devcontainer configured
- **Tailscale**: PC at 100.115.4.2, mesh VPN
- **SSH**: Key-only auth (Ed25519), Tailscale-only listener
- **Termius**: iPhone → SSH from anywhere on mobile data

## Session Management

- **Context limits**: "API error: terminated" = session too big. Start new chat.
- **Max agents per batch**: 3-4 (write results to disk immediately)
- **This file**: Always read HANDOFF.md first in any new session
