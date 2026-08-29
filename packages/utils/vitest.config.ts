import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // Most utils are pure functions; the DOM-dependent test files opt back into
    // jsdom with a /** @vitest-environment jsdom */ pragma.
    environment: 'node',
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
