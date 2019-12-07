var path = require("path");
var webpack = require("webpack");
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

export default {
  mode: "development",
  devtool: "source-map",
  entry: [
    "webpack-hot-middleware/client?reload=true",
    "./playground/app"
  ],
  output: {
    path: path.join(__dirname, "build"),
    filename: "bundle.js",
    publicPath: "/static/"
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['json']
    }),
    new webpack.HotModuleReplacementPlugin()
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
        ]
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader",
        ],
        include: [
          path.join(__dirname, "css"),
          path.join(__dirname, "playground"),
          path.join(__dirname, "node_modules"),
        ],
      },
    ]
  }
};
