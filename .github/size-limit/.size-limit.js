const { readdirSync, readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = join(__dirname, '..', '..');

// Budgets only where one already existed; elsewhere the PR comment's delta column
// catches a regression without the bump commits a per-theme budget invites.
// Canaries are single-export imports that fail if tree-shaking regresses.
// Every export subpath is measured as its own entry, except those listed in a package's `nodeOnly`, which import
// Node built-ins such as `fs` and cannot be bundled for a browser.
/**
 * @typedef {{ label: string, import: string, limit: string }} Canary
 * @typedef {{ installed?: string, own?: string, canaries?: Canary[], nodeOnly?: string[] }} Budget
 * @typedef {{ name: string, private: boolean, dependencies?: Record<string, unknown>, peerDependencies?: Record<string, unknown>, peerDependenciesMeta?: Record<string, unknown>, exports?: Record<string, unknown> }} PackageJson
 * @type {Record<string, Budget>}
 */
const PACKAGES = {
  '@rjsf/core': {
    installed: '29 kB',
    canaries: [{ label: 'Form', import: 'Form', limit: '29 kB' }],
  },
  '@rjsf/utils': {
    installed: '34 kB',
    own: '24 kB',
    canaries: [{ label: 'getUiOptions', import: '{ getUiOptions }', limit: '1 kB' }],
  },
  '@rjsf/validator-ajv8': { installed: '39 kB', own: '3 kB', nodeOnly: ['./compileSchemaValidators'] },
  '@rjsf/validator-ata': { nodeOnly: ['./compileSchemaValidators'] },
};

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * @param {string} dir
 * @returns {PackageJson}
 */
function readPackageJson(dir) {
  /** @type {unknown} */
  const json = JSON.parse(readFileSync(join(ROOT, 'packages', dir, 'package.json'), 'utf8'));
  if (!isRecord(json) || typeof json.name !== 'string') {
    throw new Error(`packages/${dir}/package.json has no name`);
  }
  /** @param {unknown} value */
  const record = (value) => (isRecord(value) ? value : undefined);
  return {
    name: json.name,
    private: json.private === true,
    dependencies: record(json.dependencies),
    peerDependencies: record(json.peerDependencies),
    peerDependenciesMeta: record(json.peerDependenciesMeta),
    exports: record(json.exports),
  };
}

// The `default` condition is what a consumer's bundler resolves; a subpath without one has no browser entry to measure
/**
 * @param {PackageJson} pkg
 * @param {string} key
 * @param {unknown} target
 * @returns {string}
 */
function subpathEntry(pkg, key, target) {
  const entry = isRecord(target) ? target.default : target;
  if (typeof entry !== 'string' || !entry) {
    throw new Error(`${pkg.name} exports "${key}" without a "default" condition; add one or list it in nodeOnly`);
  }
  return entry;
}

const released = readdirSync(join(ROOT, 'packages'))
  .filter((dir) => existsSync(join(ROOT, 'packages', dir, 'package.json')))
  .map((dir) => ({
    dir,
    pkg: readPackageJson(dir),
  }))
  // @rjsf/snapshot-tests is a test harness for the themes, not a bundle a
  // consumer installs.
  .filter(({ pkg }) => !pkg.private && pkg.name !== '@rjsf/snapshot-tests')
  .sort((a, b) => a.pkg.name.localeCompare(b.pkg.name));

module.exports = released.flatMap(({ dir, pkg }) => {
  const path = join(ROOT, 'packages', dir, 'lib', 'index.js');
  const deps = Object.keys(pkg.dependencies ?? {});
  // react-dom is never declared but is always the host's to provide. An optional peer is measured: the consumer only
  // installs it for the subpath that needs it, so its cost belongs to that subpath's row.
  const optionalPeers = Object.keys(pkg.peerDependenciesMeta ?? {});
  const peers = [...Object.keys(pkg.peerDependencies ?? {}), 'react-dom'].filter((dep) => !optionalPeers.includes(dep));
  const { installed, own, canaries = [], nodeOnly = [] } = PACKAGES[pkg.name] ?? {};
  const subpaths = Object.entries(pkg.exports ?? {}).filter(
    ([key]) => key !== '.' && !key.startsWith('./lib') && !nodeOnly.includes(key),
  );

  return [
    { name: pkg.name, path, ignore: peers, ...(installed && { limit: installed }) },
    ...subpaths.map(([key, target]) => ({
      name: `${pkg.name}${key.slice(1)}`,
      path: join(ROOT, 'packages', dir, subpathEntry(pkg, key, target)),
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
