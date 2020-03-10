// eslint-disable-next-line no-unused-vars
var webpack = require('webpack');

module.exports = options => ({
  mode: options.mode,
  devtool: options.devtool,
  cache: options.cache,
  context: options.context,
  entry: options.entry,
  output: options.output,
  plugins: options.plugins.concat([
    // Add common plugins here.
  ]),
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                getLocalIdent: (context, localIdentName, localName) =>
                  localName.replace(/([A-Z])/g, '-$1').toLowerCase(),
              },
            },
          },
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
            },
          },
        ],
      },
      {
        test: /\.less$/,
        include: /node_modules/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
            },
          },
        ],
      },
    ]
  },
  externals: options.externals,
});
