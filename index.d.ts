export interface Callback {
  action: 'add' | 'no-change' | 'update' | 'remove';
}

export interface Computed extends Config {
  paths: Path[];
}

export interface Config extends Options {
  log?: boolean;
  paths?: (string | Path)[];
  watch?: boolean;
}

export interface Module {
  hasRecursion?: boolean;
  name: string;
  path: string;
}

export interface Options {
  fileExtension?: string;
  fileName?: string;
  ignoreFiles?: (string | RegExp)[];
  moduleExtension?: string;
  moduleExtensionInPath?: boolean;
  moduleTemplate?: string;
  recursion?: boolean;
  recursionTemplate?: string;
  recursionTemplateExport?: string;
}

export interface Path extends Options {
  path: string;
}

export default function(config?: Config): Promise<Callback[]>;
