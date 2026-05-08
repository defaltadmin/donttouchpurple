/// <reference types="vitest" />
import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    compression({ algorithm: 'brotliCompress', threshold: 10240 }),
    compression({ algorithm: 'gzip' }),
    visualizer({ open: false, filename: 'dist/stats.html' }),
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
    terserOptions: { compress: { drop_console: true, drop_debugger: true } },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@sentry')) return 'sentry';
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('gameanalytics')) return 'analytics';
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('lucide') || id.includes('icon')) return 'ui-icons';
            return 'vendor';
          }
          if (id.includes('engine/') || id.includes('utils/')) return 'game-core';
          if (id.includes('components/') || id.includes('hooks/')) return 'app-ui';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    cssCodeSplit: true,
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
    }
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
