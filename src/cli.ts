#!/usr/bin/env node

import * as chokidar from 'chokidar';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as yargs from 'yargs';

interface Options {
  fileExtension: string;
  fileName: string;
  ignoreFiles: string[];
}

interface Module {
  isIndex: boolean;
  name: string;
}

const args = yargs
  .describe('ext', 'File extension used for index files and internal filter')
  .describe('name', 'File name used for the index files')
  .describe('watch', 'Enables watch mode').argv;

/**
 * Returns computed hash from provided data string.
 * @param {string} data Data string.
 */

function getHash(data: string): string {
  return crypto
    .createHash('md5')
    .update(
      data
        .split('\r\n')
        .map(line => (/^\/\//.test(line) ? '' : line))
        .join()
    )
    .digest('hex');
}

/**
 * Compares hash of two or more data strings and returns true if no differences
 * were found. Lines that start with double slash (comments) are ignored and not
 * part of the computed hash string.
 *
 * @param {string} data List of data strings to be combared.
 */

function compareContents(...data: string[]): boolean {
  let pass = true;
  if (data.length) {
    let master = getHash(data[0]);
    data.slice(1).forEach(contents => {
      if (master != getHash(contents)) {
        if (pass) {
          pass = false;
        }
      }
    });
  }
  return pass;
}

/**
 * Reads through directory in which the configuration file is placed. Callback
 * provides a parameter with list of detected modules.
 *
 * @param {string} rc Path to configuration file.
 * @param {string} [options.fileName='index'] Name of generated index file.
 * @param {string} [options.fileExtension='js'] File extension that is used to
 * filter modules.
 * @param {string[]} [options.ignoreFiles=[]] List of ignored files.
 * @param {function} callback Callback with list of module paths as parameter.
 */

function getModules(
  rc: string,
  options: Options,
  callback: (modules: Module[]) => void
) {
  const root = path.dirname(rc);
  fs.readdir(root, (err, files) => {
    if (err) throw err;
    const promises = files.map(
      file =>
        new Promise((resolve: (module: Module | null) => void, reject) => {
          fs.stat(path.join(root, file), (err, stats) => {
            if (err) {
              reject(err);
            }

            // Resolve module as child esm-index.
            if (stats.isDirectory()) {
              fs.access(
                path.join(
                  root,
                  file,
                  `${options.fileName}.${options.fileExtension}`
                ),
                fs.constants.R_OK,
                err => {
                  if (err) {
                    resolve(null);
                  }
                  resolve({
                    isIndex: true,
                    name: path.basename(file, '.' + options.fileExtension),
                  });
                }
              );
            }

            // Resolve module as file.
            else {
              let pass = true;
              [
                /\.d\.ts$/,
                new RegExp(`\\.(?:spec|test)\\.${options.fileExtension}`),
                new RegExp(`^${options.fileName}\\.${options.fileExtension}`),
              ]
                .concat(
                  options.ignoreFiles.map(
                    (name: string) =>
                      new RegExp(
                        /^\//.test(name)
                          ? `${name.substring(1, name.length - 1)}`
                          : `^${path.basename(
                              name,
                              '.' + options.fileExtension
                            )}\\.${options.fileExtension}`
                      )
                  )
                )
                .forEach((re: RegExp) => {
                  if (
                    !new RegExp(`\\.${options.fileExtension}$`).test(file) ||
                    re.test(file)
                  ) {
                    if (pass) {
                      pass = false;
                    }
                  }
                });
              resolve(
                pass
                  ? {
                      isIndex: false,
                      name: path.basename(file, '.' + options.fileExtension),
                    }
                  : null
              );
            }
          });
        })
    );
    Promise.all(promises).then(modules => {
      callback(<Module[]>modules.filter(module => module !== null));
    });
  });
}

/**
 * Returns contents for index files generated from provided list of modules.
 * @param {object[]} modules List of paths to modules to be imported.
 */

function createFileContents(modules: Module[]): string {
  let src = '';
  if (modules.length) {
    const indexes = modules.filter(module => module.isIndex == true);
    src = modules.reduce((src, module) => {
      return (
        src +
        (module.isIndex
          ? `import * as ${module.name} from './${module.name}';\r\n`
          : `export { default as ${module.name} } from './${module.name}';\r\n`)
      );
    }, src);
    if (indexes.length) {
      src = src + `export { ${indexes.map(module => module.name).join(', ')} }`;
    }
  }
  return src;
}

/**
 * Creates index file with default exports according to a list of file names
 * that passed the ignore filter. If index file already exists, it compares the
 * list of exports with the current list and generates new contents only when
 * needed.
 *
 * @param {string} rc Path to configuration file.
 * @param {string} ext File extension to be imported.
 */

function createFile(rc: string, options: Options): void {
  getModules(rc, options, modules => {
    let index = path.join(
      path.dirname(rc),
      `${options.fileName}.${options.fileExtension}`
    );
    let contents: string = createFileContents(modules);
    if (modules.length) {
      fs.access(index, fs.constants.R_OK, err => {
        if (err) {
          fs.writeFile(index, contents, err => {
            if (err) throw err;
          });
        } else {
          fs.readFile(index, 'utf8', (err, data) => {
            if (err) throw err;
            if (!compareContents(contents, data)) {
              fs.writeFile(index, contents, err => {
                if (err) throw err;
              });
            }
          });
        }
      });
    } else {
      fs.access(index, fs.constants.F_OK, err => {
        if (!err) {
          fs.unlink(index, err => {
            if (err) {
              throw err;
            }
          });
        }
      });
    }
  });
}

// Search for index configurations and creates index files according to its
// contents. Specific file names can be ignored via ignoreFiles property array
// in configuration file.

glob(`${args._[0] || './**'}/.@(esm-index|index)rc.json`, (err, files) => {
  if (err) throw err;
  files.forEach(rc => {
    fs.readFile(rc, 'utf8', (err, config) => {
      if (err) throw err;
      let options: Options = (<any>Object).assign(
        <Options>{
          fileExtension: args.ext || 'js',
          fileName: args.name || 'index',
          ignoreFiles: [],
        },
        JSON.parse(config || '{}')
      );
      createFile(rc, options);
      if (args.watch) {
        chokidar
          .watch(path.dirname(rc), {
            ignored: [
              !new RegExp(`\\.(?:${options.fileExtension}|json)$`),
              `${options.fileName}.${options.fileExtension}`,
            ],
          })
          .on('all', () => {
            createFile(rc, options);
          });
      }
    });
  });
});
