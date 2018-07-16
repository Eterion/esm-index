import template from 'contents/template';
import { Module, Path } from 'types';

/**
 * Returns contents of index file.
 * @param modules List of modules.
 * @param options Options.
 * @param contents Initial file contents.
 */

export default function(
  modules: Module[],
  options: Path,
  contents: string = ''
): string {
  const eol = '\r\n';
  modules.reduce((str, module) => {
    const useTemplate = module.hasRecursion
      ? options.recursionTemplate
      : options.moduleTemplate;
    return useTemplate ? str + template(useTemplate, module) + eol : '';
  }, contents);
  const dirs = modules.filter(module => module.hasRecursion);
  if (dirs) {
    if (options.recursionTemplateExport) {
      contents +=
        template(options.recursionTemplateExport, {
          moduleList: dirs.map(module => module.name).join(', '),
        }) + eol;
    }
  }
  return contents;
}
