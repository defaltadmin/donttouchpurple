# Deep Code Audit — Don't Touch Purple v7.5.3

You are performing a comprehensive security and correctness audit of **Don't Touch Purple**, a reflex-based grid-tapping game built with React 19, TypeScript 5, Vite 7, OGL (WebGL), GSAP, and Firebase.

## Project Context
- Game logic is pure TypeScript in `engine/` — zero React imports
- React UI in `components/` bridges to engine via hooks in `hooks/`
- Firebase for auth, Firestore, analytics, App Check
- Cloudflare Worker for score proxy (`workers/scoreWorker.ts`)
- All backgrounds use OGL (WebGL) with context loss handlers
- Game state uses sessionStorage, persistent data uses localStorage
- Cell arrays are replaced each tick — never mutated in place

## What to Review

Review ALL files in these directories in order of priority:

### Priority 1: Engine (pure game logic)
- `engine/GameEngine.ts` — main game loop, player state, boss events
- `engine/DifficultyScaler.ts` — difficulty curve, overrides resolution
- `engine/subsystems/TickProcessor.ts` — cell spawning, difficulty scaling, survival bonus
- `engine/subsystems/CellLifecycle.ts` — click handling, special cell effects
- `engine/subsystems/BossEngine.ts` — boss event logic
- `engine/subsystems/ScoreTracker.ts` — score tracking, combo logic
- `engine/subsystems/EventOrchestrator.ts` — boss event timing
- `engine/botController.ts` — bot assist AI

### Priority 2: Utils (security-critical)
- `utils/state-guard.ts` — state sanitization, type validation
- `utils/score-sync.ts` — score queue, offline persistence, IDB
- `utils/idb.ts` — IndexedDB operations
- `utils/analytics.ts` — event tracking
- `utils/error-tracker.ts` — error capture
- `utils/achievements.ts` — achievement system
- `utils/rewards.ts` — reward calculations
- `utils/featureGates.ts` — progressive feature unlocking
- `utils/game-config.ts` — game config persistence
- `utils/settings.ts` — user settings
- `utils/challenge-link.ts` — challenge link HMAC
- `utils/session.ts` — session management
- `utils/dda.ts` — dynamic difficulty adjustment
- `utils/haptics.ts` — haptic feedback
- `utils/boss-engine.ts` — boss event singleton
- `utils/feedback-rhythm.ts` — rhythm feedback

### Priority 3: Hooks (React-engine bridge)
- `hooks/useGameEngine.ts` — core bridge
- `hooks/useScoreSubmission.ts` — score submission
- `hooks/useDustEconomy.ts` — dust currency
- `hooks/useEnergyStore.ts` — energy system
- `hooks/useDailyProgress.ts` — daily challenges
- `hooks/useInputHandler.ts` — input normalization
- `hooks/useScreenStateMachine.ts` — screen transitions
- `hooks/useBackground.ts` — background lifecycle
- `hooks/useAudio.ts` — audio context
- `hooks/useSettings.ts` — settings hook
- `hooks/useTranslation.ts` — i18n
- `hooks/useUIFlags.ts` — feature flags
- `hooks/useFocusTrap.ts` — a11y focus trap
- `hooks/useOffsetCursor.ts` — cursor offset

### Priority 4: Config
- `config/gameBalance.ts` — balance constants
- `config/difficulty.ts` — difficulty definitions
- `config/gridPatterns.ts` — grid patterns
- `config/powerupWeights.ts` — powerup weights
- `config/dailyObjective.ts` — daily objectives

### Priority 5: Components (high-risk areas only)
- `components/Screens/GameOver.tsx` — score display, submission
- `components/Screens/StartScreen.tsx` — game start flow
- `components/HUD/GameArea.tsx` — game area, cell rendering
- `components/Layout/BackgroundController.tsx` — background lifecycle
- `components/Settings/SettingsDrawer.tsx` — settings UI

## What to Look For

### Security
- XSS vectors (innerHTML, dangerouslySetInnerHTML, eval, new Function)
- State tampering (can players manipulate scores, unlocks, achievements?)
- Input validation (user input sanitized before use?)
- localStorage/sessionStorage consistency (game state = sessionStorage)
- QuotaExceededError handling (safeSet wrapper on growing writes)
- Challenge-link HMAC bypass paths
- Firebase auth token handling

### Correctness
- Stale closures in hooks (refs vs closures for rapid interactions)
- Race conditions (async operations on unmounted components)
- Cell array mutation (must be replaced each tick, never mutated)
- Generation counter usage (callbacks referencing cell indices)
- Boss event state machine (enter/exit transitions, timer cleanup)
- RNG seeding (mulberry32, deterministic for replays)
- Difficulty curve smoothness (no sudden spikes)
- Score calculation overflow/underflow

### Performance
- RAF loops checking `document.hidden`
- Double RAF scheduling (queue growth)
- Canvas resize inside RAF (backing store clear)
- WebGL context loss handlers
- React.memo on expensive components
- Bundle size (manual chunks strategy)

### Error Handling
- try-catch on localStorage/IDB operations
- JSON.parse safety
- Fetch error handling
- Firebase operation error handling

## Output Format

For each issue found, use this exact format:

```
N.

File Path & Line Number: [file:line]

Issue Type: [Security | Logic | Performance | Error Handling | Stability | Code Quality]

Severity: [Critical | High | Medium | Low]

Description: [1-2 sentence description of the bug]

Context Code Snippet:
[relevant code showing the problem]

Suggested Fix: [brief description of how to fix]
```

## Rules
1. **Only report REAL bugs with traceable code paths** — not style preferences or design suggestions
2. **Don't report server-only issues** (Cloudflare Workers, Firestore rules) — client-side code only
3. **Don't report things that are by-design** (client-trusted game state, HMAC placeholder in client)
4. **JavaScript is single-threaded** — "race conditions" between synchronous code are not real bugs
5. **Check if guards/handlers already exist** before claiming they're missing — read the actual code
6. **Report severity honestly** — Critical = data loss or security breach, High = broken feature, Medium = edge case bug, Low = code quality
7. **Don't report `import.meta.env.*` as secrets** — Vite inlines these at build time, they're safe to expose
8. **Don't report Firebase client-side keys as secrets** — apiKey/projectId are identifiers, not credentials
9. **Don't report `.agent/skills/` lint errors** — those are pre-existing from autoskills, not DTP code
10. **Trace the actual code path** — don't assume a guard is missing; verify by reading the code

## Deliverable

A structured list of ALL issues found, grouped by severity (Critical first, then High, Medium, Low). Include file paths and line numbers for every finding. Be thorough — read every file listed above.
