# Code Review Request — Don't Touch Purple v7.5.3 (Round 3)

You are reviewing the codebase for **Don't Touch Purple**, a reflex-based grid-tapping game built with React 19, TypeScript 5, Vite 7, OGL (WebGL), GSAP, and Firebase.

## Previous Audits
- **Round 1** (Sonnet): 12 issues found, all fixed
- **Round 2** (Sonnet + DeepSeek + Codex): 70/70 production audit issues resolved across 15 commits
- **Round 2.5** (Sonnet + DeepSeek): 4 residual issues found and fixed:
  1. `utils/score-sync.ts` — atomic `removeAndUpdate` to prevent data loss on page close
  2. `components/HUD/Hearts.tsx` — `Math.floor` for fractional health display (Evolve mode 0.5 damage)
  3. `engine/subsystems/TickProcessor.ts` — generation counter for `slideAnim` to prevent stale cleanup on double-shuffle
  4. `App.tsx:469` — try-catch around `JSON.parse` for weekly modes localStorage

## What to Focus On
This is a **fresh full-audit**. Review the entire codebase for:

1. **Bugs** — logic errors, race conditions, data corruption, crashes
2. **Security** — XSS, injection, state tampering, auth bypass, data leaks
3. **Stability** — unhandled errors, memory leaks, infinite loops, soft locks
4. **Performance** — unnecessary re-renders, expensive operations in hot paths, bundle bloat
5. **Code Quality** — dead code, type safety, inconsistent patterns

Pay special attention to:
- `utils/idb.ts` — new `removeAndUpdate()` method (verify atomicity)
- `utils/score-sync.ts` — flush() uses atomic update (verify no data loss window)
- `components/HUD/Hearts.tsx` — fractional health handling
- `engine/subsystems/TickProcessor.ts` — slideAnim generation counter
- `engine/types.ts` — `slideAnim` type includes `gen` field
- `App.tsx` — JSON.parse safety in weekly progress tracking

## Output Format
For each issue found, use this exact format:

```
N.

**File:** `path/to/file.ts` (lines X-Y)

**Type:** [Bug | Logic Error | Performance | Security | Error Handling | Code Quality]

**Severity:** [Critical | High | Medium | Low]

**Description:** [Clear description of the issue]

**Code:**
\`\`\`typescript
[relevant code snippet]
\`\`\`

**Fix:** [Suggested fix]
```

## Rules
1. Only report REAL bugs with traceable code paths
2. Don't report server-only issues (Cloudflare Workers, Firestore rules) — client-side only
3. Don't claim something is missing if it exists elsewhere (trace the actual flow)
4. JavaScript is single-threaded — synchronous code can't have race conditions
5. Check if the code already handles the edge case before reporting it
6. Be precise about severity — "Critical" means crash/data loss, not "could be improved"
7. If you find the code is correct, say so — don't manufacture issues

## Previous Round Issues You Got Wrong
Learn from these:
- `engineConfig` storage not wired — WRONG (hook injects storage correctly)
- `triggerGameOver` counter reset timing — NOT A BUG (achievements checked synchronously before reset)
- CSP missing `game.mscarabia.com` — severity was High, should have been Critical
- BotController P2 assist never works — was already fixed in 70/70 audit

## Deliverable
A structured list of all issues found, grouped by severity. Include a "Confirmed Correct" section for things you verified are working as intended.
