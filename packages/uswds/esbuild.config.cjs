const path = require('path');
const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

const pkg = require('./package.json');
const dev = process.argv.includes('--dev');

const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  // Do not exclude pkg.dependencies if they should be bundled,
  // or exclude them if they are expected to be provided by the consumer.
  // For libraries, peerDependencies are usually the ones to exclude.
];

const baseConfig = {
  // Entry point is now the JS output from tsc in build_tmp
  entryPoints: [path.join(__dirname, 'build_tmp', 'index.js')],
  bundle: true,
  minify: !dev,
  sourcemap: true,
  target: 'es2019',
  external,
  plugins: [nodeExternalsPlugin()],
  loader: { '.js': 'jsx' }, // Retained, though input is .js from tsc
};

Promise.all([
  // Build for CommonJS (dist/index.cjs.js)
  esbuild.build({
    ...baseConfig,
    format: 'cjs',
    outfile: path.join(__dirname, pkg.main), // Uses pkg.main from package.json
  }),
  // Build for ES Modules (lib/index.esm.js)
  esbuild.build({
    ...baseConfig,
    format: 'esm',
    outfile: path.join(__dirname, pkg.module), // Uses pkg.module from package.json
  }),
  // Build for UMD (dist/uswds.umd.js)
  esbuild.build({
    ...baseConfig,
    format: 'iife', // IIFE can be used for UMD
    globalName: 'RJSFUSWDSTheme', // Global variable name for UMD
    outfile: path.join(__dirname, pkg.unpkg || 'dist/uswds.umd.js'), // Uses pkg.unpkg or a default
    // For UMD, you might not want to exclude all peerDependencies if they are common (like React)
    // or ensure the consumer provides them. For this setup, we keep them external.
    // If bundling dependencies for UMD, adjust 'external' and 'nodeExternalsPlugin' for this specific build.
  }),
]).catch((error) => {
  console.error('esbuild build failed:', error);
  process.exit(1);
});

console.log('esbuild CJS, ESM, and UMD builds complete for @rjsf/uswds');
