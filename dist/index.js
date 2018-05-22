"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var core_js_1 = require("core-js");
var glob = require("glob");
var crypto = require("crypto");
var ResolveModule;
(function (ResolveModule) {
    function asDirectory(root, file, options) {
        return new core_js_1.Promise(function (resolve, reject) {
            if (options.recursiveSearch) {
                readPattern(path.join(root, file))
                    .then(function (files) {
                    if (files.length) {
                        getOptions(files[0])
                            .then(function (options) {
                            getModules(files[0], options)
                                .then(function (modules) {
                                if (modules.length) {
                                    resolve({
                                        isIndex: true,
                                        name: path.basename(file, '.' + options.fileExtension)
                                    });
                                }
                                else {
                                    resolve(null);
                                }
                            })["catch"](function (err) {
                                reject(err);
                            });
                        })["catch"](function (err) {
                            reject(err);
                        });
                    }
                    else {
                        resolve(null);
                    }
                })["catch"](function (err) {
                    reject(err);
                });
            }
            else {
                resolve(null);
            }
        });
    }
    ResolveModule.asDirectory = asDirectory;
    function asFile(file, options) {
        return new core_js_1.Promise(function (resolve) {
            var pass = true;
            [
                /\.d\.ts$/,
                new RegExp("\\.(?:spec|test)\\." + options.fileExtension),
                new RegExp("^" + options.fileName + "\\." + options.fileExtension),
            ]
                .concat(options.ignoreFiles
                ? options.ignoreFiles.map(function (name) {
                    return new RegExp(/^\//.test(name)
                        ? name.substring(1, name.length - 1)
                        : "^" + path.basename(name, '.' + options.fileExtension) + "\\." + options.fileExtension);
                })
                : [])
                .forEach(function (re) {
                if (!new RegExp("\\." + options.fileExtension + "$").test(file) ||
                    re.test(file)) {
                    if (pass) {
                        pass = false;
                    }
                }
            });
            if (pass) {
                resolve({
                    isIndex: false,
                    name: path.basename(file, '.' + options.fileExtension)
                });
            }
            else {
                resolve(null);
            }
        });
    }
    ResolveModule.asFile = asFile;
    function asName(module) {
        var chars = 'a-zA-Z0-9';
        return module
            .replace(new RegExp("^[^" + chars + "]+"), '')
            .replace(new RegExp("[^" + chars + "]+$"), '')
            .replace(new RegExp("[^" + chars + "]+([" + chars + "])", 'g'), function (_match, $1) {
            return $1.toUpperCase();
        });
    }
    ResolveModule.asName = asName;
})(ResolveModule || (ResolveModule = {}));
function compareContents() {
    var data = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        data[_i] = arguments[_i];
    }
    var pass = true;
    if (data.length) {
        var master_1 = getHash(data[0]);
        data.slice(1).forEach(function (contents) {
            if (master_1 != getHash(contents)) {
                if (pass) {
                    pass = false;
                }
            }
        });
    }
    return pass;
}
function createContents(modules) {
    var src = '';
    if (modules.length) {
        var index = modules.filter(function (module) { return module.isIndex === true; });
        src = modules.reduce(function (src, module) {
            return (src +
                (module.isIndex
                    ? "import * as " + ResolveModule.asName(module.name) + " from './" + module.name + "';\r\n"
                    : "export { default as " + ResolveModule.asName(module.name) + " } from './" + module.name + "';\r\n"));
        }, src);
        if (index.length) {
            src =
                src +
                    ("export { " + index
                        .map(function (module) { return ResolveModule.asName(module.name); })
                        .join(', ') + " };\r\n");
        }
    }
    return src;
}
function createFile(rc, options) {
    return new core_js_1.Promise(function (resolve, reject) {
        getModules(rc, options)
            .then(function (modules) {
            var index = path.join(path.dirname(rc), options.fileName + "." + options.fileExtension);
            var contents = createContents(modules);
            if (modules.length) {
                fs.access(index, fs.constants.R_OK, function (err) {
                    if (err) {
                        fs.writeFile(index, contents, function (err) {
                            if (err) {
                                console.log("Cannot write " + index + " file.");
                                reject(err);
                            }
                            resolve(index);
                        });
                    }
                    else {
                        fs.readFile(index, 'utf8', function (err, data) {
                            if (err) {
                                console.log("Cannot read " + index + " file.");
                                reject(err);
                            }
                            if (!compareContents(contents, data)) {
                                fs.writeFile(index, contents, function (err) {
                                    if (err) {
                                        console.log("Cannot write " + index + " file.");
                                        reject(err);
                                    }
                                    resolve(index);
                                });
                            }
                        });
                    }
                });
            }
            else {
                fs.access(index, function (err) {
                    if (!err) {
                        fs.unlink(index, function (err) {
                            if (err) {
                                console.log("Cannot unlink " + index + " file.");
                                reject(err);
                            }
                        });
                    }
                });
            }
        })["catch"](function (err) {
            reject(err);
        });
    });
}
function getHash(data) {
    return crypto
        .createHash('md5')
        .update(data
        .split('\r\n')
        .map(function (line) { return (/^\/\//.test(line) ? '' : line); })
        .join())
        .digest('hex');
}
function getModules(rc, options) {
    var root = path.dirname(rc);
    return new core_js_1.Promise(function (resolve, reject) {
        fs.readdir(root, function (err, files) {
            if (err) {
                console.log("Cannot read " + root + " folder.");
                reject(err);
            }
            var promises = files.map(function (file) {
                return new core_js_1.Promise(function (success, fail) {
                    fs.stat(path.join(root, file), function (err, stats) {
                        if (err) {
                            fail(err);
                        }
                        if (stats.isDirectory()) {
                            ResolveModule.asDirectory(root, file, options).then(function (result) {
                                success(result);
                            });
                        }
                        else {
                            ResolveModule.asFile(file, options).then(function (result) {
                                success(result);
                            });
                        }
                    });
                });
            });
            core_js_1.Promise.all(promises)
                .then(function (modules) {
                var list = modules.filter(function (module) { return module !== null; });
                resolve(list.sort(function (a, b) {
                    if (a.isIndex)
                        return -1;
                    if (b.isIndex)
                        return 1;
                    if (a.name < b.name)
                        return -1;
                    if (a.name > b.name)
                        return 1;
                    return 0;
                }));
            })["catch"](function (err) {
                if (err) {
                    console.log('Failed to read files.');
                    reject(err);
                }
            });
        });
    });
}
function getOptions(rc, _a) {
    var _b = _a === void 0 ? {} : _a, ext = _b.ext, name = _b.name;
    return new core_js_1.Promise(function (resolve, reject) {
        fs.readFile(rc, 'utf8', function (err, config) {
            if (err) {
                console.log("Cannot read " + rc + " file.");
                reject(err);
            }
            resolve(Object.assign({
                fileExtension: ext || 'js',
                fileName: name || 'index',
                ignoreFiles: [],
                recursiveSearch: true
            }, JSON.parse(config || '{}')));
        });
    });
}
function readPattern(pattern) {
    return new core_js_1.Promise(function (resolve, reject) {
        glob(pattern + "/.esm-indexrc.json", function (err, files) {
            if (err) {
                console.log('Failed to read ${pattern} pattern.');
                reject(err);
            }
            resolve(files);
        });
    });
}
function esmIndex(pattern, options, args) {
    if (pattern === void 0) { pattern = './**'; }
    if (options === void 0) { options = {}; }
    if (args === void 0) { args = {}; }
    return new core_js_1.Promise(function (resolve, reject) {
        readPattern(pattern)
            .then(function (files) {
            var promises = [];
            files.forEach(function (rc) {
                promises.push(new core_js_1.Promise(function (success, fail) {
                    getOptions(rc, args)
                        .then(function (data) {
                        createFile(rc, Object.assign({}, options, data));
                        success(rc);
                    })["catch"](function (err) {
                        fail(err);
                    });
                }));
            });
            core_js_1.Promise.all(promises)
                .then(function (index) {
                resolve(index);
            })["catch"](function (err) {
                reject(err);
            });
        })["catch"](function (err) {
            reject(err);
        });
    });
}
exports["default"] = esmIndex;
