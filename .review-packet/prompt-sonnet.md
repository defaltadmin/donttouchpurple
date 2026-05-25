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

## Files to Read
- App.tsx, engine/GameEngine.ts, engine/subsystems/TickProcessor.ts
- components/Screens/StartScreen.tsx, components/Screens/GameOver.tsx
- components/HUD/PlayerPanel.tsx, components/Cell/index.tsx
- services/firebase.ts, workers/score-validator.ts, firestore.rules
- styles/game.css, styles/enhancements.css
- vite.config.ts, package.json, tsconfig.json

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
