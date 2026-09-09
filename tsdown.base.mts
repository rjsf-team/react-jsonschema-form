import { defineConfig } from 'tsdown';

/**
 * Shared build config for every @rjsf package, run from the package directory
 * via `tsdown -c ../../tsdown.base.mts`. It emits per-file ESM and
 * declarations into lib/, mirroring src/ one-to-one so the `./lib/*.js`
 * deep-import exports keep resolving. It does not typecheck; that is the
 * separate root `tsc --build`.
 */
export default defineConfig({
  // Relative paths resolve from the package that runs the build, not from this file.
  cwd: process.cwd(),
  entry: ['src/**/*.ts', 'src/**/*.tsx'],
  outDir: 'lib',
  unbundle: true,
  // `.js`/`.d.ts`, not tsdown's default `.mjs`/`.d.mts`; the packages are `type: module`.
  fixedExtension: false,
  // Otherwise tsdown derives a Node target from `engines`; these packages also run in browsers.
  target: 'esnext',
  sourcemap: true,
  dts: true,
  // Every dependency, workspace packages included, stays an import; nothing is inlined into lib/.
  deps: { neverBundle: true },
});
