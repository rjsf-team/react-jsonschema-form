const BABEL_ENV = process.env.BABEL_ENV;
const IS_TEST = BABEL_ENV === 'test';
const ignore = IS_TEST ? [] : ['test/**/*.js'];
const targets = IS_TEST ? { node: 'current' } : {};

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: ['cjs', 'test'].includes(BABEL_ENV) ? 'commonjs' : false,
        targets,
      },
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
      },
    ],
  ],
  plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-optional-chaining'],
  ignore,
  sourceMaps: 'inline',
};
