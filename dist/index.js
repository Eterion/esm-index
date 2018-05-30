"use strict";exports.__esModule=!0;var Contents,Module,Options,core_js_1=require("core-js"),crypto=require("crypto"),fs=require("fs"),path=require("path");function default_1(o){return void 0===o&&(o={}),new core_js_1.Promise(function(n,t){require("cosmiconfig")("esm-index").search().then(function(e){(o=core_js_1.Object.assign({},Options.defaults,e?e.config:{},core_js_1.Object.keys(o).filter(function(e){return void 0!==o[e]}).reduce(function(e,n){return core_js_1.Object.assign(e,((t={})[n]=o[n],t));var t},{}))).paths&&o.paths.length?core_js_1.Promise.all(o.paths.map(function(e){return Module.write(e,o)})).then(function(e){n({files:e,options:o})}).catch(function(e){t(e)}):t("Please define --paths or paths property in options.")}).catch(function(e){t(e)})})}!function(e){function t(e){return crypto.createHash("md5").update(e.split("\r\n").map(function(e){return/^\/\//.test(e)?"":e}).join()).digest("hex")}e.compare=function(){for(var n=[],e=0;e<arguments.length;e++)n[e]=arguments[e];return n.slice(1).map(function(e){return t(n[0])==t(e)}).includes(!1)},e.create=function(e,n){void 0===n&&(n=""),n=e.reduce(function(e,n){return e+(n.isIndex?"import * as "+n.name+" from '"+n.path+"';\r\n":"export { default as "+n.name+" } from '"+n.path+"';\r\n")},n);var t=e.filter(function(e){return!0===e.isIndex});return t.length&&(n+="export { "+t.map(function(e){return e.name}).join(", ")+" };\r\n"),n}}(Contents||(Contents={})),function(e){function r(e){var n="a-zA-Z0-9";return e.replace(new RegExp("^[^"+n+"]+"),"").replace(new RegExp("[^"+n+"]+$"),"").replace(new RegExp("[^"+n+"]+(["+n+"])","g"),function(e,n){return n.toUpperCase()})}var a,n;e.list=function(r,s){return new core_js_1.Promise(function(o,i){s.paths&&s.paths.map(function(e){return path.normalize(e)}).includes(path.normalize(r))?(r=path.normalize(r),fs.access(r,function(e){e?o([]):fs.readdir(r,function(e,n){if(e)o([]);else{var t=n.map(function(i){return new core_js_1.Promise(function(t,o){fs.stat(path.join(r,i),function(e,n){e?o(e):n.isDirectory()?a.asDirectory(path.join(r,i),s).then(function(e){t(e)}).catch(function(e){o(e)}):a.asFile(i,s).then(function(e){t(e)}).catch(function(e){o(e)})})})});core_js_1.Promise.all(t).then(function(e){var n=e.filter(function(e){return null!==e});o(n.sort(function(e,n){return e.isIndex?-1:n.isIndex?1:e.name<n.name?-1:e.name>n.name?1:0}))}).catch(function(e){i(e)})}})})):o([])})},(n=a||(a={})).asDirectory=function(o,i){return new core_js_1.Promise(function(n,t){e.list(o,i).then(function(e){e.length?n({isIndex:!0,name:r(path.basename(o,"."+i.fileExtension)),path:"./"+path.basename(o,"."+i.fileExtension)+(i.fileExtensionInPath||i.fileName!=Options.defaults.fileName?"/"+i.fileName+(i.fileExtensionInPath?"."+i.fileExtension:""):i.fileExtensionInPath?"/"+i.fileName+"."+i.fileExtension:"")}):n(null)}).catch(function(e){t(e)})})},n.asFile=function(o,i){return new core_js_1.Promise(function(e,n){var t=[new RegExp("\\.(?:d|spec|test)\\."+i.fileExtension),new RegExp("^"+i.fileName+"\\."+i.fileExtension)];i.ignoreFiles&&(t=t.concat(i.ignoreFiles.map(function(e){return new RegExp(/^\//.test(e)?e.substring(1,e.length-1):"^"+path.basename(e,"."+i.fileExtension)+"\\."+i.fileExtension+"$")}))),t.length?e(t.map(function(e){return!new RegExp("\\."+i.fileExtension+"$").test(o)||e.test(o)}).includes(!0)?null:{isIndex:!1,name:r(path.basename(o,"."+i.fileExtension)),path:"./"+(i.fileExtensionInPath?o:path.basename(o,"."+i.fileExtension))}):n(null)})},e.write=function(c,u){return new core_js_1.Promise(function(s,a){e.list(c,u).then(function(t){var e=u.fileName+"."+u.fileExtension,o=path.join(c,e),i=path.resolve(o),r=Contents.create(t);t.length?fs.access(i,fs.constants.R_OK,function(e){e?fs.writeFile(i,r,function(e){if(e)console.error('Error: Cannot write "'+i+'"'),a(e);else{var n='[32m> Created: "'+i+'"[0m';u.log&&console.log(n),s({code:"add",message:n,modules:t,path:c})}}):fs.readFile(o,"utf8",function(e,n){e?(console.error('Cannot read "'+i+'" file.'),a(e)):Contents.compare(r,n)?fs.writeFile(o,r,function(e){if(e)console.error('Error: Cannot write "'+i+'"'),a(e);else{var n='[33m> Updated: "'+i+'"[0m';u.log&&console.log(n),s({code:"update",message:n,modules:t,path:c})}}):s({code:"no-change",message:'> No changes: "'+i+'"',modules:t,path:c})})}):fs.access(i,function(e){e?s({code:"no-change",message:'> No changes: "'+i+'"',modules:t,path:c}):fs.unlink(o,function(e){if(e)console.error('Error: Cannot unlink "'+i+'"'),a(e);else{var n='[31m> Removed: "'+i+'"[0m';u.log&&console.log(n),s({code:"remove",message:n,modules:t,path:c})}})})}).catch(function(e){a(e)})})}}(Module||(Module={})),(Options||(Options={})).defaults={fileExtension:"js",fileExtensionInPath:!1,fileName:"index",ignoreFiles:[],log:!1,paths:[]},exports.default=default_1;