// Most React libraries import react's types without declaring @types/react. In the global virtual store a package
// sees only what it declares, so TypeScript resolves their `react` imports to untyped JS and every prop becomes `any`.
const TYPES_FOR_PEER = {
  react: '@types/react',
  'react-dom': '@types/react-dom',
};

function readPackage(pkg) {
  for (const [peer, types] of Object.entries(TYPES_FOR_PEER)) {
    if (pkg.peerDependencies?.[peer] && !pkg.peerDependencies[types] && !pkg.dependencies?.[types]) {
      pkg.peerDependencies[types] = '*';
      pkg.peerDependenciesMeta = { ...pkg.peerDependenciesMeta, [types]: { optional: true } };
    }
  }
  return pkg;
}

export const hooks = { readPackage };
