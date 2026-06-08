# Don't Touch Purple — Project Structure

## Root Layout
```
deploy-ready/
├── App.tsx                  # Root component — state machine, screen routing, all top-level logic
├── main.tsx                 # React entry point
├── index.html               # HTML shell
├── engine/                  # Pure game logic (zero React imports)
├── components/              # React UI layer
├── hooks/                   # Custom React hooks (bridge between engine and UI)
├── services/                # Firebase, Sentry, analytics, web-vitals
├── config/                  # Game balance, difficulty, patterns, achievements, powerup weights
├── utils/                   # Utilities: IDB, score-sync, achievements, audio, haptics, etc.
├── contexts/                # React contexts (DustContext, GameContext)
├── styles/                  # CSS files (game.css, enhancements.css, dtp-components.css, etc.)
├── locales/                 # i18n JSON files (en, es, fr, ja, pt)
├── workers/                 # Cloudflare Worker (score-validator.ts + wrangler.toml)
├── functions/               # Firebase Cloud Functions (src/index.ts)
├── __tests__/               # Vitest unit tests
├── e2e/                     # Playwright E2E tests (smoke.spec.ts)
├── scripts/                 # Build/release/asset scripts (.mjs, .sh)
├── public/                  # Static assets (icons, manifest.json, sw.js, og-image)
├── assets/                  # SVG icon sets (achievements, powerups, themes, UI)
├── types/                   # Global TypeScript declarations
├── website/                 # Separate Next.js marketing site
└── tools/SkillOpt/          # Internal Python ML tooling (unrelated to game runtime)
```

## Engine Layer (`engine/`)
Pure TypeScript, no React. The core game loop.

```
engine/
├── GameEngine.ts            # Main class: tick loop, tap handling, pause/resume, snapshot emission
├── DifficultyScaler.ts      # computeMs(), speedLabel(), mulberry32 RNG, spin config
├── types.ts                 # All shared engine types (GameSnapshot, PlayerState, ActiveCell, etc.)
└── subsystems/
    ├── TickProcessor.ts     # Per-tick logic: cell spawning, timers, boss triggers
    ├── CellLifecycle.ts     # spawnActive(), activeToCellsP() — cell state transitions
    ├── ScoreTracker.ts      # calculateTapScore(), calculateStreakBonus(), checkStreakMilestone()
    ├── EventOrchestrator.ts # Boss event sequencing, inversion, blackout
    └── BotController.ts     # AI bot logic for bot assist mode
```

**Key pattern:** GameEngine exposes a `subscribe(fn)` event bus. React hooks listen via `useGameEngine`. Engine never imports React.

## Components Layer (`components/`)
```
components/
├── HUD/                     # In-game overlays: GameArea, PlayerPanel, Hearts, EnergyBar, BossOverlay
├── Screens/                 # Full-screen views: StartScreen, GameOver, PauseOverlay, LoadingScreen, etc.
├── Backgrounds/             # 19 WebGL/OGL animated backgrounds (lazy-loaded)
├── Settings/                # SettingsDrawer, DevOverlay, QuickSettings, ElasticSlider
├── Shop/                    # ShopPanel, SpotlightCard
├── Leaderboard/             # LeaderboardPanel, ChampionSpotlight
├── Animations/              # Drop animations: EnergyDrop, FreezeDrop, ShieldDrop
├── Cell/                    # Cell component (index.tsx)
├── UI/                      # Shared: Icon, LottiePlayer, FilterTabs
└── ErrorBoundary.tsx        # Top-level + ChunkErrorBoundary for lazy panels
```

## Hooks Layer (`hooks/`)
Bridge between engine and React UI.
- `useGameEngine` — wraps GameEngine, exposes snapshot, start/pause/resume, tap handlers
- `useScreenStateMachine` — manages screen transitions (loading → menu → playing → gameover)
- `useGameSettings` — muted, volume, haptics, screenShake, reducedMotion
- `useThemeSettings` — theme, colorblind mode, FPS display, fullscreen
- `useDustEconomy` — dust balance, add/spend, bot accuracy
- `useEnergyStore` — energy count, regen, refill
- `useUIFlags` — all boolean UI visibility flags (showSettings, showShop, etc.)
- `useInputHandler` — keyboard input mapping to tap/hold events
- `useDevToolsState` — dev mode, god mode, freeze time, rotation speed

## Config Layer (`config/`)
- `difficulty.ts` — GAME constants (MAX_HEARTS, TOAST_DURATION_MS, LS_KEYS, etc.)
- `gameBalance.ts` — scoring weights, powerup probabilities
- `gridPatterns.ts` — STAGES[], EVOLVE_PATTERNS[] — grid layouts per stage
- `achievementDefs.ts` — ACHIEVEMENT_DEFS[] — all 50+ achievement definitions
- `dailyObjective.ts` — daily challenge generation, progress tracking
- `powerupWeights.ts` — SHOP_TRAILS, powerup spawn weights
- `difficultyOverrides.ts` — per-tick difficulty overrides

## Services Layer (`services/`)
- `firebase.ts` — Auth, Firestore, Analytics, App Check; fbFetchTop20Global, fbLogEvent, fbGetStreak
- `sentry.ts` — safeSentry wrapper (addBreadcrumb, setTags, setContext, captureException)
- `gameanalytics.ts` — initGA, logProgressionEvent
- `web-vitals.ts` — webVitalsMonitor.startMonitoring()
- `metrics.ts` — custom performance metrics
- `errorLogger.ts` — structured error logging

## Utils Layer (`utils/`)
Key utilities:
- `achievements.ts` — achievementSystem (register, check, unlock, load)
- `score-sync.ts` — scoreSync.queue() — offline-first score submission with IDB fallback
- `idb.ts` — IndexedDB wrapper for offline queue
- `audio.ts` — audioEngine (init, play sounds)
- `haptics.ts` — haptics.tap/success/shield/freeze/combo
- `dda.ts` — DynamicDifficulty — adaptive difficulty based on player reaction times
- `boss-engine.ts` — bossEngine (activate, deactivate, onSafeTap, combo)
- `seed-manager.ts` — seedManager (initOrRestore, daily seed)
- `challenge-link.ts` — challengeLink (generate, parseAndVerify)
- `settings.ts` — settingsManager (subscribe, get, set)
- `storage.ts` — safeGetJSON, safeSet (localStorage wrappers)
- `privacy.ts` — privacyManager (consent, deleteAll)
- `visual-a11y.ts` — visualA11y (icon helpers, colorblind utilities)

## Architectural Patterns

### State Machine (App.tsx)
App.tsx is the top-level state machine. Screen transitions flow through `useScreenStateMachine`. All game state flows down from `useGameEngine` snapshot.

### Event Bus (GameEngine)
GameEngine uses a `Set<listener>` event bus. Events: `tick`, `phaseChange`, `gameOver`, `damage`, `shake`, `sound`, `toast`, `scoreFloat`, `cellAnim`, `rareStart`, `bombDefused`, `botTap`, `qualityDowngrade/Upgrade`.

### Snapshot Pattern
Every tick, GameEngine emits a `GameSnapshot` — a plain object clone of all game state. React re-renders only when snapshot changes (RAF-gated dirty flag).

### Lazy Loading
All WebGL backgrounds, SettingsDrawer, ShopPanel, LeaderboardPanel, DevOverlay are `React.lazy()` loaded. Firebase is lazy-imported via `getFirebase()` singleton.

### CSS Custom Properties (Design Tokens)
All theming via CSS vars: `--theme-purple`, `--theme-accent`, `--theme-bg`, `--theme-text`, `--cell-1p`, `--motion-scale`, `--particles-enabled`. MD3-inspired token system (see DESIGN.md).

### Clock Domain Convention
- `Date.now()` — real-time state (energy regen, bomb expiry, login streaks)
- `performance.now()` — sub-frame timing (FPS, animation deltas, hit pause)
- Game ticks — internal engine clock
Never mix domains without explicit conversion.
