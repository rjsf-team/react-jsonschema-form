import { defineConfig } from 'tsdown';

/**
 * Shared build config for every @rjsf package, run from the package directory
 * via `tsdown -c ../../tsdown.base.mts`. It emits per-file ESM and
 * declarations into lib/, mirroring src/ one-to-one, so a bundler only pulls in
 * the modules an import actually reaches. It does not typecheck; that is the
 * separate root `tsc --build`.
 */
export default defineConfig({
  // Relative paths resolve from the package that runs the build, not from this file.
  cwd: process.cwd(),
  entry: 'src/**/*.{ts,tsx}',
  outDir: 'lib',
  unbundle: true,
  // The packages run in browsers and SSR alike; `neutral` also keeps the `.js`/`.d.ts` extensions.
  platform: 'neutral',
  sourcemap: true,
  // Every dependency, workspace packages included, stays an import; nothing is inlined into lib/.
  deps: { neverBundle: true },
  // TypeScript 7 no longer ships the JS compiler API, so declarations come from its native binary. rolldown-plugin-dts
  // infers this when TypeScript 7 is installed; naming it keeps the choice from changing with the inference rules.
  dts: { generator: 'tsgo' },
});
