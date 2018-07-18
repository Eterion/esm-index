import template from 'contents/template';
import { Module, Path } from 'types';

/**
 * Returns contents of index file.
 * @param {object[]} modules List of modules.
 * @param {object} options Options.
 * @param {string} contents Initial file contents.
 */

export default function(
  modules: Module[],
  { moduleTemplate, recursionTemplate, recursionTemplateExport }: Path,
  contents: string = ''
): string {
  const eol = '\r\n';
  contents = modules.reduce((str, module) => {
    const useTemplate = module.hasRecursion
      ? recursionTemplate
      : moduleTemplate;
    return useTemplate ? str + template(useTemplate, module) + eol : '';
  }, contents);
  const dirs = modules.filter(module => module.hasRecursion);
  if (dirs.length) {
    if (recursionTemplateExport) {
      contents +=
        template(recursionTemplateExport, {
          moduleList: dirs.map(module => module.name).join(', '),
        }) + eol;
    }
  }
  return contents;
}
