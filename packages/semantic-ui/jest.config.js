module.exports = {
  verbose: true,
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [`node_modules/(?!(?:.pnpm/)?(${['nanoid'].join('|')}))`],
};
