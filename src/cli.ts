#!/usr/bin/env node

import * as chokidar from 'chokidar';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as yargs from 'yargs';

interface ConfigurationFile {
  ignoreFiles?: string[];
}

interface ReadFolderCallback {
  (contents: null | string): void;
}

const args = yargs
  .describe('ext', 'File extension used for index files and internal filter')
  .describe('watch', 'Enables watch mode').argv;

// Default file extension used for both, the filter and index file. Any file not
// matching this extension will be automatically ignored.

const fileExt = args.ext || 'js';

// Returns computed hash from provided data string.
const computeHash = (data: string): string => {
  return crypto
    .createHash('md5')
    .update(
      data
        .split('\r\n')
        .map(line => (/^\/\//.test(line) ? '' : line))
        .join()
    )
    .digest('hex');
};

// Compares hash of two or more data strings and returns true if no differences
// were found. Lines that start with double slash (comments) are ignored and not
// part of the computed hash string.

const compareContents = (...data: string[]): boolean => {
  let pass = true;
  if (data.length) {
    let master = computeHash(data[0]);
    data.slice(1).forEach(contents => {
      if (master != computeHash(contents)) {
        if (pass) {
          pass = false;
        }
      }
    });
  }
  return pass;
};

// Reads through folder where the configuration file is placed in. Takes into
// account options from the configuration file. Callback provides contents of
// the generated index file as parameter.

const readFolder = (rc: string, callback?: ReadFolderCallback): void => {
  fs.readdir(path.dirname(rc), (_err, files) => {
    let config: ConfigurationFile = JSON.parse(
      fs.readFileSync(rc, 'utf8') || '{}'
    );
    files = files.filter(file => {
      let pass = true;
      [
        /\.d\.ts$/,
        new RegExp(`\\.(?:spec|test)\\.${fileExt}`),
        new RegExp(`^index\\.${fileExt}$`),
      ]
        .concat(
          config.ignoreFiles
            ? config.ignoreFiles.map((name: string) => {
                return new RegExp(
                  /^\//.test(name)
                    ? `${name.substring(1, name.length - 1)}`
                    : `^${path.basename(name, '.' + fileExt)}\\.${fileExt}$`
                );
              })
            : []
        )
        .forEach((re: RegExp) => {
          if (!new RegExp(`\\.${fileExt}$`).test(file) || re.test(file)) {
            if (pass) {
              pass = false;
            }
          }
        });
      return pass;
    });
    let contents: string[] = [];
    if (files.length) {
      files.forEach(file => {
        let name = path.basename(file, '.' + fileExt);
        contents.push(`export { default as ${name} } from './${name}';`);
      });
    }
    callback &&
      callback(contents.length ? contents.concat(['']).join('\r\n') : null);
  });
};

// Creates index file with default exports according to a list of file names
// that passed the ignore filter. If index file already exists, it compares the
// list of exports with the current list and generates new contents only when
// needed.

const indexFile = (rc: string): void => {
  readFolder(rc, contents => {
    let index = path.join(path.dirname(rc), `index.${fileExt}`);
    if (contents) {
      fs.access(index, fs.constants.F_OK, err => {
        if (!err) {
          fs.readFile(index, 'utf8', (_err, data) => {
            if (!compareContents(contents, data)) {
              fs.writeFile(index, contents, err => {
                if (err) throw err;
              });
            }
          });
        } else {
          fs.writeFile(index, contents, err => {
            if (err) throw err;
          });
        }
      });
    } else {
      fs.access(index, fs.constants.F_OK, err => {
        if (!err) {
          fs.unlink(index, err => {
            if (err) throw err;
          });
        }
      });
    }
  });
};

// Search for index configurations and creates index files according to its
// contents. Specific file names can be ignored via ignoreFiles property array
// in configuration file.

glob(`${args._[0] || './**'}/.indexrc.json`, (_err, files) => {
  files.forEach(rc => {
    indexFile(rc);
    if (args.watch) {
      chokidar
        .watch(path.dirname(rc), {
          ignored: [!new RegExp(`\\.(?:${fileExt}|json)$`), `index.${fileExt}`],
        })
        .on('all', () => {
          indexFile(rc);
        });
    }
  });
});
