var webpack = require("webpack");

module.exports = {
  cache: true,
  context: __dirname + "/src",
  entry: "./index.js",
  output: {
    path: "./dist",
    publicPath: "/dist/",
    filename: "react-jsonschema-form.js",
    library: "JSONSchemaForm",
    libraryTarget: "umd"
  },
  plugins: [
    new webpack.IgnorePlugin(/^(buffertools)$/), // unwanted "deeper" dependency
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    })
  ],
  node: {
    Buffer: "mock",
  },
  devtool: "source-map",
  externals: {
    react: {
      root: "React",
      commonjs: "react",
      commonjs2: "react",
      amd: "react"
    }
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ["babel"],
      }
    ]
  }
};
