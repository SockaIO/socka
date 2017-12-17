'use strict';

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const indexOptions = {
  title: 'Socka',
  template: 'src/index.html',
  inject: true,
  alwaysWriteToDisk: true, // Required to use with webpack-dev-server
  filename: path.resolve(__dirname + '/dist/index.html')
};

module.exports = {
  context: __dirname,
  entry: {
    app: './stepmania.js',
  },
  output: {
    path: path.resolve(__dirname + '/dist/assets/'),
    filename: '[name].bundle.js',
    publicPath: '/assets/',
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    publicPath: '/assets/',
  },
  plugins: [
    new HtmlWebpackPlugin(indexOptions),
    new HtmlWebpackHarddiskPlugin(),
    new CopyWebpackPlugin([
      {
        from: 'songs',
        to: path.resolve(__dirname + '/dist/songs'),
      }
    ], {
      copyUnmodified: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(png|jpg)$/,
        use: ['file-loader?name=[path][name].[ext]']
      },
      {
        test: /\.(xml|fnt)$/,
        use: ['file-loader?name=[path][name].[ext]']
      },
      {
        test: /astro\/.*\.(ogg|sm)/,
        use: ['file-loader?name=[path][name].[ext]']
      }
    ]
  },
};
