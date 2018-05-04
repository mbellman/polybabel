const path = require('path');

module.exports = {
  mode: 'production',
  entry: [
    path.resolve('./source/demo-vendor.ts')
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
      },
      {
        test: /\.css/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      }
    ]
  },
  output: {
    filename: 'demo-vendor.js',
    path: path.resolve('./demo-dist')
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  }
};
