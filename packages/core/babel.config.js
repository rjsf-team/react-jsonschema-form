const BABEL_ENV = process.env.BABEL_ENV;

const defaultPlugins = [
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-object-rest-spread',
  '@babel/plugin-proposal-optional-chaining',
  // IE 11 support
  '@babel/plugin-transform-object-assign'
];

module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        modules: ["cjs", "test"].includes(BABEL_ENV) ? "commonjs" : false,
        targets:
          BABEL_ENV === "test" ? { node: "current" } : { browsers: "defaults" },
      },
    ],
    "@babel/preset-react",
  ],
  env: {
    cjs: {
      plugins: defaultPlugins,
      ignore: ['test/**/*.js']
    },
    umd: {
      plugins: defaultPlugins,
      ignore: ['test/**/*.js']
    },
    es: {
      plugins: [
        ...defaultPlugins,
        ['@babel/plugin-transform-runtime', { useESModules: true, corejs: 2 }]
      ],
      ignore: ['test/**/*.js']
    },
    test: {
      plugins: defaultPlugins,
      ignore: []
    }
  },
};
