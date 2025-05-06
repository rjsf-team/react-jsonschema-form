const path = require('path');
const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

const pkg = require('./package.json');

const dev = process.argv.includes('--dev');

// Define peer dependencies and dependencies to be excluded from the bundle
const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {}), // Also exclude dependencies if they should be provided by the consumer
];

const baseConfig = {
  entryPoints: [path.join(__dirname, 'src', 'index.ts')],
  bundle: true,
  minify: !dev,
  sourcemap: true,
  target: 'es2019', // Or your desired target environment
  external,
  plugins: [nodeExternalsPlugin()], // Automatically excludes node_modules
  loader: { '.js': 'jsx' }, // Ensure JSX is handled correctly if needed, though TS handles it
};

Promise.all([
  // Build for CommonJS (main field)
  esbuild.build({
    ...baseConfig,
    format: 'cjs',
    outfile: path.join(__dirname, pkg.main),
  }),
  // Build for ES Modules (module field)
  esbuild.build({
    ...baseConfig,
    format: 'esm',
    outfile: path.join(__dirname, pkg.module),
  }),
]).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});

console.log('esbuild build complete for @rjsf/uswds');
