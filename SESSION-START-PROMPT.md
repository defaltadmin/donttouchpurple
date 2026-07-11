# Session Start Prompt — Triple Repo (2026-07-05)

You are continuing work on three production web apps. Read this prompt first, then read HANDOFF.md for full context.

---

## File Locations

**DTP Game (donttouchpurple):**
- Working dir: `C:\Users\user\OneDrive\Documents\DTP`
- HANDOFF: `C:\Users\user\OneDrive\Documents\DTP\HANDOFF.md`
- Key source: `App.tsx`, `engine/GameEngine.ts`, `components/Backgrounds/*.tsx`, `styles/*.css`
- Tests: `pnpm test` (230 tests, 21 files)
- Deploy: `firebase deploy --only hosting`

**Prayer Times (world-prayer-times):**
- Working dir: `C:\Users\user\OneDrive\Documents\DTP\world-prayer-times`
- Key file: `index.html` (single-file app ~3500 lines)
- Worker: `worker/index.js`, SW: `sw.js`
- Deploy: push to `main` → Cloudflare Pages auto-deploys

**mscarabia (Corporate Site):**
- Working dir: `C:\Users\user\OneDrive\Documents\DTP\mscarabia`
- Key files: `index.html`, `assets/js/app.js`, `assets/js/main.js`, `_headers`
- Deploy: push to `main` → Cloudflare Pages auto-deploys

---

## Current State (2026-07-05)

### DTP
- 230/230 tests pass, typecheck clean, lint clean, build clean
- 22 backgrounds use brand palette, 3 WebGL full-bleed via document.body
- CSP fixed (`unsafe-inline` added to script-src), deployed to Firebase
- Viewport meta fixed (removed `user-scalable=no`)
- `llms.txt` updated

### Prayer Times
- Personal tasks, VTIMEZONE iCal, worker auth, SW v2 all working
- `llms.txt` added
- Live on prayer.mscarabia.com

### mscarabia
- JSON-LD externalized to app.js (no inline script)
- Analytics removed, CSP cleaned (dropped GTM/Cloudflare Insights)
- Inline `onload` handlers converted to JS
- `loadGA`/`denyGA` stubbed
- Live on mscarabia.com

---

## What's Left

1. **DTP**: 5 backgrounds need brand recolor (BlockOrbit, Lightning, MouseFollower, MouseTrail, ElasticWarp)
2. **Prayer**: Push API + VAPID for guaranteed notifications
3. **mscarabia**: Case study images, Arabic RTL check
4. **All three**: Arabic RTL completeness

---

## Commands

```bash
# DTP
pnpm typecheck && pnpm lint --max-warnings=0 && pnpm test && pnpm build
firebase deploy --only hosting

# Prayer / mscarabia — just push to main, Cloudflare auto-deploys
git add -A && git commit -m "type: description" && git push origin main
```
