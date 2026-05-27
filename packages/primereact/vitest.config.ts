import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts', '../../testing/testSetup.ts'],
    coverage: {
      provider: 'v8',
    },
  },
});
