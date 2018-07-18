import { Object } from 'core-js';
import { Config, Options, Path } from 'types';
import filterObjectKeys from 'utils/filterObjectKeys';

/**
 * Return properly computed path object with options.
 * @param {string} path Path.
 * @param {object} options Options.
 * @param {object} config Configuration.
 */

export default function(path: string, options: Options, config: Config): Path {
  return Object.assign(
    {},
    filterObjectKeys(config, ...Object.keys(require('params/options').default)),
    options,
    { path }
  );
}
