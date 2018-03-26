'use strict';

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const indexOptions = {
  title: 'Socka',
  template: 'src/index.html',
  inject: true,
  alwaysWriteToDisk: true, // Required to use with webpack-dev-server
  filename: path.resolve(__dirname + '/dist/index.html')
};

module.exports = env => {

  let conf = {
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
      new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(env.production)
      }),
      new HtmlWebpackPlugin(indexOptions),
      new HtmlWebpackHarddiskPlugin(),
      new CopyWebpackPlugin([
        {
          from: 'songs',
          to: path.resolve(__dirname + '/dist/songs'),
        }
      ], {
        copyUnmodified: true,
      })
    ],
    module: {
      rules: [
        {
          test: /\.(png|jpg)$/,
          use: [
            'file-loader?name=[path][name].[ext]',
            {
              loader: 'image-webpack-loader',
              options: {
                bypassOnDebug: true
              }
            }
          ]
        },
        {
          test: /\.(xml|fnt)$/,
          use: ['file-loader?name=[path][name].[ext]']
        },
      ]
    },
  };

  if (env.production !== true) {
    conf['devtool'] = 'inline-cheap-source-map';
  } else {
    conf['devtool'] = 'nosources-source-map';
    conf['plugins'].push(new UglifyJsPlugin());
  }

  return conf;
}
