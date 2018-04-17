#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var chokidar = require("chokidar");
var crypto = require("crypto");
var fs = require("fs");
var glob = require("glob");
var path = require("path");
var yargs = require("yargs");
var args = yargs
    .describe('ext', 'File extension used for index files and internal filter')
    .describe('watch', 'Enables watch mode').argv;
// Default file extension used for both, the filter and index file. Any file not
// matching this extension will be automatically ignored.
var fileExt = args.ext || 'js';
// Returns computed hash from provided data string.
var computeHash = function (data) {
    return crypto
        .createHash('md5')
        .update(data
        .split('\r\n')
        .map(function (line) { return (/^\/\//.test(line) ? '' : line); })
        .join())
        .digest('hex');
};
// Compares hash of two or more data strings and returns true if no differences
// were found. Lines that start with double slash (comments) are ignored and not
// part of the computed hash string.
var compareContents = function () {
    var data = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        data[_i] = arguments[_i];
    }
    var pass = true;
    if (data.length) {
        var master_1 = computeHash(data[0]);
        data.slice(1).forEach(function (contents) {
            if (master_1 != computeHash(contents)) {
                if (pass) {
                    pass = false;
                }
            }
        });
    }
    return pass;
};
// Reads through folder where the configuration file is placed in. Takes into
// account options from the configuration file. Callback provides contents of
// the generated index file as parameter.
var readFolder = function (rc, callback) {
    fs.readdir(path.dirname(rc), function (_err, files) {
        var config = JSON.parse(fs.readFileSync(rc, 'utf8') || '{}');
        files = files.filter(function (file) {
            var pass = true;
            [
                /\.d\.ts$/,
                new RegExp("\\.(?:spec|test)\\." + fileExt),
                new RegExp("^index\\." + fileExt + "$"),
            ]
                .concat(config.ignoreFiles
                ? config.ignoreFiles.map(function (name) {
                    return new RegExp(/^\//.test(name)
                        ? "" + name.substring(1, name.length - 1)
                        : "^" + path.basename(name, '.' + fileExt) + "\\." + fileExt + "$");
                })
                : [])
                .forEach(function (re) {
                if (!new RegExp("\\." + fileExt + "$").test(file) || re.test(file)) {
                    if (pass) {
                        pass = false;
                    }
                }
            });
            return pass;
        });
        var contents = [];
        if (files.length) {
            files.forEach(function (file) {
                var name = path.basename(file, '.' + fileExt);
                contents.push("export { default as " + name + " } from './" + name + "';");
            });
        }
        callback &&
            callback(contents.length ? contents.concat(['']).join('\r\n') : null);
    });
};
// Creates index file with default exports according to a list of file names
// that passed the ignore filter. If index file already exists, it compares the
// list of exports with the current list and generates new contents only when
// needed.
var indexFile = function (rc) {
    readFolder(rc, function (contents) {
        var index = path.join(path.dirname(rc), "index." + fileExt);
        if (contents) {
            fs.access(index, fs.constants.F_OK, function (err) {
                if (!err) {
                    fs.readFile(index, 'utf8', function (_err, data) {
                        if (!compareContents(contents, data)) {
                            fs.writeFile(index, contents, function (err) {
                                if (err)
                                    throw err;
                            });
                        }
                    });
                }
                else {
                    fs.writeFile(index, contents, function (err) {
                        if (err)
                            throw err;
                    });
                }
            });
        }
        else {
            fs.access(index, fs.constants.F_OK, function (err) {
                if (!err) {
                    fs.unlink(index, function (err) {
                        if (err)
                            throw err;
                    });
                }
            });
        }
    });
};
// Search for index configurations and creates index files according to its
// contents. Specific file names can be ignored via ignoreFiles property array
// in configuration file.
glob((args._[0] || './**') + "/.indexrc.json", function (_err, files) {
    files.forEach(function (rc) {
        indexFile(rc);
        if (args.watch) {
            chokidar
                .watch(path.dirname(rc), {
                ignored: [!new RegExp("\\.(?:" + fileExt + "|json)$"), "index." + fileExt]
            })
                .on('all', function () {
                indexFile(rc);
            });
        }
    });
});
