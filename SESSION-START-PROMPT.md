# Session Start Prompt for MiMo — Triple Repo Audit

You are continuing work on three production web apps after a massive audit session (2026-07-04). Read this entire prompt first, then read the HANDOFF file for full context.

---

## File Locations

**DTP Game (donttouchpurple):**
- Working dir: `C:\Users\user\OneDrive\Documents\DTP`
- HANDOFF: `C:\Users\user\OneDrive\Documents\DTP\HANDOFF.md` ← READ THIS FIRST
- Session prompt: `C:\Users\user\OneDrive\Documents\DTP\SESSION-START-PROMPT.md`
- Audit prompt: `C:\Users\user\OneDrive\Documents\DTP\GPT55-AUDIT-PROMPT.md`
- Key source files:
  - `App.tsx` — main orchestrator (1789 lines)
  - `engine/GameEngine.ts` — pure game logic
  - `components/Backgrounds/*.tsx` — 22 WebGL/canvas backgrounds
  - `styles/enhancements.css` — visual polish layer
  - `styles/game.css` — base game styles
  - `workers/score-validator.ts` — Cloudflare Worker
- Tests: `pnpm test` (230 tests, 21 files)
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`

**Prayer Times (world-prayer-times):**
- Working dir: `C:\Users\user\OneDrive\Documents\DTP\world-prayer-times`
- Key file: `index.html` (single-file app, ~3500 lines — HTML + CSS + JS all inline)
- Worker: `worker/index.js` (Cloudflare Worker for meeting links)
- Service Worker: `sw.js` (notifications + caching)
- Deploy: push to `main` on GitHub → Cloudflare Pages auto-deploys
- Worker deploy: `cd worker && wrangler deploy`

**mscarabia (Corporate Site):**
- Working dir: `C:\Users\user\OneDrive\Documents\DTP\mscarabia`
- Key files:
  - `index.html` — main page (~2460 lines)
  - `assets/js/app.js` — consolidated JS (scroll reveal, quote capture, event delegation, count-up)
  - `assets/js/main.js` — i18n, interactions, form handling
  - `functions/api/quote.js` — Cloudflare Function for email capture
  - `functions/api/contact.js` — Cloudflare Function for contact form
  - `_headers` — CSP and security headers
- Deploy: push to `main` on GitHub → Cloudflare Pages auto-deploys

**Screenshots:**
- `C:\Users\user\OneDrive\Documents\DTP\screenshots\` — latest screenshots (dtp-v7.png, prayer-v7.png, mscarabia-v7.png)

---

## Current State (as of 2026-07-04)

### DTP
- 230/230 tests pass
- All 22 backgrounds use brand palette (#fda9ff, #f3aeff, #f9bd22, #c026d3)
- 3 WebGL backgrounds (Galaxy, Hyperspeed, Silk) render full-bleed via document.body
- Zero UA regex remaining (all use matchMedia)
- Zero inline onclick handlers
- Firebase env guard + CI secrets configured
- Start-screen entrance animation, 320px HUD guard, reduced-motion hard stop

### Prayer Times
- Personal tasks system (CRUD + modal + timeline)
- VTIMEZONE iCal export (8 timezones + tasks)
- Worker auth: env.COURSE_SECRET + timingSafeEqual (password: thequrangroup)
- SW v2 with notification scheduling
- Donate pill (fixed position, runtime normalization)
- Container-query prayer labels

### mscarabia
- Case studies section (Aramco/STC/Petro Rabigh)
- Email capture Worker + honeypot + rate limiting
- Scroll reveal with JS-ready fallback (visible by default)
- All 22 onclick handlers → data-action delegation
- CSP clean: no unsafe-hashes, no SHA hashes
- Space Grotesk + Plus Jakarta Sans font pairing
- 48 inline SVG icons

---

## What's Left (from HANDOFF.md)

1. **DTP**: 1 background still needs verification (14 originally unfinished, 13 rewritten)
2. **Prayer**: Push API + VAPID for guaranteed offline notifications
3. **mscarabia**: Move remaining inline scripts to external files, add case study images
4. **All three**: Arabic RTL completeness check
5. **Manual**: GitHub secrets for DTP Firebase, Resend/Turnstile env vars for mscarabia

---

## Instructions

1. Read `HANDOFF.md` for full project context and commit history
2. Read `SESSION-START-PROMPT.md` for the task list
3. Take screenshots of all three sites (use ?nocache= parameter for fresh deploys)
4. Check the "What's Left" section and pick the highest-impact item
5. Run gates before pushing: `pnpm test` for DTP, git push for prayer/corp
