import { writeFile } from 'fs';
import { Callback, Master } from 'types';

/**
 * Creates index file and returns a promise with object of action and message.
 * @param {string} path Index file path.
 * @param {string} content File contents.
 * @param {object} config Configuration object.
 */

export default function(
  path: string,
  content: string,
  { log, test }: Master
): Promise<Callback> {
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
