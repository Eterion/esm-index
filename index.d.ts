export interface Callback extends Fs {
  content: string;
  modules: Module[];
  options: Path;
}

export interface Config extends Options {
  log?: boolean;
  paths?: (string | PathInput)[];
  test?: boolean;
  watch?: boolean;
}

export interface Fs {
  action: 'add' | 'no-change' | 'update' | 'remove';
  message: string;
}

export interface Master extends Config {
  paths: Path[];
}

export interface Module {
  hasRecursion?: boolean;
  name: string;
  path: string;
}

export interface Options {
  fileExtension?: string;
  fileExtensionInPath?: boolean;
  fileName?: string;
  fileNameInPath?: boolean;
  ignoreFiles?: (string | RegExp)[];
  moduleExtension?: string;
  moduleExtensionInPath?: boolean;
  moduleTemplate?: string;
  recursion?: boolean;
  recursionTemplate?: string;
  recursionTemplateExport?: string;
}

export interface PathInput extends Options {
  path: string | string[];
}

export interface Path extends PathInput {
  path: string;
}

export default function(config?: Config): Promise<Callback[]>;
