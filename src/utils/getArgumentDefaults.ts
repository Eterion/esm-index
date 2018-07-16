import config from 'args/config';
import options from 'args/options';

interface Callback {
  [index: string]: any;
}

/**
 * Returns default values of all arguments.
 */

export default function(): Callback {
  const args = { ...config, ...options };
  const obj: Callback = {};
  Object.keys(args).forEach(arg => {
    obj[arg] = args[arg].default;
  });
  return obj;
}
