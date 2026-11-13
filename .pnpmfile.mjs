// Most React libraries import react's types without declaring @types/react. In the global virtual store a package
// sees only what it declares, so TypeScript resolves their `react` imports to untyped JS and every prop becomes `any`.
const TYPES_FOR_PEER = {
  react: '@types/react',
  'react-dom': '@types/react-dom',
};

/**
 * @typedef {Record<string, string>} DependencyMap
 * @typedef {{ name?: string, dependencies?: DependencyMap, peerDependencies?: DependencyMap, peerDependenciesMeta?: Record<string, { optional?: boolean }> }} PackageManifest
 * @param {PackageManifest} pkg
 * @returns {PackageManifest}
 */
function readPackage(pkg) {
  // Workspace packages already reach @types/react through the root node_modules; adding the peer to them would
  // record @types/react as a dependency of the published @rjsf/* packages in the lockfile.
  if (pkg.name?.startsWith('@rjsf/')) {
    return pkg;
  }
  const missing = Object.entries(TYPES_FOR_PEER).filter(
    ([peer, types]) => pkg.peerDependencies?.[peer] && !pkg.peerDependencies[types] && !pkg.dependencies?.[types],
  );
  if (missing.length === 0) {
    return pkg;
  }
  return {
    ...pkg,
    peerDependencies: { ...pkg.peerDependencies, ...Object.fromEntries(missing.map(([, types]) => [types, '*'])) },
    peerDependenciesMeta: {
      ...pkg.peerDependenciesMeta,
      ...Object.fromEntries(missing.map(([, types]) => [types, { optional: true }])),
    },
  };
}

export const hooks = { readPackage };
