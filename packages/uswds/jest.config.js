const baseConfig = require('../../jest.config.js'); // Assuming a base config exists at the root

module.exports = {
  ...baseConfig, // Inherit base configuration
  rootDir: '.', // Set root directory to the current package
  moduleNameMapper: {
    // Map @rjsf/* imports to their source directories for testing
    // Add explicit mappings for root and subpaths
    '^@rjsf/core/(.*)$': '<rootDir>/../core/src/$1',
    '^@rjsf/core$': '<rootDir>/../core/src',
    '^@rjsf/utils/(.*)$': '<rootDir>/../utils/src/$1',
    '^@rjsf/utils$': '<rootDir>/../utils/src',
    '^@rjsf/validator-ajv8/(.*)$': '<rootDir>/../validator-ajv8/src/$1',
    '^@rjsf/validator-ajv8$': '<rootDir>/../validator-ajv8/src',
    // Add mappings for other @rjsf packages if needed by tests
    // You might also need to map peer dependencies if they cause issues
    // Example: '^@trussworks/react-uswds$': '<rootDir>/node_modules/@trussworks/react-uswds',
  },
  // Add any other package-specific overrides here
  testEnvironment: 'jsdom', // Ensure jsdom environment is set
};
