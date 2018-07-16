interface Data {
  [index: string]: any;
}

/**
 * Returns string template, where `{n}` patterns are replaced with data values.
 * @param {string} template String template.
 * @param {object} data Data object with replacement values.
 */

export default function(template: string, data: Data): string {
  Object.keys(data).forEach(key => {
    template = template.replace(
      new RegExp(`{${key}}`, 'g'),
      data[key].toString()
    );
  });
  return template;
}
