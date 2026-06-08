# Don't Touch Purple — Tech Stack

## Languages & Runtimes
- TypeScript 5.2+ (strict mode, `noEmit` typecheck)
- React 18.3 (not 19 — package.json pins `^18.3.1`)
- Node.js 22 | 24 (CI matrix)
- Python 3.x (tools/SkillOpt only — not part of game runtime)

## Build System
- **Vite 7.3** — dev server + production bundler
- **Rollup** (via Vite) — manual chunk splitting:
  - `react-vendor` — React + ReactDOM
  - `firebase` — Firebase SDK
  - `framer-motion` — animation library
  - `lottie` — dotlottie-web
  - `sentry` — Sentry SDK
  - `analytics` — GameAnalytics
  - `bg-effects` — WebGL backgrounds
  - `heavy-panels` — Shop + Leaderboard
  - `settings-panel` — Settings drawer
  - `game-core` — engine + utils + hooks + components
  - `services-monitoring` — errorLogger, metrics, web-vitals
- **Terser** — minification (drops console.log/info/debug, debugger)
- **Brotli + Gzip** compression via `vite-plugin-compression`
- **PostCSS** + autoprefixer + cssnano
- **rollup-plugin-visualizer** — bundle analysis at `dist/stats.html`

## Runtime Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react / react-dom | ^18.3.1 | UI framework |
| firebase | ^12.13.0 | Auth, Firestore, Hosting, Analytics, App Check |
| @sentry/react | ^10.51.0 | Error tracking |
| framer-motion | ^12.38.0 | UI animations |
| gsap | ^3.15.0 | Advanced animations (backgrounds) |
| ogl | ^1.0.11 | WebGL renderer for backgrounds |
| @lottiefiles/dotlottie-web | ^0.74.0 | Lottie animations |
| gameanalytics | ^4.4.7 | Player analytics |
| web-vitals | ^4.2.1 | Core Web Vitals monitoring |
| @microsoft/clarity | ^1.0.2 | Session recording |

## Dev Dependencies (key)
| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^7.3.3 | Build tool |
| vitest | ^4.1.6 | Unit testing |
| @playwright/test | ^1.59.1 | E2E testing |
| typescript | ^5.2.2 | Type checking |
| eslint | ^9.39.4 | Linting |
| prettier | (via eslint-plugin-prettier) | Formatting |
| wrangler | ^4.92.0 | Cloudflare Workers CLI |
| semantic-release | ^23.0.8 | Automated releases |
| @vitest/coverage-v8 | 4.1.6 | Coverage reports |

## Backend / Infrastructure
- **Firebase** — Auth (anonymous + Google), Firestore (leaderboard, streaks), Hosting, Analytics, App Check
- **Cloudflare Workers** — `workers/score-validator.ts` — leaderboard proxy + score validation
- **Firebase Cloud Functions** — `functions/src/index.ts`
- **GitHub Actions** — CI (`ci.yml`), release (`release.yml`), bundle size check (`bundle-size.yml`), website deploy (`website-deploy.yml`)

## Testing
- **Vitest 4** — unit tests in `__tests__/` (161 tests passing)
  - `vitest.config.ts` — jsdom environment, setup in `test/setup.ts`
  - Coverage via `@vitest/coverage-v8`
- **Playwright** — E2E smoke tests in `e2e/smoke.spec.ts`
  - `playwright.config.ts` — multi-browser (Chromium, WebKit)

## Package Manager
- **pnpm** (lockfile: `pnpm-lock.yaml`)
- pnpm overrides: `ws >=8.20.1`, `onnx-proto>protobufjs 7.5.8`

## Development Commands
```bash
pnpm dev              # Dev server with HMR at http://localhost:5173
pnpm build            # tsc + vite build → dist/
pnpm preview          # Preview production build
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run (unit tests)
pnpm test:coverage    # vitest run --coverage
pnpm test:e2e         # playwright test
pnpm test:e2e:ui      # playwright test --ui
pnpm lint             # eslint --fix
pnpm format           # prettier --write
pnpm analyze          # build + open dist/stats.html
pnpm check:bundle     # node scripts/check-bundle-size.mjs
pnpm ship             # bash scripts/ship.sh (full release flow)
pnpm semantic-release # automated changelog + version bump
```

## Environment Variables
Defined in `.env`, `.env.local`, `.env.production`, `.env.example`:
- Firebase config keys (`VITE_FIREBASE_*`)
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — Sentry sourcemap upload (build-time only)
- `__APP_VERSION__` — injected at build time from `package.json`

## PWA
- `public/manifest.json` — PWA manifest
- `public/sw.js` — Service worker (version injected at build: `dtp-v{version}`)
- Offline-capable via service worker + IDB score queue

## Linting / Formatting
- `.eslintrc.json` / `eslint.config.js` — ESLint 9 flat config
- `.prettierrc` — Prettier config
- `lint-staged.config.js` — pre-commit hooks via lint-staged

## Release
- `semantic-release` with `@semantic-release/changelog`, `@semantic-release/git`, `@semantic-release/github`
- `.releaserc.json` — release config
- `CHANGELOG.md` — auto-generated
