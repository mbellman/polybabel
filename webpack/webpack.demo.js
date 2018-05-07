const path = require('path');

module.exports = {
  mode: 'production',
  devServer: {
    contentBase: [
      './demo-dist',
      './demo'
    ],
    port: 1234
  },
  entry: [
    path.resolve('./demo-source/demo.ts')
  ],
  module: {
    rules: [
      {
        test: /\.ts/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            target: 'es5'
          }
        }
      }
    ]
  },
  output: {
    filename: 'demo.js',
    path: path.resolve('./demo-dist')
  },
  devtool: false,
  performance: {
    hints: false
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  externals: {
    'codemirror': 'CodeMirror'
  }
};
