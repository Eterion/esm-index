[![Npm](https://img.shields.io/npm/v/esm-index.svg?style=flat-square)](https://www.npmjs.com/package/esm-index)

# ESM Index

A package that simply generates list of ES6 exports to an index file according
to directory structure, where the configuration file is placed. This package is
intended only for development (or production if you want, I don't care), in
cases where you want to have all of the ES6 modules available through a single
import, without manually maintaining the index file.

## Contents

* [Configuration File](#configuration-file)
* [Example](#example)
* [Options](#options)
* [Future](#future)

## Configuration File

The program is controlled by placement of `.indexrc.json` configuration files.
Create this file wherever you want to have maintained the index file with ES6
exports.

```
$ esm-index <directory> [options]
```

The above command will search for configuration files in the _modules_ directory
and generates index files if possible (new index file is generated only when
changes are detected). The contents of the json configuration file can be empty
(if your other tools won't yell at you), or with following options (all of them
are optional).

| Option        | Description                                                                       |
| ------------- | --------------------------------------------------------------------------------- |
| `ignoreFiles` | Array of strings or regular expressions (properly escaped) of ignored file names. |

## Example

Assuming the following file structure, the existence of `.indexrc.json` file
tells the program to create index file with default exports of `bar.js` and
`foo.js` modules.

```
modules
|-- .indexrc.json
|-- bar.js
|-- foo.js
```

Contents of the index file will be generated as follows.

```js
export { default as bar } from './bar';
export { default as foo } from './foo';
```

## Options

Options can be passed as parameters in command line after the source path. For
example, if you want to use typescript files instead of javascript, the command
line would look like this.

```
$ esm-index \"modules/**\" --ext ts
```

| Option      | Default | Description                                             |
| ----------- | ------- | ------------------------------------------------------- |
| `--ext`     | js      | File extension used for index files and internal filter |
| `--help`    |         | Show help                                               |
| `--version` |         | Show version number                                     |
| `--watch`   | false   | Enables watch mode                                      |

## Future

There are some things I want to maybe add in the future, so here's a list in no
particular order.

* Add node API
* Detect what kind of export the module actually has, if any
* Make configuration file optional
* Recursive import (via option)
* Support cosmiconfig
* Support for `require` instead of import (via option)
