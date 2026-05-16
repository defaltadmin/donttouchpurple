/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
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
  ],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'terser',
    terserOptions: { compress: { drop_console: true, drop_debugger: true, pure_funcs: ['console.log', 'console.info'] }, mangle: { safari10: true }, output: { comments: false } },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Game Analytics - separate chunk
          if (id.includes('gameanalytics')) return 'analytics';

          // React ecosystem
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('lucide') || id.includes('icon')) return 'ui-icons';
            // Other vendor libraries in smaller chunks
            if (id.includes('date-fns') || id.includes('lodash')) return 'utils-vendor';
            return 'vendor';
          }

          // Game engine and core logic
          if (id.includes('engine/') || id.includes('subsystems/')) return 'game-engine';
          if (id.includes('utils/')) return 'game-utils';

          // UI components by feature
          if (id.includes('Backgrounds/')) return 'bg-effects';
          if (id.includes('Shop/') || id.includes('Leaderboard/')) return 'heavy-panels';
          if (id.includes('Settings/')) return 'settings-panel';
          if (id.includes('components/') || id.includes('hooks/')) return 'ui-layer';

          // Services - split heavy ones (but not Firebase/Sentry since lazy)
          if (id.includes('services/')) {
            if (id.includes('errorLogger.ts') || id.includes('metrics.ts')) return 'services-monitoring';
            return 'services-core';
          }
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
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    clearMocks: true,
    coverage: {
      exclude: [
        'e2e/**',
        'junk/**',
        'sonnet-eval/**',
        'dist/**',
        'functions/**',
        'public/**',
        '**/*.test.ts',
        '**/*.d.ts',
        'test/**',
        'vite.config.ts',
      ],
    },
  },
})
