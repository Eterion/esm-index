import { PathInput } from 'types';

/**
 * Returns a list of paths reduced to a single array.
 * @param {object[]} paths Array of paths.
 */

export default function(paths: (string | PathInput)[]): string[] {
  return paths
    .map(options => (typeof options == 'string' ? options : options.path))
    .reduce((arr: string[], item) => arr.concat(item), []);
}
