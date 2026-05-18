# Autonomous Run — Tier 2 Visual Polish

## Before Running
```bash
cd "C:\Users\user\My Drive\Documents\MSC\Development\donttouchpurple\deploy-ready"
openclaude --dangerously-skip-permissions
```

## Prompt to Give
```
Read AUTONOMOUS-RUN.md and execute all tasks in order. Commit after each logical chunk. Don't ask for permission. If tests fail, fix them. When done, push the branch and update errorlog16-5.md.
```

## Tasks (in order)

### 1. Wire Dead CSS Features (~15 min)
- [ ] ScoreDisplay: set `data-streak` on combo-wrap when streak >= 7
- [ ] DustWidget: detect dust increase, apply `dust--gained` class transiently
- [ ] ScoreDisplay: apply `hud-val--speed-high` class when speed is high
- [ ] Cell: define `.ice-hit-flash` CSS (white flash overlay, radial gradient)
- [ ] Hearts: add `.heart--gain` CSS class (sparkle/scale-up on medpack)

### 2. Fix Heart Loss Animation Target (~5 min)
- [ ] Hearts.tsx: change anim target from `Math.ceil(displayHealth) - 1` to `displayHealth` (the heart becoming empty, not the one remaining)

### 3. Score Count-Up in HUD (~20 min)
- [ ] ScoreDisplay: track prevScore in ref, animate from prev to current over ~150ms
- [ ] Use requestAnimationFrame with overshoot curve
- [ ] Add brief scale(1.08) bump on each increment

### 4. PwrBar Fade-Out on Expiry (~10 min)
- [ ] PwrBar: add fade-out transition instead of hard-cut to null
- [ ] Change interval from 200ms to 50ms for smoother drain

### 5. Staggered GameOver Buttons (~15 min)
- [ ] GameOver: use framer-motion staggerChildren for AGAIN, SHARE, icon buttons
- [ ] 80-100ms delay between each

### 6. Powerup Icon Entrance Bounce (~15 min)
- [ ] Cell: add framer-motion spring animation for powerup icons on spawn
- [ ] Scale from 0 to 1 with spring physics

### 7. HowToPlay Entrance Animations (~15 min)
- [ ] HowToPlay: use framer-motion stagger for rows
- [ ] Title: character animation or fade-in

### 8. Boss Health Bar (~30 min)
- [ ] Create BossHealthBar component
- [ ] Read from bossEngine.state via dtp:boss:update event
- [ ] Show shield hits / maxShield as progress bar
- [ ] Animate on shield break
- [ ] Position above grid during boss phases

### 9. Powerup Screen Effects (~20 min)
- [ ] Freeze: blue tint vignette on screen edges, 2s duration
- [ ] Shield: golden glow, 1s duration
- [ ] Multiplier: radial flash, 0.5s duration
- [ ] Use CSS classes toggled by engine events

### 10. StartScreen Liquid Glass Button (~20 min)
- [ ] Adapt Apple Tahoe Liquid Glass concept from 21st.dev
- [ ] Apply to PLAY button with glassmorphism + backdrop-filter
- [ ] SVG displacement map effect

### 11. NewBestBanner Enhancement (~15 min)
- [ ] GameOver: add confetti particles or gold gradient for new personal best
- [ ] More celebratory than current minimal text

### 12. Reduced Motion Selective Targeting (~15 min)
- [ ] performance.css: only target decorative animations, not functional transitions
- [ ] Keep screen changes, modal opens, state transitions

### 13. Final Verification (~10 min)
- [ ] Run `pnpm test` — all 136 tests should pass
- [ ] Run `pnpm typecheck` — note pre-existing App.tsx error
- [ ] Update errorlog16-5.md with Tier 2 status
- [ ] Commit all changes
- [ ] Push branch

## Total Estimated Time: ~3 hours

## If Something Goes Wrong
- Tests fail: fix the failing test, don't skip it
- Type error: fix it or document it in errorlog
- Build fails: check imports, fix missing dependencies
- Unsure about design: make a reasonable choice and document it
