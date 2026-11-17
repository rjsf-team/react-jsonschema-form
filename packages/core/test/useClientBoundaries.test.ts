/** @vitest-environment node */
import { globSync, readFileSync } from 'node:fs';

// A server component imports a package's root, which loads the listed modules on the server; each one creates a context,
// calls a client-only function or library as it loads, or is a value `Form` needs as a client reference.
// scripts/checkUseClientBuild.mts checks the same list against the build.
import BOUNDARIES from '../../../testing/useClientBoundaries.json' with { type: 'json' };

const packages = `${import.meta.dirname}/../..`;

// A package whose root is a boundary makes every module it loads a client module
const isBoundary = (path: string) =>
  BOUNDARIES.includes(path) || BOUNDARIES.includes(path.replace(/\/src\/.*/, '/src/index.ts'));

// Paths joined with `/`, as the list has them, which globSync doesn't use on Windows. Only published packages, as
// no server component imports the apps or the snapshot harness
const SOURCES = globSync('*/src/**/*.{ts,tsx}', {
  cwd: packages,
  exclude: ['docs/**', 'playground/**', 'snapshot-tests/**'],
}).map((path): [string, string] => [path.replaceAll('\\', '/'), readFileSync(`${packages}/${path}`, 'utf8')]);

describe("'use client' boundaries", () => {
  it.each(BOUNDARIES)('%s starts with the directive', (path) => {
    expect(readFileSync(`${packages}/${path}`, 'utf8')).toMatch(/^'use client';\r?\n/);
  });

  it.each([
    ['creates a context', /createContext[<(]/],
    [
      'calls withTheme() or generateForm() as it loads',
      /^(?!(?:export (?:default )?)?function |\/[/*])\S.*\b(?:withTheme|generateForm)(?:<.*>)?\(/m,
    ],
  ])('lists every source module that %s', (_, pattern) => {
    const unlisted = SOURCES.filter(([path, source]) => pattern.test(source) && !isBoundary(path)).map(
      ([path]) => path,
    );
    expect(unlisted).toEqual([]);
  });
});
