import { R_OK } from 'constants';
import create from 'contents/create';
import { Promise } from 'core-js';
import { access } from 'fs';
import add from 'module/fs/add';
import remove from 'module/fs/remove';
import update from 'module/fs/update';
import list from 'module/list';
import { join, resolve } from 'path';
import { Callback, Master, Path } from 'types';

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
              add(index, content, config)
                .then(data => {
                  success({ ...data, content, modules, options });
                })
                .catch(err => {
                  fail(err);
                });
            } else {
              update(index, content, config)
                .then(data => {
                  success({ ...data, content, modules, options });
                })
                .catch(err => {
                  fail(err);
                });
            }
          });
        } else {
          remove(index, config)
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
