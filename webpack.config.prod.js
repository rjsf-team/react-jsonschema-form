var path = require("path");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: "./playground/app",
  output: {
    path: path.join(__dirname, "build"),
    filename: "bundle.js",
    publicPath: "/static/"
  },
  plugins: [
    new ExtractTextPlugin("styles.css", {allChunks: true}),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    })
  ],
  resolve: {
    extensions: ["", ".js", ".jsx", ".css"]
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: "babel",
        include: [
          path.join(__dirname, "src"),
          path.join(__dirname, "playground"),
          path.join(__dirname, "node_modules", "codemirror", "mode", "javascript"),
        ],
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("css-loader"),
        include: [
          path.join(__dirname, "css"),
          path.join(__dirname, "playground"),
          path.join(__dirname, "node_modules"),
        ],
      },
      {
        test: /\.json$/,
        loader:"json-loader",
        include: [
          path.join(__dirname, "css"),
          path.join(__dirname, "playground"),
          path.join(__dirname, "node_modules"),
        ],
      }
    ]
  }
};
