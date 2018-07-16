import { Callback, Config } from 'types';
import computeConfig from 'utils/computeConfig';
import listDuplicates from 'utils/listDuplicates';

export default function(config?: Config): Promise<Callback[]> {
  return new Promise((resolve, reject) => {
    computeConfig(config)
      .then(config => {
        const dupPaths = listDuplicates(config.paths.map(path => path.path));
        if (dupPaths.length) {
          reject(`Found duplicate paths: ${dupPaths.join(', ')}`);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}
