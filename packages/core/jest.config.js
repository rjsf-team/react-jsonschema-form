module.exports = {
  verbose: true,
  setupFilesAfterEnv: ['./test/setup-jsdom.js'],
  testMatch: ['**/test/**/*.test.[jt]s?(x)'],
};
