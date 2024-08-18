module.exports = {
  verbose: true,
  testEnvironment: 'jsdom',
  testMatch: ['**/test/**/*.test.[jt]s?(x)'],
  transformIgnorePatterns: [`node_modules/(?!(?:.pnpm/)?(${['nanoid'].join('|')}))`],
};
