# DTP Security Review — DeepSeek

You are performing a security-focused review of Don't Touch Purple, a reflex-based grid-tapping game.

## Context
- Stack: React 18, TypeScript 5, Vite 7, Firebase (Firestore, Auth, Analytics, App Check), Cloudflare Workers
- Game state: sessionStorage (not localStorage), session snapshot with bounds-clamping
- Score submission: client → IndexedDB queue → Cloudflare Worker → Firestore
- 0 known vulnerabilities, all prior security findings resolved

## Focus Areas (Security-Critical)
1. **Session snapshot integrity** — sessionStorage is plain JSON, no HMAC. What can be tampered?
2. **Worker auth** — Firebase ID token verification, aud claim, origin check, rate limiting
3. **Firestore rules** — badge regex, tick formula, dust_wallet monotonicity
4. **Score inflation** — practice mode, god mode, session restore bypass vectors
5. **XSS** — user inputs (playerName, leaderboard initials, badge), React auto-escaping
6. **CSP** — unsafe-inline styles, missing connect-src, frame-ancestors
7. **Challenge links** — HMAC secret in client bundle, forgeability

## Files to Read
- engine/GameEngine.ts (lines 1040-1174: restoreSessionSnapshot)
- services/firebase.ts (getDeviceId, normalizeGlobalScoreEntry, App Check)
- workers/score-validator.ts (full file — Firebase JWT, rate limiting, CORS)
- firestore.rules (full file — all validation functions)
- utils/challenge-link.ts (HMAC signing)
- utils/score-sync.ts (IDB queue, score submission)
- utils/privacy.ts (GDPR, data keys)
- App.tsx (lines 474-596: handleEngineGameOver, practiceMode/godMode gating)
- firebase.json (CSP headers)

## Output Format
For each finding:
- **ID**: SEC-XXX
- **Severity**: Critical / High / Medium / Low / Info
- **File + Line**: Exact location
- **Description**: What is the vulnerability
- **Attack vector**: How it can be exploited
- **Fix**: Concrete code change

## Rules
- Read full files — don't assume from file names
- Verify findings against live code — SEC-001 (cell type whitelist), SEC-008 (aud validation), SEC-007 (practice mode gating) are already fixed
- Focus on exploitable issues, not theoretical concerns
- Include proof-of-concept for critical findings
