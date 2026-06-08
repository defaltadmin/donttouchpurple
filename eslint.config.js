import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'junk/**', 'node_modules/**', 'public/sw.js', 'website/**', 'MSCArabia.com/**', 'functions/lib/**', 'coverage/**', '.agent/**', '.agents/**', '.claude/**', '.continue/**', '.gemini/**', '.trae/**', '.windsurf/**', '.wrangler/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Node.js scripts — relax browser rules
  {
    files: ['scripts/**', 'postcss.config.js', 'vite.config.ts', 'lint-staged.config.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },

  // Cloudflare Workers / Pages Functions — Web Worker globals
  {
    files: ['workers/**', 'MSCArabia.com/functions/**'],
    languageOptions: {
      globals: { ...globals.worker, ...globals.es2021 },
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-case-declarations': 'warn',
    },
  },
);
