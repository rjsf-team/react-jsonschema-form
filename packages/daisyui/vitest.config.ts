import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../testing/testSetup.ts'],
    coverage: {
      provider: 'v8',
      exclude: ['node_modules/**', 'test/**'],
    },
  },
});
