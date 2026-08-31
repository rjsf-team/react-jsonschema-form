const { readdirSync, readFileSync, existsSync } = require('node:fs');

// Budgets only where one already existed; elsewhere the PR comment's delta column
// catches a regression without the bump commits a per-theme budget invites.
// Canaries are single-export imports that fail if tree-shaking regresses.
const PACKAGES = {
  '@rjsf/core': {
    installed: '92 kB',
    own: '24 kB',
    // getTestRegistry pulls the AJV chain into core's lib/, but it is a
    // devDependency there — a consumer installing @rjsf/core never gets it.
    extraIgnore: ['@rjsf/validator-ajv8'],
    canaries: [{ label: 'Form', import: 'Form', limit: '53 kB' }],
  },
  '@rjsf/utils': {
    installed: '34 kB',
    own: '19 kB',
    canaries: [{ label: 'getUiOptions', import: '{ getUiOptions }', limit: '1 kB' }],
  },
  '@rjsf/validator-ajv8': { installed: '39 kB', own: '3 kB' },
};

const released = readdirSync('packages')
  .filter((dir) => existsSync(`packages/${dir}/package.json`))
  .map((dir) => ({ dir, pkg: JSON.parse(readFileSync(`packages/${dir}/package.json`, 'utf8')) }))
  // build:ts emits the lib/ entry point being measured; a package without one
  // (@rjsf/snapshot-tests) ships no bundle to measure.
  .filter(({ pkg }) => !pkg.private && pkg.scripts?.['build:ts'])
  .sort((a, b) => a.pkg.name.localeCompare(b.pkg.name));

module.exports = released.flatMap(({ dir, pkg }) => {
  const path = `packages/${dir}/lib/index.js`;
  const deps = Object.keys(pkg.dependencies ?? {});
  // react-dom is never declared but is always the host's to provide.
  const peers = [...Object.keys(pkg.peerDependencies ?? {}), 'react-dom'];
  const { installed, own, extraIgnore = [], canaries = [] } = PACKAGES[pkg.name] ?? {};

  return [
    { name: pkg.name, path, ignore: peers, ...(installed && { limit: installed }) },
    ...(deps.length
      ? [
          {
            name: `${pkg.name} (without dependencies)`,
            path,
            ignore: [...peers, ...deps, ...extraIgnore],
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
