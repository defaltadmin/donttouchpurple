# Session Start Prompt for MiMo

Read `HANDOFF.md` in full. It contains the complete state of all three repos (DTP game, prayer times, mscarabia) after a massive audit session on 2026-07-04. 

**What you need to know:**
- Three repos were audited, fixed, and pushed: `defaltadmin/donttouchpurple`, `defaltadmin/world-prayer-times`, `defaltadmin/mscarabia`
- HANDOFF.md has the full commit log, what was done, what's left, and remaining manual steps
- 230/230 DTP tests pass. Lighthouse A94-100 / BP92 / SEO100 across all sites
- The prayer Worker secret is `thequrangroup` (do NOT paste in chat, use it only for `wrangler secret put`)
- mscarabia has a new `/api/quote` Worker for email capture from the calculator
- All inline onclick handlers on mscarabia were converted to `data-action` delegation
- All UA regex patterns were replaced with `matchMedia('(pointer: coarse)')`
- WebGL backgrounds (Galaxy, Hyperspeed, Silk) now append to `document.body` for full-bleed rendering

**What to do next:**
1. Read HANDOFF.md for full context
2. Check the "What's Left" section for pending work
3. Take screenshots of all three sites and review visually
4. Pick the highest-impact remaining item and implement it
