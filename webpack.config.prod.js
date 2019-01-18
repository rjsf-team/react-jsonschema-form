var path = require("path");
var webpack = require("webpack");
var MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "production",
  entry: "./playground/app",
  output: {
    path: path.join(__dirname, "build"),
    filename: "bundle.js",
    publicPath: "/static/"
  },
  plugins: [
    new MiniCssExtractPlugin({filename: "styles.css", allChunks: true}),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    })
  ],
  resolve: {
    extensions: [".js", ".jsx", ".css"]
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [
          "babel-loader",
        ],
        include: [
          path.join(__dirname, "src"),
          path.join(__dirname, "playground"),
          path.join(__dirname, "node_modules", "codemirror", "mode", "javascript"),
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          "css-loader",
        ],
        include: [
          path.join(__dirname, "css"),
          path.join(__dirname, "playground"),
          path.join(__dirname, "node_modules"),
        ],
      }
    ]
  }
};
