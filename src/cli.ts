import { Promise } from 'es6-promise';
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
  recursiveSearch: boolean;
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
 * Compares hash of two or more data strings and returns true if no differences
 * were found. Line that start with double slash (comments) are ignored and not
 * taken into account by the comparison.
 *
 * @param {string[]} data List of data strings to be compared.
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
 * Returns contents for index file generated from provided list of modules.
 * @param {object[]} modules List of paths to modules to be imported.
 */

function createContents(modules: Module[]): string {
  let src = '';
  if (modules.length) {
    const esmIndex = modules.filter(module => module.isIndex === true);
    src = modules.reduce((src, module) => {
      return (
        src +
        (module.isIndex
          ? `import * as ${module.name} from './${module.name}';\r\n`
          : `export { default as ${module.name} } from './${module.name}';\r\n`)
      );
    }, src);
    if (esmIndex.length) {
      src =
        src +
        `export { ${esmIndex.map(module => module.name).join(', ')} }\r\n`;
    }
  }
  return src;
}

/**
 * Creates index file with default exports according to a list of file names
 * that passed the ignore filter. If index file already exists, it compares the
 * list of exports with the current list and generates new contents when needed.
 *
 * @param {string} rc Path to configuration file.
 * @param {object} options Options (passed cmd arguments).
 */

function createFile(rc: string, options: Options): void {
  getModules(rc, options, modules => {
    let index = path.join(
      path.dirname(rc),
      `${options.fileName}.${options.fileExtension}`
    );
    let contents: string = createContents(modules);
    if (modules.length) {
      fs.access(index, fs.constants.R_OK, err => {
        if (err) {
          fs.writeFile(index, contents, err => {
            if (err) {
              console.log(`Cannot write ${index} file.`);
              throw err;
            }
          });
        } else {
          fs.readFile(index, 'utf8', (err, data) => {
            if (err) {
              console.log(`Cannot read ${index} file.`);
              throw err;
            }
            if (!compareContents(contents, data)) {
              fs.writeFile(index, contents, err => {
                if (err) {
                  console.log(`Cannot write ${index} files.`);
                  throw err;
                }
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
              console.log(`Cannot unlink ${index} file.`);
              throw err;
            }
          });
        }
      });
    }
  });
}

/**
 * Reads provided node-glob path and provides callback with file list of found
 * configuration files.
 *
 * @param {string} src Node-glob pattern.
 * @param {function} callback Callback with files as parameter.
 */

function getConfig(src: string, callback: (files: string[]) => void): void {
  glob(`${src || './**'}/.@(esm-index|index)rc.json`, (err, files) => {
    if (err) {
      console.log('Failed to read files.');
      throw err;
    }
    callback(files);
  });
}

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
 * Reads through directory in which the configuration file is placed. Callback
 * provides a parameter with a list of detected modules.
 *
 * @param {string} rc Path to configuration file.
 * @param {object} options Options (passed cmd arguments).
 * @param {function} callback Callback with a list of modules as parameter.
 */

function getModules(
  rc: string,
  options: Options,
  callback: (modules: Module[]) => void
) {
  const root = path.dirname(rc);
  fs.readdir(root, (err, files) => {
    if (err) {
      console.log(`Cannot read ${root} directory.`);
      throw err;
    }
    const promises = files.map(
      file =>
        new Promise((resolve: (module: Module | null) => void, reject) => {
          fs.stat(path.join(root, file), (err, stats) => {
            if (err) {
              reject(err);
            }

            // Resolve module as child esm-index.
            if (stats.isDirectory()) {
              if (options.recursiveSearch) {
                getConfig(path.join(root, file), files => {
                  if (files.length) {
                    getOptions(files[0], options => {
                      getModules(files[0], options, modules => {
                        if (modules.length) {
                          resolve({
                            isIndex: true,
                            name: path.basename(
                              file,
                              '.' + options.fileExtension
                            ),
                          });
                        } else {
                          resolve(null);
                        }
                      });
                    });
                  } else {
                    resolve(null);
                  }
                });
              } else {
                resolve(null);
              }
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
                          ? name.substring(1, name.length - 1)
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
              if (pass) {
                resolve({
                  isIndex: false,
                  name: path.basename(file, '.' + options.fileExtension),
                });
              } else {
                resolve(null);
              }
            }
          });
        })
    );
    Promise.all(promises)
      .then(modules => {
        let list: Module[] = <Module[]>modules.filter(
          module => module !== null
        );
        callback(
          list.sort((a, b) => {
            if (a.isIndex) return -1;
            if (b.isIndex) return 1;
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
          })
        );
      })
      .catch(err => {
        if (err) {
          console.log('Failed to read files.');
          throw err;
        }
      });
  });
}

/**
 * Reads configuration files and provides callback with options object as
 * parameter.
 *
 * @param {string} rc Path to configuration file.
 * @param {function} callback Callback with options as parameter.
 */

function getOptions(rc: string, callback: (options: Options) => void): void {
  fs.readFile(rc, 'utf8', (err, config) => {
    if (err) {
      console.log(`Cannot read ${rc} file.`);
      throw err;
    }
    callback(
      (<any>Object).assign(
        <Options>{
          fileExtension: args.ext || 'js',
          fileName: args.name || 'index',
          ignoreFiles: [],
          recursiveSearch: true,
        },
        JSON.parse(config || '{}')
      )
    );
  });
}

// Search for index configuration files and creates index files according to its
// contents and options. Specific file names can be ignored via ignoreFiles
// property in configuration file.

getConfig(args._[0], files => {
  files.forEach(rc => {
    getOptions(rc, options => {
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
