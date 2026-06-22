import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'react-transition-group/TransitionGroupContext':
        'react-transition-group/cjs/TransitionGroupContext.js',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../testing/testSetup.ts', './test/setup-vitest.ts'],
    coverage: {
      provider: 'v8',
    },
    server: {
      deps: {
        inline: [/@mui\//],
      },
    },
  },
});
