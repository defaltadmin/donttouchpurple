# OpenCode Audit — 2026-05-30

33 findings: 2 Critical, 4 High, 10 Medium, 17 Low

## Security (9)
- SEC-001 Critical: Challenge secret in client bundle (VITE_CHALLENGE_SECRET)
- SEC-002 Critical: Same HMAC key for server-side scoring
- SEC-003 High: Badge field not re-validated client-side
- SEC-004 High: App Check commented out in rules
- SEC-005 Medium: No CSP header in dev server
- SEC-006 Medium: HMAC verification catch block might accept on error
- SEC-007 Low: SENTRY_AUTH_TOKEN in .env.example
- SEC-008 Low: Firebase config hardcoded (by design)
- SEC-009 Low: Admin role dead code in rules

## Performance (7)
- PERF-001 High: useGameEngine useEffect cleanup
- PERF-002 Medium: GameArea React.memo with inline callbacks
- PERF-003 Medium: BombTimer RAF per cell
- PERF-004 Medium: Spark canvas RAF pile-up
- PERF-005 Low: Logger warn in production
- PERF-006 Low: Sourcemaps deployed
- PERF-007 Low: Backgrounds eagerly imported

## Code Quality (9)
- CQ-001 Medium: addDoc for scores (duplicate submissions)
- CQ-002 Medium: DDA uses Date.now() for reaction times
- CQ-003 Low: GameEngine monolithic
- CQ-004 Low: BotController doesn't check document.hidden
- CQ-005 Low: Mixed clock domains
- CQ-006 Low: Touch event listener cleanup
- CQ-007 Low: No LRU eviction on quota
- CQ-008 Low: Fixed interval tick
- CQ-009 Low: i18n English only

## Game Logic (5)
- BUG-001 High: Bot superhuman at high accuracy
- BUG-002 Medium: Bomb density at high grid
- BUG-003 Medium: Grace ticks vs time
- BUG-004 Low: Energy regen stale on mount
- BUG-005 Low: Hold cell release

## Architecture (3)
- ARC-001 Medium: No engines field
- ARC-002 Low: optimizeDeps
- ARC-003 Low: Background RAF cleanup
