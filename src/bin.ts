#!/usr/bin/env node

import * as chokidar from 'chokidar';
import * as yargs from 'yargs';
import esmIndex from './index';

// List of command line arguments with descriptions.
const args = yargs
  .describe('ext', 'File extension used for index files and internal filter')
  .string('ext')
  .describe('log', 'Enable log messages when modules are resolved')
  .boolean('log')
  .describe('name', 'File name used for the index files')
  .string('name')
  .describe('paths', 'List of paths where index files should be generated')
  .array('paths')
  .describe('watch', 'Enables watch mode').argv;

// Search through paths and generate index files.
esmIndex({
  fileExtension: args.ext || undefined,
  fileName: args.name || undefined,
  log: args.log || undefined,
  paths: args.paths || undefined,
})
  .then(result => {
    if (args.watch) {
      console.log('Started watching paths...');
      let options = result.options;
      if (options.paths && options.paths.length) {
        chokidar
          .watch(options.paths, {
            ignored: [
              !new RegExp(`\.${options.fileExtension}$`),
              `${options.fileName}.${options.fileExtension}`,
            ],
          })
          .on('all', () => {
            esmIndex(options).catch(err => {
              console.error(err);
            });
          });
      }
    }
  })
  .catch(err => {
    console.error(err);
  });
