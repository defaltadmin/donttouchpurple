/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sw-version-inject',
      writeBundle() {
        const swPath = 'dist/sw.js'
        try {
          let sw = readFileSync(swPath, 'utf-8')
          sw = sw.replace('dtp-v__SW_VERSION__', `dtp-v${pkg.version}`)
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
