import { defineConfig } from 'vitest/config';

// Lets vitest run from the repo root across every package (e.g. `pnpm vitest run`,
// `pnpm vitest --project @rjsf/core`). The nx-driven per-package test scripts are
// unaffected and remain the canonical way CI runs tests.
export default defineConfig({
  test: {
    projects: ['packages/*/vitest.config.ts'],
  },
});
