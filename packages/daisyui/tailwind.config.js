const config = require('./tailwind.config.json');

// Add plugins that require JavaScript functions
config.plugins = [require('daisyui')];

module.exports = config;
