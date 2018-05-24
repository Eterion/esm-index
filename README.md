[![Npm](https://img.shields.io/npm/v/esm-index.svg?style=flat-square)](https://www.npmjs.com/package/esm-index)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# ESM Index

A package that simply generates list of ES6 default exports to an index file
according to directory structure, where configuration file is placed in. This
package is intended only for development (or production if you want, I don't
care), in cases where you want to have all of the ES6 modules available through
a single import, without manually maintaining the index file.

Install with your favorite package manager with access to npm registry.

```
$ yarn add esm-index --dev
```

Then simply initialize the script, where first parameter is
[node-glob](https://github.com/isaacs/node-glob) pattern where to search
configuration files (defaults to `'./**'`), and second parameter is for
[options](#options).

```typescript
import esmIndex from 'esm-index';
esmIndex(glob, options);
```

## Contents

* [Configuration File](#configuration-file)
* [Options](#options)
* [Command Line](#command-line)
* [Example](#example)
* [Future](#future)

## Configuration File

The program is controlled by placement of `.esm-indexrc.json` configuration
files. Include this file wherever you want to have maintained the index file
with ES6 default exports.

## Options

The following options can be inserted as second parameter of `esmIndex` function
and into json configuration files.

| Option                | Type     | Description                                                                                                  |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `fileExtension`       | string   | Include only files with this file extension. Defaults to `'js'`.                                             |
| `fileExtensionInPath` | boolean  | If set to true, file extensions will be included in module paths. Disabled by default.                       |
| `fileName`            | string   | File name of the generated index file. Defaults to `'index'`.                                                |
| `ignoreFiles`         | string[] | List of strings or regular expressions (properly escaped, starts and ends with /) of ignored file names.     |
| `recursiveSearch`     | boolean  | If enabled, child folders with configuration files will be added to export list as well. Enabled by default. |

## Command Line

The easies way to use this program is via command line.

```
$ esm-index <directory> [options]
```

The above command will search for configuration files in _directory_ (defaults
to `'./**'`) and generates index files if possible (new index file is generated
only when changes are detected). The following parameters can be passed to set
options, however options from configuration files take precedence.

| Options     | Default | Description                                             |
| ----------- | ------- | ------------------------------------------------------- |
| `--ext`     | js      | File extension used for index files and internal filter |
| `--help`    |         | Show help                                               |
| `--log`     |         | Enable log messages when modules are evaluated          |
| `--name`    | index   | File name used for the index files                      |
| `--version` |         | Show version number                                     |
| `--watch`   |         | Enables watch mode                                      |

## Example

Assuming the following file structure, the existence of `.esm-indexrc.json` file
tells the program to create index file with default exports of `bar.js` and
`foo.js` modules. **Note, each module must have `default export` to work
properly.**

```
modules
|-- .esm-indexrc.json
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

* ~~Add node API~~ `v1.2.0`
* Detect what kind of export the module actually has, if any
* Make configuration file optional
* ~~Recursive import (via option)~~ `^v1.1.0`
* Support cosmiconfig
* Support for `require` instead of `import` (via option or custom template)
