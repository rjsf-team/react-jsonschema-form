const replace = require('@rollup/plugin-replace');

module.exports = {
  // This function will run for each entry/format/env combination
  rollup(config, options) {
    //
    if (options.format === 'cjs' && options.env === 'development') {
      config.input['validator-ajv8'] = config.input['validator-ajv8'].replace('index.ts', 'index-dev.ts');
    }
    return config; // always return a config.
  },
};
