import path from 'path';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

const BASE_PATH = process.cwd();
const pkg = require(path.resolve(BASE_PATH, 'package.json'));

export default {
  input: './src/index.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourceMap: true
    }
  ],
  external: pkg.peerDependencies ? Object.keys(pkg.peerDependencies) : [],
  plugins: [babel(), resolve(), commonjs()]
};
