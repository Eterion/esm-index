import { Object } from 'core-js';
import esmIndex from 'index';
import config from 'params/config';
import options from 'params/options';
import filterObjectKeys from 'utils/filterObjectKeys';
import * as yargs from 'yargs';

const params = filterObjectKeys(
  yargs.options(Object.assign({}, config, options)).argv,
  ...[...Object.keys(config), ...Object.keys(options)]
);

esmIndex(params).catch(err => {
  console.error(err);
});
