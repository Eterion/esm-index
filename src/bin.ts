import esmIndex from 'index';
import config from 'params/config';
import options from 'params/options';
import { Config } from 'types';
import filterObjectKeys from 'utils/filterObjectKeys';
import * as yargs from 'yargs';

esmIndex(<Config>(
  filterObjectKeys(
    yargs.options({ ...config, ...options }).argv,
    ...[...Object.keys(config), ...Object.keys(options)]
  )
))
  .then(callback => {
    console.info('callback: ', callback);
  })
  .catch(err => {
    console.error(err);
  });
