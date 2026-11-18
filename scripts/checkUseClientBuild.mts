// Fails when the build dropped `'use client'` from a boundary module, which a server component then loads as a server
// module; packages/core/test/useClientBoundaries.test.ts checks the same list in src/
import { existsSync, readFileSync } from 'node:fs';

import boundaries from '../testing/useClientBoundaries.json' with { type: 'json' };

const root = new URL('../', import.meta.url);
const hasDirective = (url: URL) => existsSync(url) && readFileSync(url, 'utf8').startsWith('"use client";');
const dropped = boundaries
  .map((path) => `packages/${path.replace('/src/', '/lib/').replace(/\.tsx?$/, '.js')}`)
  .filter((path) => !hasDirective(new URL(path, root)));

if (dropped.length > 0) {
  console.error(`These boundary modules are missing from the build or lost 'use client':\n${dropped.join('\n')}`);
  process.exit(1);
}
