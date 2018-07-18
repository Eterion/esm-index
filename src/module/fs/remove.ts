import { access, unlink } from 'fs';
import idle from 'module/fs/idle';
import { Callback, Master } from 'types';

/**
 * Removes index file and returns a promise with object of action and message.
 * @param {string} path Index file path.
 * @param {object} config Configuration object.
 */

export default function(
  path: string,
  { log, test }: Master
): Promise<Callback> {
  return new Promise((resolve, reject) => {
    function doResolve() {
      const message = `Removed: "${path}"`;
      if (log) console.log(`\x1b[31m> ${message}\x1b[0m`);
      resolve({ action: 'remove', message });
    }
    access(path, err => {
      if (err) {
        resolve(idle(path));
      } else {
        test
          ? doResolve()
          : unlink(path, err => {
              if (err) {
                console.error(`Error: Cannot remove "${path}"`);
                reject(err);
              } else {
                doResolve();
              }
            });
      }
    });
  });
}
