module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    // "<rootDir>.*(node_modules).*$"
  ],
  globals: {
    'ts-jest': {
      babelConfig: true
    }
  }
};