export interface Module {
  isIndex: boolean;
  name: string;
  path: string;
}

export interface Options {
  [index: string]: any;
  fileExtension?: string;
  fileExtensionInPath?: boolean;
  fileName?: string;
  ignoreFiles?: string[];
  log?: boolean;
  paths?: string[];
}

export interface Callback {
  files: CallbackFile[];
  options: Options;
}

export interface CallbackFile {
  code: 'add' | 'no-change' | 'update' | 'remove';
  message: string;
  modules: Module[];
  path: string;
}

export default function(options?: Options): Promise<Callback>;
