import { Callback } from 'types';

/**
 * Returns object of action and message.
 * @param {string} path Index file path.
 */

export default function(path: string): Callback {
  return {
    action: 'no-change',
    message: `No changes: "${path}"`,
  };
}
