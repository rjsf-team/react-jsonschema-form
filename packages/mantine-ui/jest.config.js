module.exports = {
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
  },
  snapshotSerializers: ['@emotion/jest/serializer'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    browsers: ['chrome', 'firefox', 'safari'],
  },
};
