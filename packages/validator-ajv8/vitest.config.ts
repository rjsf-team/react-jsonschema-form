import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
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
