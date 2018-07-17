import name from 'module/name';
import { basename } from 'path';
import { Module, Path } from 'types';

/**
 * Returns true if module path should be ignored.
 * @param {string} file Path to modules.
 * @param {RegExp[]} regexp List of ignored regular expressions.
 * @param {object} options Options.
 */

function isIgnored(
  file: string,
  regexp: RegExp[],
  { moduleExtension }: Path
): boolean {
  return regexp
    .map(re => !new RegExp(`\.${moduleExtension}$`).test(file) || re.test(file))
    .includes(true);
}

/**
 * Returns list of regular expressions that should be ignored.
 * @param {object} options Options.
 */

function ignoreList({
  fileExtension,
  fileName,
  ignoreFiles,
  moduleExtension,
}: Path): RegExp[] {
  return [
    new RegExp(`\.(?:d|spec|test)\.${moduleExtension}`),
    new RegExp(`^${fileName}\.${fileExtension}$`),
    ...(ignoreFiles
      ? ignoreFiles.map(name => {
          return new RegExp(
            typeof name == 'string' && /^\//.test(name) && /\/$/.test(name)
              ? name.substring(1, name.length - 1)
              : `^${name}\.${moduleExtension}$`
          );
        })
      : []),
  ];
}

/**
 * Returns module path resolved as file.
 * @param {string} file Path to module.
 * @param {object} options Options.
 */

export default function(file: string, options: Path): Module | null {
  if (isIgnored(file, ignoreList(options), options)) {
    return null;
  }
  const fileName = basename(file, '.' + options.fileExtension);
  return {
    name: name(fileName),
    path: `./${options.moduleExtensionInPath ? file : fileName}`,
  };
}
