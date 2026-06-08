# Memory Export — Key Context for Mac Sessions

> Import these into OpenClaude memory on Mac: `openclaude` then paste relevant sections.

## Project State (2026-05-29)

- **DTP Game**: v7.5.4, 214 tests, 0 lint errors, CI green
- **Live**: https://game.mscarabia.com (Firebase Hosting)
- **GitHub**: https://github.com/defaltadmin/donttouchpurple
- **MSCArabia**: https://mscarabia.com (CF Pages, separate project)
- **Branch**: main (all work merged)

## What's Done (recent sessions)

- Session removal (resume game deleted, ~300 lines across 10+ files)
- Landing page redesign (hero grid + boss events + features + open source + CTA)
- Dev mode restored in prod (commit d9df010)
- MSCArabia: 18 findings fixed (commit 8b4a390)
- MSCArabia ALL PHASES complete (5 commits, ~50 fixes)
- Resend replaces MailChannels for contact form
- Landing page must match game aesthetic (no generic static page)

## What's Next

1. **Deploy verification** — 9+ commits since last Firebase deploy
2. **Gameplay trailer** (15-30s) — needs screen recording
3. **Screenshots** (5-6 key moments)
4. **App Check enforcement** — code ready, needs Firebase Console toggle
5. **Game portals** — itch.io, CrazyGames, Poki, Newgrounds
6. **Product Hunt** — listing ready in .github/LAUNCH.md
7. **Multiplayer prototype** — CF Durable Objects + WebSockets

## Key Patterns

- SSH to PC: `ssh user@100.115.4.2` or `ssh home-pc` (with config)
- WoL: Mocha WOL app on phone to wake PC
- Max 3-4 parallel agents per batch (V8 heap limit)
- "API error: terminated" = session too big, start new chat
- HANDOFF.md is the SINGLE entry point for all new sessions
- Don't put PC to sleep unless explicitly told
- Implement ALL AI review suggestions, not just bug fixes
- Commit directly after verification passes; don't ask

## Firebase

- Project: dont-touch-purple
- Hosting: game.mscarabia.com
- Deploy: `firebase deploy --only hosting`
- Client-side API keys are public identifiers, not secrets

## Cloudflare

- Workers: score-validator (score validation endpoint)
- KV: rate limiting for /api/sign-challenge
- mscarabia.com on CF Pages

## Critical Rules

1. Pure game logic in engine/ — zero React imports
2. Cell arrays replaced each tick — never mutate in place
3. sessionStorage for game state (not localStorage)
4. Generation counter for callbacks referencing cell indices
5. data-testid on all key interactive elements
6. CSS vars from DESIGN.md — no hardcoded hex
7. RAF idle skip — check document.hidden
8. WebGL context loss handlers on all OGL backgrounds
9. React.memo for external library components in expensive contexts
10. safeSet wrapper for localStorage writes that grow
11. VITE_* env vars for DSNs and API keys
12. UTC for weekly tasks — getUTCDay/getUTCDate
13. pnpm lint --max-warnings=0 must pass
