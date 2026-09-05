import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';

/**
 * Shared build config for every @rjsf package, run from the package directory
 * via `tsdown -c ../../tsdown.base.mts`. It emits per-file ESM and
 * declarations in lib/ (mirroring src/ so the `./lib/*.js` deep-import exports
 * keep resolving), plus a CJS
 * bundle (dist/index.cjs), an ESM bundle (dist/<name>.esm.js) and a UMD bundle
 * (dist/<name>.umd.js). It does not typecheck; that is a separate step.
 *
 * `neverBundle` keeps every package external, matching esbuild's old
 * `--packages=external`.
 */

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { name: string };
const shortName = pkg.name.replace(/^@rjsf\//, '');

/**
 * Published bundle names that predate the `<package name>` convention. They
 * are kept because renaming a shipped file or the browser global is a
 * breaking change for CDN users.
 *  - core: `JSONSchemaForm` is the historical `<script>` global.
 *  - fluentui-rc: copy-pasted from core; it ships `core.umd.js` under the
 *    `JSONSchemaForm` global, colliding with core. Fix at the next major.
 *  - shadcn: the bundle was always named `rjsf-shadcn`.
 */
const legacyNames: Record<string, Partial<BundleNames>> = {
  core: { esmName: 'index.esm', globalName: 'JSONSchemaForm' },
  'fluentui-rc': { esmName: 'index.esm', umdName: 'core.umd', globalName: 'JSONSchemaForm' },
  shadcn: { esmName: 'rjsf-shadcn.esm', umdName: 'rjsf-shadcn.umd', globalName: '@rjsf/rjsf-shadcn' },
};

interface BundleNames {
  esmName: string;
  umdName: string;
  globalName: string;
}

const { esmName, umdName, globalName }: BundleNames = {
  esmName: `${shortName}.esm`,
  umdName: `${shortName}.umd`,
  globalName: pkg.name,
  ...legacyNames[shortName],
};

const tsconfig = 'tsconfig.json';

/** Validators also ship their `compileSchemaValidators` entry as a standalone CJS + ESM bundle. */
const extraEntries = ['compileSchemaValidators'].filter((entry) => existsSync(`src/${entry}.ts`));

// esbuild dropped JSDoc and kept legal/annotation comments; rolldown keeps
// JSDoc by default, which grew the heavily documented bundles by ~50%.
const comments = { legal: true, annotation: true, jsdoc: false };

const common = {
  cwd: process.cwd(),
  outDir: 'dist',
  platform: 'browser',
  target: 'esnext',
  sourcemap: true,
  dts: false,
  clean: false,
  deps: { neverBundle: true },
  // The UMD wrapper's browser-global branch needs a global name per external.
  // Nothing declares them, so rolldown guesses; nobody loads these bundles
  // with externals as `<script>` globals, so the guesses are fine.
  suppressWarnings: ['MISSING_GLOBAL_NAME'],
} as const;

export default defineConfig([
  {
    ...common,
    // Per-file ESM + declarations mirroring src/ one-to-one.
    entry: ['src/**/*.ts', 'src/**/*.tsx'],
    format: 'esm',
    outDir: 'lib',
    unbundle: true,
    clean: true,
    tsconfig,
    outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
    dts: { tsconfig, sourcemap: true },
  },
  {
    ...common,
    entry: 'src/index.ts',
    format: {
      cjs: { outputOptions: { comments } },
      esm: {
        outputOptions: { entryFileNames: `${esmName}.js`, comments },
      },
      umd: {
        sourcemap: false,
        globalName,
        outputOptions: { entryFileNames: `${umdName}.js`, comments },
      },
    },
  },
  ...extraEntries.map((entry) => ({
    ...common,
    entry: `src/${entry}.ts`,
    format: {
      cjs: { outputOptions: { comments } },
      esm: {
        outputOptions: { entryFileNames: `${entry}.esm.js`, comments },
      },
    },
  })),
]);
