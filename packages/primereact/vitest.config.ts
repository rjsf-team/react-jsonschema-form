import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts', '../../testing/testSetup.ts'],
    coverage: {
      provider: 'v8',
    },
  },
});
