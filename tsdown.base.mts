import { defineConfig } from 'tsdown';

/**
 * Shared build config for every @rjsf package, run from the package directory
 * via `tsdown -c ../../tsdown.base.mts`. It emits per-file ESM and
 * declarations into lib/, mirroring src/ one-to-one so the `./lib/*.js`
 * deep-import exports keep resolving. It does not typecheck; that is the
 * separate root `tsc --build`.
 */

const tsconfig = 'tsconfig.json';

export default defineConfig({
  // Relative paths resolve from the package that runs the build, not from this file.
  cwd: process.cwd(),
  entry: ['src/**/*.ts', 'src/**/*.tsx'],
  format: 'esm',
  outDir: 'lib',
  unbundle: true,
  clean: true,
  platform: 'neutral',
  target: 'esnext',
  sourcemap: true,
  tsconfig,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  dts: { tsconfig, sourcemap: true },
  // Every dependency, workspace packages included, stays an import; nothing is inlined into lib/.
  deps: { neverBundle: true },
});
