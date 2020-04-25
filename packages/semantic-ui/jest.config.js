// jest.config.js
const {defaults} = require('jest-config');
module.exports = {
  // ...
  moduleFileExtensions: [...defaults.moduleFileExtensions],
  transformIgnorePatterns :["<rootDir>/node_modules/@rsjf"],
  verbose: true
  // ...
};