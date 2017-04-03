'use strict';

const webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: {
    app: './stepmania.js',
  },
  output: {
    path: __dirname + '/dist/assets/',
    filename: '[name].bundle.js',
    publicPath: '/assets/',
  },
  devServer: {
    contentBase: __dirname + '/src/',
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg)$/,
        use: ['file-loader?name=[path][name].[ext]']
      },
      {
        test: /\.xml$/,
        use: ['file-loader?name=[path][name].[ext]']
      },
      {
        test: /astro\/.*\.(ogg|sm)/,
        use: ['file-loader?name=[path][name].[ext]']
      }
    ]
  },
};
