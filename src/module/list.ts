import { Promise } from 'core-js';
import { access, readdir, stat } from 'fs';
import asDirectory from 'module/resolve/asDirectory';
import asFile from 'module/resolve/asFile';
import { join, normalize } from 'path';
import { Module, Path } from 'types';

/**
 * Returns a promise with a list of modules detected in given path.
 * @param {object} options Options.
 * @param {object[]} paths List of paths.
 */

export default function list(options: Path, paths: Path[]): Promise<Module[]> {
  return new Promise((resolve, reject) => {
    const path = normalize(options.path);
    access(path, err => {
      if (err) resolve([]);
      readdir(path, (err, files) => {
        if (err) resolve([]);
        const promises: Promise<Module | null>[] = files.map(file => {
          return new Promise((success, fail) => {
            stat(join(path, file), (err, stats) => {
              if (err) fail(err);
              const child: Path = paths.filter(
                module =>
                  module.fileExtension == options.fileExtension &&
                  normalize(module.path) == normalize(join(path, file))
              )[0];
              if (options.recursion && child && stats.isDirectory()) {
                list(child, paths)
                  .then(modules => {
                    success(asDirectory(join(path, file), modules, child));
                  })
                  .catch(err => {
                    fail(err);
                  });
              } else {
                success(asFile(file, options));
              }
            });
          });
        });
        Promise.all(promises)
          .then(modules => {
            let filtered: Module[] = <Module[]>modules.filter(module => module);
            resolve(
              filtered.sort((a, b) => {
                if (a.hasRecursion) return -1;
                if (b.hasRecursion) return 1;
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
              })
            );
          })
          .catch(err => {
            reject(err);
          });
      });
    });
  });
}
