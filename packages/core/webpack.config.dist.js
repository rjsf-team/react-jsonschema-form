var path = require("path");
var webpack = require("webpack");
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

export default {
  mode: "production",
  cache: true,
  context: __dirname + "/src",
  entry: "./index.tsx",
  output: {
    path: path.join(__dirname, "dist"),
    publicPath: "/dist/",
    filename: "react-jsonschema-form.js",
    library: "JSONSchemaForm",
    libraryTarget: "umd"
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['json']
    }),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    })
  ],
  devtool: "source-map",
  externals: {
    react: {
      root: "React",
      commonjs: "react",
      commonjs2: "react",
      amd: "react"
    },
    'react-dom': {
      root: "ReactDOM",
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom',
      umd: 'react-dom',
    }
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".css"]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: [
          "babel-loader",
          "ts-loader"
        ],
        exclude: [
          path.join(__dirname, "node_modules", "core-js"),
          path.join(__dirname, "node_modules", "babel-runtime"),
        ],
      },
    ]
  }
};
