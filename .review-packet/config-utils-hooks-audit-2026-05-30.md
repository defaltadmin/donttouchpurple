# Config/Utils/Hooks/Contexts/Styles Audit — 2026-05-30

15 findings: 1 Critical, 1 High, 6 Medium, 7 Low

## Critical (1)

### FINDING 1 — loginClaimedToday always returns false
- **File:** hooks/useDailyProgress.ts:242
- **Issue:** `handleLoginStreakClaim` writes with `new Date().toDateString()` ("Fri May 30 2026") but `loginClaimedToday` compares against `new Date().toISOString().slice(0, 10)` ("2026-05-30"). These NEVER match. Login streak popup re-triggers every session, inflates rewardsBadgeCount by 1.
- **Fix:** Standardize on `toISOString().slice(0, 10)` everywhere.

## High (1)

### FINDING 2 — Inconsistent date formats in useDailyProgress
- **File:** hooks/useDailyProgress.ts:78,90,111,150,157
- **Issue:** Three different date formats: toDateString() (local), toISOString() (UTC). Login streak resets at local midnight, daily challenges reset at UTC midnight. Systems desync for non-UTC users.
- **Fix:** Standardize all on UTC `toISOString().slice(0,10)`.

## Medium (6)

### FINDING 3 — Non-constant-time HMAC comparison in state-guard
- **File:** utils/state-guard.ts:59-60
- **Issue:** `toBase64url(expected) === sig` is string comparison, not constant-time. Vulnerable to timing attack.
- **Fix:** Use `crypto.subtle.verify('HMAC', key, sigBytes, dataBytes)`.

### FINDING 4 — addDust race condition in DustContext
- **File:** contexts/DustContext.tsx:65-69
- **Issue:** `next` is still 0 when dustRef.current is updated (setState callback runs async). Rapid calls produce wrong dust amounts.
- **Fix:** Update dustRef.current inside setDust callback.

### FINDING 5 — spendDust success flag set inside setState callback
- **File:** contexts/DustContext.tsx:72-78
- **Issue:** `success` flag set async inside setState. Fallback reads stale ref.
- **Fix:** Check synchronously against dustRef.current before setDust.

### FINDING 6 — GameContext provider value not memoized
- **File:** contexts/GameContext.tsx:59-71
- **Issue:** Provider value object recreated every render. All consumers re-render on every snapshot.
- **Fix:** Wrap in useMemo.

### FINDING 7 — "F" key toggles FPS in input fields
- **File:** hooks/useThemeSettings.ts:71-79
- **Issue:** No input field guard. Typing "f" in name field toggles FPS overlay.
- **Fix:** Check e.target is not INPUT/TEXTAREA.

### FINDING 8 — spendEnergy double-spend race
- **File:** hooks/useEnergyStore.ts:52-59
- **Issue:** Guard reads stale energyDataRef.current. Two rapid calls both pass guard, decrement below zero.
- **Fix:** Move guard inside setEnergyData callback.

## Low (7)

### FINDING 9 — Duplicate .toast animation (CSS cascade)
- **File:** styles/game.css:202 + styles/enhancements.css:495
- **Fix:** Remove game.css version (dead code).

### FINDING 10 — Duplicate .rare-splash-text animation
- **File:** styles/game.css:162-168 + styles/enhancements.css:515-527
- **Fix:** Remove game.css version.

### FINDING 11 — Debug red outline in production
- **File:** styles/performance.css:61-65
- **Fix:** Guard with dev-only media query or attribute.

### FINDING 12 — Raw localStorage.setItem bypasses safeSet
- **Files:** hooks/useDustEconomy.ts:49,62,65, hooks/useGameEngine.ts:32, hooks/useDailyProgress.ts:98, config/keybindings.ts:75
- **Fix:** Replace with safeSet(). Line 98 has zero error handling.

### FINDING 13 — loadInitialDust called twice
- **File:** contexts/DustContext.tsx:58,63
- **Fix:** Compute once, share result.

### FINDING 14 — useGameSettings audio sync only runs on mount
- **File:** hooks/useGameSettings.ts:17-22
- **Fix:** Remove eslint-disable or document intent.

### FINDING 15 — achievements.ts reads localStorage directly
- **File:** utils/achievements.ts:35
- **Fix:** Use safeGet for consistency.
