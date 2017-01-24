// This is all james' fault
// Don't worry, he eventually repented and became an electrical engineer

var webpack = require('webpack');
var merge = require('webpack-merge');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var conf = {
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
    // add `.ts` as a resolvable extension.
    extensions: ['.ts', '.js', '.png', '.jpg']
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'awesome-typescript-loader' },
      { test: /\.(png|jpg)$/, loader: 'url-loader?limit=10000&name=[name]-[hash:base64:7].[ext]' },
      { test: /\.css$/, loader: "style-loader!css-loader" }
    ]
  }
};

module.exports = function(env) {
  env = env || {};

  if (env.dev) {
    // we're in dev
    conf = merge(conf, {
      devtool: 'source-map',
      plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.LoaderOptionsPlugin({
          minimize: false,
          debug: true
        }),
      ]
    });
  } else {
    // we're compiling for prod
    conf = merge(conf, {
      plugins: [
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.LoaderOptionsPlugin({
          minimize: true,
          debug: false
        }),
      ]
    });
  }

  if (env.electron) {
    // we're compiling for electron
    conf = merge(conf, {
      target: 'electron-renderer',
      plugins: [
        new webpack.DefinePlugin({
          'process.env.ELECTRON': true
        })
      ],
      // electron will find './bc17/thing.ext' but won't find '/bc17/thing.ext'
      output: { publicPath: './bc17/' }
    });
  } else {
    // we're compiling for the browser
    conf = merge(conf, {
      plugins: [
        new webpack.DefinePlugin({
          'process.env.ELECTRON': false
        })
      ],
      externals: {
        'electron': 'electron',
        'os': 'os',
        'fs': 'fs',
        'child_process': 'child_process',
        'http': 'http'
      }
    });
  }

  return conf;
};
