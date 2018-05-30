[![Npm](https://img.shields.io/npm/v/esm-index.svg?style=flat-square)](https://www.npmjs.com/package/esm-index)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# ESM Index

A package that simply generates list of ES6 default exports to an index file
according to directory structure. This package is intended only for development
(or production if you want, I don't care), in cases where you want to have all
of the ES6 modules available through a single import, without manually
maintaining the index file.

Install with your favorite package manager with access to npm registry.

```
$ yarn add esm-index --dev
```

## Contents

- [Options](#options)
- [Api](#api)
- [CLI](#cli)
- [Example](#example)
- [Future](#future)

## Options

The following options can be passed through `.esm-indexrc.json` configuration
file (or [cosmiconfig](https://github.com/davidtheclark/cosmiconfig)
equivalent), or as function parameter (see [api](#api)). Note, command line
arguments will overwrite options from configuration file.

| Option                | Description                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `fileExtension`       | Include only files with this file extension. Defaults to `'js'`.                       |
| `fileExtensionInPath` | If set to true, file extensions will be included in module paths. Disabled by default. |
| `fileName`            | File name of the generated index file. Defaults to `'index'`.                          |
| `ignoreFiles`         | List of ignored file names.                                                            |
| `log`                 | Enables log messages when modules are resolved. Disabled by default.                   |
| `paths`               | List of paths that should be evaluated.                                                |

## Api

Default export is provided, where first parameter accepts [options](#options)
object. This function returns a promise with options and information about
generated index files.

```typescript
import esmIndex from 'esm-index';
esmIndex(<options>); // returns promise
```

## CLI

The easies way to use this program is via command line.

```
$ esm-index [options]
```

The above command line will search through provided paths and generates index
files if possible (new index file is generated only when changes are detected).
The following parameters can be passed. Note, command line arguments will
overwrite options from configuration file.

| Options     | Default | Description                                             |
| ----------- | ------- | ------------------------------------------------------- |
| `--ext`     | js      | File extension used for index files and internal filter |
| `--help`    |         | Show help                                               |
| `--log`     |         | Enable log messages when modules are resolved           |
| `--name`    | index   | File name used for the index files                      |
| `--paths`   |         | List of paths that should be evaluated                  |
| `--version` |         | Show version number                                     |
| `--watch`   |         | Enables watch mode                                      |

## Example

Assuming the following file structure, the program will create index file with
default exports of `bar.js` and `foo.js` modules. **Note, each file must have
`export default ...` to work properly.**

```
modules
|-- bar.js
|-- foo.js
```

Contents of the `index.js` file will be generated as following.

```javascript
export { default as bar } from './bar';
export { default as foo } from './foo';
```

## Future

There are some things I want to maybe add in the future, so here's a list in no
particular order.

- ~~Add node API~~ `v1.2.0`
- Detect what kind of export the module actually has, if any
- ~~Make configuration file optional~~ `v2.0.0`
- ~~Recursive import (via option)~~ `^v1.1.0`
- ~~Support cosmiconfig~~ `v2.0.0`
- Support for `require` instead of `import` (via option or custom template)
