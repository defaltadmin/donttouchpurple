# Don't Touch Purple — Master Handoff

> **PROJECT**: Don't Touch Purple (game) — NOT the MSC Arabia website.
> **If you're working on mscarabia.com, read `MSCArabia.com/HANDOFF.md` instead.**
> This file is ONLY for the DTP game at game.mscarabia.com.

## Project Identity

- **Game**: Don't Touch Purple — reflex-based grid-tapping game
- **Stack**: React 18, TypeScript 5, Vite 7, Firebase, OGL/WebGL, GSAP, framer-motion
- **Version**: 7.6.1
- **Live**: https://game.mscarabia.com (Firebase Hosting, auto-deployed)
- **GitHub**: https://github.com/defaltadmin/donttouchpurple
- **Branch**: main (all work merged)

## Current Build Status

| Check | Status |
|-------|--------|
| Typecheck | 0 errors |
| Tests | 230/230 pass (21 files) |
| Build | Clean (0 circular warnings) |
| Lint | Pre-existing worker globals only (21 issues, not from this session) |
| Vulnerabilities | 0 (root) |
| Lighthouse | A100/B96/S100 (desktop + mobile) |

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
  ├── hooks/ (16 custom hooks — useGameEngine bridge, useThemeSettings, useDevToolsState, etc.)
  ├── services/ (firebase.ts, firestoreService.ts, sentry.ts, web-vitals.ts, gameanalytics.ts)
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
pnpm test         # Unit tests (vitest, 232 tests)
pnpm test:e2e     # E2E tests (Playwright)
pnpm build        # Production build
pnpm lint         # ESLint fix
firebase deploy --only hosting  # Deploy to game.mscarabia.com
```

## Post-Session Audit (REQUIRED)

After any session with 5+ file changes:
1. `pnpm typecheck && pnpm test && pnpm build`
2. For full audit: run `/multi-ai-audit` (opencode + gemini per module, batched)
3. Save results to `.review-packet/`, triage findings, fix valid ones

**NEVER run full-codebase audit in one call** — causes heap OOM. Always batch per-module.

## Recent Session (2026-06-01)

### 4-AI Review Fix Session — 26 Fixes, 5 Phases

**Commit** `e040522`. 21 files changed. 230/230 tests. Deployed.

#### Sources
- Sonnet v7.6.1 game review + Sonnet Corp v1.0
- DeepSeek v7.6.1 game review + DeepSeek Corp v1.0

#### Phase 1: Critical + Quick Wins (DTP Game)
- **CRIT-001**: Removed `?documentId=auto` from Worker — leaderboard was broken (only 1 entry ever stored)
- **DTP-002**: `_isDisposed` guard on `processTick()`
- **DTP-005**: `.catch()` on challengeLink verification
- **DTP-006**: `BuildDeploySection` gated behind `import.meta.env.DEV`
- **MED-005**: Server-side date generation (prevents future-date spam)
- **LOW-001**: Conditional badge field
- **MED-003**: Removed duplicate initials sanitization in score-sync
- **LOW-003**: 30s flush timeout prevents permanent `_flushing` lock

#### Phase 2: ElasticWarp Performance
- Visibility pause (rAF stops when tab hidden)
- Connection-line O(n²) gating (only runs when cursor near)
- Resize clamp for particles

#### Phase 3: React Performance
- Tick snapshot debounce via rAF (coalesces 60fps→1 render/frame)

#### Phase 4: Security
- 429 handler on tokeninfo verification
- **App Check enforced on Firestore** — `hasValidAppCheck()` uncommented in `firestore.rules`

#### Phase 5: Corp Site (mscarabia.com)
- Deleted dead `HeroStage.tsx`, GSAP timeline cleanup, visibility guard on bot loop
- Security headers (`_headers`), `robots.txt`, `sitemap.xml`, canonical link
- `aria-hidden` on decorative game grid
- NebulaCanvas: ResizeObserver + WebGL context cleanup
- CrescentRing: removed fighting width/height props
- Removed unused `@cloudflare/next-on-pages` dep

#### Deployed
- Firebase Hosting + Firestore rules: `firebase deploy --only hosting,firestore:rules`
- Cloudflare Worker: `npx wrangler deploy` from `workers/`
- Corp site: `npx wrangler pages deploy out --project-name=mscarabia`

#### Master Roadmap
`REVIEW-ROADMAP-v7.6.1.md` — every finding from all 4 reviews, triaged with status

#### SkillNet Installed
- `pip install skillnet-ai` (v0.0.18)
- Search works on Windows; `create`/`evaluate` need `API_KEY` env var (uses gpt-4o by default)
- `download` has Windows encoding bug (charmap codec)
- Firebase security rules skill downloaded

### Skills Installed + Taste-Skill Audits + Anti-Slop Fixes

#### Skills Installed (4 repos, 30+ skills)

| Repo | Skills | Location |
|------|--------|----------|
| taste-skill (Leonxlnx) | 13 design/anti-slop | `~/.openclaude/skills/taste-skill/` + `taste-skill-v1/` + `gpt-tasteskill/` + `image-to-code-skill/` + `redesign-skill/` + `soft-skill/` + `output-skill/` + `minimalist-skill/` + `brutalist-skill/` + `stitch-skill/` + `imagegen-frontend-web/` + `imagegen-frontend-mobile/` + `brandkit/` |
| PentesterFlow | 10 pentesting | `~/.openclaude/skills/pf-recon/` + `pf-webvuln/` + `pf-ssrf/` + `pf-ssti/` + `pf-jwt/` + `pf-graphql/` + `pf-race/` + `pf-takeover/` + `pf-supabase/` + `pf-deserialize/` |
| open-code-review | 1 multi-agent review (29 personas) | `~/.openclaude/skills/open-code-review/` |
| webwright (Microsoft) | 1 browser automation | `~/.openclaude/skills/webwright/` |

#### SkillOpt Installed
- **Repo**: `C:\Users\user\My Drive\Documents\MSC\Development\SkillOpt` (cloned, `pip install -e .`)
- **Purpose**: Iteratively optimize agent skill prompts via rollout scoring
- **Backend**: OpenAI-compatible via `opengateway.gitlawb.com` with `mimo-v2.5-pro`
- **Config**: `.env` configured with OpenGateway key
- **Potential**: Optimize DTP domain agent prompts (security-audit, game-engine, ui-components) with task datasets

#### Taste-Skill Audits
- `.review-packet/taste-audit-game.md` — DTP scored 7.5/10 against anti-slop framework
- `.review-packet/taste-audit-corp.md` — MSCArabia had 5 HIGH + 6 Medium findings

#### DTP Game Fixes Applied
- Em-dashes replaced with hyphens in all user-facing text (GameOver, EnergyPopup, HowToPlay, EnergyBar, App, WhatsNew, BuildDeploySection, website/layout)
- Hardcoded hex reviewed: Cell bomb urgency colors are intentional; Canvas backgrounds can't use CSS vars — no action needed

#### MSCArabia Fixes Applied (`MSCArabia.com-work/index.html`)
- Scroll cue removed (hero-scroll div)
- sec-pill eyebrows 5 → 3 (removed Manpower Solutions + Free Quote)
- Filler verbs replaced ("accelerate your digital transformation" → concrete copy)
- Service cards: first card now spans 2 cols (`.svc-card--featured`)
- `100vh` → `100dvh` for mobile viewport

## Previous Session (2026-05-31)

### Landing/Game Merge + Background Separation + Leaderboard Investigation

**6 commits** (`cf3afcc`→`9e8af46`). 230 tests, all green. Build clean.

#### Architecture Change: Single-Page Game
- **Removed LoadingScreen** — game starts directly on StartScreen, playerName defaults to "Player"
- **Removed website/ dependency** — game is now the single deployable (Next.js landing archived)
- **Side-panel layout on desktop** (1100px+): LeftPanel (bosses + features) + menu card + RightPanel (tech + CTA)
- **"Learn More" overlay on mobile**: fullscreen scrollable overlay with all landing content
- **Game now serves at root** — no more /play path needed

#### New Components (`components/Landing/`)
- `LeftPanel.tsx` — BossShowcase + FeatureGrid wrapper
- `RightPanel.tsx` — TechStats + LandingCTA + footer
- `LearnMoreOverlay.tsx` — fullscreen overlay for mobile
- `BossShowcase.tsx` — 3 boss event cards (Storm, Inversion, Blackout)
- `FeatureGrid.tsx` — 6 feature cards
- `TechStats.tsx` — open source + stats + GitHub link
- `LandingCTA.tsx` — "Ready? No signup. No ads. Just tap."

#### CSS: `styles/landing.css`
- Side-panel layout (3-column at 1100px+, single column below)
- Side panels sticky-positioned, scaled down for narrow columns
- Learn More overlay with slide-up animation
- Glass cards, boss cards, feature cards, tech badges, stats

#### Background Layer Separation (commit `668d641`)
- Galaxy WebGL moved from inside .root to full viewport (position:fixed, z-index:-1)
- ParticleLayer removed from StartScreen (falling dots eliminated)
- Footer credit opacity 0.45 → 0.7

#### Leaderboard Investigation
- **Root cause**: `game.mscarabia.com` served stale build through Cloudflare (old bundle hash, no Firebase env vars baked in)
- API key HTTP referrer restrictions: only `game.mscarabia.com` allowed (blocks `dont-touch-purple.web.app`)
- Anonymous auth works from `game.mscarabia.com`, Firestore REST reads work
- **Fix**: Update Cloudflare to serve from Firebase Hosting, or deploy fresh dist to current host
- Firebase config now baked into single Vite build — leaderboard will work once fresh bundle is served

#### Hero Overhaul (commit `a1e98a9`)
- GameDemo.tsx deleted, all demo CSS removed (~160 lines)
- Hero badge, score/streak display, boss overlay removed
- Bot taps cells every 600ms with tap animation, occasionally taps purple (shake)
- Crescent ring overflow fix (sharp top corners clipped)

### Previous Session (2026-05-30)

#### 3D Visuals, SEO, A11y, Performance, Skills, Dead Code Cleanup

**5 commits pushed** (`c909f6a`→`cf3afcc`). 230 tests, all green. Build clean.

#### 3D Visuals
- **Game landing page**: WebGL nebula canvas (OGL) hero background (`website/src/components/NebulaCanvas.tsx`) — mouse-reactive nebula, starfield, purple/pink/cyan palette
- **Game landing page**: Interactive gameplay demo (`website/src/components/GameDemo.tsx`) — "Try It Now" 3x3 timed grid with score/lives/CTA
- **Game app**: Galaxy WebGL background renders on start screen by default when no bg equipped
- **Corporate site** (gitignored, deployed separately): 3D perspective on hero card, 3 floating depth orbs

#### Performance
- GameAnalytics lazy-loaded (~91KB off initial bundle) — 3 files changed (App.tsx, hooks/useDustEconomy.ts, utils/analytics.ts)
- INP replaces deprecated FID in web-vitals.ts

#### Accessibility
- JSON-LD structured data (WebApplication schema) in index.html
- Skip-to-content link, ARIA labels on nav buttons/player pill/settings grid
- role="radiogroup" + aria-checked on PillRow
- `*:focus-visible` works unconditionally (removed .keyboard-nav-active gate)
- Footer contrast fix (#524151 → #958a9e), `<main>` landmark on landing

#### Dead Code Cleanup (Karpathy audit)
- Deleted `services/clarity.ts` (zero imports)
- Deleted `utils/cleanup-pattern.ts` (redirected 11 backgrounds to local version)
- Lazy-loaded DevOverlay + DevUnlockModal
- AchievementToast interface moved to module scope
- ChunkErrorBoundary wraps 3 lazy panels (retry on failure)

#### Skills Installed
- **gstack** (`~/.claude/skills/gstack/`): 40+ slash-command skills — /office-hours, /plan-ceo-review, /review, /ship, /qa, /browse, /cso, /autoplan, /spec, /investigate
- **karpathy-guidelines** (`~/.openclaude/skills/karpathy-guidelines/`): 4 behavioral principles

#### Tests
- 18 new StartScreen tests (menu-card, pills, glow, energy states) — 230 total, 21 files

#### Karpathy Big Refactors (completed 2026-05-30)

1. **Achievement registration** — 33 `register()` calls replaced with `config/achievementDefs.ts` array + 3-line loop
2. **_processTap() decomposition** — 150-line method split into 6 focused methods: `_processTapIce`, `_processTapBomb`, `_processTapPowerup`, `_processTapDanger`, `_processTapSafe`, `_checkTapAchievements`
3. **Monitoring stack consolidation** — `services/monitoring.ts` merges `errorLogger` + `error-tracker` + `metrics` + `devLog` into single module; old files become thin re-exports
4. **App.tsx split** — Skipped: too high-risk due to deep state coupling (handleEngineGameOver touches 15+ state variables and refs)

#### What's Left (for next session)
- ~~App.tsx split~~ — deferred, see above
- Deploy verification (push to remote)
- Lighthouse re-run
- Gameplay trailer + screenshots
- App Check enforcement (Firebase Console toggle)
- Game portals (itch.io, CrazyGames, Poki)
- Multiplayer prototype (Durable Objects)

#### Known False Positives (don't fix these)
- CSS classes `dtp-btn.previewing`, `dtp-combo-popup`, `dtp-boss-hp` — audit said unused but they ARE used in TSX
- `metrics.ts` — web-vitals.ts imports and monkey-patches it; needs careful handling, not blind deletion

## Previous Session (2026-05-30)

### Glassmorphic Landing Pages + MCP Servers + Master Reference DB

**Commit** `1c859f8` on main. 907 lines added across 7 files. Build passes.

#### Glassmorphic Landing Pages
- **game.mscarabia.com** (`website/src/app/page.tsx`): Redesigned with pure black background, crescent ring + glass orb hero, mouse parallax on orb, glass-card treatment on boss/feature cards with cursor-following glow
- **mscarabia.com** (`website/src/app/corporate/`): New corporate landing page with glassmorphic hero, nav, values, stats, products, CTA. Routes to `/corporate` as static export.

#### New Components (website/src/components/)
- `GlassOrb.tsx` — backdrop-filter blur(25px) saturate(200%), radial gradient highlight, GSAP float animation, accepts children
- `CrescentRing.tsx` — extreme elliptical border-radius, stacked inset box-shadows for deep magenta glow, neon purple backlight layer
- `HeroStage.tsx` — composes crescent+orb+badge+title+subtitle with GSAP entrance timeline

#### CSS Additions (website/src/app/globals.css)
- `--neon-glow`, `--neon-bright`, `--neon-edge` CSS custom properties
- `.glass-orb`, `.crescent-ring`, `.crescent-backlight`, `.hero-stage` classes
- `.glass-card` with cursor-following radial gradient hover glow
- Corporate nav/section/stat/CTA/footer styles
- Responsive breakpoints for crescent+orb at 640px and 1024px
- Body background changed to pure black (#000000)

#### MCP Servers Installed (local config)
- `playwright` — @anthropic-ai/playwright-mcp (browser automation, E2E debugging)
- `chrome-devtools` — @anthropic-ai/chrome-devtools-mcp (live perf profiling)
- `firecrawl` — firecrawl-mcp (web crawling, SEO audits)

#### Master Reference Database
- Created `memory/reference-master-external-resources.md` consolidating ALL external references from every session
- Updated `memory/project-glassmorphic-landing-2026-05-30.md` to COMPLETE status
- Tracked: Iconsax, Flectofy, Flair.ai, Shader Gradient, Humane by Design, Design Spells, Draftly, 21st.dev, React Bits, Google Stitch, Runway, Pika, Kling, Luma, Midjourney

## Previous Session (2026-05-27)

### Multi-AI Review Round — Big Pickle v2 R2 + DeepSeek + Sonnet + Manual Triage

**17 commits on main** (`e532f88`→`7c4d556`). 44 new tests. All security/quality/review findings resolved. CI green (Node 22 + 24).

#### Big Pickle v2 R2 (commit `e532f88`)
- **SEC-013** (Med): `/api/sign-challenge` rate-limited (30 req/min per IP via KV)
- **STB-014** (Low): Dead `enableDevMode` removed from `useDevToolsState`
- **CQ-003** (Info): Duplicate `settingsManager` subscription removed from App.tsx
- **ARC-005** (Med): 44 new tests for state-guard, challenge-link, useThemeSettings, useDevToolsState

#### DeepSeek Review (commit `a793ef4`) — 6 fixed, 1 accepted, 1 known
- **SEC-014** (High): dust_wallet read restricted to owner UID (removed anon bypass)
- **SEC-015** (Med): iss claim validated in Worker token verification
- **SEC-016** (Low): seed length capped at 256 chars in /api/sign-challenge
- **CQ-004** (Low): Dead settingsManager subscription removed from useThemeSettings
- **CQ-005** (Low): Firestore tick formula aligned with Worker (removed +300 buffer)

#### Sonnet Review (commits `6a4e2d5` + `d4c4bdd`) — 5 fixed, 2 already fixed, 1 deferred→done
- **SEC-013-R1** (Med): KV TTL 90→61, closing 30-second burst window
- **SEC-013-R2** (Med): Missing cf-connecting-ip → 403 (both rate limit blocks)
- **STB-014-R1** (Low): Test asserting enableDevMode not exported
- **TST-01** (Low): IS_PROD unsigned URL rejection test + vi.unstubAllEnvs() hardening
- **TST-02** (Info): safeStore double-quota-fail silent drop test
- **SEC-CL-01**: `/api/verify-challenge` endpoint with constant-time HMAC compare (commit `f0b15ff`)

#### Manual Triage (commit `87ec7f6`) — 3 high/medium bugs
- **FIX-01** (High): gamesPlayed double-incremented (startGame + handleEngineGameOver) — achievement thresholds fired at half
- **FIX-02** (High): PauseOverlay restart bypassed scoreSubmittedRef reset — scores silently dropped
- **FIX-03** (Med): visibilitychange auto-resumed manual pauses — added visibilityPausedRef
- **FIX-04** (Med): scheduleTimeout dropped callbacks during pause — changed guard to `!== 'gameover'`

#### Remaining Items (commits `593b47e` + `d8ec430` + `f0b15ff`)
- Full HMAC-SHA256 signature in state-guard.ts AND Worker (was truncated to 16 chars)
- Documentation: dustCallbacks stability, achievement ordering, best1/best2 ref usage, p2 powerups
- `/api/verify-challenge` endpoint replaces client-side re-signing in challenge-link.ts

#### Review Quality Report
| Reviewer | Findings | Valid | Wrong | Hit Rate |
|---|---|---|---|---|
| DeepSeek | 8 | 8 | 0 | 100% |
| Sonnet | 8 | 7 | 0 | 100% (1 deferred→fixed) |
| Manual triage | 12 | 6 | 6 | 50% |

#### CI Fixes (commits `ace1e12`→`7c4d556`)
- Committed uncommitted Big Pickle v2 changes (score-sync, useGameEngine snapshotRef, GameOver toBlob, CellLifecycle, devLog, idb, game.css) — CI was failing on old signatures
- Committed missing `styles/light-theme.css` — test was failing on dynamic import() in CI
- Committed missing `components/BorderGlow.tsx` and review packet outputs
- Deleted old review files from git (deepseek-*.md, AUDIT, DTP_DEEP_ANALYSIS, lighthouse26-5.txt)

#### Achievement Toast Fix (commit `7c4d556`)
- Toast visibility extended from 3.5s to 6s (queue drain 3500ms→6000ms, CSS fadeOut 3s→5.5s)

#### Final state: 214/214 tests, 0 type/lint errors, CI green (Node 22 + 24)

### Big Pickle Review v2 — All 14 Findings Fixed + Review Prompt Ready
Review source: `.review-packet/DTP-v7.5.3-FULL-REVIEW.md` (Big Pickle, 13 findings)
Follow-up prompt: `.review-packet/prompt-bigpickle-v2.md`

#### Security (5 fixes)
- **SEC-010** (High): HMAC signing moved to Worker `/api/sign-challenge`. Client calls server for both sign + verify. No secret in bundle.
- **SEC-011** (Med): Worker rejects `practiceMode: true` / `godMode: true` (403). Client sends flags in scoreSync.queue payload.
- **SEC-009** (Med): `hasValidAppCheck()` guard defined in firestore.rules. Ready to uncomment after Firebase Console enforcement toggle.
- **SEC-012** (Med): Session snapshots signed with HMAC. Key derived from sessionStorage nonce via HKDF (survives refresh). Tampered sessions rejected.
- **SEC-013** (Low): `dust_wallet` reads restricted to authenticated users matching their own UID.

#### Stability (3 fixes)
- **STB-001** (Med): NaN attempts prevented — `Math.max(0, Math.floor(Number(...)))` validation.
- **STB-002** (Med): IDB cursor fallback clarified — same transaction, not silent loss.
- **STB-003** (Low): devAutoPlay rewritten as self-scheduling loop with refs. No longer re-registers on every tick.

#### Performance (3 fixes)
- **PERF-004** (Med): `snapshotRef` exposed from useGameEngine hook. Non-render consumers read from ref.
- **PERF-005** (Low): 59 light-theme CSS rules extracted → `styles/light-theme.css`. Vite auto-splits into separate chunk (4.6KB). Lazy-loaded on theme switch.
- **PERF-006** (Info): WeakMap cache for spawnActive valid slots in CellLifecycle.

#### UX + Code Quality (2 fixes)
- **UX-001** (Low): GameOver share card uses async `canvas.toBlob()` instead of blocking `toDataURL()`.
- **CQ-001** (Info): Unified `logError()` — always logs to console, sends to Sentry in production.

#### Architecture (2 hooks extracted)
- **ARC-001** (partial): `useThemeSettings` (111 lines) + `useDevToolsState` (38 lines) extracted from App.tsx. 1947 → 1878 lines. Further decomposition deferred (engine callback cross-coupling).

### Previous Sessions (2026-05-25/26)

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
1. ~~**Push to remote**~~ ✓ — `git push` done (3 commits: 880fb91, 655ec76, 09da7c8, 6177005)
2. **Cloudflare update** — point game.mscarabia.com to Firebase Hosting (fixes leaderboard)
3. ~~**Lighthouse re-run**~~ ✓ — A100/B96/S100 (both mobile + desktop)
4. **Side-panel visual QA** — verify desktop 3-column layout and mobile Learn More overlay look correct

### Review Packets (2026-06-01) — Upload and get feedback
**Location**: `.review-packet/`
| Packet | File | AI | Size |
|--------|------|----|------|
| Game | `prompt-sonnet-v4.md` or `dtp-v7.6.1-sonnet.zip` | Sonnet | 340KB / 178KB ZIP |
| Game | `prompt-deepseek-v4.md` | DeepSeek | 291KB |
| Corp site | `prompt-corp-sonnet-v1.md` or `corp-sonnet-v1.zip` | Sonnet | 46KB / 29KB ZIP |
| Corp site | `prompt-corp-deepseek-v1.md` | DeepSeek | 48KB |

**Feedback files**: Drop AI responses into `.review-packet/` with names like:
- `feedback-sonnet-game-v7.6.1.md`
- `feedback-deepseek-game-v7.6.1.md`
- `feedback-sonnet-corp-v1.md`
- `feedback-deepseek-corp-v1.md`

Next session: read feedback, triage findings, fix in phased batches.

### High Priority
4. ~~**Achievement notification UX**~~ ✓ — toast extended to 6s (was 3.5s)
5. **Gameplay trailer** (15-30s) — needs screen recording
6. **Screenshots** (5-6 key moments) — needs screen capture
7. ~~**App Check enforcement**~~ ✓ — enforced in Firebase Console + `hasValidAppCheck()` uncommented in `firestore.rules` (commit `e040522`)

### Medium Priority
8. **Game portals** — submit to itch.io, CrazyGames, Poki, Newgrounds
9. **Product Hunt** — listing content ready in .github/LAUNCH.md
10. **Multiplayer prototype** — Cloudflare Durable Objects + WebSockets
11. ~~**Resume game removal**~~ ✓ — already removed (no session.ts, no persistence methods, no resume UI in StartScreen)

### From Deep Analysis Report
- ~~STAB-001: Track gameover timeout ref, clear on unmount~~ ✓ — useGameEngine.ts:333-339 clears all 3 timer refs on unmount
- ~~SEC-006: dust_wallet monotonic check in Firestore rule~~ ✓ — firestore.rules:82-84 +10000/-5000 bounds per write
- ~~SEC-003: Move challenge HMAC to Worker~~ ✓ (SEC-010)
- ~~SEC-013: Add HMAC to session snapshot~~ ✓ (SEC-012)
- ~~ARCH-001: App.tsx hook extraction~~ ✓ (partial — 2 hooks extracted)
- ~~QOL-001: Bomb countdown ring on cells~~ ✓ — Cell/index.tsx:44-71 + 286-289 SVG ring with --bomb-remaining CSS var
- ~~QOL-002: Boss event timer in HUD~~ ✓ — BossOverlay.tsx:7-18 BossCountdown component with 250ms interval

### From Multi-AI Review Session (2026-05-27) — ALL DONE
- ~~SEC-013 sign-challenge rate limiting~~ ✓
- ~~STB-014 dead enableDevMode~~ ✓
- ~~CQ-003 duplicate settingsManager sub~~ ✓
- ~~ARC-005 test coverage for security modules~~ ✓ (44 tests)
- ~~SEC-014 dust_wallet anon bypass~~ ✓
- ~~SEC-015 iss validation~~ ✓
- ~~SEC-016 seed length cap~~ ✓
- ~~CQ-004 dead settingsManager sub in useThemeSettings~~ ✓
- ~~CQ-005 Firestore tick formula alignment~~ ✓
- ~~SEC-013-R1/R2 rate limit hardening~~ ✓
- ~~SEC-CL-01 verify-by-re-signing~~ ✓ (/api/verify-challenge endpoint)
- ~~FIX-01 gamesPlayed double-count~~ ✓
- ~~FIX-02 scoreSubmittedRef restart~~ ✓
- ~~FIX-03 visibility auto-resume~~ ✓
- ~~FIX-04 scheduleTimeout pause drop~~ ✓
- ~~HMAC truncation~~ ✓ (full 256-bit signature in state-guard + Worker)
- ~~Achievement ordering documentation~~ ✓
- ~~dustCallbacks stability documentation~~ ✓
- **Multiplayer prototype** — Cloudflare Durable Objects + WebSockets
- **ARC-004** handleEngineGameOver hook extraction — Phase 3 (40+ cross-coupled deps)

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
