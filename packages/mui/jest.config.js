module.exports = {
  snapshotSerializers: ['@emotion/jest/serializer'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    browsers: ['chrome', 'firefox', 'safari'],
  },
  transformIgnorePatterns: [`/node_modules/(?!nanoid)`],
};
