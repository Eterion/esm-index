#!/usr/bin/env node

import * as chokidar from 'chokidar';
import * as path from 'path';
import * as yargs from 'yargs';
import esmIndex from './index';

// List of custom command line arguments with descriptions.
const args = yargs
  .describe('ext', 'File extension used for index files and internal filter')
  .describe('log', 'Enable log messages when modules are evaluated')
  .describe('name', 'File name used for the index files')
  .describe('watch', 'Enables watch mode').argv;

// Search for index configuration files and generate index files according to
// its contents and options. Specific file names can be ignored via ignoreFiles
// property through options or configuration files.

esmIndex(args._[0], {
  fileExtension: args.ext,
  fileName: args.name,
}).then(files => {
  files.forEach(({ rc, options, message }) => {
    if (args.log) {
      console.log(message);
    }
    if (args.watch) {
      chokidar
        .watch(path.dirname(rc), {
          ignored: [
            !new RegExp(`\.${options.fileExtension}$`),
            `${options.fileName}.${options.fileExtension}`,
          ],
        })
        .on('all', () => {
          esmIndex(rc, options).then(modules => {
            modules.forEach(({ code, message }) => {
              if (args.log) {
                if (['add', 'update', 'remove'].includes(code)) {
                  console.log(message);
                }
              }
            });
          });
        });
    }
  });
});
