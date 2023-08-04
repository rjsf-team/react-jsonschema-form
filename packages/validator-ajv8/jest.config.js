module.exports = {
  verbose: true,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    browsers: ['chrome', 'firefox', 'safari'],
  },
  testMatch: ['**/test/**/*.test.ts?(x)'],
  coverageDirectory: '<rootDir>/coverage/',
  collectCoverage: true,
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/test'],
  coverageThreshold: {
    global: {
      // todo: dropped from 100 after jest 29
      branches: 98,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
