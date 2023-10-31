module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    browsers: ['chrome', 'firefox', 'safari'],
  },
  transformIgnorePatterns: [`/node_modules/(?!nanoid)`],
};
