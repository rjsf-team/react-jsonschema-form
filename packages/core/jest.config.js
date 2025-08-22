module.exports = {
  verbose: true,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./test/setup-jest-env.js'],
  testMatch: ['**/test/**/*.test.[jt]s?(x)'],
};
