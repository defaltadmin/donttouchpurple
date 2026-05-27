# DTP Code Review — v7.5.4 (Big Pickle v2 Round 2)

**Project**: Don't Touch Purple — reflex-based grid-tapping game
**Stack**: React 18, TypeScript 5, Vite 7, Firebase, OGL/WebGL, Cloudflare Workers
**Date**: 2026-05-27

## Build Status
- Typecheck: 0 errors
- Tests: 211/211 pass (20 files)
- Lint: 0 errors, 0 warnings
- Build: Clean

## What Changed This Round

This review covers 5 changes from Big Pickle v2 Round 2:

1. **SEC-013** (Med): Rate limiting added to `/api/sign-challenge` endpoint
2. **STB-014** (Low): Dead `enableDevMode` callback removed from `useDevToolsState`
3. **CQ-003** (Info): Duplicate `settingsManager` subscription removed from App.tsx
4. **ARC-005** (Med): 44 new tests for security-critical modules
5. **ARC-004** (Info): Deferred — `handleEngineGameOver` extraction (40+ cross-coupled deps)

## Review Instructions

The zip contains all changed files. Focus on:

1. **Security** — Rate limiting bypass vectors? KV TTL edge cases? HMAC CPU abuse still possible?
2. **Dead code** — Is enableDevMode removal complete? Any dangling references?
3. **Duplicate sub** — Does removing App.tsx's settingsManager subscription break anything?
4. **Test quality** — Edge cases covered? Missing scenarios for security modules?
5. **General** — Any bugs, security holes, performance issues, or code quality problems?

Do NOT report on files not in the zip — they are unchanged from the previous review round.

## Severity Scale
- **Critical**: Data loss, security breach, production down
- **High**: Exploitable vulnerability, significant bug
- **Medium**: Security surface gap, notable bug, missing test coverage
- **Low**: Dead code, minor code quality issue
- **Info**: Style preference, nitpick

## Format

For each finding:
```
### [ID] — Title
- **Severity**: Critical/High/Medium/Low/Info
- **Category**: Security/Stability/Performance/UX/Code Quality/Architecture
- **File + Line**: exact location
- **Description**: what's wrong
- **Impact**: what could happen
- **Fix**: specific code change
```
