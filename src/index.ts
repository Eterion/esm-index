import * as fs from 'fs';
import * as path from 'path';
import { Promise } from 'core-js';
import * as glob from 'glob';
import * as crypto from 'crypto';

interface Arguments {
  [key: string]: string;
}

interface Options {
  fileExtension?: string;
  fileName?: string;
  ignoreFiles?: string[];
  recursiveSearch?: boolean;
}

interface Module {
  isIndex: boolean;
  name: string;
}

namespace ResolveModule {
  /**
   * Returns a promise with resolved file path as directory.
   * @param {string} root Path to directory where configuration file is placed in.
   * @param {string} file File name.
   * @param {object} options Configuration options.
   */

  export function asDirectory(
    root: string,
    file: string,
    options: Options
  ): Promise<Module | null> {
    return new Promise((resolve, reject) => {
      if (options.recursiveSearch) {
        readPattern(path.join(root, file))
          .then(files => {
            if (files.length) {
              getOptions(files[0])
                .then(options => {
                  getModules(files[0], options)
                    .then(modules => {
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
                    })
                    .catch(err => {
                      reject(err);
                    });
                })
                .catch(err => {
                  reject(err);
                });
            } else {
              resolve(null);
            }
          })
          .catch(err => {
            reject(err);
          });
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Returns a promise with resolved file path as file.
   * @param {string} file File name.
   * @param {options} options Configuration options.
   */

  export function asFile(
    file: string,
    options: Options
  ): Promise<Module | null> {
    return new Promise(resolve => {
      let pass = true;
      [
        /\.d\.ts$/,
        new RegExp(`\\.(?:spec|test)\\.${options.fileExtension}`),
        new RegExp(`^${options.fileName}\\.${options.fileExtension}`),
      ]
        .concat(
          options.ignoreFiles
            ? options.ignoreFiles.map(
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
            : []
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
    });
  }

  /**
   * Returns proper module name in cases where file or directory name contains
   * non-standard characters.
   *
   * @param module Module name.
   */

  export function asName(module: string) {
    const chars = 'a-zA-Z0-9';
    return module
      .replace(new RegExp(`^[^${chars}]+`), '')
      .replace(new RegExp(`[^${chars}]+$`), '')
      .replace(new RegExp(`[^${chars}]+([${chars}])`, 'g'), (_match, $1) => {
        return $1.toUpperCase();
      });
  }
}

/**
 * Compares hash of two or more data strings and returns true if no differences
 * were found. Lines that start with double slash (comments) are automatically
 * ignored and not taken into account by the comparison.
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
 * Returns contents for index file generated from list of modules.
 * @param {object[]} modules List of modules to be imported.
 */

function createContents(modules: Module[]): string {
  let src = '';
  if (modules.length) {
    const index = modules.filter(module => module.isIndex === true);
    src = modules.reduce((src, module) => {
      return (
        src +
        (module.isIndex
          ? `import * as ${ResolveModule.asName(module.name)} from './${
              module.name
            }';\r\n`
          : `export { default as ${ResolveModule.asName(
              module.name
            )} } from './${module.name}';\r\n`)
      );
    }, src);
    if (index.length) {
      src =
        src +
        `export { ${index
          .map(module => ResolveModule.asName(module.name))
          .join(', ')} };\r\n`;
    }
  }
  return src;
}

/**
 * Creates index file with default exports according to a list of file names
 * that passed the ignore filter and returns a promise with index file path. If
 * index file already exists, it compares the list of exports with the current
 * list and generates new content only when needed.
 *
 * @param {string} rc Path to configuration file.
 * @param {object} options Configuration options.
 */

function createFile(rc: string, options: Options): Promise<string> {
  return new Promise((resolve, reject) => {
    getModules(rc, options)
      .then(modules => {
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
                  reject(err);
                }
                resolve(index);
              });
            } else {
              fs.readFile(index, 'utf8', (err, data) => {
                if (err) {
                  console.log(`Cannot read ${index} file.`);
                  reject(err);
                }
                if (!compareContents(contents, data)) {
                  fs.writeFile(index, contents, err => {
                    if (err) {
                      console.log(`Cannot write ${index} file.`);
                      reject(err);
                    }
                    resolve(index);
                  });
                }
              });
            }
          });
        } else {
          fs.access(index, err => {
            if (!err) {
              fs.unlink(index, err => {
                if (err) {
                  console.log(`Cannot unlink ${index} file.`);
                  reject(err);
                }
              });
            }
          });
        }
      })
      .catch(err => {
        reject(err);
      });
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
 * Reads through directory in which the configuration file is placed in and
 * returns a promise with list of modules as parameter.
 *
 * @param {string} rc Path to configuration file.
 * @param {object} options Configuration options.
 */

function getModules(rc: string, options: Options): Promise<Module[]> {
  const root = path.dirname(rc);
  return new Promise((resolve, reject) => {
    fs.readdir(root, (err, files) => {
      if (err) {
        console.log(`Cannot read ${root} folder.`);
        reject(err);
      }
      const promises: Promise<Module | null>[] = files.map(
        file =>
          new Promise((success, fail) => {
            fs.stat(path.join(root, file), (err, stats) => {
              if (err) {
                fail(err);
              }
              if (stats.isDirectory()) {
                ResolveModule.asDirectory(root, file, options).then(result => {
                  success(result);
                });
              } else {
                ResolveModule.asFile(file, options).then(result => {
                  success(result);
                });
              }
            });
          })
      );
      Promise.all(promises)
        .then(modules => {
          let list: Module[] = <Module[]>modules.filter(
            module => module !== null
          );
          resolve(
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
            reject(err);
          }
        });
    });
  });
}

/**
 * Reads configuration file and returns a promise with options object compiled
 * from defaults, command line arguments and json content.
 *
 * @param {string} rc Path to configuration file.
 * @param {object} args Command line options.
 */

function getOptions(
  rc: string,
  { ext, name }: Arguments = {}
): Promise<Options> {
  return new Promise((resolve, reject) => {
    fs.readFile(rc, 'utf8', (err, config) => {
      if (err) {
        console.log(`Cannot read ${rc} file.`);
        reject(err);
      }
      resolve(
        Object.assign(
          <Options>{
            fileExtension: ext || 'js',
            fileName: name || 'index',
            ignoreFiles: [],
            recursiveSearch: true,
          },
          JSON.parse(config || '{}')
        )
      );
    });
  });
}

/**
 * Reads provided node-glob pattern and returns a promise with a list of files.
 * @param {string} pattern Node-glob pattern.
 */

function readPattern(pattern: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(`${pattern}/.esm-indexrc.json`, (err, files) => {
      if (err) {
        console.log('Failed to read ${pattern} pattern.');
        reject(err);
      }
      resolve(files);
    });
  });
}

/**
 * Returns a promise with generated list of index files.
 * @param {string} pattern Node-glob pattern.
 * @param {object} options Configuration options.
 */

export default function esmIndex(
  pattern: string = './**',
  options: Options = {},
  args: Arguments = {}
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    readPattern(pattern)
      .then(files => {
        let promises: Promise<string>[] = [];
        files.forEach(rc => {
          promises.push(
            new Promise((success, fail) => {
              getOptions(rc, args)
                .then(data => {
                  createFile(rc, Object.assign({}, options, data));
                  success(rc);
                })
                .catch(err => {
                  fail(err);
                });
            })
          );
        });
        Promise.all(promises)
          .then(index => {
            resolve(index);
          })
          .catch(err => {
            reject(err);
          });
      })
      .catch(err => {
        reject(err);
      });
  });
}
