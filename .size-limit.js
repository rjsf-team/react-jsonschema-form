// One check per released package, derived from that package's own package.json,
// so adding a package or changing its dependencies needs no edit here.
//
// The bare check ignores every declared peer, which for a theme means the number
// is the theme itself rather than the UI library behind it. A package that also
// declares real dependencies gets a second "(without dependencies)" check, so
// the pair reads as install cost vs. own code.
//
// `limit` is only set where a budget already existed: size-limit fails the build
// on an overrun, and a per-theme budget would mostly produce bump commits. The
// unbudgeted packages are measured and show up in the PR comment's delta column,
// which is what actually catches a regression.
const { readdirSync, readFileSync, existsSync } = require('node:fs');

// getTestRegistry pulls @rjsf/validator-ajv8 into core's lib/, but it is a
// devDependency there — a consumer installing @rjsf/core never gets it, so it
// does not belong in core's own-code number.
const EXTRA_IGNORE = {
  '@rjsf/core': ['@rjsf/validator-ajv8', 'ajv', 'ajv-formats', 'prop-types'],
};

const LIMITS = {
  '@rjsf/core': { installed: '92 kB', own: '24 kB' },
  '@rjsf/utils': { installed: '34 kB', own: '19 kB' },
  '@rjsf/validator-ajv8': { installed: '39 kB', own: '3 kB' },
};

// Single-export imports that must stay small; they fail if tree-shaking regresses.
const CANARIES = [
  { pkg: '@rjsf/core', label: 'Form', import: 'Form', limit: '53 kB' },
  { pkg: '@rjsf/utils', label: 'getUiOptions', import: '{ getUiOptions }', limit: '1 kB' },
];

const released = readdirSync('packages')
  .filter((dir) => existsSync(`packages/${dir}/package.json`))
  .map((dir) => ({ dir, pkg: JSON.parse(readFileSync(`packages/${dir}/package.json`, 'utf8')) }))
  // build:ts is what emits the lib/ entry point being measured; @rjsf/snapshot-tests
  // is published but ships no bundle, so it has none.
  .filter(({ pkg }) => !pkg.private && pkg.scripts?.['build:ts'])
  .sort((a, b) => a.pkg.name.localeCompare(b.pkg.name));

module.exports = released.flatMap(({ dir, pkg }) => {
  const path = `packages/${dir}/lib/index.js`;
  const deps = Object.keys(pkg.dependencies ?? {});
  // react-dom is never a declared dependency but is always the host's to provide.
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
  // size-limit rejects an explicit `limit: undefined`, so drop the unset ones.
  return checks.map((c) => (c.limit === undefined ? (({ limit, ...rest }) => rest)(c) : c));
});
