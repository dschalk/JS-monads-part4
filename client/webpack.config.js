var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [
    './src/main.js',
  ],
  output: {
      publicPath: './dist/',
      filename: 'main.js'
  },
  debug: true,
  devtool: 'source-map',
  module: {
    loaders: [
      { 
        test: /\.js$/,
        exclude: '/mnt/B/Javascript_Monads/__acc_Zone_29/JS-monads-part4/client/node_modules',
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      },
    ]
  }
};
