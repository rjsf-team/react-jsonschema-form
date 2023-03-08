module.exports = {
  moduleNameMapper: {
    'office-ui-fabric-react/lib/': 'office-ui-fabric-react/lib-commonjs/',
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    browsers: ['chrome', 'firefox', 'safari'],
  },
};
