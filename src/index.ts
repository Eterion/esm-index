import { Promise, Object } from 'core-js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';

interface Module {
  isIndex: boolean;
  path: string;
}

type ModuleInList = Module | null;

interface Options {
  [index: string]: any;
  fileExtension?: string;
  fileExtensionInPath?: boolean;
  fileName?: string;
  ignoreFiles?: string[];
  recursiveSearch?: boolean;
}

interface Result {
  code: 'add' | 'no-change' | 'update' | 'remove';
  message: string;
  options: Options;
  rc: string;
}

namespace Core {
  /**
   * Reads through provided node-glob pattern and returns a promise with files.
   * @param pattern Node-glob pattern.
   */

  export function read(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const configName = '.esm-indexrc.json';
      glob(
        `./${pattern.replace(new RegExp(`/${configName}$`), '')}/${configName}`,
        (err, files) => {
          if (err) {
            console.log(`Failed to read ${pattern} pattern.`);
            reject(err);
          }
          resolve(files);
        }
      );
    });
  }

  /**
   * Creates index file with generated contents and returns a promise with
   * object that contains path to configuration file, options object and result
   * message.
   *
   * @param rc Path to configuration file.
   * @param args Command line arguments merged with options.
   */

  export function write(rc: string, options: Options): Promise<Result> {
    return new Promise((resolve, reject) => {
      Options.read(rc, options)
        .then(options => {
          Module.list(rc, options)
            .then(modules => {
              let index = path.join(
                path.dirname(rc),
                `${options.fileName}.${options.fileExtension}`
              );
              let indexPath = path.resolve(index);
              let contents = Contents.create(modules);
              let result = { rc, options };
              if (modules.length) {
                fs.access(index, fs.constants.R_OK, err => {
                  if (err) {
                    fs.writeFile(index, contents, err => {
                      if (err) {
                        console.log(`Cannot write ${indexPath} file.`);
                        reject(err);
                      }
                      resolve(
                        Object.assign({}, result, {
                          code: 'add',
                          message: `\x1b[32m> Created "${indexPath}"\x1b[0m`,
                        })
                      );
                    });
                  } else {
                    fs.readFile(index, 'utf8', (err, data) => {
                      if (err) {
                        console.log(`Cannot read ${indexPath} file.`);
                        reject(err);
                      }
                      if (Contents.compare(contents, data)) {
                        fs.writeFile(index, contents, err => {
                          if (err) {
                            console.log(`Cannot write ${indexPath} file.`);
                            reject(err);
                          }
                          resolve(
                            Object.assign({}, result, {
                              code: 'update',
                              message: `\x1b[33m> Updated "${indexPath}"\x1b[0m`,
                            })
                          );
                        });
                      } else {
                        resolve(
                          Object.assign({}, result, {
                            code: 'no-change',
                            message: `> No changes in "${indexPath}"`,
                          })
                        );
                      }
                    });
                  }
                });
              } else {
                fs.access(index, err => {
                  if (!err) {
                    fs.unlink(index, err => {
                      if (err) {
                        console.log(`Cannot unlink ${indexPath} file.`);
                        reject(err);
                      }
                      resolve(
                        Object.assign({}, result, {
                          code: 'remove',
                          message: `\x1b[31m> Removed "${indexPath}"\x1b[0m`,
                        })
                      );
                    });
                  }
                });
              }
            })
            .catch(err => {
              console.log('Failed to read list of modules.');
              reject(err);
            });
        })
        .catch(err => {
          console.log(`Failed to read ${rc} file.`);
          reject(err);
        });
    });
  }
}

namespace Contents {
  /**
   * Compares provided data strings with each other and returns true if no
   * differences were found. Line starting with double slash (comments) are
   * excluded from the comparison.
   *
   * @param data List of data strings to be compared.
   */

  export function compare(...data: string[]): boolean {
    return data
      .slice(1)
      .map(item => hash(data[0]) == hash(item))
      .includes(false);
  }

  /**
   * Returns contents of generated index files from list of modules.
   * @param modules List of modules.
   * @param contents Initial file contents.
   */

  export function create(modules: Module[], contents: string = ''): string {
    contents = modules.reduce((str, module) => {
      return (
        str +
        (module.isIndex
          ? `import * as ${Module.name(module.path)} from './${
              module.path
            }';\r\n`
          : `export { default as ${Module.name(module.path)} } from './${
              module.path
            }';\r\n`)
      );
    }, contents);
    const index = modules.filter(module => module.isIndex === true);
    if (index.length) {
      contents += `export { ${index
        .map(module => Module.name(module.path))
        .join(', ')} };\r\n`;
    }
    return contents;
  }

  /**
   * Returns hash of provided data string.
   * @param data Source data string.
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
   * @param src Module name.
   */

  export function name(src: string): string {
    const chars = 'a-zA-Z0-9';
    return src
      .replace(new RegExp(`^[^${chars}]+`), '')
      .replace(new RegExp(`[^${chars}]+$`), '')
      .replace(new RegExp(`[^${chars}]+([${chars}])`, 'g'), (_match, $1) => {
        return $1.toUpperCase();
      });
  }

  /**
   * Creates index file with default exports according to a list of file names
   * that passed the ignore filter and returns a promise with object containing
   * index file path and type. If index file already exists, list of exports is
   * instead compared to generated content and updated only when needed.
   *
   * @param rc Path to configuration file.
   * @param options Options object.
   */

  export function list(rc: string, options: Options): Promise<Module[]> {
    return new Promise((resolve, reject) => {
      const root = path.dirname(rc);
      fs.readdir(root, (err, files) => {
        if (err) {
          console.log(`Cannot read ${root} folder.`);
          reject(err);
        }
        const promises: Promise<ModuleInList>[] = files.map(
          file =>
            new Promise((success, fail) => {
              fs.stat(path.join(root, file), (err, stats) => {
                if (err) {
                  console.log(`Cannot read ${file} file.`);
                  fail(err);
                }
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
                if (Module.name(a.path) < Module.name(b.path)) return -1;
                if (Module.name(a.path) > Module.name(b.path)) return 1;
                return 0;
              })
            );
          })
          .catch(err => {
            console.log(`Failed to read files.`);
            reject(err);
          });
      });
    });
  }

  namespace Resolve {
    /**
     * Resolve path as directory and returns a promise with module information.
     * @param rc Path to configuration file.
     * @param options Options object.
     */

    export function asDirectory(
      file: string,
      options: Options
    ): Promise<ModuleInList> {
      return new Promise((resolve, reject) => {
        if (options.recursiveSearch) {
          Core.read(file)
            .then(files => {
              if (files.length) {
                Options.read(files[0], options)
                  .then(options => {
                    Module.list(files[0], Object.assign({}, options))
                      .then(modules => {
                        if (modules.length) {
                          resolve({
                            isIndex: true,
                            path: `${path.basename(
                              file,
                              '.' + options.fileExtension
                            )}${
                              options.fileName != Options.defaults.fileName
                                ? `/${options.fileName +
                                    (options.fileExtensionInPath
                                      ? '.' + options.fileExtension
                                      : '')}`
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
     * Resolve path as file and returns a promise with module information.
     * @param rc Path to configuration file.
     * @param options Options object.
     */

    export function asFile(
      file: string,
      options: Options
    ): Promise<ModuleInList> {
      return Promise.resolve(
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
          .map(
            re =>
              !new RegExp(`\\.${options.fileExtension}$`).test(file) ||
              re.test(file)
          )
          .includes(true)
          ? null
          : {
              isIndex: false,
              path: options.fileExtensionInPath
                ? file
                : path.basename(file, '.' + options.fileExtension),
            }
      );
    }
  }
}

namespace Options {
  /**
   * Default values for options object.
   */

  export const defaults: Options = {
    fileExtension: 'js',
    fileExtensionInPath: false,
    fileName: 'index',
    ignoreFiles: [],
    recursiveSearch: true,
  };

  /**
   * Reads configuration file and returns a promise with json contents.
   * @param rc Path to configuration file.
   */

  export function read(rc: string, options: Options = {}): Promise<Options> {
    return new Promise((resolve, reject) => {
      fs.readFile(rc, 'utf8', (err, json) => {
        if (err) {
          console.log(`Cannot read ${rc} file.`);
          reject(err);
        }
        options = Object.keys(options)
          .filter(key => options[key] !== undefined)
          .reduce((object: Options, key) => {
            object[key] = options[key];
            return object;
          }, {});
        resolve(Object.assign({}, defaults, options, JSON.parse(json || '{}')));
      });
    });
  }
}

/**
 * Returns a promise with list objects for generated index files.
 * @param pattern Node-glob pattern.
 * @param options Options object.
 */

export default function esmIndex(
  pattern: string = '**',
  options: Options = {}
): Promise<Result[]> {
  return new Promise((resolve, reject) => {
    Core.read(pattern).then(files => {
      const promises: Promise<Result>[] = files.map(
        rc =>
          new Promise((success, fail) => {
            Core.write(rc, options)
              .then(({ code, message, options }) => {
                success({ code, message, options, rc });
              })
              .catch(err => {
                fail(err);
              });
          })
      );
      Promise.all(promises)
        .then(results => {
          resolve(results);
        })
        .catch(err => {
          reject(err);
        });
    });
  });
}
