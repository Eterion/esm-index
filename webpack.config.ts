import { resolve } from 'path';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { BannerPlugin, Configuration } from 'webpack';
import * as NodeExternals from 'webpack-node-externals';

export default ['bin', 'index'].map(name => {
  return <Configuration>{
    target: 'node',
    externals: [NodeExternals()],
    node: {
      __dirname: false,
      __filename: false,
    },
    entry: {
      [name]: resolve(__dirname, 'src', name),
    },
    output: {
      filename: '[name].js',
      path: resolve(__dirname),
      ...(name == 'index'
        ? { library: 'esmIndex', libraryTarget: 'commonjs2' }
        : {}),
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: 'ts-loader',
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
      plugins: [new TsconfigPathsPlugin()],
    },
    plugins:
      name == 'bin'
        ? [new BannerPlugin({ banner: '#!/usr/bin/env node', raw: true })]
        : [],
  };
});
