# Triple-Repo Execution Plan & Handoff Tracker

> **Purpose**: Single source of truth for what is done vs pending across the three MSC Arabia web products.  
> **Any AI or human** picking this up: read this file first, then the per-repo HANDOFF docs.  
> **Update rule**: After every meaningful change, flip checkboxes and append a dated log entry at the bottom.

**Last updated**: 2026-07-11 (session: P2 weekly ladder committed)  
**Owner workspace**: `C:\Users\user\OneDrive\Documents\DTP`  
**Prior coordinated session**: 2026-07-05 (see `SESSION-START-PROMPT.md`, root `HANDOFF.md`)

---

## 0. Repo map (canonical paths only)

| Product | Live URL | Local path | Git remote | Deploy |
|---------|----------|------------|------------|--------|
| **DTP Game** | https://game.mscarabia.com | `C:\Users\user\OneDrive\Documents\DTP` | `github.com/defaltadmin/donttouchpurple` (+ GitLab) | Firebase Hosting (`firebase deploy --only hosting`) |
| **Corp site** | https://mscarabia.com | `C:\Users\user\OneDrive\Documents\DTP\mscarabia` | `github.com/defaltadmin/mscarabia` | Cloudflare Pages (push `main`) |
| **Prayer times** | https://prayer.mscarabia.com | `C:\Users\user\OneDrive\Documents\DTP\world-prayer-times` | `github.com/defaltadmin/world-prayer-times` | Cloudflare Pages (push `main`) |

### Do NOT use as source of truth

| Path | Why |
|------|-----|
| `DTP\MSCArabia.com\` | **Stale clone** of corp site. Same remote as `mscarabia/`, but **17 commits behind** `origin/main` and **1 local-only** commit (`novalidate` on forms). Prefer cherry-picking that commit into `mscarabia/` if still needed, then archive/delete this folder. |
| `DTP\website\` | Separate Next.js experiment (`v0.1.0`), not a live product. |
| `DTP\game.mscarabia.com\` | Empty folder; live game is Firebase, not this dir. |
| `C:\Users\user\.git` | Accidental home-dir `git init` (2026-07-11). Unrelated to these projects. Safe to remove later with user consent. |

### Per-repo docs to read

| Repo | Read first |
|------|------------|
| DTP | `HANDOFF.md`, `AGENTS.md`, `DESIGN.md`, `llms.txt` |
| Corp | `mscarabia/HANDOFF.md`, `mscarabia/ROADMAP.md` |
| Prayer | `world-prayer-times/CONTEXT.md`, `PRD.md`, `llms.txt` |
| Cross | `ROADMAP-6MONTH.md`, this file |

---

## 1. Priority stack (execute in this order)

| P | Workstream | Product | Status | Why this order |
|---|------------|---------|--------|----------------|
| **P0** | Repo hygiene | All | 🟡 PARTIAL | `.gitignore` done; commits / stale clone still open |
| **P1** | Calculator lead capture verification + PDF estimate | Corp | 🟡 PARTIAL | Email API already exists; PDF + prod verify missing |
| **P2** | Weekly seeded ladder | DTP | ✅ DONE (committed) | Deterministic seed, leaderboard tabs, server validation, 7 tests |
| **P3** | Mosque/Madrasah lobby mode | Prayer | ⬜ PENDING | Viral wedge for congregations |
| **P4** | VAPID push notifications | Prayer | ⬜ PENDING | Offline prayer reminders |
| **P5** | 5 background brand recolors | DTP | ✅ DONE (uncommitted) | Brand palette applied 2026-07-11 |
| **P6** | Arabic RTL completeness | Corp + Prayer | ⬜ PENDING | Quality / market fit |
| **P7** | Case studies + testimonials | Corp | ⬜ PENDING | Trust / SEO (needs content from owner) |
| **P8** | Larger roadmap (Client Portal, Fire PWA, `@msc/ui`) | Multi | ⬜ BACKLOG | Months 2–6 |

---

## 2. P0 — Repo hygiene

### DTP game (`donttouchpurple`)

- [x] Plan tracker file created (`TRIPLE-REPO-PLAN.md`)
- [x] Expand `.gitignore` for nested product repos + Android build noise + agent tool dirs
- [x] Decide fate of deleted paths (`.amazonq/`, `OPUS-AUDIT-V2/`, audit docs): **commit deletes** or **restore**
- [x] Commit or discard local mods to `HANDOFF.md`, `SESSION-START-PROMPT.md`
- [x] Commit P5 background recolors + plan + gitignore (recommended single hygiene commit)
- [ ] Optional: remove empty `game.mscarabia.com/`
- [x] `TRIPLE-REPO-PLAN.md` present on disk (commit with next hygiene commit)

**Current dirty tree (as of 2026-07-11):**
- Clean (post-commit `e885089`)

**HEAD**: `e885089` on `main` = `origin/main`
**Commands**:
```bash
cd "C:\Users\user\OneDrive\Documents\DTP"
pnpm typecheck && pnpm lint --max-warnings=0 && pnpm test && pnpm build
firebase deploy --only hosting
```

### Corp (`mscarabia`)

- [ ] Commit or discard deleted review docs (`CF-SETUP.md`, `CODE_REVIEW.md`, review packets)
- [ ] Resolve `MSCArabia.com` clone: cherry-pick `bfb361c` (novalidate) if still valid → then delete/archive stale clone
- [ ] Verify live `/api/quote` + Resend secrets in Cloudflare Pages

**HEAD (canonical)**: `b36861b` = `origin/main`  
**Stale clone HEAD**: `bfb361c` (ahead 1, behind 17)

### Prayer (`world-prayer-times`)

- [ ] Remove Windows junk `nul` if present (`?? nul` in git status)
- [ ] Align version strings: `package.json` says `1.26.1`, `CONTEXT.md` says `1.27.2`
- [ ] Prune unused worktrees: `wt/4058a5ed`, `wt/e7d58542` (confirm unused first)

**HEAD**: `e44f005` = `origin/main`

---

## 3. P1 — Corp: calculator email-capture

### Already done (do not re-implement)

- [x] UI: `#quote-capture` form in `mscarabia/index.html` (“Email me this quote”)
- [x] Client: `mscarabia/assets/js/app.js` → `POST /api/quote` JSON
- [x] Server: `mscarabia/functions/api/quote.js` (honeypot, rate limit KV, Resend, origin lock)
- [x] Full manpower form still posts via `/api/contact` with Turnstile

### Remaining

- [ ] **Prod verify**: submit test lead on live site; confirm email hits `LEAD_INBOX` / `info@mscarabia.com`
- [ ] **Confirm secrets**: `RESEND_API_KEY`, `LEAD_INBOX`, optional `RATE_LIMIT_KV` on CF Pages
- [ ] **PDF estimate (gap)**: roadmap asked for instant PDF — not implemented yet. Options:
  1. Client-side print stylesheet / `window.print` estimate sheet
  2. Client-side PDF (e.g. lightweight jsPDF) generated from quote params
  3. Server-side PDF attachment via Resend
- [ ] i18n for quote-capture strings (EN/AR)
- [ ] Optional: also email the **user** a copy (currently only inbox)

**Acceptance criteria**
1. Live calculator → email field → success message
2. Business inbox receives structured quote
3. (If PDF in scope) User can download/print a one-page estimate without leaving site

---

## 4. P2 — DTP: weekly seeded ladder

### Existing building blocks

- Seeded RNG: `mulberry32` in engine
- Challenge links: `utils/challenge-link.ts` + Worker `/api/sign-challenge`, `/api/verify-challenge`
- Score validation Worker; Firebase leaderboard
- AGENTS.md rule: weekly boundaries use **UTC** (`getUTCDay` / `getUTCDate`)

### Not built yet

- [ ] Define weekly seed: `HMAC/SHA256("ladder|" + ISO week + year)` or server-issued seed
- [ ] UI: “Weekly Ladder” mode entry on start screen
- [ ] Leaderboard collection/query scoped to current week id (reset Monday 00:00 UTC)
- [ ] Anti-cheat: reuse signed scores + App Check
- [ ] Tests: seed stability across week, week boundary, score submit schema
- [ ] Docs: update `HANDOFF.md` + CHANGELOG

**Acceptance criteria**
1. All players same seed Mon–Sun UTC
2. Leaderboard only shows current week
3. New week → empty ladder, new seed
4. Typecheck + 230+ tests green

**Suggested first files**
- `utils/` or `engine/` weekly-seed helper
- `services/firestoreService.ts` leaderboard query
- `components/Screens/StartScreen*` / RewardsHub
- `workers/score-validator.ts` if week id must be signed

---

## 5. P3 — Prayer: Mosque/Madrasah lobby mode

### Target

Shareable read-only board: city + class schedule + live countdown. URL params, no auth.

### Tasks

- [ ] Spec URL params (e.g. `?mode=lobby&city=Riyadh&lang=ar`)
- [ ] Hide editing chrome; large type for TV/lobby
- [ ] Auto-refresh prayer times + countdown
- [ ] Optional: kiosk fullscreen / wake lock
- [ ] Document in `CONTEXT.md` + CHANGELOG

**Key file**: `world-prayer-times/index.html` (monolith ~2.7k+ lines)

---

## 6. P4 — Prayer: VAPID push

### Today

Browser Notification API only; tab often must stay open (esp. iOS warning already in product).

### Tasks

- [ ] Generate VAPID keys; store private key in Worker secrets
- [ ] Subscribe UI + permission flow
- [ ] Persist subscriptions (KV/D1)
- [ ] Scheduled Worker (cron) to fire pre-prayer pushes
- [ ] iOS/PWA constraints documented honestly

---

## 7. P5 — DTP: 5 background recolors

Files under `components/Backgrounds/`:

| File | Status |
|------|--------|
| `BlockOrbit.tsx` | ✅ recolored + reducedMotion + idle-skip + dtp-bg-canvas |
| `Lightning.tsx` | ✅ magenta/gold brand tint in shader + dtp-bg-canvas |
| `MouseFollower.tsx` | ✅ default glow → brand magenta `#c026d3` |
| `MouseTrail.tsx` | ✅ HSL rainbow → fixed brand hex palette |
| `ElasticWarp.tsx` | ✅ particle + link colors brand-only + dtp-bg-canvas |

**Brand tokens** (from prior overhaul): `#fda9ff`, `#f3aeff`, `#f9bd22`, `#c026d3`  
Also: `reducedMotion` prop, `data-low-quality` guard, `dtp-bg-canvas` class, `document.hidden` idle-skip where applicable.  
Reference finished backgrounds: `GridPulse`, `StarWarp`, `DataStream`, etc.

**Still uncommitted** — next agent should run `pnpm typecheck && pnpm test` then commit with hygiene.

---

## 8. P6 — Arabic RTL completeness

- [ ] Corp: toggle AR, walk all sections/forms/calculator/quote-capture
- [ ] Prayer: AR + RTL timeline/panel/modals
- [ ] Fix any hardcoded EN strings; mirror spacing for RTL

---

## 9. P7 — Corp content (needs human assets)

- [ ] Case studies with real project imagery
- [ ] Testimonials
- [ ] Blog/resources (optional)

---

## 10. P8 — Backlog (6-month roadmap)

From `ROADMAP-6MONTH.md` (approved 2026-07-04):

- [ ] Fire Safety Inspection PWA
- [ ] MSC Client Portal
- [ ] Manpower Job Board
- [ ] Shared `@msc/ui` package
- [ ] Finish remaining DTP backgrounds beyond the 5 listed
- [ ] Teacher attendance roster (prayer/madrasah)
- [ ] Replay/ghost challenge + auto OG share cards (DTP)
- [ ] Corp: self-host Material Symbols subset; uptime/Sentry; CRM wiring

---

## 11. Known healthy baselines (do not “fix” without verifying)

| Product | Baseline (as of last handoff) |
|---------|--------------------------------|
| DTP 7.9.1 | Typecheck 0 · tests 230/230 · lint 0 · Lighthouse A100/B96/S100 · App Check on |
| Corp | Lighthouse ~P97/A100/SEO100 · CSP cleaned July 5 · analytics removed |
| Prayer 1.26.x | Live SW + Worker meeting links · personal tasks · iCal VTIMEZONE |

### Recent commits (reference)

| Repo | Commit | Note |
|------|--------|------|
| DTP | `e885089` | feat: weekly seeded ladder (P2) |
| DTP | `823eddb` | chore: triple-repo plan, gitignore, recolor 5 backgrounds |
| DTP | `cb52338` | CSP unsafe-inline, eslint ignore nested |
| Corp | `b36861b` | onload → JS, GA stubs |
| Corp | `d7ac985` | JSON-LD externalized, CSP |
| Prayer | `e44f005` | llms.txt |

---

## 12. Session protocol for any AI

1. Read **this file** top-to-bottom.
2. Read the product HANDOFF for the repo you touch.
3. Work **one priority item** at a time; keep blast radius small.
4. Run the product’s verify commands before claiming done.
5. **Update this file**: checkboxes + log entry (date, what changed, files, leftover risk).
6. Do **not** force-push; do **not** deploy without user intent if secrets/live traffic involved.
7. Nested repos: commit **inside** `mscarabia/` or `world-prayer-times/`, not via parent DTP git add of their trees.
8. Canonical corp path is **`mscarabia/`**, never `MSCArabia.com/`.

### Verify commands

```bash
# DTP
cd "C:\Users\user\OneDrive\Documents\DTP"
pnpm typecheck && pnpm lint --max-warnings=0 && pnpm test && pnpm build

# Prayer (no test suite required for static; manual + optional Playwright)
cd "C:\Users\user\OneDrive\Documents\DTP\world-prayer-times"
# deploy: wrangler pages deploy . --project-name world-prayer-times
# or: push main

# Corp
cd "C:\Users\user\OneDrive\Documents\DTP\mscarabia"
# push main → CF Pages; smoke test /api/contact and /api/quote
```

---

## 13. Execution log

### 2026-07-11 — Plan created + state audit

**Agent**: Grok (xAI)  
**Done**:
- Audited all three repos (git status, remotes, HEAD, handoffs, roadmaps).
- Discovered calculator **email capture already implemented** (`quote.js` + UI); PDF still missing.
- Created this tracker with prioritized backlog.

### 2026-07-11 — Hygiene partial + P5 background recolors

**Agent**: Grok (xAI)  
**Done**:
- Expanded `DTP/.gitignore` (nested `mscarabia/`, `world-prayer-times/`, android, agent dirs, zips).
- Recolored 5 DTP backgrounds to brand palette:
  - `components/Backgrounds/BlockOrbit.tsx`
  - `components/Backgrounds/Lightning.tsx`
  - `components/Backgrounds/MouseFollower.tsx`
  - `components/Backgrounds/MouseTrail.tsx`
  - `components/Backgrounds/ElasticWarp.tsx`
- Wrote/updated `TRIPLE-REPO-PLAN.md`.

**Not done (next agent)**:
1. **Commit DTP** (with user OK): plan + gitignore + 5 backgrounds + decide on doc deletes.
2. **P0 remainder**: corp doc deletes; resolve `MSCArabia.com` stale clone; prayer version align.
3. **P1**: live-verify `/api/quote`; optional PDF estimate for calculator.
4. **P2**: weekly seeded ladder (next major feature).
5. **P3/P4**: prayer lobby mode / VAPID.

**Suggested next commit message (DTP)**:
```
chore: triple-repo plan, gitignore nested repos; recolor 5 leftover backgrounds
```

**Risks / blockers**:
- Live secret verification needs Cloudflare dashboard access / user confirmation of Resend.
- Case study content needs real assets from business owner.
- Do not `git add` nested product folders; they have their own remotes.
- Home dir `C:\Users\user\.git` is accidental — unrelated; ask before removing.

### 2026-07-11 — P2 weekly ladder committed

**Agent**: MiMo Code  
**Done**:
- Committed P2 weekly seeded ladder (`e885089`): full client→Worker→Firestore pipeline.
- Fixed type error in `score-sync.ts:68` (non-null assertion on `sessionId`).
- Verify: typecheck clean, lint 0, 237/237 tests pass, build clean.
- Removed stale docs: `.amazonq/`, `OPUS-AUDIT-V2/`, `DOCUMENTATION.md`, `REVIEW-ROADMAP-v7.6.1.md`, `llms-full.txt`.
- Updated `HANDOFF.md`, `SESSION-START-PROMPT.md`.
- Updated tracker (this file).

**Not done (next agent)**:
1. **P0 remainder**: corp doc deletes; resolve `MSCArabia.com` stale clone; prayer version align; optional `game.mscarabia.com/` removal.
2. **P1**: live-verify `/api/quote`; optional PDF estimate for calculator.
3. **P3/P4**: prayer lobby mode / VAPID.
4. **Push DTP** when user is ready (`git push origin main`).

**Risks / blockers**:
- Worker deployed separately — `score-validator.ts` changes need `wrangler deploy` to go live.
- Firestore rules need `firebase deploy --only firestore:rules` to take effect.
- Do not push until user confirms readiness.

---

*End of tracker. Keep this file short of secrets — no API keys, passwords, or VAPID private keys.*
