import config from 'params/config';
import options from 'params/options';

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
