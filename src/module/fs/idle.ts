import { Fs } from 'types';

/**
 * Returns object of action and message.
 * @param {string} path Index file path.
 */

export default function(path: string): Fs {
  return {
    action: 'no-change',
    message: `No changes: "${path}"`,
  };
}
