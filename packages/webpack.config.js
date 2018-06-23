const path = require('path');
const nodeExternals = require('webpack-node-externals');

const BASE_PATH = process.cwd();
const pkg = require(path.resolve(BASE_PATH, 'package.json'));
const output = path.parse(pkg.main);

module.exports = {
  mode: 'production',
  entry: `./${pkg.source}`,
  output: {
    path: path.resolve(BASE_PATH, output.dir),
    filename: output.base,
    libraryTarget: 'commonjs'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: { cacheDirectory: true }
        }
      }
    ]
  },
  externals: [
    nodeExternals({ modulesFromFile: { include: ['peerDependencies'] } })
  ]
};
