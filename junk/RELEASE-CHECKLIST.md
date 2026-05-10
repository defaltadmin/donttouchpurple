# 📦 v6.0.0 Release Checklist

## Pre-Release Validation
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `pnpm test` → 100% pass
- [ ] `pnpm test:e2e` → Chrome & WebKit pass
- [ ] `pnpm build` → Bundle < 600KB limit, no stray `console.*`
- [ ] Manual Playtest: Boss phases, inversion, hold/bomb timers accurate
- [ ] Mobile: Tap latency < 20ms, rotation lock works, haptics trigger
- [ ] PWA: Add to Homescreen, offline mode loads cached shell
- [ ] Accessibility: Screen reader announces HUD, focus trap in modals, reduced motion respected

## Post-Release Monitoring (First 48h)
- [ ] GitHub Actions → Deploy successful
- [ ] Error tracking → `dtp:errors` queue empty in DevTools
- [ ] Analytics → `game_start` events logging, consent toggle respected

## Rollback Plan (If needed)
```bash
git revert HEAD~1
git tag -d v6.0.0
git push origin :refs/tags/v6.0.0
```
