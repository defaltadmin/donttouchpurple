# Code Review Request — Don't Touch Purple v7.5.3 (Round 3)

You are reviewing the codebase for **Don't Touch Purple**, a reflex-based grid-tapping game built with React 19, TypeScript 5, Vite 7, OGL (WebGL), GSAP, and Firebase.

## Previous Audits
- **Round 1** (DeepSeek): 12 issues found, all fixed
- **Round 2** (7 AIs): 70/70 production audit issues resolved across 15 commits
- **Round 2.5** (DeepSeek): 4 residual issues found and fixed:
  1. `utils/score-sync.ts` — atomic `removeAndUpdate` to prevent data loss on page close
  2. `components/HUD/Hearts.tsx` — `Math.floor` for fractional health display
  3. `engine/subsystems/TickProcessor.ts` — generation counter for `slideAnim`
  4. `App.tsx:469` — try-catch around `JSON.parse`

## What to Focus On
This is a **fresh full-audit**. Review the entire codebase for:

1. **Security** — XSS, injection, state tampering, auth bypass, data leaks, CSP gaps
2. **Data Integrity** — IDB atomicity, localStorage corruption, score loss, state desync
3. **Game Logic** — cell lifecycle, boss events, difficulty scaling, RNG, scoring
4. **Stability** — unhandled errors, memory leaks, soft locks, context loss
5. **Performance** — RAF efficiency, render thrashing, bundle size

Pay special attention to:
- `utils/idb.ts` — `removeAndUpdate()` atomicity (single IDB transaction)
- `utils/score-sync.ts` — flush() no longer has delete-then-re-enqueue window
- `engine/GameEngine.ts` — cell array replacement, generation counter usage
- `engine/subsystems/TickProcessor.ts` — shuffle, boss events, difficulty scaling
- `engine/subsystems/CellLifecycle.ts` — cell type selection, special cell behavior
- `services/firebase.ts` — auth flow, score submission, dust sync
- `workers/scoreWorker.ts` — CORS, origin validation, Firebase token verification

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
- `ensureAuth` IIFE race condition — NOT A BUG (IIFE assigned synchronously)
- `fbSyncDust` using display name as doc ID — was already fixed in 70/70 audit
- GAME_OVER_TICK unused constant — was already removed
- Challenge link score 0 bug — was already fixed with proper null check

## Deliverable
A structured list of all issues found, grouped by severity. Include a "Confirmed Correct" section for things you verified are working as intended.
