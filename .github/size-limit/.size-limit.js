const { readdirSync, readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = join(__dirname, '..', '..');

// Budgets only where one already existed; elsewhere the PR comment's delta column
// catches a regression without the bump commits a per-theme budget invites.
// Canaries are single-export imports that fail if tree-shaking regresses.
// Every export subpath is measured as its own entry, except the Node-only ones.
const NODE_ONLY_SUBPATHS = ['./compileSchemaValidators']; // imports fs
const PACKAGES = {
  '@rjsf/core': {
    installed: '47 kB',
    own: '24 kB',
    canaries: [{ label: 'Form', import: 'Form', limit: '47 kB' }],
  },
  '@rjsf/utils': {
    installed: '34 kB',
    own: '19 kB',
    canaries: [{ label: 'getUiOptions', import: '{ getUiOptions }', limit: '1 kB' }],
  },
  '@rjsf/validator-ajv8': { installed: '39 kB', own: '3 kB' },
};

const released = readdirSync(join(ROOT, 'packages'))
  .filter((dir) => existsSync(join(ROOT, 'packages', dir, 'package.json')))
  .map((dir) => ({ dir, pkg: JSON.parse(readFileSync(join(ROOT, 'packages', dir, 'package.json'), 'utf8')) }))
  // @rjsf/snapshot-tests is a test harness for the themes, not a bundle a
  // consumer installs.
  .filter(({ pkg }) => !pkg.private && pkg.name !== '@rjsf/snapshot-tests')
  .sort((a, b) => a.pkg.name.localeCompare(b.pkg.name));

module.exports = released.flatMap(({ dir, pkg }) => {
  const path = join(ROOT, 'packages', dir, 'lib', 'index.js');
  const deps = Object.keys(pkg.dependencies ?? {});
  // react-dom is never declared but is always the host's to provide; devDependencies (which @rjsf/core/testing
  // reaches) are never installed by a consumer. An optional peer is measured: the consumer only installs it for the
  // subpath that needs it, so its cost belongs to that subpath's row.
  const optionalPeers = Object.keys(pkg.peerDependenciesMeta ?? {});
  const peers = [
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    'react-dom',
  ].filter((dep) => !optionalPeers.includes(dep));
  const { installed, own, canaries = [] } = PACKAGES[pkg.name] ?? {};
  const subpaths = Object.entries(pkg.exports).filter(
    ([key]) => key !== '.' && !key.startsWith('./lib') && !NODE_ONLY_SUBPATHS.includes(key),
  );

  return [
    { name: pkg.name, path, ignore: peers, ...(installed && { limit: installed }) },
    ...subpaths.map(([key, target]) => ({
      name: `${pkg.name}${key.slice(1)}`,
      path: join(ROOT, 'packages', dir, typeof target === 'string' ? target : target.default),
      ignore: peers,
    })),
    ...(deps.length
      ? [
          {
            name: `${pkg.name} (without dependencies)`,
            path,
            ignore: [...peers, ...deps],
            ...(own && { limit: own }),
          },
        ]
      : []),
    ...canaries.map(({ label, import: imp, limit }) => ({
      name: `${pkg.name}: ${label}`,
      path,
      import: imp,
      ignore: peers,
      limit,
    })),
  ];
});
