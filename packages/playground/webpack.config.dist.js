var path = require("path");
var webpack = require("webpack");
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  mode: "production",
  devtool: "source-map",
  entry: [
    "./src/index"
  ],
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  output: {
    path: path.join(__dirname, "dist"),
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
          path.join(__dirname, "node_modules", "mode", "javascript"),
        ]
      },
      {
        test: /\.s?css$/,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader"
        ],
        include: [
          path.join(__dirname, "src"),
          path.join(__dirname, "playground"),
          path.join(__dirname, "node_modules", "monaco-editor")
        ],
      },
      {
        test: /\.less$/,
        include: /node_modules[\\/]antd/,
        use: [
          {
            loader: "style-loader",
            options: {
              insert: "#antd-styles-iframe"
            }
          },
          "css-loader",
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
            },
          },
        ],
      },
      {
        test: /\.ttf$/,
        use: ['file-loader'],
        include: [
          path.join(__dirname, "src"),
          path.join(__dirname, "playground"),
          path.join(__dirname, "node_modules", "monaco-editor"),
        ]
      },
      {
        type: 'javascript/auto',
        test: /\.mjs$/,
        use: []
      }
    ]
  }
};
