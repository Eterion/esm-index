#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var index_1 = require("./index");
var yargs = require("yargs");
var args = yargs
    .describe('ext', 'File extension used for index files and internal filter')
    .describe('name', 'File name used for the index files')
    .describe('watch', 'Enables watch mode').argv;
index_1["default"](args._[0], {}, args);
