import compare from 'contents/compare';
import { readFile, writeFile } from 'fs';
import idle from 'module/fs/idle';
import { Fs, Master } from 'types';

/**
 * Updates index file and returns a promise with object of action and message.
 * @param {string} path Index file path.
 * @param {string} content File contents.
 * @param {object} config Configuration object.
 */

export default function(
  path: string,
  content: string,
  { log, test }: Master
): Promise<Fs> {
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
            console.error(`Error: Cannot read "${path}"`);
            reject(err);
          } else {
            if (compare(content, data)) {
              writeFile(path, content, err => {
                if (err) {
                  console.error(`Error: Cannot write "${path}"`);
                  reject(err);
                } else {
                  doResolve();
                }
              });
            } else {
              resolve(idle(path));
            }
          }
        });
  });
}
