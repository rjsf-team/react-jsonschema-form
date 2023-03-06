const replace = require('@rollup/plugin-replace');

module.exports = {
  // This function will run for each entry/format/env combination
  rollup(config, options) {
    if (options.format === 'esm') {
      config.plugins.push(
        replace({
          'antd/lib': 'antd/es',
          'rc-picker/lib': 'rc-picker/es',
        })
      );
    }
    return config; // always return a config.
  },
};
