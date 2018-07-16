import { CosmiconfigResult } from 'cosmiconfig';
import { Config } from 'types';

/**
 * Returns a promise with configuration object.
 */

export default function(): Promise<Config> {
  return new Promise((resolve, reject) => {
    require('cosmiconfig')('esmindex')
      .search()
      .then((result: CosmiconfigResult) => {
        resolve(<Config>(result ? result.config : {}));
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}
