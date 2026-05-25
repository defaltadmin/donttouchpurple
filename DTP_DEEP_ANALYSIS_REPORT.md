# Don't Touch Purple — Deep Analysis Report

**Version:** v7.5.3 | **Stack:** React 18 + TypeScript 5 + Vite 7 + Firebase + Cloudflare Workers
**Date:** 2026-05-25 | **Sources:** Claude self-analysis, Amazon Q, Security agent, Architecture agent, Performance analysis

---

## Executive Summary

| Category | Critical | High | Medium | Low | Info | Total |
|----------|----------|------|--------|-----|------|-------|
| Bugs & Logic | 0 | 2 | 1 | 0 | 0 | 3 |
| Stability | 0 | 1 | 2 | 1 | 0 | 4 |
| Performance | 0 | 0 | 2 | 1 | 0 | 3 |
| Security | 0 | 3 | 5 | 4 | 2 | 14 |
| Architecture | 0 | 4 | 5 | 5 | 3 | 17 |
| QOL | 0 | 0 | 3 | 0 | 0 | 3 |
| **Total** | **0** | **10** | **18** | **11** | **5** | **44** |

**Already fixed in this session:** 7 findings from Amazon Q triage (BUG-001, BUG-002, BUG-003, BUG-005, PERF-001, SEC-001 cell type, HYGIENE-001/002)

**New findings requiring action:** 37

---

## 1. BUGS & LOGIC ERRORS

### BUG-001: Dual Bot Tap Path — ALREADY FIXED
- **Status:** Fixed (TickProcessor has zero bot references)
- **Verified:** `TickProcessor.ts` contains no `bot`, `BotController`, or `handleTap` references

### BUG-002: start() During _deathCleanupTimer — ALREADY FIXED
- **Status:** Fixed (`start()` clears `_deathCleanupTimer` at line 331)

### BUG-003: scoreSubmittedRef Never Reset — ALREADY FIXED
- **Status:** Fixed (reset at line 1225 in `startGame()`)

### BUG-004: safeReset() Settings Async Gap — LOW RISK
- **Severity:** Low
- **File:** `engine/GameEngine.ts:515-525`
- **Description:** `safeReset()` calls `import('../utils/settings').then(...)` which is async. During the microsecond gap, the engine could tick with the old settings object.
- **Impact:** Theoretical only — the gap is microseconds and the engine is in "starting" phase, not "playing".
- **Fix:** No action needed. Document if desired.

### BUG-005: pendingStageUpdate Never Cleared — ALREADY FIXED
- **Status:** Fixed (`TickProcessor.ts:128` sets `ref.pendingStageUpdate = false`)

### BUG-006: Inversion + rareMode Danger Color Conflict — FIXED
- **Severity:** High
- **File:** `engine/GameEngine.ts:659`
- **Status:** Fixed this session (`cell.type !== 'purple'` → `cell.type !== danger`)

### BUG-007: activeBomb Delta Timer Stale Closure on Restore — MITIGATED
- **Severity:** Medium
- **File:** `engine/GameEngine.ts:1086-1110`
- **Description:** The bomb delta timer captures `bombRef` (reference to `this.p1` or `this.p2` at restore time). If `start()` is called before bomb expires, `this.p1` is replaced by `makePS()` but `bombRef` still points to old object.
- **Impact:** Mitigated by guard at line 1092: `if (!this.activeBomb || this.activeBomb.idx !== bombIdx)` — if start() is called, `activeBomb` is nulled at line 338, so the guard catches it.
- **Fix:** For belt-and-suspenders, change `bombRef` from a captured variable to a dynamic lookup (`bombPlayer === 1 ? this.p1 : this.p2` inside the callback).

### BUG-008: emitSnapshot() Dirty-Flag Race — NEW
- **Severity:** Medium
- **File:** `engine/GameEngine.ts:388-391`
- **Description:** In the RAF loop, `dirty` is set to `false` at line 389 BEFORE `emitSnapshot()` runs at line 390. If `emitSnapshot()` triggers a listener that sets `dirty = true` again (e.g., through a callback), that flag is correctly preserved. However, if a tick fires between line 389 and 390 (which can't happen in single-threaded JS), the snapshot would be stale. This is actually safe due to JS event loop — **not a real bug**.
- **Fix:** None needed. Document for clarity.

### BUG-009: calculateTapScore Max Multiplier Overflow — NEW
- **Severity:** Low
- **File:** `engine/subsystems/ScoreTracker.ts`
- **Description:** `calculateTapScore()` applies multiplier, streak bonus, and stage bonus. At extreme values (streak 999, multiplier active, stage 3), the score increment per tap could exceed 100. The engine caps `ref.score` at 9999 (line in _processTap), so no overflow past game limit.
- **Impact:** None — bounded by the 9999 cap.
- **Fix:** None needed.

---

## 2. STABILITY & CRASH RISKS

### STAB-001: Component Unmount During GAME_OVER_DELAY_MS — HIGH
- **Severity:** High
- **File:** `App.tsx:1216-1228` (handleEngineGameOver)
- **Description:** `handleEngineGameOver` has a 600ms `setTimeout` for the screen transition. If the user navigates away (back to menu) within those 600ms, the callback fires on an unmounted or re-rendered component, calling `setScreen("gameover")` on a stale closure.
- **Impact:** React state update on unmounted component warning. Could cause ghost gameover screen.
- **Fix:** Track timeout in a ref and clear it on unmount / on menu navigation.

### STAB-002: holdTimers Map — Missing Cleanup on stop() — MEDIUM
- **Severity:** Medium
- **File:** `engine/GameEngine.ts`
- **Description:** `holdTimers` Map entries are created per active hold cell. When `stop()` is called, `holdTimers.clear()` runs. But if a hold timer callback fires after `stop()` but before `clear()`, it could access stale player state.
- **Impact:** Minor — the callback checks `this.phase` and bails. Low probability race.
- **Fix:** Already handled by phase check in hold timer callback.

### STAB-003: IndexedDB Queue — No Size Limit Enforcement in Single Transaction — MEDIUM
- **Severity:** Medium
- **File:** `utils/score-sync.ts`
- **Description:** The IDB queue grows unbounded if the network is down. Each failed score submission re-enqueues. The cap check happens in a separate transaction from the insert, so concurrent writes could exceed the cap.
- **Impact:** IndexedDB storage growth on offline devices. Not a crash risk but a slow leak.
- **Fix:** Use a single readwrite transaction for count+delete+add.

### STAB-004: Firebase Async Operations — Missing .catch() on Some Paths — LOW
- **Severity:** Low
- **File:** `services/firebase.ts`
- **Description:** Most Firebase operations have `.catch()` handlers. However, `fbLogGamePlay()` and `fbLogGameWin()` fire-and-forget. If Firebase is unreachable, these silently fail — which is acceptable.
- **Impact:** None — fire-and-forget is intentional for analytics events.
- **Fix:** None needed.

---

## 3. PERFORMANCE

### PERF-001: devHeatmap State Update in Production — FIXED
- **Status:** Fixed this session (gated behind `devMode`)

### PERF-002: getSnapshot() Cell Clone Frequency — ACCEPTABLE
- **Status:** Verified — `dirty` flag gates cloning to once per tick (~250-800ms), not per frame

### PERF-003: scoreFloats Array Growth — MEDIUM
- **Severity:** Medium
- **File:** `App.tsx`
- **Description:** `setScoreFloats(prev => [...prev.slice(-9), newFloat])` creates a new array on every tap. At rapid tapping (10+ taps/sec), this creates 10+ state updates per second, each triggering a GameArea re-render.
- **Impact:** Potential jank during rapid tapping sequences.
- **Fix:** Batch score float updates or use a ref instead of state for float positions.

### PERF-004: botTapTimersRef Array Growth — LOW
- **Severity:** Low
- **File:** `App.tsx`
- **Description:** `botTapTimersRef.current` grows during bot assist gameplay (stores highlight positions). Entries are cleared after 500ms via setTimeout, but during rapid bot tapping the array can temporarily hold many entries.
- **Impact:** Minor — array is transient and auto-cleansed. No memory leak.
- **Fix:** None needed.

### PERF-005: 19 Background Components — All Respect shouldAnimateBackground — VERIFIED
- **Status:** All background components check `shouldAnimateBackground` and pause RAF when false. Canvas components check `document.hidden`.

### PERF-006: Canvas DPR Scaling — VERIFIED
- **Status:** Components use `setTransform` pattern for DPR, not accumulated `ctx.scale`. PulseField is safe with resize guard. Lightning was fixed in prior session.

### PERF-007: Double RAF Pattern — VERIFIED FIXED
- **Status:** No component schedules RAF at both top and bottom of animate callback.

---

## 4. SECURITY

### SEC-001: Session Snapshot Cell Type Injection — FIXED
- **Severity:** High
- **Status:** Fixed this session (VALID_CELL_TYPES whitelist added)

### SEC-002: Badge Field Firestore Rule Too Permissive — MEDIUM
- **Severity:** Medium
- **File:** `firestore.rules:15-18`
- **Description:** `validBadge()` only checks `string size <= 24`. No character set restriction. The Worker validates `^[a-zA-Z0-9_-]+$` but direct Firestore writes bypass the Worker.
- **Fix:** Add `request.resource.data.badge.matches('^[a-zA-Z0-9_-]*$')` to `validBadge()`.

### SEC-003: Challenge Link HMAC Secret in Client Bundle — HIGH
- **Severity:** High
- **File:** `utils/challenge-link.ts:8-9`
- **Description:** `VITE_CHALLENGE_SECRET` is embedded in the client JS bundle. Any attacker can extract it and forge challenge URLs with arbitrary scores. When the secret is NOT set, signing is disabled entirely.
- **Impact:** Challenge links can be forged. However, challenge URLs only carry display data — they don't write to the leaderboard.
- **Fix:** Move HMAC signing to the Cloudflare Worker. Client requests a signed URL from the API.

### SEC-004: getDeviceId() Math.random() Fallback — LOW
- **Severity:** Low
- **File:** `services/firebase.ts:221,226,231`
- **Description:** Fallback uses `Math.random()` which is not cryptographically secure.
- **Fix:** Use `crypto.getRandomValues(new Uint8Array(16))` as fallback.

### SEC-005: Firestore Tick Formula 25% More Permissive Than Worker — MEDIUM
- **Severity:** Medium
- **File:** `firestore.rules:40-44`
- **Description:** Firestore allows `score <= tick * 15 + 300`. Worker allows `score <= tick * 12 + 300`. Direct Firestore writes (bypassing Worker) get 25% more leeway.
- **Fix:** Align Firestore rule to `tick * 12 + 300`.

### SEC-006: dust_wallet Allows Unlimited Increase — MEDIUM
- **Severity:** Medium
- **File:** `firestore.rules:64-71`
- **Description:** The update rule checks `dust >= 0` and `dust < 10000000` but does NOT check that the new value is ≤ current value. A user can set dust to 9,999,999 at any time.
- **Fix:** Add `request.resource.data.dust <= resource.data.dust` or use Cloud Functions for mutations.

### SEC-007: Practice Mode Scores Submitted to Leaderboard — MEDIUM
- **Severity:** Medium
- **File:** `App.tsx:265,435,547`
- **Description:** `practiceMode` enables `godMode` in the engine config (`godMode: godMode || practiceMode`). Practice mode scores are submitted to the global leaderboard with no differentiation. A user can toggle practice mode and never take damage.
- **Fix:** Guard score submission: `if (practiceMode || godMode) skip scoreSync.queue()`.

### SEC-008: Worker Does Not Validate `aud` Claim — HIGH
- **Severity:** High
- **File:** `workers/score-validator.ts:121-131`
- **Description:** Worker verifies Firebase ID token via `tokeninfo` endpoint but only checks `tokenInfo.sub`. Does NOT verify `tokenInfo.aud` matches the DTP Firebase project.
- **Impact:** A valid ID token from ANY Firebase project could pass validation.
- **Fix:** Add `if (tokenInfo.aud !== env.FIREBASE_PROJECT_ID) return 401`.

### SEC-009: CSP Allows unsafe-inline Styles — LOW
- **Severity:** Low
- **File:** `firebase.json:29`
- **Description:** `style-src 'self' 'unsafe-inline'` is required by React's `style={}` prop. Accepted trade-off.
- **Fix:** Migrate to CSS modules + nonce-based CSP if desired. Not urgent.

### SEC-010: CSP Missing Clarity/GameAnalytics connect-src — LOW
- **Severity:** Low
- **File:** `firebase.json:29`
- **Description:** `connect-src` doesn't include `https://www.clarity.ms` or GameAnalytics endpoints.
- **Fix:** Add missing endpoints to `connect-src`.

### SEC-011: Worker Allows Requests With No Origin Header — LOW
- **Severity:** Low
- **File:** `workers/score-validator.ts:104`
- **Description:** `if (origin && !allowedOrigins.includes(origin))` — requests with no Origin header (curl, scripts) pass through.
- **Fix:** Require Origin header for all POST requests.

### SEC-012: XSS via Player Name — MONITOR
- **Severity:** Info
- **Status:** Currently safe — React auto-escapes all rendering. No `dangerouslySetInnerHTML` on user data.

### SEC-013: Session Snapshot Not Integrity-Protected — MEDIUM
- **Severity:** Medium
- **File:** `engine/GameEngine.ts:1040-1174`
- **Description:** Session snapshot in sessionStorage is plain JSON with no HMAC. A user can modify score, health, streak, seed, and cell types.
- **Impact:** Score inflation via sessionStorage tampering. Bounds-clamping limits the damage but doesn't prevent it.
- **Fix:** Add HMAC signature using a per-session random key stored in memory only.

### SEC-014: Client-Generated sessionId — LOW
- **Severity:** Low
- **File:** `utils/score-sync.ts:22`
- **Description:** `sessionId` is client-generated via `crypto.randomUUID()`. Worker validates format but not server-side issuance.
- **Fix:** Issue session IDs from server if deduplication is critical.

### SEC-015: Firebase API Keys — NOT A VULNERABILITY
- **Severity:** Info
- **Status:** Correctly identified as client-side identifiers. Firebase security via rules + App Check.

---

## 5. ARCHITECTURE & CODE QUALITY

### ARCH-001: App.tsx God Component — CRITICAL (but "Critical" = maintenance risk, not runtime)
- **File:** `App.tsx` (1,928 lines, 66 useState, 54 useEffect, 22 useCallback)
- **Description:** Single component owns all UI state, game orchestration, daily challenges, shop, dev mode, bot assist, energy, rewards, keyboard shortcuts, and more.
- **Extraction Plan:**

| New Hook | Responsibility | State to Extract |
|----------|---------------|-----------------|
| `useGameSession()` | start/pause/resume/goMenu, game mode, engine config | ~12 state vars |
| `usePlayerStats()` | gamesPlayed, best scores, wins, deaths | 5 state + 5 ref |
| `useDailyRewards()` | login streak, challenges, weekly tasks, boss counters | 8 state vars |
| `useShopState()` | shop data, dust economy | 2 state + 1 ref |
| `useAchievementToasts()` | achievement queue, icon map | 1 state + 1 ref |
| `useKeyboardShortcuts()` | all keyboard handlers | 2 ref |
| `useBackgroundSystem()` | background map, equipped bg | 1 memo |

### ARCH-002: Inline Achievement Registrations in Constructor — HIGH
- **File:** `engine/GameEngine.ts:149-194`
- **Description:** 33 inline `achievementSystem.register()` calls spanning 46 lines.
- **Fix:** Extract to `engine/achievements-registry.ts`.

### ARCH-003: _tickCtx Proxy — 34 Properties — MEDIUM
- **File:** `engine/GameEngine.ts:227-262`
- **Description:** Manually-constructed proxy with 26 getter/setter pairs + 8 method references.
- **Fix:** Document the pattern. Don't refactor — the verbosity is the price of the architectural boundary.

### ARCH-004: TickProcessor.processTick() — 200 Lines — MEDIUM
- **File:** `engine/subsystems/TickProcessor.ts:57-257`
- **Fix:** Extract `_processDeltaTimers()`, `_processRareMode()`, `_processPlayerTick()`, `_processBossAndBomb()`, `_processTickMeta()`.

### ARCH-005: BotController — Two Execution Paths — HIGH
- **File:** `engine/subsystems/BotController.ts` + `App.tsx:929-955`
- **Description:** Engine-driven (setInterval) and React-driven (useEffect setTimeout) bot paths.
- **Fix:** Remove React-driven devAutoPlay. Wire through BotController with devMode flag.

### ARCH-006: Non-Self-Documenting Names — LOW
- **Names:** `iMult` → `speedMultiplier`, `evolveTick` → `evolveModeTick`, `spinLevel` → `gridRotationLevel`
- **Fix:** Rename + JSDoc comments.

### ARCH-007: makePS() Placement — LOW
- **File:** `engine/GameEngine.ts:45-56`
- **Fix:** Nit — convert to static method or document as intentionally external.

### ARCH-008: Two Timer Systems — MEDIUM
- **File:** `engine/GameEngine.ts:417-438`
- **Description:** `scheduleTimeout` (wall-clock, skipped during pause) vs `addDeltaTimer` (game-clock, pauses with game).
- **Fix:** Add block comment explaining the distinction and when to use each.

### ARCH-009: tsconfig.json Include — INFO (resolved)
- **Status:** `services/` and `utils/` already in `include` array.

### ARCH-010: .gitignore Gap — LOW
- **Description:** `.agent/` directory is untracked but NOT in `.gitignore`.
- **Fix:** Add `.agent/` to `.gitignore`.

### ARCH-011: CI Node Version — INFO (resolved)
- **Status:** Already using Node [22, 24].

### ARCH-012: workers/score-validator.ts — INFO (resolved)
- **Status:** Not dead code. Has wrangler.toml, is deployed.

### ARCH-013: useScoreSubmission.ts — Unused Hook — MEDIUM
- **File:** `hooks/useScoreSubmission.ts` (167 lines)
- **Description:** Never imported. Contains duplicate state/logic of App.tsx's handleEngineGameOver.
- **Fix:** Delete the file.

### ARCH-014: handleEngineGameOver — 122 Lines — HIGH
- **File:** `App.tsx:474-596`
- **Description:** Largest inline callback. Handles: screen transition, Sentry, dust, Firebase events, GA, win/death tracking, localStorage, machine state, best score, share message, score submission, daily/weekly progress.
- **Fix:** Extract to `useGameSession()` hook.

### ARCH-015: Duplicate Score Path — HIGH
- **File:** `App.tsx:540-556` vs `hooks/useScoreSubmission.ts:78-156`
- **Description:** Two identical score submission paths. The hook one is dead code.
- **Fix:** Delete `useScoreSubmission.ts`.

### ARCH-016: BotController setInterval vs Engine Tick — MEDIUM
- **File:** `engine/subsystems/BotController.ts:43`
- **Description:** Bot uses its own setInterval, not the engine tick. At high speeds, bot may miss cells.
- **Fix:** Drive bot from inside `processTick()`.

### ARCH-017: Dual Communication Channels — MEDIUM
- **File:** `App.tsx:1123-1148,1171-1185`
- **Description:** Engine uses both `engine.subscribe()` and `window.dispatchEvent(CustomEvent)` for boss/daily events.
- **Fix:** Route all communication through `engine.subscribe()`. Add boss event types to GameEvent union.

### ARCH-018: Inline IIFEs in JSX — LOW
- **File:** `App.tsx:1455-1462,1772-1785`
- **Fix:** Extract to useMemo or small sub-components.

### ARCH-019: useEffect Ordering — LOW
- **File:** `App.tsx:205-1200`
- **Description:** 54 useEffects not consistently organized.
- **Fix:** Group into labeled sections with block comments.

### ARCH-020: GameEngine Class Size — HIGH
- **File:** `engine/GameEngine.ts` (1,252 lines, 50+ private fields, 30+ methods)
- **Fix:** Further extraction: `AchievementChecker`, `SessionManager`, `TapProcessor`.

### ARCH-021: React 18 vs 19 Docs Mismatch — INFO
- **Description:** `package.json` has React 18.3.1 but AGENTS.md says "React 19".
- **Fix:** Update AGENTS.md to say React 18.

---

## 6. QUALITY OF LIFE

### QOL-001: No Bomb Countdown Ring — MEDIUM
- **Description:** Active bomb cells show a bomb icon but no visual countdown timer. Players have no urgency cue.
- **Fix:** Add a circular progress ring around bomb cells showing time remaining.

### QOL-002: No Boss Event Timer — MEDIUM
- **Description:** Storm/inversion/blackout events have no visible countdown. Players don't know how long to survive.
- **Fix:** Add a timer bar or countdown number to the HUD during boss events.

### QOL-003: Score Submits on 0-Score Games — LOW
- **Description:** `addDust(earned, 'GameOver')` runs even for 0-score games. The Firebase log event fires regardless.
- **Fix:** Gate dust logging on `earned > 0`.

---

## 7. HYGIENE (Already Resolved)

| ID | Status | Evidence |
|----|--------|----------|
| HYGIENE-001 | Fixed | `.gitignore` has `.env`, `.env.local`, `.env.production` |
| HYGIENE-002 | Fixed | `.gitignore` has `junk/` |
| HYGIENE-003 | Verified | `score-validator.ts` is deployed, not dead code |
| LINT-001 | Fixed | 0 errors, 0 warnings achieved this session |

---

## Recommended Fix Priority

### Phase 1 — Quick Wins (< 30 min each)
1. **SEC-007**: Gate practice mode score submission (2 min)
2. **SEC-008**: Validate `aud` claim in Worker (5 min)
3. **SEC-002**: Add badge regex to Firestore rule (2 min)
4. **SEC-005**: Align Firestore tick formula (2 min)
5. **BUG-007**: Belt-and-suspenders bombRef fix (5 min)
6. **ARCH-010**: Add `.agent/` to .gitignore (1 min)
7. **ARCH-013/015**: Delete unused useScoreSubmission.ts (1 min)
8. **QOL-003**: Gate dust logging on earned > 0 (1 min)

### Phase 2 — Medium Effort (30 min – 2 hrs each)
9. **STAB-001**: Track gameover timeout ref, clear on unmount (15 min)
10. **SEC-006**: Add dust_wallet monotonic check to Firestore rule (15 min)
11. **SEC-011**: Require Origin header in Worker (15 min)
12. **PERF-003**: Batch or ref-ify scoreFloats (30 min)
13. **ARCH-002**: Extract achievement registrations (30 min)
14. **QOL-001**: Bomb countdown ring on cells (1 hr)
15. **QOL-002**: Boss event timer in HUD (1 hr)
16. **ARCH-008**: Document timer system distinction (15 min)
17. **ARCH-017**: Unify engine→UI communication (2 hrs)

### Phase 3 — Large Refactors (2+ hrs each)
18. **ARCH-001**: App.tsx hook extraction (4-6 hrs)
19. **ARCH-014**: Extract handleEngineGameOver (1 hr)
20. **ARCH-005**: Consolidate bot execution paths (1 hr)
21. **ARCH-004**: Extract processTick sub-methods (2 hrs)
22. **SEC-003**: Move challenge HMAC to Worker (2 hrs)
23. **SEC-013**: Add HMAC to session snapshot (2 hrs)
24. **ARCH-020**: Further GameEngine decomposition (4+ hrs)

---

## Findings Cross-Reference (All Sources)

| ID | Source | Severity | Status |
|----|--------|----------|--------|
| BUG-001 | Amazon Q | Critical | Already fixed |
| BUG-002 | Amazon Q | Critical | Already fixed |
| BUG-003 | Amazon Q | Critical | Already fixed |
| BUG-004 | Amazon Q | Critical | Low risk, no fix |
| BUG-005 | Amazon Q | High | Already fixed |
| BUG-006 | Amazon Q | High | **Fixed this session** |
| BUG-007 | Amazon Q | High | Mitigated |
| BUG-008 | Self | Medium | Safe (JS event loop) |
| BUG-009 | Self | Low | Bounded by 9999 cap |
| STAB-001 | Self | High | **Open** |
| STAB-002 | Self | Low | Handled by phase check |
| STAB-003 | Self | Medium | **Open** |
| STAB-004 | Self | Low | Intentional fire-and-forget |
| PERF-001 | Amazon Q | Medium | **Fixed this session** |
| PERF-002 | Amazon Q | Medium | Acceptable |
| PERF-003 | Self | Medium | **Open** |
| PERF-004 | Self | Low | Transient, auto-cleansed |
| PERF-005 | Self | Info | Verified |
| PERF-006 | Self | Info | Verified |
| PERF-007 | Self | Info | Verified |
| SEC-001 | Amazon Q + Security | High | **Fixed this session** |
| SEC-002 | Security | Medium | **Open** |
| SEC-003 | Security | High | **Open** |
| SEC-004 | Amazon Q + Security | Low | **Open** |
| SEC-005 | Security | Medium | **Open** |
| SEC-006 | Security | Medium | **Open** |
| SEC-007 | Security | Medium | **Open** |
| SEC-008 | Security | High | **Open** |
| SEC-009 | Security | Low | Accepted trade-off |
| SEC-010 | Security | Low | **Open** |
| SEC-011 | Security | Low | **Open** |
| SEC-012 | Security | Info | Monitor |
| SEC-013 | Security | Medium | **Open** |
| SEC-014 | Security | Low | **Open** |
| SEC-015 | Security | Info | Not a vulnerability |
| ARCH-001–021 | Architecture | Various | **Open** (17 items) |
| QOL-001–003 | Amazon Q + Self | Medium | **Open** |
| HYGIENE-001–003 | Amazon Q | Various | Already fixed |
| LINT-001 | Amazon Q | Medium | **Fixed this session** |
