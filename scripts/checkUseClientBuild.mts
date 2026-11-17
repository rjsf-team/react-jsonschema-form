// Fails when the build dropped `'use client'` from a boundary module, which a server component then loads as a server
// module; packages/core/test/useClientBoundaries.test.ts checks the same list in src/
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const boundaries: string[] = JSON.parse(readFileSync(new URL('testing/useClientBoundaries.json', root), 'utf8'));
const dropped = boundaries
  .map((path) => `packages/${path.replace('/src/', '/lib/').replace(/\.tsx?$/, '.js')}`)
  .filter((path) => !readFileSync(new URL(path, root), 'utf8').startsWith('"use client";'));

if (dropped.length > 0) {
  console.error(`The build dropped 'use client' from:\n${dropped.join('\n')}`);
  process.exit(1);
}
