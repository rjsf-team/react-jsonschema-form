import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../testing/testSetup.ts', './test/testSetup.ts'],
    coverage: {
      provider: 'v8',
    },
  },
});
