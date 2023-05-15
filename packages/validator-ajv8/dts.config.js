const replace = require('@rollup/plugin-replace');

module.exports = {
  // This function will run for each entry/format/env combination
  rollup(config, options) {
    // Since the `compileSchemaValidators()` function uses the `fs` library from `Node` we cannot allow this method to
    // be exported into anything but the `cjs` development environment. The default `index.ts` file does not export this
    // function, but the `index-dev.ts` file does. In order to fix issue #3668, we added this `dts.config.js` to fix it.
    //
    // When the build is being generated for the `cjs` development environment we make sure that the `index.ts` file is
    // switched out for the `index-dev.ts` file. Interestingly, once we switch it out, it remains as `index-dev.ts` for
    // the next (and subsequent) set of build options unless we switch it back. As a result, we do the if/then/else with
    // a replacement in both directions.
    if (options.format === 'cjs' && options.env === 'development') {
      config.input['validator-ajv8'] = config.input['validator-ajv8'].replace('/index.ts', '/index-dev.ts');
    } else {
      config.input['validator-ajv8'] = config.input['validator-ajv8'].replace('/index-dev.ts', '/index.ts');
    }
    return config; // always return a config.
  },
};
