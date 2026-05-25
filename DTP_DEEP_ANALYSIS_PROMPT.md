# Don't Touch Purple — Deep Analysis Prompt
**Version:** v7.5.3 | **Stack:** React 18 + TypeScript + Vite + Firebase + Cloudflare Workers
**Purpose:** Full deep-dive analysis for bugs, errors, stability, QOL, architecture, and roadmap.

---

## CONTEXT: What This Game Is

"Don't Touch Purple" is a browser-based reflex arcade game. Players tap colored cells on a grid — avoid purple (or the current "danger" color), collect powerups, survive boss events, and climb a global leaderboard. Two game modes: **Classic** (3×3 grid, time-limited) and **Evolve** (grid grows from 3×3 to 5×5 as you progress). Supports 1P and 2P, keyboard and touch input, PWA install, Firebase leaderboard, and a dust economy (in-game currency).

---

## CODEBASE STRUCTURE

```
deploy-ready/
├── engine/
│   ├── GameEngine.ts          ← Core game loop, tick scheduler, tap handler, session save/restore
│   ├── DifficultyScaler.ts    ← computeMs(), speedLabel(), mulberry32 RNG, spin config
│   ├── types.ts               ← All shared types: CellType, GameEvent, GameSnapshot, PlayerState
│   └── subsystems/
│       ├── TickProcessor.ts   ← Per-tick logic: cell spawn, boss triggers, bomb timers
│       ├── CellLifecycle.ts   ← spawnActive(), activeToCellsP()
│       ├── ScoreTracker.ts    ← calculateTapScore(), calculateStreakBonus()
│       ├── EventOrchestrator.ts ← Boss event management
│       └── BotController.ts   ← Bot assist logic
├── App.tsx                    ← ~2500-line monolith: all UI state, screen routing, game orchestration
├── hooks/
│   ├── useGameEngine.ts       ← Engine lifecycle, event subscription, React bridge
│   ├── useScreenStateMachine.ts ← Screen transitions (loading→menu→playing→gameover)
│   ├── useEnergyStore.ts      ← Energy regen system
│   ├── useDustEconomy.ts      ← Dust currency
│   ├── useInputHandler.ts     ← Keyboard input mapping
│   └── ...
├── components/
│   ├── HUD/                   ← GameArea, GameHeader, Hearts, BossOverlay, ScoreFloat
│   ├── Screens/               ← StartScreen, GameOver, PauseOverlay, LoadingScreen, etc.
│   ├── Backgrounds/           ← 19 animated canvas/CSS backgrounds (lazy loaded)
│   ├── Shop/                  ← ShopPanel, SpotlightCard
│   ├── Settings/              ← SettingsDrawer, DevOverlay, QuickSettings
│   └── Leaderboard/           ← LeaderboardPanel, ChampionSpotlight
├── config/
│   ├── difficulty.ts          ← GAME constants, LS_KEYS, DIFFICULTY scaling
│   ├── gameBalance.ts         ← Powerup weights, spawn rates
│   ├── gridPatterns.ts        ← STAGES[], EVOLVE_PATTERNS[]
│   └── dailyObjective.ts      ← Daily challenge definitions
├── services/
│   ├── firebase.ts            ← Lazy Firebase init, Firestore, Analytics, Auth, App Check
│   ├── sentry.ts              ← Error tracking
│   └── web-vitals.ts          ← CWV monitoring
├── utils/
│   ├── achievements.ts        ← Achievement system
│   ├── boss-engine.ts         ← Boss combo/shield system
│   ├── dda.ts                 ← Dynamic Difficulty Adjustment
│   ├── score-sync.ts          ← Offline score queue + Firebase submit
│   ├── session.ts             ← Session persistence
│   ├── storage.ts             ← safeGetJSON, safeSet wrappers
│   └── ...30+ utility files
├── workers/
│   └── score-validator.ts     ← Cloudflare Worker (currently unreferenced)
└── __tests__/                 ← 134 unit tests (vitest)
```

---

## KNOWN ISSUES (from existing audit docs — treat as confirmed baseline)

### CRITICAL / HIGH (Tier 1-2)
- **Dual bot tap path**: `BotController.ts` and `TickProcessor.ts` both execute bot taps independently → cells double-clicked, dust double-spent, grid desync
- **`safeReset()` stale player state**: Only resets score/streak/health/active — leaves `anim`, `shield`, `freezeEnd`, `multiplierEnd`, `shieldCount` dirty → powerup bleed between games
- **Snapshot reference leak**: `getSnapshot()` spreads `...this.p1` but doesn't clone `cells: CellType[]` array → `React.memo` misses updates when cell contents change but reference is same
- **`emitSnapshot()` dirty-flag race**: Sets `dirty = false` at start of function, not end → RAF loop can skip frames during phase transitions
- **`_isDisposed` missing on most public methods**: Only `handleTap`, `handleHoldStart`, `handleHoldEnd`, `activateStoredFreeze/Shield` check it — `pause()`, `resume()`, `start()`, `devForce*` do not
- **`scoreSubmittedRef` never reset**: Set to `true` on game over, never reset to `false` → second game in same session never submits to leaderboard
- **`snapshotRef.current?.p1.score`**: Optional chain stops at `p1`, not `.score` → crash if `p1` is undefined at game over
- **`spendEnergy` stale closure**: Reads `energyData.count` from outer closure, not `energyDataRef.current` → energy guard can pass when energy is actually 0

### MEDIUM (Tier 3)
- **`App.tsx` monolith**: ~2500 lines, 50+ state variables, `handleEngineGameOver` is ~100 lines inline
- **`handleEngineGameOver` useCallback deps incomplete**: Missing `wins`, `deaths`, `gamesPlayed`, `best1`, `best2` → stale closures on progress tracking
- **312 lint warnings**: All in `--max-warnings=0` mode — 30+ unused imports, 15+ exhaustive-deps violations, 6+ `no-explicit-any`
- **`IS_PROD` hostname-only check**: Any non-listed hostname silently disables all Firebase writes with no warning
- **`workers/score-validator.ts` unreferenced**: Dead code — either wire to Cloudflare deployment or delete
- **`.env.local` / `.env.production` not gitignored**: Firebase API keys potentially exposed
- **`junk/` directory committed**: Contains old zips, AI prompt archives, coverage reports, `.aider` history

---

## WHAT TO ANALYZE

You are performing a **full deep analysis** of this codebase. Cover ALL of the following:

### 1. BUGS & LOGIC ERRORS
- Identify any remaining bugs not listed above
- Check all state mutation paths for race conditions
- Verify timer/RAF cleanup is complete on every code path (unmount, game over, pause, restart)
- Check for memory leaks: event listeners, intervals, RAF loops, Map/Set growth
- Verify the `holdTimers` Map is always cleaned up (game over, restart, dispose)
- Check `_deltaTimers` array for unbounded growth
- Verify `activeBomb` delta timer is correctly re-registered on session restore
- Check `bossEvent.endsAt` expiry handling during pause/resume
- Verify `rareMode` turnsLeft countdown is correct
- Check `checkStageProgress` — does `pendingStageUpdate` ever get cleared?
- Verify `devSpawnSpecialCell` mutation via `mutable` cast is safe
- Check `restoreSessionSnapshot` RNG fast-forward cap — is `GAME.HUMAN_LIMIT_TICK + 100` sufficient?

### 2. STABILITY & CRASH RISKS
- All `?.` optional chains — are they complete?
- All `JSON.parse` calls — are they wrapped in try/catch?
- All `localStorage` / `sessionStorage` access — are they guarded for private browsing / QuotaExceeded?
- Firebase async operations — are all `.catch()` handlers present?
- What happens if `engineRef.current` is null when a callback fires?
- What happens if the component unmounts during the `GAME_OVER_DELAY_MS` timeout?
- What happens if `start()` is called while a previous game's `_deathCleanupTimer` is still pending?

### 3. PERFORMANCE
- `getSnapshot()` is called every RAF frame — profile the clone cost of `active.map(c => ({...c}))` at 25 cells × 60fps
- `emitSnapshot()` triggers `setSnapshot()` which re-renders the entire tree — is `React.memo` used correctly on `GameArea`, `Cell`, `Hearts`?
- Background components: 19 canvas/CSS animations — are they all properly paused when `shouldAnimateBackground` is false?
- `updatePerformanceMetrics()` runs every RAF frame — is the rolling FPS average (60-sample ring buffer) accurate?
- `scoreFloats` state: `[...prev.slice(-9), newFloat]` — is 9 the right cap? Does it cause visible jank?
- `botTapTimersRef` array: timers are pushed but only cleaned on unmount — does it grow unboundedly during long sessions?
- `devHeatmap` state in `App.tsx`: updated on every tap via `setDevHeatmap(h => ({...h, [i]: ...}))` — this creates a new object every tap even in prod (heatmap is passed to `GameArea` always)

### 4. SECURITY
- `restoreSessionSnapshot`: bounds-clamping is present for score/health/streak — but is `active[]` cell data sanitized? A tampered `type` field could inject an unknown cell type
- `normalizeGlobalScoreEntry` in `firebase.ts`: score is clamped to 9999, initials sanitized — but is `badge` field sanitized before Firestore write?
- `score-validator.ts` (Cloudflare Worker): currently unreferenced — if wired, does it validate the score server-side or just relay?
- `getDeviceId()`: only persists if telemetry consent is granted — but `crypto.randomUUID()` fallback uses `Math.random()` which is not cryptographically secure
- Firebase Security Rules (`firestore.rules`): review for overly permissive write rules on `lb_global` collection
- `challengeLink.generate()`: does it sign the score to prevent tampering?
- `devMode` is gated by `import.meta.env.DEV` in render, but `devGodMode` is a runtime flag — can it be set from the console?

### 5. CODE QUALITY & MAINTAINABILITY
- `App.tsx` god component: propose a concrete extraction plan with hook names and responsibilities
- `GameEngine.ts` constructor: 40+ achievement registrations inline — should be in a separate `registerAchievements()` method or config file
- `_tickCtx` proxy object: 30+ getters/setters that mirror `GameEngine` private fields — is this the right pattern? Consider passing `this` directly to subsystems
- `TickProcessor.processTick()`: what is its complexity? Does it do too much per tick?
- `BotController`: two execution paths (engine-driven vs React-driven `devAutoPlay`) — consolidate
- Naming: `iMult` (speed multiplier), `evolveTick`, `spinLevel` — are these self-documenting?
- `makePS()` function: creates PlayerState — should be a static method on a PlayerState class or factory
- `scheduleTimeout()` vs `addDeltaTimer()`: two different timer systems — when to use which? Document the distinction

### 6. QOL IMPROVEMENTS (Player-Facing)
- **Resume on reload**: Session restore works but requires manual "Resume" button — should auto-resume if session is < 5 min old
- **Score animation**: Score increments instantly — consider a rolling number animation (CSS counter or requestAnimationFrame tween)
- **Streak visual feedback**: Streak counter in HUD only shows at ≥3 — consider showing at ≥1 with color progression
- **Boss event countdown**: `bossEvent.endsAt` is available but no visible timer is shown during boss events
- **Bomb countdown**: `activeBomb.expiresAt` is available — the bomb cell should show a visual countdown ring
- **Hold cell progress**: `holdStart` timestamp is tracked — is a progress ring rendered on the cell?
- **Powerup toast positioning**: `pwrToastP1/P2` — where do these render relative to the grid? Do they overlap cells?
- **Game over screen**: Does it show the peak streak? The best powerup collected? Time survived?
- **Leaderboard**: Only top 20 global — no personal rank shown if outside top 20
- **Daily objective**: Only one objective per day — consider 3 tiered objectives (easy/medium/hard)
- **Colorblind mode**: 4 modes available — are all cell types distinguishable in each mode?
- **Keyboard mode**: Is there visual feedback for which key maps to which cell?
- **2P mode**: Is there a win/loss screen that shows both scores clearly?
- **Accessibility**: Are all interactive elements keyboard-focusable? Are ARIA labels complete?

### 7. QOL IMPROVEMENTS (Developer-Facing)
- **312 lint warnings**: Path to zero — prioritize `exhaustive-deps` (runtime risk) over `no-explicit-any` (type safety)
- **Test coverage**: 134 tests — what is the coverage %? Are `GameEngine.ts` edge cases covered (dispose during game over, session restore with tampered data)?
- **E2E tests**: `e2e/smoke.spec.ts` — does it cover the full game loop (start → tap → game over → leaderboard)?
- **CI pipeline**: `bundle-size.yml` Node 18 (EOL) — update to Node 20
- **`tsconfig.json`**: `services/` and `utils/` not in `include` — add them
- **`junk/` directory**: Should be gitignored or deleted
- **`.env.local` / `.env.production`**: Should be gitignored; rotate any committed keys

### 8. ARCHITECTURE ROADMAP
Propose a phased roadmap:

**Phase 1 — Stability (1-2 days)**
- Fix all Tier 1-2 bugs listed above
- Fix `scoreSubmittedRef` reset
- Fix `safeReset()` full player state reinit
- Fix snapshot cells array clone
- Add `_isDisposed` guards to all public methods

**Phase 2 — Lint Zero (2-3 hours)**
- Remove 30+ unused imports from `App.tsx`
- Fix `exhaustive-deps` warnings
- Replace `any` with proper types

**Phase 3 — Refactor App.tsx (3-5 hours)**
- Extract `useScoreSubmission` hook
- Extract `useDailyProgress` hook
- Extract `useGameOrchestrator` hook
- Reduce `App.tsx` to <500 lines

**Phase 4 — QOL Polish (1-2 days)**
- Bomb countdown ring on cell
- Boss event timer display
- Score roll animation
- Auto-resume on reload
- Personal rank on leaderboard

**Phase 5 — Infrastructure (ongoing)**
- Wire `score-validator.ts` Cloudflare Worker
- Add server-side score validation
- Expand E2E test coverage
- Add Lighthouse CI gate

---

## KEY FILES TO FOCUS ON

1. `engine/GameEngine.ts` — Core engine, ~900 lines
2. `App.tsx` — UI orchestrator, ~2500 lines
3. `hooks/useGameEngine.ts` — React bridge, ~300 lines
4. `engine/subsystems/TickProcessor.ts` — Per-tick logic
5. `engine/subsystems/BotController.ts` — Bot system
6. `services/firebase.ts` — Firebase integration
7. `hooks/useEnergyStore.ts` — Energy system
8. `utils/score-sync.ts` — Offline score queue
9. `firestore.rules` — Security rules
10. `workers/score-validator.ts` — Cloudflare Worker

---

## SPECIFIC QUESTIONS TO ANSWER

1. Is the `_deathCleanupTimer` + `_deathSlowdown` pattern safe against rapid restart? What if `start()` is called before the 600ms cleanup fires?
2. Does `restoreSessionSnapshot` correctly handle the case where `p1.active` contains a `bomb` cell whose `expiresAt` is already in the past?
3. In `_processTap`, the `tappedIsDanger` branch for inversion mode checks `cell.type !== 'purple'` — but what if `rareMode` is active during inversion? Is the danger color correctly resolved?
4. `calculateTapScore` uses `bossEngine.combo.multiplier` — what is the max value of this multiplier? Can it cause score overflow past 9999?
5. The `DynamicDifficulty` (DDA) system adjusts spawn rate — but `computeMs()` uses `tickCount` for difficulty scaling independently. Do these two systems interact correctly or can they fight each other?
6. `seedManager.initOrRestore()` — what happens if the seed in sessionStorage is from a different game mode than the current one?
7. The `InputBuffer` deduplication — what is the window? Can legitimate rapid taps on the same cell be dropped?
8. `haptics.tap()` is called on every `handleTap` — is there a rate limit to prevent haptic spam on rapid taps?
9. `achievementSystem.check()` is called on every safe tap — is this O(1) or does it iterate all achievements?
10. The `autoLowQuality` FPS threshold is hardcoded at 40fps down / 50fps up — is there hysteresis to prevent oscillation?

---

## OUTPUT FORMAT REQUESTED

For each finding, provide:
- **ID**: Unique identifier (BUG-001, PERF-001, QOL-001, etc.)
- **Severity**: Critical / High / Medium / Low / Info
- **File + Line**: Exact location
- **Description**: What is wrong and why
- **Impact**: What breaks or degrades
- **Fix**: Concrete code change or approach
- **Effort**: Time estimate

Then provide a **prioritized implementation roadmap** grouped by:
1. Must fix before next release (Critical/High bugs)
2. Should fix this sprint (Medium bugs + lint zero)
3. Nice to have (QOL + architecture)
4. Long-term (infrastructure + new features)

---

*This prompt was generated from a full codebase read of Don't Touch Purple v7.5.3 on 2026-05-24.*
*Use alongside the source files in `deploy-ready/` for full context.*
