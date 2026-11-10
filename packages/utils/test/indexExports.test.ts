import { readFileSync } from 'node:fs';

describe('src/index.ts', () => {
  // knip counts a name an `export *` re-exports as used whenever any utils module imports it, so a value exported that
  // way escapes the check that only what another package imports is public. Types may still be re-exported wholesale.
  it('names every value it re-exports', () => {
    const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/^export \* from/m);
  });
});
