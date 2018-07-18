interface Callback {
  [index: string]: any;
}

/**
 * Returns object of default values for each key.
 * @param {object} obj Configuration object.
 */

export default function(
  obj: { [index: string]: any } = {
    ...require('params/config'),
    ...require('params/options'),
  }
): Callback {
  const defaults: Callback = {};
  Object.keys(obj).forEach(param => {
    defaults[param] = obj[param].default;
  });
  return defaults;
}
