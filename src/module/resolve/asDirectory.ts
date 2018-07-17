import name from 'module/name';
import { basename } from 'path';
import { Module, Path } from 'types';
import getArgumentDefaults from 'utils/getArgumentDefaults';

/**
 * Returns computed file path for index file based on options.
 * @param {object} options Options.
 */

function computeFilePath({
  moduleExtensionInPath,
  fileName,
  fileExtension,
}: Path): string {
  return moduleExtensionInPath || fileName != getArgumentDefaults().fileName
    ? `/${fileName}${moduleExtensionInPath ? '.' + fileExtension : ''}`
    : moduleExtensionInPath
      ? `/${fileName}.${fileExtension}`
      : '';
}

/**
 * Returns module path resolved as directory.
 * @param {string} path Path to directory.
 * @param {object[]} modules List of modules.
 * @param {object} options Options.
 */

export default function(
  path: string,
  modules: Module[],
  options: Path
): Module | null {
  if (!modules.length) {
    return null;
  }
  const fileName = basename(path, '.' + options.fileExtension);
  return {
    hasRecursion: true,
    name: name(fileName),
    path: `./${fileName}${computeFilePath(options)}`,
  };
}
