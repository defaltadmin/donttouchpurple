/// <reference types="vitest" />
import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
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
    // Minify with esbuild (default) — ensure it runs
    minify: 'esbuild',
    // Raise chunk warning threshold (Sentry is legitimately large)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps game engine + React in fast-loading chunks
        // Sentry loads lazily so it won't block FCP
        manualChunks(id) {
          if (id.includes('@sentry')) return 'sentry';
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('gameanalytics')) return 'analytics';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Sourcemaps only in dev
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    clearMocks: true,
    coverage: {
      exclude: [
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

