// This file is magic.

var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    app: './app.ts',
  },
  output: {
    path: path.resolve(__dirname, 'bc17'),
    publicPath: '/bc17/',
    filename: 'bundle.js'
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js', '.png', '.jpg', '.glsl']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' },
      { test: /\.(png|jpg)$/, loader: 'url?limit=10000' },
      { test: /\.glsl$/, loader: 'raw' }
    ]
  },
  plugins: []
};
