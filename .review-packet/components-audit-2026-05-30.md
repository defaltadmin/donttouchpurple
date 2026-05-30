# Components Audit — 2026-05-30

17 findings: 0 Critical, 2 High, 6 Medium, 9 Low

## High (2)

### FINDING 1 — ShareModal: aria-hidden="true" hides dialog from screen readers
- **File:** components/Screens/ShareModal.tsx:14
- **Issue:** Backdrop `<div>` has `aria-hidden="true"` but is ancestor of `role="dialog"` modal. Entire dialog invisible to assistive technology.
- **Fix:** Remove `aria-hidden="true"` from the backdrop div. `role="dialog"` and `aria-modal="true"` on child are sufficient.

### FINDING 2 — LottiePlayer: onComplete in useCallback deps causes re-initialization every render
- **File:** components/UI/LottiePlayer.tsx:78
- **Issue:** `initDotLottie` has `onComplete` in dep array. Parent passes new closure each render → identity change → useEffect triggers .destroy() + recreate. Visible flicker.
- **Fix:** Store `onComplete` in a ref, remove from useCallback deps.

## Medium (6)

### FINDING 3 — QuickSettings: settings read once in render, no reactivity
- **File:** components/Settings/QuickSettings.tsx:18
- **Issue:** `settingsManager.get()` called once. Toggle clicks update module-level state but React has no signal to re-render.
- **Fix:** Use `useState` + subscription or `useSyncExternalStore`.

### FINDING 4 — PwrBar: RAF loop at ~60fps forces re-render every frame
- **File:** components/HUD/PwrBar.tsx:30-38
- **Issue:** `setNow(Date.now())` every frame for progress drain animation. Could use CSS transition instead.
- **Fix:** Set width via CSS transition, remove RAF loop.

### FINDING 5 — BorderGlow: onReady in useEffect deps causes animation restart
- **File:** components/BorderGlow.tsx:67
- **Issue:** New `onReady` ref each parent render → GSAP timeline rebuilt.
- **Fix:** Store in ref, remove from dep array.

### FINDING 6 — Cell/BombTimer: Hardcoded hex colors
- **File:** components/Cell/index.tsx:51-52,66
- **Issue:** `#ff2200`, `#ff6600`, `#fff` in SVG. Violates CSS vars rule.
- **Fix:** Use CSS custom properties with fallbacks.

### FINDING 7 — Cell spark: Hardcoded hex colors
- **File:** components/Cell/index.tsx:140
- **Issue:** `#ff2200`, `#c026d3` in canvas strokeStyle.
- **Fix:** Read from computed styles at init.

### FINDING 8 — ScoreFloat: Hardcoded hex colors for score tiers
- **File:** components/HUD/ScoreFloat.tsx:47
- **Issue:** `#ff6b6b`, `#ffd93d`, `#ffffff` inline.
- **Fix:** Use CSS vars.

## Low (9)

### FINDING 9 — GameOver NewBestBanner: Hardcoded hex and rgba
- **File:** components/Screens/GameOver.tsx:44,48
- **Fix:** Use `var(--gold)`, `var(--gold-bright)`.

### FINDING 10 — GameOver 2P colors: Hardcoded hex
- **File:** components/Screens/GameOver.tsx:133-134
- **Fix:** Use `var(--color-p1)`, `var(--color-p2)`.

### FINDING 11 — PlayerPanel: Date.now() stale timestamp
- **File:** components/HUD/PlayerPanel.tsx:93
- **Note:** Acceptable — re-renders frequently during gameplay.

### FINDING 12 — RewardsHub: Variable `t` shadows useTranslation `t`
- **File:** components/Screens/RewardsHub.tsx:59,222,261
- **Fix:** Rename param to `task`.

### FINDING 13 — PwrBar: Hardcoded magic numbers for durations
- **File:** components/HUD/PwrBar.tsx:14
- **Fix:** Import from BALANCE config.

### FINDING 14 — NameChangeForm: Unreliable touch detection
- **File:** components/Settings/NameChangeForm.tsx:19
- **Fix:** Use `window.matchMedia('(pointer: fine)')`.

### FINDING 15 — ElasticSlider: RAF loop for animation
- **File:** components/Settings/ElasticSlider.tsx:72-82
- **Fix:** Use CSS transition via ref.

### FINDING 16 — PauseOverlay: Unnecessary setInterval while paused
- **File:** components/Screens/PauseOverlay.tsx:28-31
- **Fix:** Compute `now` once on mount.

### FINDING 17 — PlayerPanel: Extra wrapper div on cells
- **File:** components/HUD/PlayerPanel.tsx:255
- **Fix:** Put key directly on Cell component.

## Summary
| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 2 |
| Medium | 6 |
| Low | 9 |
