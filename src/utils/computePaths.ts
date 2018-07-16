import { Object } from 'core-js';
import options from 'params/options';
import { Config, Path } from 'types';
import filterKeys from 'utils/filterKeys';

/**
 * Returns array of paths with properly computed properties.
 * @param {object} config Configuration object.
 * @param {string[]|object[]} paths Array of paths.
 */

export default function(config: Config, paths: (string | Path)[] = []): Path[] {
  return paths.map(path =>
    Object.assign(
      {},
      options,
      filterKeys(config, ...Object.keys(options)),
      typeof path == 'string' ? { path } : path
    )
  );
}
