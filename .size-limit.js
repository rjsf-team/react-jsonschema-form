const { readdirSync, readFileSync, existsSync } = require('node:fs');

// getTestRegistry pulls the AJV chain into core's lib/, but it is a devDependency
// there — a consumer installing @rjsf/core never gets it.
const EXTRA_IGNORE = {
  '@rjsf/core': ['@rjsf/validator-ajv8', 'ajv', 'ajv-formats', 'prop-types'],
};

// Only where a budget already existed; elsewhere the PR comment's delta column is
// what catches a regression, without the bump commits a per-theme budget invites.
const LIMITS = {
  '@rjsf/core': { installed: '92 kB', own: '24 kB' },
  '@rjsf/utils': { installed: '34 kB', own: '19 kB' },
  '@rjsf/validator-ajv8': { installed: '39 kB', own: '3 kB' },
};

// Single-export imports that fail if tree-shaking regresses.
const CANARIES = [
  { pkg: '@rjsf/core', label: 'Form', import: 'Form', limit: '53 kB' },
  { pkg: '@rjsf/utils', label: 'getUiOptions', import: '{ getUiOptions }', limit: '1 kB' },
];

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
  const limits = LIMITS[pkg.name] ?? {};

  const checks = [{ name: pkg.name, path, ignore: peers, limit: limits.installed }];
  if (deps.length) {
    checks.push({
      name: `${pkg.name} (without dependencies)`,
      path,
      ignore: [...peers, ...deps, ...(EXTRA_IGNORE[pkg.name] ?? [])],
      limit: limits.own,
    });
  }
  for (const canary of CANARIES.filter((c) => c.pkg === pkg.name)) {
    checks.push({
      name: `${pkg.name}: ${canary.label}`,
      path,
      import: canary.import,
      ignore: peers,
      limit: canary.limit,
    });
  }
  // size-limit rejects an explicit `limit: undefined`.
  return checks.map((c) => (c.limit === undefined ? (({ limit, ...rest }) => rest)(c) : c));
});
