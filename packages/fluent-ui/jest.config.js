module.exports = {
  moduleNameMapper: {
    'office-ui-fabric-react/lib/': 'office-ui-fabric-react/lib-commonjs/',
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    browsers: ['chrome', 'firefox', 'safari'],
  },
  transformIgnorePatterns: [`node_modules/(?!(?:.pnpm/)?(${['nanoid'].join('|')}))`],
};
