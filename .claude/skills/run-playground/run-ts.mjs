#!/usr/bin/env node
// Runs a TypeScript/TSX script against the @rjsf/* sources, no build needed:
//
//   node .claude/skills/run-playground/run-ts.mjs <script.ts|tsx> [args...]
//
// Node's own type stripping can't load @rjsf/utils (it has .tsx files and enums), so this loads the script through
// Vite's SSR module runner with the playground's vite.config.ts: `@rjsf/*` imports resolve to each package's `src`,
// and bare imports (react, react-dom/server, lodash, ajv...) resolve from packages/playground's dependencies. The script
// may only import packages: relative imports resolve from packages/playground/src.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const PLAYGROUND = path.join(REPO, 'packages/playground');

const [script, ...rest] = process.argv.slice(2);
if (!script) {
  console.error('usage: run-ts.mjs <script.ts|tsx> [args...]');
  process.exit(2);
}
process.argv = [process.argv[0], path.resolve(script), ...rest];
const PROBE_ID = path.join(PLAYGROUND, 'src', `__run-ts-probe__${path.extname(script) || '.ts'}`);

const vitePkg = createRequire(path.join(PLAYGROUND, 'package.json')).resolve('vite/package.json');
const { createServer, createServerModuleRunner } = await import(
  pathToFileURL(path.join(path.dirname(vitePkg), 'dist/node/index.js')).href
);

process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';
const server = await createServer({
  configFile: path.join(PLAYGROUND, 'vite.config.ts'),
  root: PLAYGROUND,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  logLevel: 'error',
  plugins: [
    {
      // The script is served as if it were a file in packages/playground/src (nothing is written there), so its bare
      // imports resolve against the playground's dependencies even when the script lives in a scratch dir
      name: 'probe-in-playground',
      resolveId: (id) => (id === PROBE_ID ? PROBE_ID : null),
      load: (id) => (id === PROBE_ID ? readFileSync(path.resolve(script), 'utf8') : null),
    },
  ],
});
const runner = createServerModuleRunner(server.environments.ssr, { hmr: false });
let code = 0;
try {
  await runner.import(PROBE_ID);
} catch (err) {
  console.error(err);
  code = 1;
} finally {
  await runner.close();
  await server.close();
}
process.exit(code);
