import { Promise } from 'core-js';
import write from 'module/write';
import toMaster from 'transform/toMaster';
import { Callback, Config } from 'types';
import findDuplicateInArray from 'utils/findDuplicateInArray';
import getPathList from 'utils/getPathList';

/**
 * Returns a promise with a list of detected modules.
 * @param {object} config Configuration object.
 */

export default function(config?: Config): Promise<Callback[]> {
  return new Promise((resolve, reject) => {
    toMaster(config)
      .then(master => {
        const dups = findDuplicateInArray(getPathList(master.paths));
        if (dups.length)
          reject(`Error: Found duplicated paths (${dups.join(', ')})`);
        Promise.all(master.paths.map(options => write(options, master)))
          .then(modules => {
            resolve(modules);
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
