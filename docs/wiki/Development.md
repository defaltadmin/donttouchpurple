# Development

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Language | TypeScript 5 |
| Build Tool | Vite 6 |
| Animation | GSAP, Framer Motion, CSS keyframes, dotlottie-web, OGL |
| Backend | Firebase (Firestore, Analytics, Auth, App Check) |
| Testing | Vitest (unit), Playwright (E2E) |
| CI/CD | GitHub Actions → GitHub Pages |
| Security | CSP headers, Cloudflare Worker score validation |

## Architecture

```
App.tsx (screen state machine, game lifecycle orchestration)
├── engine/           Pure game logic, no React dependencies
│   ├── GameEngine.ts         Main loop, player state, boss events
│   └── subsystems/           TickProcessor, CellLifecycle, BossEngine
├── components/       React UI
│   ├── Screens/              StartScreen, GameOver, HowToPlay, Shop
│   ├── HUD/                  Score, Energy, Health, Combo badges
│   └── Backgrounds/          12 GPU-accelerated canvas themes
├── hooks/            React ↔ Engine bridge
├── config/           Game balance, difficulty curves, patterns
├── utils/            Audio, analytics, i18n, haptics, session
└── styles/           CSS with custom properties (MD3 tokens)
```

## Development Setup

```bash
git clone https://github.com/defaltadmin/donttouchpurple.git
cd donttouchpurple
pnpm install
pnpm dev            # Start dev server
pnpm typecheck      # TypeScript check
pnpm test           # Run unit tests
pnpm build          # Production build
```

## Key Design Decisions

- **Engine isolation**: Game logic lives in `engine/` with zero React imports. This keeps it testable and portable.
- **4 animation systems**: CSS for ambient loops, GSAP for imperative sequences, framer-motion for React transitions, dotlottie for pre-made assets.
- **Custom i18n**: Type-safe `I18nKey` union type ensures compile-time checking of all translation keys.
- **Manual chunks**: Vite splits GSAP, framer-motion, and Lottie into separate lazy-loaded chunks.
- **Score validation**: Server-side Cloudflare Worker validates scores against impossible thresholds.

## Contributing

See [CONTRIBUTING.md](https://github.com/defaltadmin/donttouchpurple/blob/main/CONTRIBUTING.md) for guidelines.
