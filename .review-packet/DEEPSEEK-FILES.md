# DeepSeek — Files to Review

## Game (Don't Touch Purple v7.7.0)

Give DeepSeek these files:

### Core Engine
1. `engine/GameEngine.ts` — Main game loop, player state, boss events
2. `engine/subsystems/TickProcessor.ts` — Cell spawning, difficulty scaling
3. `engine/subsystems/CellLifecycle.ts` — Click handling, special cells
4. `engine/subsystems/BotController.ts` — Bot AI
5. `engine/subsystems/EventOrchestrator.ts` — Event coordination
6. `engine/subsystems/ScoreTracker.ts` — Score calculation
7. `engine/DifficultyScaler.ts` — Difficulty curve
8. `engine/types.ts` — All type definitions

### Config
9. `config/gameBalance.ts` — Balance constants
10. `config/difficulty.ts` — Difficulty config
11. `config/achievementDefs.ts` — 33 achievement definitions
12. `config/gridPatterns.ts` — Grid patterns
13. `config/powerupWeights.ts` — Powerup spawn weights

### React Layer
14. `components/App.tsx` — Main app state machine
15. `hooks/useGameEngine.ts` — Engine ↔ React bridge
16. `components/Screens/StartScreen.tsx` — Start screen
17. `components/Screens/GameOver.tsx` — Game over screen
18. `components/HUD/GameArea.tsx` — Grid render area
19. `components/Cell/index.tsx` — Cell rendering + spark canvas
20. `components/Backgrounds/ElasticWarp.tsx` — Default background

### Services
21. `services/firebase.ts` — Firebase init
22. `services/firestoreService.ts` — Firestore CRUD
23. `services/monitoring.ts` — Unified monitoring
24. `services/sentry.ts` — Sentry config

### Workers
25. `workers/score-validator.ts` — Cloudflare Worker (score validation, JWT, rate limiting)

### Utilities
26. `utils/state-guard.ts` — HMAC session signing
27. `utils/score-sync.ts` — Score sync queue
28. `utils/challenge-link.ts` — Challenge links
29. `utils/i18n.ts` — Internationalization
30. `utils/settings.ts` — Settings manager
31. `utils/achievements.ts` — Achievement logic
32. `utils/perf-monitor.ts` — Performance monitoring

### Context
33. `HANDOFF.md` — Complete project handoff
34. `CHANGELOG.md` — Change log
35. `package.json` — Dependencies

---

## Corp Site (MSC Arabia)

Give DeepSeek these files:

1. `MSCArabia.com/index.html` — Complete site (~3600 lines)
2. `MSCArabia.com/functions/api/contact.js` — Contact form handler
3. `MSCArabia.com/_headers` — Security headers + CSP
4. `MSCArabia.com/404.html` — Custom 404
5. `MSCArabia.com/privacy-policy.html` — Privacy policy
6. `MSCArabia.com/cookie-policy.html` — Cookie policy
7. `MSCArabia.com/sitemap.xml` — Sitemap
8. `MSCArabia.com/robots.txt` — Robots config
9. `MSCArabia.com/HANDOFF.md` — Project handoff
