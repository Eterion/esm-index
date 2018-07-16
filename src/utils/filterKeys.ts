import { Object } from 'core-js';

interface Data {
  [index: string]: any;
}

/**
 * Returns input object with allowed keys only. This method does not modify the
 * original object, but rather creates and returns a new one.
 *
 * @param {object} obj Input object.
 * @param {string|string[]} allowed List of allowed keys.
 */

export default function(obj: Data, ...allowed: string[]): Data {
  return Object.keys(obj)
    .filter(key => allowed.includes(key))
    .reduce((o, key) => Object.assign({}, o, { [key]: obj[key] }), {});
}
