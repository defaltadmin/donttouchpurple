# DTP Code Review — Sonnet

You are reviewing Don't Touch Purple, a reflex-based grid-tapping game built with React 18 + TypeScript 5 + Vite 7 + Firebase + Cloudflare Workers.

## Context
- 164 tests passing, 0 lint errors, 0 vulnerabilities
- Recently completed: game over rework, security hardening, circular chunk fix, lighthouse optimization
- Full analysis report at DTP_DEEP_ANALYSIS_REPORT.md (44 findings, 15 fixed, 29 open)

## Focus Areas
1. **App.tsx** (1,928 lines) — the god component. Propose concrete extraction hooks.
2. **engine/GameEngine.ts** (1,252 lines) — the god class. Identify further decomposition opportunities.
3. **Security** — review Firestore rules, Worker auth, session snapshot integrity
4. **Performance** — main-thread work (2.7s), chunk sizes, lazy-load opportunities
5. **UI/UX** — StartScreen design, game over flow, mobile responsiveness

## Files Provided
**Upload `dtp-sonnet-review.zip`** (2.8MB, 363 files) — contains the full game source:
- All TypeScript/TSX source files (engine, components, hooks, services, utils, config)
- All CSS files (game.css, enhancements.css, fx-enhancements.css, performance.css)
- Build config (vite.config.ts, tsconfig.json, package.json)
- Firebase config (firebase.json, firestore.rules)
- Tests (__tests__/, test/)
- Documentation (DESIGN.md, AGENTS.md, llms.txt, HANDOFF.md)
- Analysis context (DTP_DEEP_ANALYSIS_PROMPT.md, DTP_DEEP_ANALYSIS_REPORT.md, lighthouse26-5.txt)

**Start by reading:** HANDOFF.md → DTP_DEEP_ANALYSIS_REPORT.md → then dive into specific files.

## Output Format
For each finding:
- **ID**: Unique identifier
- **Severity**: Critical / High / Medium / Low / Info
- **File + Line**: Exact location
- **Description**: What is wrong and why
- **Impact**: What breaks or degrades
- **Fix**: Concrete code change or approach

## Rules
- Read full files before reporting — don't guess from names
- Verify findings against live code — many issues from prior reviews are already fixed
- Prioritize runtime bugs over style nits
- Include code snippets for proposed fixes
