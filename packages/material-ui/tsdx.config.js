const copy = require('rollup-plugin-copy');

/** Provides a custom tsdx config with a `rollup()` function that gets called for each of the module generated. In our
 * case it gets called first for the `cjs` development build, then for the `cjs` production build and lastly for the
 * `esm` build. See the [tsdx customization](https://github.com/jaredpalmer/tsdx#customization) documention.
 *
 * This is a work-around for `tsdx` only being capable of generating one release at a time. To fix having multiple
 * releases (one each for material-ui v4 and v5, and the main one that has both) we need to run `tsdx` three times.
 * Unfortunately, when we run `tsdx` more than once in a build, it overwrites what the previous run did. In order to
 * keep the `index.js`, `index.d.ts`, and the generated `cjs` and `esm` .js/js.map files we need to back them up until
 * the last rollup run for the final (main) `esm` build, when we copy the backups back into the main dist directory
 * using the `rollup-plugin-copy` that we installed specifically for this purpose in the `material-ui` theme.
 *
 * In order to get `tdsx` to properly build the `v4.js` or `v5.js` index files, we need to specify them explicitly in
 * the command as follows:
 * ```
 * tsdx build -i ./src/v5.ts --name @rjsf/material-ui-v5 && tsdx build -i ./src/v4.ts --name @rjsf/material-ui-v4
 * ```
 *
 * After running those we will finally run the main build as follows:
 * ```
 * tsdx build
 * ```
 *
 * The first two times we run `tsdx` (for v4 and v5), we use the rollup copy plugin to backup the generated files into
 * a `dist-temp` directory that is along side of the `dist` directory. So after running the v4 and v5 builds, the
 * `dist-temp` directory will look like the following:
 * - dist-temp
 *   - v4.js
 *   - material-ui-v4.cjs.development.js
 *   - material-ui-v4.cjs.development.js.map
 *   - material-ui-v4.cjs.production.min.js
 *   - material-ui-v4.cjs.production.min.js.map
 *   - material-ui-v4.esm.js
 *   - v5.js
 *   - material-ui-v5.cjs.development.js
 *   - material-ui-v5.cjs.development.js.map
 *   - material-ui-v5.cjs.production.min.js
 *   - material-ui-v5.cjs.production.min.js.map
 *   - material-ui-v5.esm.js
 *
 * On the final `esm` run for the main build, the `v4` and `v5` files will be copied to the `dist` directory that
 * will contain all of the rest of the build.
 */
module.exports = {
  // This function will run for each entry/format/env combination
  rollup(config, options) {
    // If the -i option was specified then we are dealing with a v4 or v5 build
    if (options.i) {
      // The name we specified will look like `@rjsf/material-ui-v(4/5)` so get the `v(4/5)` off the end
      const version = options.name.substring(options.name.length - 2);
      // Strip off the `@rjsf` leaving `/material-ui-v(4/5)`
      const packageName = options.name.replace('@rjsf', '');
      // Find the location of the package name in the config's output file name
      const index = config.output.file.lastIndexOf(packageName);
      // Compute just the source directory from the config's output file name
      const srcDir = config.output.file.substring(0, index);
      // Compute just the file name form the config's output file name
      const srcName = config.output.file.substring(index);
      // Compute the destination directory by replacing `dist` with `dist-temp/version`
      const dest = srcDir.replace('dist', `dist-temp`);
      // Setup the targets for the copy plugin, one for each file...
      // Don't worry if the file isn't there simply isn't copied
      const targets = [
        { src: `${srcDir}/index.js`, dest, rename: `${version}.js` },
        { src: `${srcDir}${srcName}`, dest },
        { src: `${srcDir}${srcName}.map`, dest },
      ]
      // Append the copy plugin with the targets, setting the hook point to be when the whole generated bundle is done
      // See [rollup output generation hooks](https://rollupjs.org/guide/en/#output-generation-hooks) documentation
      config.plugins.push(copy({ targets, hook: 'writeBundle' }))
    } else if (config.output.format === 'esm') { // Check for the last run of the main `tsdx` build
      // Strip off the `@rjsf` leaving `/material-ui`
      const packageName = options.name.replace('@rjsf', '');
      // Find the location of the package name in the config's output file name
      const index = config.output.file.indexOf(`${packageName}.esm.js`);
      // Compute just the destination directory from the config's output file name
      const dest = config.output.file.substring(0, index);
      // Compute the source directory by replacing `dist` with the `dist-temp/*` wildcard
      const src = dest.replace('dist', 'dist-temp/*');
      // Setup the single target for the copy plugin
      const targets = [
        { src, dest },
      ]
      // Append the copy plugin with the targets, setting the hook point to be when the whole generated bundle is done
      config.plugins.push(copy({ targets, hook: 'writeBundle' }))
    }
    // Uncomment to debug the resulting config
    // console.dir(config, { depth: null });
    return config; // always return a config.
  },
};
