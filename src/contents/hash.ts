import { createHash } from 'crypto';

/**
 * Returns hash of provided data string.
 * @param {string} data Source data string.
 */

export default function(data: string): string {
  return createHash('md5')
    .update(data)
    .digest('hex');
}
