module.exports = {
  moduleNameMapper: {
    'office-ui-fabric-react/lib/': 'office-ui-fabric-react/lib-commonjs/',
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    browsers: ['chrome', 'firefox', 'safari'],
  },
};
