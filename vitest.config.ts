import { defineConfig } from 'vitest/config'

export default defineConfig({
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
        'vitest.config.ts',
      ],
    },
  },
})
