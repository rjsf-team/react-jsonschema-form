var path = require("path");
var webpack = require("webpack");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: ["./src/index"],
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
  output: {
    path: path.join(__dirname, "build"),
  },
  devServer: {
    static: { directory: path.join(__dirname, "build") },
    compress: true,
    hot: true,
    port: 8080,
  },
  resolve: {
    alias: {
      // The following is needed to allow the material ui v4 theme to properly load the css into the iframe
      "@material-ui/styles": path.resolve(
        "node_modules",
        "@material-ui/styles"
      ),
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
      // The following two are needed to allow the material ui v5 theme to properly load the css into the iframe
      "@emotion/react": path.resolve("./node_modules/@emotion/react"),
      "@emotion/styled": path.resolve("./node_modules/@emotion/styled"),
    },
  },
  plugins: [
    new MonacoWebpackPlugin({
      features: ["!gotoSymbol"],
      languages: ["json"],
    }),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "index.html",
    }),
    new webpack.DefinePlugin({
      "process.env": {
        SHOW_NETLIFY_BADGE: JSON.stringify(process.env.SHOW_NETLIFY_BADGE),
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: ["babel-loader"],
        include: [
          path.join(__dirname, "src"),
          path.join(__dirname, "playground"),
          path.join(__dirname, "node_modules", "mode", "javascript"),
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
      {
        test: /\.s?css$/,
        use: ["style-loader", "css-loader", "sass-loader"],
        include: [
          path.join(__dirname, "src"),
          path.join(__dirname, "playground"),
          path.join(__dirname, "node_modules", "monaco-editor"),
        ],
      },
      {
        test: /\.less$/,
        include: /node_modules[\\/]antd/,
        use: [
          {
            loader: "style-loader",
            options: {
              insert: "#antd-styles-iframe",
            },
          },
          "css-loader",
          {
            loader: "less-loader",
            options: {
              javascriptEnabled: true,
            },
          },
        ],
      },
      {
        test: /\.ttf$/,
        type: "asset/resource",
        include: [
          path.join(__dirname, "src"),
          path.join(__dirname, "playground"),
          path.join(__dirname, "node_modules", "monaco-editor"),
        ],
      },
      {
        type: "javascript/auto",
        test: /\.mjs$/,
        use: [],
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
};
