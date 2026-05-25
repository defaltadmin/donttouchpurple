# DTP Config & Build Source — For DeepSeek Review

Configuration, balance, build setup, keybindings.


---
## `config/gameBalance.ts`
---

export const BALANCE = {
  rare: {
    triggerInterval: 50,
    warnThreshold: 3,
    minScore: 50,
    modCheck: 4,
    chance: 0.35,
    minTurns: 5,
    bonusTurns: 4,
  },

  bot: {
    minDustToStart: 30,
    baseCostPerTap: 3,
    baseDelayMs: 200,
    minDelayMs: 80,
    delayReductionPerTap: 0.5,
    defaultAccuracy: 0.85,
    checkIntervalMs: 1000,
  },

  survival: {
    interval: 20,
    lateThreshold: 200,
    midThreshold: 120,
    lateAmount: 5,
    midAmount: 3,
    earlyAmount: 2,
  },

  boss: {
    shieldBaseHits: 5,
    shieldBonusHits: 3,
  },

  bomb: {
    minScore: 100,
    spawnChance: 0.12,
    fuseTimeMs: 2000,
    warningTimeMs: 700,
  },

  shuffle: {
    minInterval: 40,
    bonusInterval: 20,
    secondShuffleChance: 0.35,
    slideCleanupMs: 250,
  },

  cells: {
    earlyGame: {
      graceTicks: 15,
    },
  },
} as const;



---
## `config/difficulty.ts`
---

// ─── Difficulty scaling constants ────────────────────────────────
export const DIFFICULTY = {
  INIT_MS:    2000,
  MIN_MS:     420,   // raised floor (was 380) — slightly slower ceiling
  DECAY_EXP:  0.968, // gentler decay (was 0.960)
  DECAY_EVERY: 6,    // slower steps (was 5)
  // Spin / rotation
  SPIN_BASE_DURATION: 14,
  SPIN_SPEED_CAP:     2.2,
  SPIN_GROWTH:        0.05, // +5% faster per level
  SPIN_EPOCH_LEVELS:  4,    // direction flips every N levels
} as const;

// ─── Game balance constants ───────────────────────────────────────
export const GAME = {
  MAX_HEARTS:       5,
  STAGE_TAPS_NEEDED: 12,
  MAX_ENERGY:       5,
  ENERGY_REGEN_MS:  15 * 60 * 1000, // 15 min
  DUST_PER_ENERGY:  50,
  // Timing
  HUMAN_LIMIT_TICK: 420,
  SURVIVAL_BONUS_START_TICK: 60,
  HOLD_TIMEOUT_MS:  5000,
  KEY_PRESS_VISUAL_MS: 150,
  TOAST_DURATION_MS: 2200,
  PWR_TOAST_DURATION_MS: 2000,
  HEART_ANIM_MS:    420,
  SHAKE_ANIM_MS:    400,
  LEVELUP_BADGE_MS: 2200,
  RARE_SPLASH_MS:   5000,
  GAME_OVER_DELAY_MS: 400,
  CELL_ANIM_MS:     500,
  SHIELD_DROP_MS:   1100,
  TAP_BUFFER_MS:    50,
} as const;

// ─── localStorage keys ────────────────────────────────────────────
export const LS_KEYS = {
  P1_KEYS:      "dtp-keys-p1",
  P2_KEYS:      "dtp-keys-p2",
  LB_CLASSIC:   "dtp-lb-classic",
  LB_EVOLVE:    "dtp-lb-evolve",
  PRIVACY_OK:   "dtp-privacy-ok",
  PLAYER_NAME:  "dtp-player-name",
  DUST:         "dtp-dust",
  ENERGY:       "dtp-energy-data",
  SHOP:         "dtp-shop",
  WEEKLY_BONUS: "dtp-weekly-bonus",
  STORED_PWR:   "dtp-stored-pwr",
  BEST_CLASSIC: "dtp-best-classic",
  BEST_EVOLVE:  "dtp-best-evolve",
  ONBOARD_SEEN: "dtp-onboarding-v1",
} as const;


---
## `config/keybindings.ts`
---

// ─── Default key layouts ──────────────────────────────────────────
// P1: Row1: 1 2 3 4 | Row2: q w e r | Row3: a s d f | Row4: z x c v
export const DEFAULT_P1_KEYS: string[] = [
  "1","2","3","4",
  "q","w","e","r",
  "a","s","d","f",
  "z","x","c","v",
];

// P2: Row1: 7 8 9 0 | Row2: u i o p | Row3: j k l ; | Row4: m , . /
export const DEFAULT_P2_KEYS: string[] = [
  "7","8","9","0",
  "u","i","o","p",
  "j","k","l",";",
  "m",",",".","/",
];

// ─── Key → grid cell mapping ──────────────────────────────────────
// Maps physical 4×4 key layout to grid cell index for any grid size.
// Keys are stored as a flat 16-element array (row-major, 4 cols wide).
export function getKeyForCell(
  _player: 1 | 2,
  cellIdx: number,
  cols: number,
  keys: string[]
): string {
  const row = Math.floor(cellIdx / cols);
  const col = cellIdx % cols;
  const keyIdx = row * 4 + col;
  return keys[keyIdx] || "";
}

// Returns the grid cell index for a given key press, or -1 if not found.
export function gridIndexFromKey(
  key: string,
  cols: number,
  rows: number,
  mask: number[] | null,
  keys: string[]
): number {
  const k = key.toLowerCase();
  const validSlots = mask ?? Array.from({ length: cols * rows }, (_, i) => i);
  for (const i of validSlots) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    if (keys[row * 4 + col] === k) return i;
  }
  return -1;
}

// ─── Key label formatting ─────────────────────────────────────────
export function toLabel(k: string): string {
  if (!k) return "?";
  if (/^[a-z]$/.test(k)) return k.toUpperCase();
  const m: Record<string, string> = {
    " ": "SPC", escape: "ESC", backspace: "⌫",
    enter: "↵", tab: "↹", ",": ",",
  };
  return m[k] ?? (k.length === 1 ? k : k.slice(0, 3).toUpperCase());
}

// ─── localStorage helpers for key persistence ─────────────────────
export function loadKeys(lsKey: string, def: string[]): string[] {
  try {
    const r = localStorage.getItem(lsKey);
    if (r) {
      const p = JSON.parse(r);
      if (Array.isArray(p) && p.length === 16) return p;
    }
  } catch { /* ignore */ }
  return [...def];
}

export function saveKeys(lsKey: string, val: string[]): void {
  try { localStorage.setItem(lsKey, JSON.stringify(val)); } catch { /* ignore */ }
}


---
## `vite.config.ts`
---

/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Build plugins array — Sentry sourcemap upload only when auth token is present
const plugins = [
  react(),
  compression({ algorithm: 'brotliCompress', threshold: 10240 }),
  compression({ algorithm: 'gzip' }),
  visualizer({ open: false, filename: 'dist/stats.html', gzipSize: true, brotliSize: true }),
  {
    name: 'sw-version-inject',
    writeBundle() {
      const swPath = 'dist/sw.js'
      try {
        let sw = readFileSync(swPath, 'utf-8')
        sw = sw.replaceAll('dtp-v__SW_VERSION__', `dtp-v${pkg.version}`)
        writeFileSync(swPath, sw)
        console.log(`[sw-inject] Cache name set to dtp-v${pkg.version}`)
      } catch (e) {
        console.warn('[sw-inject] Failed to inject version into sw.js', e)
      }
    }
  }
]

// Conditionally add Sentry sourcemap upload plugin when auth token is available
if (process.env.SENTRY_AUTH_TOKEN) {
  const { sentryVitePlugin } = await import('@sentry/vite-plugin')
  plugins.push(
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: pkg.version },
      sourcemaps: { assets: './dist/**' },
    })
  )
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
    sourcemap: 'hidden',
    minify: 'terser',
    terserOptions: { compress: { drop_debugger: true, pure_funcs: ['console.log', 'console.info', 'console.debug'] }, mangle: { safari10: true }, format: { comments: false } },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Game Analytics - separate chunk
          if (id.includes('gameanalytics')) return 'analytics';

          // React ecosystem
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('@lottiefiles') || id.includes('dotlottie')) return 'lottie';
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('@sentry')) return 'sentry';
            if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
            if (id.includes('lucide') || id.includes('icon')) return 'ui-icons';
            // Other vendor libraries in smaller chunks
            if (id.includes('date-fns') || id.includes('lodash')) return 'utils-vendor';
            return 'vendor';
          }

          // Monitoring services (independent, no circular deps — keep separate for lazy load)
          if (id.includes('services/') &&
              (id.includes('errorLogger') || id.includes('metrics') || id.includes('web-vitals'))) return 'services-monitoring';

          // Game engine + core logic + UI + services (circular deps between all these
          // groups make separate chunks impossible — Rollup merges them with warnings)
          if (id.includes('engine/') || id.includes('subsystems/') ||
              id.includes('utils/') || id.includes('components/') ||
              id.includes('hooks/') || id.includes('services/')) return 'game-core';

          // UI components by feature (non-circular subsets)
          if (id.includes('Backgrounds/')) return 'bg-effects';
          if (id.includes('Shop/') || id.includes('Leaderboard/')) return 'heavy-panels';
          if (id.includes('Settings/')) return 'settings-panel';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = (assetInfo.name ?? '').split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/img/[name]-[hash].[ext]';
          }
          return 'assets/[ext]/[name]-[hash].[ext]';
        },
      },
    },
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
    }
  },
})


---
## `tsconfig.json`
---

{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vite/client"]
  },
  "include": [
    "main.tsx",
    "App.tsx",
    "vite.config.ts",
    "components/**/*.ts",
    "components/**/*.tsx",
    "config/**/*.ts",
    "contexts/**/*.ts",
    "contexts/**/*.tsx",
    "engine/**/*.ts",
    "hooks/**/*.ts",
    "input/**/*.ts",
    "services/**/*.ts",
    "utils/**/*.ts",
    "__tests__/**/*.ts",
    "test/**/*.ts",
    "*.d.ts",
    "types/**/*.d.ts"
  ],
  "references": []
}


---
## `package.json`
---

{
  "name": "dont-touch-purple",
  "version": "7.5.3",
  "private": true,
  "description": "Fast-paced reflex grid-tapping game. Two modes, 50+ achievements, global leaderboard, 12 WebGL backgrounds. React 19 + TypeScript + Firebase.",
  "type": "module",
  "license": "MIT",
  "author": "defaltadmin",
  "repository": {
    "type": "git",
    "url": "https://github.com/defaltadmin/donttouchpurple.git"
  },
  "homepage": "https://dont-touch-purple.web.app",
  "bugs": {
    "url": "https://github.com/defaltadmin/donttouchpurple/issues"
  },
  "keywords": [
    "game",
    "arcade",
    "reflex",
    "reaction-time",
    "webgl",
    "pwa",
    "react",
    "typescript",
    "firebase",
    "vite"
  ],
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "build": "tsc && vite build",
    "analyze": "pnpm build && npx open-cli dist/stats.html",
    "check:bundle": "node scripts/check-bundle-size.mjs",
    "deploy": "pnpm build && powershell -Command \"Compress-Archive -Path dist\\* -DestinationPath htdocs.zip -Force\"",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,json,css}\"",
    "prepare": "echo 'prepare script'",
    "lint-staged": "lint-staged",
    "ship": "bash scripts/ship.sh",
    "semantic-release": "semantic-release",
    "release:patch": "npm version patch && git push && git push --tags",
    "release:minor": "npm version minor && git push && git push --tags",
    "audit:lighthouse": "npx lighthouse http://localhost:4173 --output=json --output=html --output-path=./dist/audit.html --quiet",
    "release": "bash scripts/release-v7.sh",
    "release:major": "npm version major && git push && git push --tags && bash scripts/release-v6.sh"
  },
  "dependencies": {
    "@lottiefiles/dotlottie-web": "^0.74.0",
    "@microsoft/clarity": "^1.0.2",
    "@sentry/react": "^10.51.0",
    "firebase": "^12.13.0",
    "framer-motion": "^12.38.0",
    "gameanalytics": "^4.4.7",
    "gsap": "^3.15.0",
    "ogl": "^1.0.11",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "web-vitals": "^4.2.1"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260517.1",
    "@eslint/js": "^9.39.4",
    "@playwright/test": "^1.59.1",
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/git": "^10.0.1",
    "@semantic-release/github": "^10.0.7",
    "@semantic-release/npm": "^12.0.1",
    "@sentry/vite-plugin": "^5.3.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^25.6.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^8.59.2",
    "@typescript-eslint/parser": "^8.59.2",
    "@vitejs/plugin-react": "^4.7.0",
    "@vitest/coverage-v8": "4.1.6",
    "ai": "^6.0.184",
    "autoprefixer": "^10.5.0",
    "cssnano": "^8.0.1",
    "eslint": "^9.39.4",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-prettier": "^5.5.5",
    "eslint-plugin-react": "7",
    "eslint-plugin-react-hooks": "^5.2.0",
    "globals": "^16.5.0",
    "jimp": "^1.6.1",
    "jsdom": "^29.0.2",
    "postcss": "^8.5.14",
    "rollup-plugin-visualizer": "^7.0.1",
    "semantic-release": "^23.0.8",
    "terser": "^5.47.1",
    "typescript": "^5.2.2",
    "typescript-eslint": "^8.59.3",
    "vite": "^7.3.3",
    "vite-plugin-compression": "^0.5.1",
    "vite-plugin-purgecss": "^0.2.13",
    "vitest": "^4.1.6",
    "workers-ai-provider": "^3.1.14",
    "wrangler": "^4.92.0"
  },
  "pnpm": {
    "overrides": {
      "ws": ">=8.20.1",
      "onnx-proto>protobufjs": "7.5.8"
    }
  }
}


---
## `main.tsx`
---

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { scoreSync } from './utils/score-sync'
import { GameProvider } from './contexts/GameContext'
import { DustProvider } from './contexts/DustContext'

declare const __APP_VERSION__: string;
const IS_PROD = window.location.hostname === 'game.mscarabia.com';

if (IS_PROD) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
      release: __APP_VERSION__,
      sendDefaultPii: false,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: 0.1,
      tracePropagationTargets: [
        /^https:\/\/game\.mscarabia\.com/,
      ],
    });
    // Initialize safeSentry wrapper so error reporting works
    import('./services/sentry').then(m => m.getSentry()).catch(() => {});
  }).catch(() => {});
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Initialize score sync
scoreSync.init();
if (import.meta.hot) {
  import.meta.hot.dispose(() => scoreSync.destroy());
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GameProvider>
        <DustProvider>
            <App />
        </DustProvider>
      </GameProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)


---
## `index.html`
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />

    <!-- ── Primary Meta ───────────────────────────────────── -->
    <meta name="description" content="Don't Touch the Purple — a fast-paced browser reflex game. Tap safe colors, dodge purple, unlock upgrades. Free to play." />
    <meta name="keywords" content="reflex game, browser game, reaction game, arcade, free game, don't touch purple" />
    <meta name="author" content="MSC Arabia" />
    <meta name="robots" content="index, follow" />

    <!-- ── Open Graph (Facebook, WhatsApp, LinkedIn) ─────── -->
    <meta property="og:type"        content="website" />
    <meta property="og:url"         content="https://game.mscarabia.com/" />
    <meta property="og:title"       content="Don't Touch the Purple" />
    <meta property="og:description" content="Fast-paced reflex game. Tap safe colors. Don't touch purple. Free to play." />
    <meta property="og:image"       content="https://game.mscarabia.com/og-image.png" />
    <meta property="og:image:width"  content="1280" />
    <meta property="og:image:height" content="720" />
    <meta property="og:site_name"   content="Don't Touch the Purple" />
    <meta property="og:locale"      content="en_US" />

    <!-- ── Twitter / X Card ──────────────────────────────── -->
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:url"         content="https://game.mscarabia.com/" />
    <meta name="twitter:title"       content="Don't Touch the Purple" />
    <meta name="twitter:description" content="Fast-paced reflex game. Tap safe colors. Don't touch purple. Free to play." />
    <meta name="twitter:image"       content="https://game.mscarabia.com/og-image.png" />

    <!-- ── Canonical ─────────────────────────────────────── -->
    <link rel="canonical" href="https://game.mscarabia.com/" />

    <!-- Microsoft Clarity: initialized via services/clarity.ts -->
    <!-- Set VITE_CLARITY_PROJECT_ID in .env or InfinityFree env vars -->

    <!-- Preconnect to font CDN for faster FCP -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap" /></noscript>

    <link rel="preload" as="image" href="/og-image.png" type="image/png" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="mask-icon" href="/mask-icon.svg" color="#c026d3" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
     
    <title>Don't Touch the Purple</title>

    <!-- Meta Tags for Mobile -->
    <meta name="theme-color" content="#c026d3" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

    <!-- Mobile safe area & touch highlight fix -->
    <style>
      html, body { height: 100%; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; overscroll-behavior: none; }
      #root { height: 100%; display: flex; flex-direction: column; }
    </style>

    <!-- CSP is set via HTTP headers in firebase.json for production.
         Not included here as meta tag CSP blocks Vite dev server scripts. -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>


---
## `utils/state-guard.ts`
---

import { logger } from './logger';

export const stateGuard = {
  parse<T>(raw: string | null, fallback: T, validator?: (d: unknown) => boolean): T {
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (validator && !validator(parsed)) throw new Error('Schema mismatch');
      return parsed as T;
    } catch (e) {
      logger.warn('State corruption detected, applying fallback', (e as Error).message);
      return fallback;
    }
  },

  safeStore(key: string, data: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if ((e as Error).name === 'QuotaExceededError') {
        logger.error('Storage quota exceeded, clearing non-essential keys');
        // Only clear large/non-essential keys — preserve achievements, dust, settings
        const safeToClear = ['dtp:errors', 'dtp:perf'];
        safeToClear.forEach(k => localStorage.removeItem(k));
        try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* still full after cleanup */ }
      }
    }
  },

  sanitize<T extends Record<string, unknown>>(raw: unknown, defaults: T): T {
    if (!raw || typeof raw !== 'object') return defaults;
    const clean: Record<string, unknown> = {};
    for (const k of Object.keys(defaults)) {
      const val = (raw as Record<string, unknown>)[k];
      // Reject mismatched types — use default instead
      if (val != null && typeof val !== typeof defaults[k]) {
        clean[k] = defaults[k];
      } else {
        clean[k] = val ?? defaults[k];
      }
    }
    return clean as T;
  }
};


---
## `utils/idb.ts`
---

export interface QueuedScore {
  id?: number;
  score: number;
  initials: string;
  mode: string;
  tick?: number;
  attempts?: number;
  nextRetry?: number;
  queuedAt?: number;
  [key: string]: unknown;
}

export const idb = {
  DB_NAME: 'dtp-offline-queue',
  STORE: 'scores',
  _db: null as IDBDatabase | null,

  async open(): Promise<IDBDatabase> {
    if (this._db) {
      // Liveness check: if the connection was closed externally, reopen
      try { void this._db.objectStoreNames; } catch { this._db = null; }
    }
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE)) {
          db.createObjectStore(this.STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => {
        this._db = req.result;
        this._db.onclose = () => { this._db = null; };
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async enqueue(score: QueuedScore): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result >= 100) {
          const toEvict = countReq.result - 99; // evict enough to bring below cap
          let evicted = 0;
          const cursorReq = store.openCursor();
          cursorReq.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor && evicted < toEvict) {
              cursor.delete();
              evicted++;
              cursor.continue();
            } else {
              store.add({ ...score, queuedAt: Date.now() });
            }
          };
          cursorReq.onerror = () => { try { store.add({ ...score, queuedAt: Date.now() }); } catch { /* store corrupted */ } };
        } else {
          store.add({ ...score, queuedAt: Date.now() });
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async peekAll(): Promise<QueuedScore[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).getAll();
      req.onsuccess = () => resolve((req.result || []) as QueuedScore[]);
      req.onerror = () => reject(req.error);
    });
  },

  async removeItems(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      for (const id of ids) store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /** Atomically remove some items and update others in a single transaction. */
  async removeAndUpdate(
    removeIds: number[],
    updates: { id: number; patch: Partial<QueuedScore> }[],
  ): Promise<void> {
    if (removeIds.length === 0 && updates.length === 0) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      for (const id of removeIds) store.delete(id);
      for (const { id, patch } of updates) {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const existing = getReq.result;
          if (existing) store.put({ ...existing, ...patch });
        };
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async count(): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  close() {
    this._db?.close();
    this._db = null;
  }
};


---
## `utils/analytics.ts`
---

import { logger } from './logger';
import { safeSet } from './storage';
import { safeSentry } from '../services/sentry';
import { logDesignEvent } from '../services/gameanalytics';

type EventName = 'game_start' | 'game_over' | 'retry' | 'pause' | 'settings_change' | 'achievement_unlocked';
interface GameEvent { name: EventName; ts: number; payload?: Record<string, unknown>; }

const QUEUE_KEY = 'dtp:events';
const MAX_QUEUE = 50;

export const analytics = {
  track(name: EventName, payload: Record<string, unknown> = {}) {
    if ((navigator as { doNotTrack?: string }).doNotTrack === '1') return;
    const evt: GameEvent = { name, ts: Date.now(), payload };
    const queue = this._getQueue();
    queue.push(evt);
    if (queue.length > MAX_QUEUE) queue.shift();
    safeSet(QUEUE_KEY, JSON.stringify(queue));
    this._flush();
  },

  _getQueue(): GameEvent[] {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
  },

  async _flush() {
    const queue = this._getQueue();
    if (!queue.length || !navigator.onLine) return;
    try {
      // Transmit each event before clearing the queue
      for (const evt of queue) {
        // Forward to GameAnalytics as a design event (prod only, per IS_PROD guard)
        logDesignEvent(`analytics/${evt.name}`, 1);
        // Add as Sentry breadcrumb for error correlation (no-op if Sentry not yet loaded)
        safeSentry.addBreadcrumb({
          message: `analytics: ${evt.name}`,
          category: 'analytics',
          level: 'info',
          data: evt.payload as Record<string, unknown>,
        });
        // In dev mode, log the full payload for debugging
        if (import.meta.env.DEV) {
          logger.debug('[Analytics]', evt.name, JSON.stringify({ name: evt.name, ...evt.payload }));
        }
      }
      safeSet(QUEUE_KEY, '[]');
      logger.debug('Analytics flushed', queue.length, 'events');
    } catch { logger.warn('Analytics flush failed'); }
  }
};


---
## `utils/haptics.ts`
---

let _enabled = true;

export function setHapticsEnabledForEngine(enabled: boolean): void {
  _enabled = enabled;
}

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

function vibrate(pattern: number | number[]): void {
  if (!_enabled || !canVibrate()) return;
  try { navigator.vibrate(pattern); } catch { /* vibrate blocked or unsupported */ }
}

// For Capacitor: use @capacitor/haptics Haptics.vibrate() instead of navigator.vibrate
// when running in a native container. The web fallback above handles PWA/browser.

export const haptics = {
  tap: () => vibrate(8),
  success: () => vibrate([12, 8, 8]),
  damage: () => vibrate([20, 30, 20]),
  bomb: () => vibrate([40, 20, 60, 20, 40]),
  /** Shield activation — firm double-tap */
  shield: () => vibrate([15, 40, 15]),
  /** Freeze — staccato shiver */
  freeze: () => vibrate([6, 8, 6, 8, 6]),
  /** Multiplier pickup — rising buzz */
  multiplier: () => vibrate([8, 6, 12, 6, 18]),
  /** Combo streak — escalating intensity */
  combo: (streak: number) => {
    const intensity = Math.min(streak * 3, 30);
    vibrate([intensity, 10, intensity]);
  },
  /** Level up — celebratory burst */
  levelUp: () => vibrate([10, 15, 10, 15, 30]),
  /** Medpack heal — gentle pulse */
  medpack: () => vibrate([12, 20, 12]),
};


---
## `utils/achievements.ts`
---

import { logger } from './logger';
import { privacyManager } from './privacy';
import { analytics } from './analytics';
import { safeSet } from './storage';

export interface Achievement { id: string; name: string; desc: string; icon: string; unlocked: boolean; date?: string; }
const ACH_KEY = 'dtp:achievements';
const TOAST_KEY = 'dtp:achievement-toasts';

export const achievementSystem = {
  registry: new Map<string, Achievement>(),
  unlocked: new Set<string>(),

  register(ach: Achievement) { if (!this.registry.has(ach.id)) this.registry.set(ach.id, ach); },

  isUnlocked(id: string) { return this.unlocked.has(id); },

  check(id: string, condition: () => boolean): boolean {
    if (this.unlocked.has(id) || !this.registry.has(id)) return false;
    if (condition()) {
      this.unlock(id);
      return true;
    }
    return false;
  },

  unlock(id: string) {
    const ach = this.registry.get(id);
    if (!ach || this.unlocked.has(id)) return;
    ach.unlocked = true;
    ach.date = new Date().toISOString();
    this.unlocked.add(id);
    safeSet(ACH_KEY, JSON.stringify([...this.unlocked]));
    try {
      const queue = JSON.parse(localStorage.getItem(TOAST_KEY) || '[]');
      queue.push({ id, name: ach.name, icon: ach.icon, desc: ach.desc, ts: Date.now() });
      safeSet(TOAST_KEY, JSON.stringify(queue.slice(-5)));
    } catch {
      // Corrupt toast queue — reset and retry
      safeSet(TOAST_KEY, JSON.stringify([{ id, name: ach.name, icon: ach.icon, desc: ach.desc, ts: Date.now() }]));
    }
    logger.info('🏆 Achievement unlocked:', ach.name.replace(/[\r\n]/g, ''));
    window.dispatchEvent(new CustomEvent('dtp:achievement', { detail: ach }));
    if (privacyManager.getConsent()) {
      analytics.track('achievement_unlocked', { id: ach.id });
    } else {
      logger.debug('Telemetry skipped for achievement unlock (consent revoked)');
    }
  },

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(ACH_KEY) || '[]');
      this.unlocked = new Set(saved);
      // Sync registry entries so isUnlocked checks on registry objects work
      for (const id of this.unlocked) {
        const ach = this.registry.get(id);
        if (ach) ach.unlocked = true;
      }
    } catch (err) {
      logger.warn('[achievements] Failed to load, resetting:', err);
      this.unlocked = new Set();
    }
  },

  getProgress(): { total: number; unlocked: number; list: Achievement[] } {
    const list = [...this.registry.values()];
    return { total: list.length, unlocked: this.unlocked.size, list };
  }
};
