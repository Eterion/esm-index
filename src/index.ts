import { Callback, CallbackFile, Module, Options } from '..';
import { CosmiconfigResult } from 'cosmiconfig';
import { Promise, Object } from 'core-js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

namespace Contents {
  /**
   * Compares provided data strings with each other and returns true if no
   * differences were found. Line starting with double slash (comments) are
   * excluded from the comparison.
   *
   * @param {string[]} data List of data strings to be compared.
   */

  export function compare(...data: string[]): boolean {
    return data
      .slice(1)
      .map(item => hash(data[0]) == hash(item))
      .includes(false);
  }

  /**
   * Returns contents of generated index files from list of modules.
   * @param {object[]} modules List of modules.
   * @param {string} [contents=''] Initial file contents.
   */

  export function create(modules: Module[], contents: string = ''): string {
    contents = modules.reduce((str, module) => {
      return (
        str +
        (module.isIndex
          ? `import * as ${module.name} from '${module.path}';\r\n`
          : `export { default as ${module.name} } from '${module.path}';\r\n`)
      );
    }, contents);
    const index = modules.filter(module => module.isIndex === true);
    if (index.length) {
      contents += `export { ${index
        .map(module => module.name)
        .join(', ')} };\r\n`;
    }
    return contents;
  }

  /**
   * Returns hash of provided data string.
   * @param {string} data Source data string.
   */

  function hash(data: string): string {
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
}

namespace Module {
  /**
   * Returns modified module name from provided module path. This is needed to
   * filter out any not allowed characters from module name. Without it,
   * exported module names could result in gibberish and would not work.
   *
   * @param {string} src Module name.
   */

  function name(src: string): string {
    const chars = 'a-zA-Z0-9';
    return src
      .replace(new RegExp(`^[^${chars}]+`), '')
      .replace(new RegExp(`[^${chars}]+$`), '')
      .replace(new RegExp(`[^${chars}]+([${chars}])`, 'g'), (_match, $1) => {
        return $1.toUpperCase();
      });
  }

  /**
   * Returns a promise with a list of modules that were detected in given path.
   * @param {string} root Path where index file should be generated
   * @param {object} options Options.
   */

  export function list(root: string, options: Options): Promise<Module[]> {
    return new Promise((resolve, reject) => {
      if (
        options.paths &&
        options.paths
          .map(pathItem => path.normalize(pathItem))
          .includes(path.normalize(root))
      ) {
        root = path.normalize(root);
        fs.access(root, err => {
          if (err) {
            resolve([]);
          } else {
            fs.readdir(root, (err, files) => {
              if (err) {
                resolve([]);
              } else {
                const promises: Promise<Module | null>[] = files.map(
                  file =>
                    new Promise((success, fail) => {
                      fs.stat(path.join(root, file), (err, stats) => {
                        if (err) {
                          fail(err);
                        } else {
                          if (stats.isDirectory()) {
                            Resolve.asDirectory(path.join(root, file), options)
                              .then(result => {
                                success(result);
                              })
                              .catch(err => {
                                fail(err);
                              });
                          } else {
                            Resolve.asFile(file, options)
                              .then(result => {
                                success(result);
                              })
                              .catch(err => {
                                fail(err);
                              });
                          }
                        }
                      });
                    })
                );
                Promise.all(promises)
                  .then(modules => {
                    let list: Module[] = <Module[]>(
                      modules.filter(module => module !== null)
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
                    reject(err);
                  });
              }
            });
          }
        });
      } else {
        resolve([]);
      }
    });
  }

  namespace Resolve {
    /**
     * Returns a promise with module resolved as directory.
     * @param {string} file Path to module.
     * @param {object} options Options.
     */

    export function asDirectory(
      file: string,
      options: Options
    ): Promise<Module | null> {
      return new Promise((resolve, reject) => {
        Module.list(file, options)
          .then(modules => {
            if (modules.length) {
              resolve({
                isIndex: true,
                name: name(path.basename(file, '.' + options.fileExtension)),
                path: `./${path.basename(file, '.' + options.fileExtension)}${
                  options.fileExtensionInPath ||
                  options.fileName != Options.defaults.fileName
                    ? '/' +
                      options.fileName +
                      (options.fileExtensionInPath
                        ? '.' + options.fileExtension
                        : '')
                    : options.fileExtensionInPath
                      ? '/' + options.fileName + '.' + options.fileExtension
                      : ''
                }`,
              });
            } else {
              resolve(null);
            }
          })
          .catch(err => {
            reject(err);
          });
      });
    }

    /**
     * Returns a promise with module resolved as file.
     * @param {string} file Path to module.
     * @param {object} options Options.
     */

    export function asFile(
      file: string,
      options: Options
    ): Promise<Module | null> {
      return new Promise((resolve, reject) => {
        const transformIgnoreFiles = (name: string) =>
          new RegExp(
            /^\//.test(name)
              ? name.substring(1, name.length - 1)
              : `^${path.basename(name, '.' + options.fileExtension)}\\.${
                  options.fileExtension
                }$`
          );
        let ignore: RegExp[] = [
          new RegExp(`\\.(?:d|spec|test)\\.${options.fileExtension}`),
          new RegExp(`^${options.fileName}\\.${options.fileExtension}`),
        ];
        if (options.ignoreFiles) {
          ignore = ignore.concat(options.ignoreFiles.map(transformIgnoreFiles));
        }
        if (ignore.length) {
          resolve(
            ignore
              .map(
                re =>
                  !new RegExp(`\\.${options.fileExtension}$`).test(file) ||
                  re.test(file)
              )
              .includes(true)
              ? null
              : {
                  isIndex: false,
                  name: name(path.basename(file, '.' + options.fileExtension)),
                  path: `./${
                    options.fileExtensionInPath
                      ? file
                      : path.basename(file, '.' + options.fileExtension)
                  }`,
                }
          );
        } else {
          reject(null);
        }
      });
    }
  }

  /**
   * Reads provided module path, creates/updates/removes index file if
   * necessary, and returns a promise with information about generated module.
   *
   * @param {string} dir Path where index file should be generated.
   * @param {object} options Options
   */

  export function write(dir: string, options: Options): Promise<CallbackFile> {
    return new Promise((resolve, reject) => {
      Module.list(dir, options)
        .then(modules => {
          let file = `${options.fileName}.${options.fileExtension}`;
          let index = path.join(dir, file);
          let indexPath = path.resolve(index);
          let contents = Contents.create(modules);
          if (modules.length) {
            fs.access(indexPath, fs.constants.R_OK, err => {
              if (err) {
                fs.writeFile(indexPath, contents, err => {
                  if (err) {
                    console.error(`Error: Cannot write "${indexPath}"`);
                    reject(err);
                  } else {
                    let message = `\x1b[32m> Created: "${indexPath}"\x1b[0m`;
                    options.log && console.log(message);
                    resolve({
                      code: 'add',
                      message,
                      modules,
                      path: dir,
                    });
                  }
                });
              } else {
                fs.readFile(index, 'utf8', (err, data) => {
                  if (err) {
                    console.error(`Cannot read "${indexPath}" file.`);
                    reject(err);
                  } else {
                    if (Contents.compare(contents, data)) {
                      fs.writeFile(index, contents, err => {
                        if (err) {
                          console.error(`Error: Cannot write "${indexPath}"`);
                          reject(err);
                        } else {
                          let message = `\x1b[33m> Updated: "${indexPath}"\x1b[0m`;
                          options.log && console.log(message);
                          resolve({
                            code: 'update',
                            message,
                            modules,
                            path: dir,
                          });
                        }
                      });
                    } else {
                      let message = `> No changes: "${indexPath}"`;
                      resolve({
                        code: 'no-change',
                        message,
                        modules,
                        path: dir,
                      });
                    }
                  }
                });
              }
            });
          } else {
            fs.access(indexPath, err => {
              if (err) {
                let message = `> No changes: "${indexPath}"`;
                resolve({
                  code: 'no-change',
                  message,
                  modules,
                  path: dir,
                });
              } else {
                fs.unlink(index, err => {
                  if (err) {
                    console.error(`Error: Cannot unlink "${indexPath}"`);
                    reject(err);
                  } else {
                    let message = `\x1b[31m> Removed: "${indexPath}"\x1b[0m`;
                    options.log && console.log(message);
                    resolve({
                      code: 'remove',
                      message,
                      modules,
                      path: dir,
                    });
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
}

namespace Options {
  /** Default value for options object. */
  export const defaults: Options = {
    fileExtension: 'js',
    fileExtensionInPath: false,
    fileName: 'index',
    ignoreFiles: [],
    log: false,
    paths: [],
  };
}

/**
 * Return a promise with information about generated modules.
 * @param {object} options Options.
 */

export default function(options: Options = {}): Promise<Callback> {
  return new Promise((resolve, reject) => {
    const cosmiconfig = require('cosmiconfig');
    const explorer = cosmiconfig('esm-index');
    explorer
      .search()
      .then((result: CosmiconfigResult) => {
        options = Object.assign(
          {},
          Options.defaults,
          result ? result.config : {},
          Object.keys(options)
            .filter(key => options[key] !== undefined)
            .reduce(
              (object: Options, key) =>
                Object.assign(object, { [key]: options[key] }),
              {}
            )
        );
        if (options.paths && options.paths.length) {
          Promise.all(
            options.paths.map(pathItem => Module.write(pathItem, options))
          )
            .then(files => {
              resolve({ files, options });
            })
            .catch(err => {
              reject(err);
            });
        } else {
          reject('Please define --paths or paths property in options.');
        }
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}
