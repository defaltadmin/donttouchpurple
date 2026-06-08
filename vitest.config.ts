import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', 'functions/**', 'e2e/**', 'junk/**', 'website/**', '.agent/**'],
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    clearMocks: true,
    testTimeout: 10000,
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
