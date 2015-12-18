var path = require("path");
var webpack = require("webpack");

module.exports = {
  devtool: "eval",
  entry: [
    "webpack-hot-middleware/client?reload=true",
    "cosmos-js"
  ],
  resolve: {
    alias: {
      COSMOS_COMPONENTS: path.join(__dirname, "src/components"),
      COSMOS_FIXTURES: path.join(__dirname, "fixtures")
    }
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "bundle.js",
    publicPath: "/static/"
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loader: "babel",
      include: path.join(__dirname, "src"),
      query: {
        plugins: ["react-transform"],
        extra: {
          "react-transform": {
            transforms: [{
              transform: "react-transform-hmr",
              imports: ["react"],
              locals: ["module"]
            }, {
              transform: "react-transform-catch-errors",
              imports: ["react", "redbox-react"]
            }]
          }
        }
      }
    }]
  }
};
