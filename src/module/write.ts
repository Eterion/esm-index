import { R_OK } from 'constants';
import compare from 'contents/compare';
import create from 'contents/create';
import { Promise } from 'core-js';
import { access, readFile, unlink, writeFile } from 'fs';
import list from 'module/list';
import { join, resolve } from 'path';
import { Callback, Master, Path } from 'types';

interface FileSystemCallback {
  action: 'add' | 'no-change' | 'update' | 'remove';
  message: string;
}

namespace Action {
  /**
   * Creates index file and returns a promise with object of action and message.
   * @param {string} path Index file path.
   * @param {string} content File contents.
   * @param {object} config Configuration object.
   */

  export function add(
    path: string,
    content: string,
    { log, test }: Master
  ): Promise<FileSystemCallback> {
    return new Promise((resolve, reject) => {
      function doResolve() {
        const message = `Created: "${path}"`;
        if (log) console.log(`\x1b[32m> ${message}\x1b[0m`);
        resolve({ action: 'add', message });
      }
      test
        ? doResolve()
        : writeFile(path, content, err => {
            if (err) {
              console.error(`Error: cannot write "${path}"`);
              reject(err);
            } else {
              doResolve();
            }
          });
    });
  }

  /**
   * Returns object of action and message.
   * @param {string} path Index file path.
   */

  function noChange(path: string): FileSystemCallback {
    return {
      action: 'no-change',
      message: `No changes: "${path}"`,
    };
  }

  /**
   * Updates index file and returns a promise with object of action and message.
   * @param {string} path Index file path.
   * @param {string} content File contents.
   * @param {object} config Configuration object.
   */

  export function update(
    path: string,
    content: string,
    { log, test }: Master
  ): Promise<FileSystemCallback> {
    return new Promise((resolve, reject) => {
      function doResolve() {
        const message = `Updated: "${path}"`;
        if (log) console.log(`\x1b[33m> ${message}\x1b[0m`);
        resolve({ action: 'update', message });
      }
      test
        ? doResolve()
        : readFile(path, 'utf8', (err, data) => {
            if (err) {
              console.error(`Error: cannot read "${path}"`);
              reject(err);
            } else {
              if (compare(content, data)) {
                writeFile(path, content, err => {
                  if (err) {
                    console.error(`Error: cannot write "${path}"`);
                    reject(err);
                  } else {
                    doResolve();
                  }
                });
              } else {
                resolve(noChange(path));
              }
            }
          });
    });
  }

  /**
   * Removes index file and returns a promise with object of action and message.
   * @param {string} path Index file path.
   * @param {object} config Configuration object.
   */

  export function remove(
    path: string,
    { log, test }: Master
  ): Promise<FileSystemCallback> {
    return new Promise((resolve, reject) => {
      function doResolve() {
        const message = `Removed: "${path}"`;
        if (log) console.log(`\x1b[31m> ${message}\x1b[0m`);
        resolve({ action: 'remove', message });
      }
      access(path, err => {
        if (err) {
          resolve(noChange(path));
        } else {
          test
            ? doResolve()
            : unlink(path, err => {
                if (err) {
                  console.error(`Error: cannot remove "${path}"`);
                  reject(err);
                } else {
                  doResolve();
                }
              });
        }
      });
    });
  }
}

/**
 * Makes appropriate action with index file and returns a promise information
 * about individual paths.
 *
 * @param {object} options Options.
 * @param {object} config Configuration object.
 */

export default function(options: Path, config: Master): Promise<Callback> {
  return new Promise((success, fail) => {
    list(options, config.paths)
      .then(modules => {
        const file = `${options.fileName}.${options.fileExtension}`;
        const index = resolve(join(options.path, file));
        const content = create(modules, options);
        if (modules.length) {
          access(index, R_OK, err => {
            if (err) {
              Action.add(index, content, config)
                .then(data => {
                  success({ ...data, content, modules, options });
                })
                .catch(err => {
                  fail(err);
                });
            } else {
              Action.update(index, content, config)
                .then(data => {
                  success({ ...data, content, modules, options });
                })
                .catch(err => {
                  fail(err);
                });
            }
          });
        } else {
          Action.remove(index, config)
            .then(data => {
              success({ ...data, content, modules, options });
            })
            .catch(err => {
              fail(err);
            });
        }
      })
      .catch(err => {
        fail(err);
      });
  });
}
