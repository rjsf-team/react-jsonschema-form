module.exports = {
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
  },
  verbose: true,
  setupFilesAfterEnv: ['./test/setup-jsdom.js'],
  testMatch: ['**/test/**/*.test.[jt]s?(x)'],
};
