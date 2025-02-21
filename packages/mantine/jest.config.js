module.exports = {
  rootDir: './',
  snapshotSerializers: ['<rootDir>/test/cleanSnapshotSerializer.ts'],
  verbose: true,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    browsers: ['chrome', 'firefox', 'safari'],
  },
  transformIgnorePatterns: [`/node_modules/(?!nanoid)`],
};
