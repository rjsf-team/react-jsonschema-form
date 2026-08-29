import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Shared vitest defaults for every package; package configs extend this via mergeConfig().
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // resolved against this file, so it works regardless of where a consuming config lives
    setupFiles: [fileURLToPath(new URL('./testSetup.ts', import.meta.url))],
    coverage: {
      provider: 'v8',
    },
  },
});

/** The 100%-coverage gate shared by the packages that enforce it (utils and the validators). */
export function fullCoverage(extraExcludes: string[] = []) {
  return {
    enabled: true,
    reportsDirectory: 'coverage',
    include: ['src/**'],
    exclude: ['node_modules/**', 'test/**', '**/tsconfig.json', ...extraExcludes],
    thresholds: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  };
}
