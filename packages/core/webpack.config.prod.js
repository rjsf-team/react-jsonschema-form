var path = require("path");
var webpack = require("webpack");
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  mode: "production",
  entry: "./playground/app",
  output: {
    path: path.join(__dirname, "build"),
    filename: "bundle.js",
    publicPath: process.env.SHOW_NETLIFY_BADGE ? "": "/react-jsonschema-form/"
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['json']
    }),
    new MiniCssExtractPlugin({filename: "styles.css", allChunks: true}),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production"),
        SHOW_NETLIFY_BADGE: JSON.stringify(process.env.SHOW_NETLIFY_BADGE)
      }
    })
  ],
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
