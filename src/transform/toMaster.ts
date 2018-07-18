import { Object, Promise } from 'core-js';
import toPath from 'transform/toPath';
import { Config, Master, PathInput } from 'types';
import filterObjectKeys from 'utils/filterObjectKeys';
import getParamDefaults from 'utils/getParamDefaults';
import getPathList from 'utils/getPathList';
import readCosmiconfig from 'utils/readCosmiconfig';

/**
 * Returns a promise with properly computed master object.
 * @param {object} config Configuration object.
 */

export default function(config: Config = {}): Promise<Master> {
  return new Promise((resolve, reject) => {
    readCosmiconfig()
      .then(cosmiconfig => {
        const params: Config = Object.assign(
          {},
          getParamDefaults(),
          config,
          cosmiconfig
        );
        const paths = [...(config.paths || []), ...(params.paths || [])];
        resolve(<Master>filterObjectKeys(
          Object.assign({}, params, {
            paths: getPathList(paths).map(path => {
              const options: PathInput = paths
                .map(options => {
                  return typeof options == 'string'
                    ? { path: options }
                    : options;
                })
                .filter(options => {
                  return (typeof options.path == 'string'
                    ? [options.path]
                    : options.path
                  ).includes(path);
                })[0];
              const keys = Object.keys(require('params/options').default);
              return Object.assign(
                toPath(path, options, filterObjectKeys(params, ...keys)),
                { path: path }
              );
            }),
          }),
          ...Object.keys(require('params/config').default)
        ));
      })
      .catch(err => {
        reject(err);
      });
  });
}
