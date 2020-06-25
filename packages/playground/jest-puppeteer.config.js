const getConfig = require('jest-puppeteer-docker/lib/config');

const baseConfig = getConfig();
const customConfig = Object.assign({}, baseConfig);

customConfig.server = {
  // In CI mode, run from built production version instead of the dev version.
  command: "serve -l 8080",
  port: 8080,
  usedPortAction: "kill"
};

customConfig.chromiumFlags = ['--font-render-hinting=none', '--enable-font-antialiasing'];

module.exports = customConfig;