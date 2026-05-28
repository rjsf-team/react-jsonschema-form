import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../testing/testSetup.ts'],
    exclude: ['node_modules/**', 'lib-test/**'],
    coverage: {
      provider: 'v8',
      enabled: true,
      reportsDirectory: 'coverage',
      include: ['src/**'],
      exclude: ['node_modules/**', 'test/**', '**/tsconfig.json'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
